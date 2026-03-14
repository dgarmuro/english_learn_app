from langchain_core.messages import AnyMessage
from typing_extensions import Annotated, TypedDict
from typing import Optional
import operator

class EnglishLearnerState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    correction: Optional[str]