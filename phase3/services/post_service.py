from fastapi import HTTPException, status

def validate_post_ownership(current_user_id: int, post_owner_id: int, message: str):
    if post_owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )

def validate_self_offer(current_user_id: int, post_owner_id: int):
    if post_owner_id == current_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot make an offer on your own post."
        )
    