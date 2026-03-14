from langchain_core.messages import SystemMessage
from .prompts import PROMPT_CONVERSACION,PROMPT_CORRECCION
from .state import EnglishLearnerState
from services.llm import llm_grok


def select_topic_node(state: EnglishLearnerState):
    
    system_message = SystemMessage(content="Introduce yourself as an English teacher to the user and ask the first question.")

    response = llm_grok.invoke(
        [system_message] + state["messages"]
    )

    return {
        "messages": [response]
    }

def conversation_node(state: EnglishLearnerState):
    
    system_message = SystemMessage(content=PROMPT_CONVERSACION)

    response = llm_grok.invoke(
        [system_message] + state["messages"]
    )

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