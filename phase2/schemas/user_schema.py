from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    username: str

    class Config:
        from_attributes = True