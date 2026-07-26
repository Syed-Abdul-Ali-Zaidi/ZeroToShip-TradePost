from pydantic import BaseModel
from typing import Optional

class TradePostCreate(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None

class TradePostResponse(BaseModel):
    post_id: int
    title: str
    description: str
    owner_id: int
    image_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True