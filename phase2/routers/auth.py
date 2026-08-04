from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from phase2.database.json_store import db
from phase2.schemas.user_schema import UserCreate, UserResponse, UserLogin, Token
from phase3.services.auth_service import get_current_user_id, hash_password, create_access_token

router = APIRouter(prefix="/api/accounts", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# --- GET USER DICT ---
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = credentials.credentials
    
    user_id = get_current_user_id(token= token)
        
    user = db.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
        
    return user

# --- 4. ROUTES ---
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate):
    if db.get_user_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken."
        )
    
    user_dict = user_data.model_dump()
    user_dict["password"] = hash_password(user_dict["password"])
    user_dict["user_id"] = db.generate_id("users", "user_id")
    
    db.insert_record("users", user_dict)
    
    return user_dict

@router.post("/login", response_model=Token)
def login_user(credentials: UserLogin, response: Response):
    user = db.get_user_by_username(credentials.username)
    
    if not user or user["password"] != hash_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )
        
    access_token = create_access_token(data={"sub": str(user["user_id"])})

    # Set it as a cookie so server-rendered pages can read it too
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,   # JS can't read it — safer
        samesite="lax",
        max_age=3600      # match your token expiry
    )

    return {"access_token": access_token, "token_type": "bearer"}