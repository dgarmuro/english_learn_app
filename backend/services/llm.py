#from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv
load_dotenv()

llm_grok = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7
)