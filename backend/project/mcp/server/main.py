# project/server/main.py
from server import mcp
from tools import *

if __name__ == "__main__":
    mcp.run(transport="sse", host="0.0.0.0", port=8001)