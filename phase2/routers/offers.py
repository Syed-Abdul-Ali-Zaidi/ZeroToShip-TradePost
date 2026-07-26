from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from phase2.database.json_store import db
from phase2.schemas.offer_schema import OfferCreate, OfferUpdate, OfferResponse
from phase2.routers.auth import get_current_user

router = APIRouter(prefix="/offers", tags=["Offers"])

# ==========================================
# 1. Create Offer
# ==========================================
@router.post("/", response_model=OfferResponse)
def create_offer(offer_data: OfferCreate, current_user: dict = Depends(get_current_user)):
    """Proposes a new trade offer on a post."""
    post = db.get_post_by_id(offer_data.post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Target post not found.")
        
    if post["owner_id"] == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="You cannot make an offer on your own post.")

    if post["status"] != "Open":
        raise HTTPException(status_code=400, detail="This post is no longer accepting offers.")

    offer_dict = offer_data.model_dump()
    
    # Securely lock identities and initial state
    offer_dict["proposer_id"] = current_user["user_id"]
    offer_dict["offer_id"] = db.generate_id("offers", "offer_id")
    offer_dict["status"] = "Pending"
    offer_dict["turn_holder_id"] = post["owner_id"] # Post owner gets the first turn
    
    db.insert_record("offers", offer_dict)
    
    return offer_dict

# ==========================================
# 2. Edit / Counter Offer
# ==========================================
@router.put("/{offer_id}", response_model=OfferResponse)
def edit_offer(offer_id: int, offer_data: OfferUpdate, current_user: dict = Depends(get_current_user)):
    """Edits an offer details. Only the current turn_holder can do this."""
    offer = db.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")
        
    if offer["status"] != "Pending":
        raise HTTPException(status_code=400, detail="Can only edit pending offers.")
        
    # Rule Enforcement: Only the turn holder can edit
    if current_user["user_id"] != offer["turn_holder_id"]:
        raise HTTPException(status_code=403, detail="It is not your turn to edit this offer.")

    # Determine who gets the next turn
    post = db.get_post_by_id(offer["post_id"])
    post_owner_id = post["owner_id"]
    
    # If the current user is the proposer, pass turn to post owner. Otherwise, pass back to proposer.
    if current_user["user_id"] == offer["proposer_id"]:
        next_turn_id = post_owner_id
    else:
        next_turn_id = offer["proposer_id"]

    # Extract ONLY the allowed editable fields to prevent tampering
    updated_fields = {
        "offered_item_details": offer_data.offered_item_details,
        "turn_holder_id": next_turn_id
    }
    
    db.update_offer(offer_id, updated_fields)
    return db.get_offer_by_id(offer_id)

# ==========================================
# 3. Accept Offer
# ==========================================
@router.post("/{offer_id}/accept")
def accept_offer(offer_id: int, current_user: dict = Depends(get_current_user)):
    """Accepts an offer, updates competing offers, and closes the post."""
    offer = db.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")
        
    if offer["status"] != "Pending":
        raise HTTPException(status_code=400, detail="This offer is no longer pending.")
        
    # Rule Enforcement: Only the turn holder can accept
    if current_user["user_id"] != offer["turn_holder_id"]:
        raise HTTPException(status_code=403, detail="It is not your turn to accept this offer.")

    # Trigger custom JSON store method
    success = db.process_offer_acceptance(offer_id, offer["post_id"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to process acceptance. The parent post could not be found."
        )
    
    return {"message": "Trade accepted successfully! Competing offers declined and post marked as Traded."}


# ==========================================
# 4. Withdraw / Decline Offer (Delete)
# ==========================================
@router.delete("/{offer_id}")
def delete_offer(offer_id: int, current_user: dict = Depends(get_current_user)):
    """
    Deletes an offer. 
    Acts as 'Withdraw' if the current user made the offer.
    Acts as 'Decline' if the current user owns the target post.
    """
    offer = db.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")

    # We need the parent post to check who the owner is
    post = db.get_post_by_id(offer["post_id"])
    if not post:
        raise HTTPException(status_code=404, detail="Parent post missing or corrupted.")
    
    is_proposer = current_user["user_id"] == offer["proposer_id"]
    is_post_owner = current_user["user_id"] == post["owner_id"]

    # Rule Enforcement: Only the proposer OR the post owner can delete it
    if not (is_proposer or is_post_owner):
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to delete or decline this offer."
        )
        
    if offer["status"] != "Pending":
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete an offer that is already accepted or closed."
        )

    # Use the delete record logic from your flat-file JSON store
    db.delete_offer(offer_id)
    
    return {"message": "Offer deleted successfully."}

# ==========================================
# 5. Get your Offers 
# ==========================================
@router.get("/my-outbound", response_model=List[OfferResponse])
def get_my_outbound_offers(current_user: dict = Depends(get_current_user)):
    """Fetches all offers the current user has made to other posts."""
    return db.get_offers_by_user(current_user["user_id"])