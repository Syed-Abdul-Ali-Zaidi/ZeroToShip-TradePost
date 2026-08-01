from phase2.database.json_store import db


def enrich_post(post: dict) -> dict:
    """Attaches the owner_username to a post dictionary."""
    user = db.get_user_by_id(post["owner_id"])
    post_copy = post.copy()

    post_copy["owner_username"] = user["username"] if user else "Unknown User"
    return post_copy

def enrich_offer(offer: dict) -> dict:
    """Attaches the post_owner_username & proposer_username to a offer dictionary."""
    proposer = db.get_user_by_id(offer['proposer_id'])

    post = db.get_post_by_id(offer["post_id"])
    post_owner = db.get_user_by_id(post["owner_id"])

    offer_copy = offer.copy()
    offer_copy["proposer_username"] = proposer["username"] if proposer else "Unknown User"
    offer_copy["post_owner_username"] = post_owner["username"] if post_owner else "Unknown User"

    return offer_copy