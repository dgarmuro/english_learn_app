from redis import Redis
from langgraph.checkpoint.redis import RedisSaver

redis_client = Redis(
    host="localhost",
    port=6379,
    decode_responses=True
)

# Setup síncrono al arrancar (crea índices)
with RedisSaver.from_conn_string("redis://localhost:6379") as saver:
    saver.setup()