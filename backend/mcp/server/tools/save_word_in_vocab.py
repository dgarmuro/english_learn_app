from server import mcp
from services.postgresql import supabase_admin  # reutilizas lo que ya tienes

@mcp.tool()
async def save_word_in_vocab(words: list[str]) -> bool:
    """
    Save a list of words in the vocabulary collection.
    Args:
        words: A list of words in english to save
    Returns:
        True if saved successfully, False otherwise.
    """
    try:
        rows = [{"word": word} for word in words]
        supabase_admin.table("vocabulary").insert(rows).execute()
        return True
    except Exception as e:
        return False