from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from agents.conversational_agent.conversational_agent import graph as conversational_graph
from typing import Optional
from services.postgresql import supabase,supabase_admin
from services.redis import redis_client
import uuid
from contextlib import asynccontextmanager
from langgraph.checkpoint.redis.aio import AsyncRedisSaver
from agents.conversational_agent.conversational_agent import graph as conversational_graph
from datetime import datetime, timezone
from fastapi import Request

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncRedisSaver.from_conn_string("redis://localhost:6379") as checkpointer:
        await checkpointer.setup()
        conversational_graph.checkpointer = checkpointer  # inyectar aquí
        yield  # app arriba y corriendo

app = FastAPI(title="English Learner Chat", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://127.0.0.1:8081", "exp://localhost:8081", "*"],  # añade todos los posibles
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer()

# ── Auth ───────────────────────────────────────────────────

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    
class SignUpRequest(BaseModel):
    email: str
    password: str

class SignInRequest(BaseModel):
    email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
# ── Modelos ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    thread_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    correction: Optional[str] = None

class ConversationInfo(BaseModel):
    thread_id: str
    preview: str
    created_at: str

class WordReview(BaseModel):
    id: int
    word: str
    translation: str
    example: str | None = None
    level: str

class WordProgress(BaseModel):
    word_id: str  # uuid
    score: int    # int2

class VocabularyReviewUpdate(BaseModel):
    words: list[WordProgress]

# ── Endpoints ──────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user=Depends(get_current_user)):
    user_id = current_user.id

    ownership = supabase_admin.table("conversations") \
        .select("thread_id") \
        .eq("thread_id", request.thread_id) \
        .eq("user_id", user_id) \
        .limit(1) \
        .execute()

    if not ownership.data:
        raise HTTPException(status_code=403, detail="Conversation not found or access denied")

    config = {"configurable": {"thread_id": request.thread_id}}

    graph_result = await conversational_graph.ainvoke(
        {"messages": [HumanMessage(content=request.message)]},
        config=config,
        durability="async"
    )

    ai_response = graph_result["messages"][-1].content

    supabase_admin.table("messages").insert([
        {"thread_id": request.thread_id, "role": "user",      "content": request.message},
        {"thread_id": request.thread_id, "role": "assistant", "content": ai_response},
    ]).execute()

    return ChatResponse(
        response=ai_response,
        correction=graph_result.get("correction")
    )


@app.post("/conversations")
async def create_conversation(request: Request, current_user=Depends(get_current_user)):
    print("Headers recibidos:", dict(request.headers))
    thread_id = str(uuid.uuid4())

    supabase_admin.table("conversations").insert({
        "thread_id": thread_id,
        "user_id": current_user.id,
    }).execute()

    return {"thread_id": thread_id}


@app.get("/conversations", response_model=list[ConversationInfo])
async def get_conversations(request: Request, current_user=Depends(get_current_user)):
    print("Headers recibidos:", dict(request.headers))

    result = supabase.table("conversations") \
        .select("thread_id, created_at, topic") \
        .eq("user_id", current_user.id) \
        .order("created_at", desc=True) \
        .execute()

    return [
        ConversationInfo(
            thread_id=row["thread_id"],
            preview=row["topic"] or "New conversation",
            created_at=row["created_at"]
        )
        for row in result.data
    ]

@app.delete("/conversations/{thread_id}")
async def delete_conversation(thread_id: str, current_user=Depends(get_current_user)):
    user_id = current_user.id

    supabase_admin.table("conversations") \
        .delete() \
        .eq("thread_id", thread_id) \
        .eq("user_id", user_id) \
        .execute()

    # Borrar checkpoint de Redis
    pattern = f"checkpoint:{thread_id}:*"
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)

    return {"message": f"Conversation {thread_id} deleted"}

@app.get("/vocabulary_review", response_model=list[WordReview])
async def get_vocabulary_review(current_user=Depends(get_current_user)):
    """
    Este método recupera un subconjunto del vocabulario en base al nivel elegido y al progreso del usuario
    """

    # 1. Mirar word id con bajo score para el user_id. Recupera maximo 20 words mas antiguas.
    user_words = supabase.table("progress") \
        .select("word_id") \
        .eq("user_id", current_user.id) \
        .lte("score", 2) \
        .order("last_review", desc=False) \
        .limit(20) \
        .execute()
    user_word_ids = [row["word_id"] for row in user_words.data]

    if len(user_word_ids) < 20:
        # 2. Recuperar las palabras que ya tiene el user (para review)
        known_words = supabase.table("vocabulary") \
            .select("word, translation, example, id, level") \
            .in_("id", user_word_ids) \
            .execute()

        # 3. Completar hasta 20 con palabras nuevas random según nivel
        new_words = supabase.table("vocabulary") \
            .select("word, translation, example, id, level") \
            .eq("level", current_user.level) \
            .not_.in_("id", user_word_ids) \
            .order("random()") \
            .limit(20 - len(user_word_ids)) \
            .execute()

        words_review = known_words.data + new_words.data
    else:
        # Ya tiene 20 palabras para repasar
        words_review = supabase.table("vocabulary") \
            .select("word, translation, example, id, level") \
            .in_("id", user_word_ids) \
            .execute()
        words_review = words_review.data
    return words_review


@app.post("/vocabulary_review")
async def update_vocabulary_review(review: VocabularyReviewUpdate, current_user=Depends(get_current_user)):
    """
    Finaliza la revisión del vocabulario. Se actualiza progress
    """
    now = datetime.now(timezone.utc).isoformat()

    for word in review.words:
        supabase.table("progress") \
            .upsert({
                "user_id": current_user.id,
                "word_id": word.word_id,
                "score": word.score,
                "last_review": now
            }) \
            .execute()

    return {"updated": len(review.words)}

@app.post("/auth/signup")
async def signup(request: SignUpRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        # Crear perfil en la tabla profiles
        supabase.table("profiles").insert({
            "id": response.user.id,
            "email": request.email,
            "level": 0
        }).execute()

        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "message": "User created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/signin")
async def signin(request: SignInRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user_id": response.user.id,
            "email": response.user.email,
        }
    except Exception as e:
        print(f"Supabase error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/auth/signout")
async def signout():
    try:
        supabase.auth.sign_out()
        return {"message": "Signed out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/refresh")
async def refresh(request: RefreshTokenRequest):
    try:
        response = supabase.auth.refresh_session(request.refresh_token)
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/auth/signup")
async def signup(request: SignUpRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        # Crear perfil en la tabla profiles
        supabase.table("profiles").insert({
            "id": response.user.id,
            "email": request.email,
            "level": 0
        }).execute()

        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "message": "User created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@app.get("/health")
async def health():
    return {"status": "ok"}