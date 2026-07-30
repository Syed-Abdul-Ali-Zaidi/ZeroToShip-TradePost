from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from phase2.database.json_store import db
from phase2.schemas.post_schema import TradePostCreate, TradePostResponse
from phase2.routers.auth import get_current_user
from phase3.services.post_service import validate_post_ownership

router = APIRouter(prefix="/api/posts", tags=["Trade Posts"])

# ==========================================
# 1. All_posts (No login required)
# ==========================================
@router.get("/", response_model=List[TradePostResponse])
def get_all_posts():
    """Fetches every active trade post on the platform."""
    return db.get_all_posts()


# ==========================================
# 2. All_my_post (Login required)
# ==========================================
@router.get("/my_posts", response_model=List[TradePostResponse])
def get_my_posts(status: str = None, current_user: dict = Depends(get_current_user)):
    """Fetches only the posts owned by the currently logged-in user."""
    all_posts = db.get_posts_by_user(current_user["user_id"])
    
    # Filter the result according to status
    if status:
        return [post for post in all_posts if post.get("status") == status]
        
    return all_posts


# ==========================================
# 3. Create_post (Login required)
# ==========================================
@router.post("/create_post", response_model=TradePostResponse)
def create_post(post_data: TradePostCreate, current_user: dict = Depends(get_current_user)):
    """Creates a new trade listing."""
    post_dict = post_data.model_dump()
    
    # Forcefully assign the owner_id from the secure JWT token
    post_dict["owner_id"] = current_user["user_id"] 
    
    # Generate ID and Status
    post_dict["post_id"] = db.generate_id("posts", "post_id")
    post_dict["status"] = "Open" 
    
    db.insert_record("posts", post_dict)
    
    return post_dict


# ==========================================
# 3b. View_single_post (No login required)
# ==========================================
@router.get("/{post_id}", response_model=TradePostResponse)
def get_single_post(post_id: int):
    """Fetches a specific post by its ID so users can view details before offering."""
    post = db.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    return post


# ==========================================
# 4a. Edit_post (Login required)
# ==========================================
@router.put("/edit_post/{post_id}", response_model=TradePostResponse)
def edit_post(post_id: int, post_data: TradePostCreate, current_user: dict = Depends(get_current_user)):
    """Updates an existing post. Only the author can edit it."""
    post = db.get_post_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        
    # Security: Validate ownership
    validate_post_ownership(
        current_user_id= current_user["user_id"],
        post_owner_id= post["owner_id"],
        message= "Not authorized to edit this post.")
        
    updated_fields = post_data.model_dump(exclude_unset=True)
    
    db.update_post(post_id, updated_fields)
    
    return db.get_post_by_id(post_id)


# ==========================================
# 4b. Delete_post (Login required)
# ==========================================
@router.delete("/delete_post/{post_id}")
def delete_post(post_id: int, current_user: dict = Depends(get_current_user)):
    """Deletes a post and triggers a CASCADE DELETE on associated offers."""
    post = db.get_post_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        
    # Security: Validate ownership
    validate_post_ownership(
        current_user_id= current_user["user_id"],
        post_owner_id= post["owner_id"],
        message= "Not authorized to delete this post.")
        
    db.delete_post(post_id)
    
    return {"message": "Post and all associated offers deleted successfully."}


# ==========================================
# 5. Post_with_its_all_offer_to_its Author
# ==========================================
@router.get("/{post_id}/offers", response_model=Dict[str, Any])
def get_post_with_offers(post_id: int, current_user: dict = Depends(get_current_user)):
    """Fetches a specific post and all inbound offers made on it. Strictly locked to the author."""
    post = db.get_post_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        
    # Security: Validate ownership; Only the post author can view the offers on it
    validate_post_ownership(
        current_user_id= current_user["user_id"],
        post_owner_id= post["owner_id"],
        message= "You can only view offers on your own trade posts.")
    
    associated_offers = db.get_offers_by_post(post_id)
    
    return {
        "post": post,
        "offers": associated_offers
    }