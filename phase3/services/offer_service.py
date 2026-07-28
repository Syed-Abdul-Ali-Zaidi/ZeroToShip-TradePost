from fastapi import HTTPException

def validate_pending_status(offer_status: str, message: str):
    if offer_status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=message
        )

def validate_open_status(post_status: str, message: str):
    if post_status != "Open":
        raise HTTPException(
            status_code=400,
            detail=message
        )

def validate_turn_holder(current_user_id: int, turn_holder_id: int, message: str):
    if current_user_id != turn_holder_id:
        raise HTTPException(
            status_code=403,
            detail=message
        )

def validate_delete_permission(current_user_id: int, proposer_id: int, post_owner_id: int):
    is_proposer = current_user_id == proposer_id
    is_post_owner = current_user_id == post_owner_id

    # Rule Enforcement: Only the proposer OR the post owner can delete it
    if not (is_proposer or is_post_owner):
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to delete or decline this offer."
        )  