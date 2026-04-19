from langgraph.graph import StateGraph, START, END
from .utils.nodes import conversation_node, correction_node
from .utils.state import EnglishLearnerState

builder = StateGraph(EnglishLearnerState)

builder.add_node("conversation", conversation_node)
builder.add_node("correction", correction_node)

builder.add_edge(START, "conversation")
builder.add_edge("conversation", "correction")
builder.add_edge("correction", END)

graph = builder.compile()