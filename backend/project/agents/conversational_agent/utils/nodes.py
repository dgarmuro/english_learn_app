from langchain_core.messages import SystemMessage
from .prompts import PROMPT_CONVERSACION,PROMPT_CORRECCION
from .state import EnglishLearnerState
from services.llm import llm_grok
from langchain_core.runnables import RunnableConfig


def select_topic_node(state: EnglishLearnerState):
    
    system_message = SystemMessage(content="Introduce yourself as an English teacher to the user and ask the first question.")

    response = llm_grok.invoke(
        [system_message] + state["messages"]
    )

    return {
        "messages": [response]
    }

async def conversation_node(state: EnglishLearnerState, config: RunnableConfig | None):
    
    system_message = SystemMessage(content=PROMPT_CONVERSACION)
    mcp_tools = config["configurable"].get("mcp_tools", [])

    llm_with_tools = llm_grok.bind_tools(mcp_tools)

    response = await llm_with_tools.ainvoke( [system_message] + state["messages"])

    return {
        "messages": [response]
    }


def correction_node(state: EnglishLearnerState):
   
    last_user_message = state["messages"][-1]
    system_message = SystemMessage(content=PROMPT_CORRECCION)

    response = llm_grok.invoke([system_message,last_user_message])

    correction_text = response.content.strip()
    if correction_text:
        return {"correction": correction_text}
    return {"correction": None}