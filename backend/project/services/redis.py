from redis import Redis
from langgraph.checkpoint.redis import RedisSaver
import os
from urllib.parse import urlparse

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
_parsed = urlparse(REDIS_URL)

redis_client = Redis(
    host=_parsed.hostname,
    port=_parsed.port or 6379,
    decode_responses=True
)

# Setup síncrono al arrancar (crea índices)
with RedisSaver.from_conn_string(REDIS_URL) as saver:
    saver.setup()