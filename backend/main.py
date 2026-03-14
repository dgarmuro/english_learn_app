from fastapi import FastAPI
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from agents.conversational_agent.conversational_agent import graph as conversational_graph
from typing import Optional

# http://127.0.0.1:8000/docs

app = FastAPI(title="English Learner Chat")

# Almacén de sesiones en memoria (simple, sin DB por ahora)
sessions: dict[str, list] = {}

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    response: str
    correction: Optional[str] = None

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Recuperar historial de la sesión o crear uno nuevo
    history = sessions.get(request.session_id, [])
    
    # Añadir mensaje del usuario
    history.append(HumanMessage(content=request.message))
    
    # Invocar el grafo con el historial completo
    result = await conversational_graph.ainvoke({"messages": history})
    
    # Guardar historial actualizado
    sessions[request.session_id] = result["messages"]
    
    # Extraer la última respuesta del asistente
    ai_response = result["messages"][-1].content
    
    return ChatResponse(
        session_id=request.session_id,
        response=ai_response,
        correction=result.get("correction")
    )

@app.delete("/chat/{session_id}")
async def clear_session(session_id: str):
    sessions.pop(session_id, None)
    return {"message": f"Session {session_id} cleared"}

@app.get("/health")
async def health():
    return {"status": "ok"}