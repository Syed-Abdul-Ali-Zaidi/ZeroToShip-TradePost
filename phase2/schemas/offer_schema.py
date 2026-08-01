from pydantic import BaseModel
from typing import Optional
from phase2.schemas.post_schema import TradePostResponse

class OfferCreate(BaseModel):
    post_id: int                           # The item you want
    offered_item_details: str
    offered_post_id: Optional[int] = None  # OPTIONAL: Link an existing post if you have one

class OfferUpdate(BaseModel):
    offered_item_details: str

class OfferResponse(BaseModel):
    offer_id: int
    post_id: int
    post_owner_username: str
    proposer_id: int                        # Who is making the offer
    proposer_username: str
    offered_item_details: str
    offered_post_id: Optional[int] = None
    turn_holder_id: int
    status: str

    class Config:
        from_attributes = True

class OfferWithPostResponse(OfferResponse):
    post: Optional[TradePostResponse] = None