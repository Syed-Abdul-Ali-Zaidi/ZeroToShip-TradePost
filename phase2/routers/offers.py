from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from phase2.database.json_store import db
from phase2.schemas.offer_schema import OfferCreate, OfferUpdate, OfferResponse, OfferWithPostResponse
from phase2.routers.auth import get_current_user
from phase2.routers.posts import enrich_post
from phase3.services.offer_service import validate_delete_permission, validate_open_status, validate_pending_status, validate_turn_holder
from phase3.services.post_service import validate_self_offer
from phase3.services.enrichment_service import enrich_post, enrich_offer

router = APIRouter(prefix="/api/offers", tags=["Offers"])

# ==========================================
# 1. Create Offer
# ==========================================
@router.post("/create_offer", response_model=OfferResponse)
def create_offer(offer_data: OfferCreate, current_user: dict = Depends(get_current_user)):
    """Proposes a new trade offer on a post."""
    post = db.get_post_by_id(offer_data.post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Target post not found.")

    validate_self_offer(current_user_id= current_user["user_id"], post_owner_id= post["owner_id"])

    validate_open_status(post_status= post["status"], message= "This post is no longer accepting offers.")

    offer_dict = offer_data.model_dump()
    
    # Securely lock identities and initial state
    offer_dict["proposer_id"] = current_user["user_id"]
    offer_dict["offer_id"] = db.generate_id("offers", "offer_id")
    offer_dict["status"] = "Pending"
    offer_dict["turn_holder_id"] = post["owner_id"] # Post owner gets the first turn
    
    db.insert_record("offers", offer_dict)
    
    return enrich_offer(offer_dict)

# ==========================================
# 2. Edit / Counter Offer
# ==========================================
@router.put("/edit_offer/{offer_id}", response_model=OfferResponse)
def edit_offer(offer_id: int, offer_data: OfferUpdate, current_user: dict = Depends(get_current_user)):
    """Edits an offer details. Only the current turn_holder can do this."""
    offer = db.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")

    validate_pending_status(offer_status= offer["status"], message= "Can only edit pending offers.")
        
    # Rule Enforcement: Only the turn holder can edit
    validate_turn_holder(current_user_id= current_user["user_id"], turn_holder_id=offer["turn_holder_id"], message= "It is not your turn to edit this offer.")

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
    updated_offer = db.get_offer_by_id(offer_id)
    return enrich_offer(updated_offer)

# ==========================================
# 3. Accept Offer
# ==========================================
@router.post("/{offer_id}/accept")
def accept_offer(offer_id: int, current_user: dict = Depends(get_current_user)):
    """Accepts an offer, updates competing offers, and closes the post."""
    offer = db.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")

    validate_pending_status(offer_status= offer["status"], message= "This offer is no longer pending.")  
        
    # Rule Enforcement: Only the turn holder can accept
    validate_turn_holder(current_user_id= current_user["user_id"], turn_holder_id=offer["turn_holder_id"], message= "It is not your turn to accept this offer.")

    # Accept and process targeted POST and its offers
    success_mainpost = db.process_offer_acceptance(offer_id, offer["post_id"])
    if not success_mainpost:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to process acceptance. The parent post could not be found."
        )

    # Accept and process targeted OFFERED_POST and its offers
    offered_post_id = offer.get("offered_post_id", 0) 
    if offered_post_id > 0:
        success_offer = db.process_offer_acceptance(0, offered_post_id)
        if not success_offer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to process acceptance. The offered post could not be found."
            )
        # Message for two-way process
        return {"message": "Trade accepted successfully! Both posts marked as Traded and all competing offers declined."}

    # Message for one-way process
    return {"message": "Trade accepted successfully! Competing offers declined and post marked as Traded."}


# ==========================================
# 4. Withdraw / Decline Offer (Delete)
# ==========================================
@router.delete("/delete_offer/{offer_id}")
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

    validate_delete_permission(current_user_id= current_user["user_id"], proposer_id= offer["proposer_id"], post_owner_id= post["owner_id"])

    validate_pending_status(offer_status= offer["status"], message= "Cannot delete an offer that is already accepted or closed.")

    # Use the delete record logic from your flat-file JSON store
    db.delete_offer(offer_id)
    
    return {"message": "Offer deleted successfully."}

# ==========================================
# 5. Get your Offers 
# ==========================================
@router.get("/my_offers", response_model= List[OfferWithPostResponse])
def get_my_outbound_offers(current_user: dict = Depends(get_current_user)):
    """Fetches all offers the current user has made to other posts."""
    offers = db.get_offers_by_user(current_user["user_id"])
    enriched_offers = list()
    for offer in offers:
        offer_copy = offer.copy()
        enriched_offer = enrich_offer(offer_copy)

        post = db.get_post_by_id(offer["post_id"])
        enriched_offer["post"] = enrich_post(post) if post else None

        enriched_offers.append(enriched_offer)
    return enriched_offers