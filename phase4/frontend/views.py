from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["Frontend Views"])
templates = Jinja2Templates(directory="phase4/templates")

# ==========================================
# 1. POSTS & ROOT VIEWS
# ==========================================
@router.get("/")
@router.get("/posts/")
def render_home_page(request: Request):
    """Serves the main public feed."""
    return templates.TemplateResponse(request, "posts/posts.html")

@router.get("/posts/my_posts")
def render_my_posts(request: Request):
    """Serves the user's personal posts dashboard."""
    return templates.TemplateResponse(request, "posts/my_posts.html")

@router.get("/posts/create_post")
def render_create_post(request: Request):
    """Serves the blank form to create a new post."""
    token = request.cookies.get("access_token")
    if not token:
        print("Token: ",token)
        return templates.TemplateResponse(request, "registration/login.html")
    return templates.TemplateResponse(request, "posts/post_create_form.html")

@router.get("/posts/{post_id}")
def render_post_details(request: Request, post_id: int):
    """Serves the detailed view of a specific post."""
    return templates.TemplateResponse(request, "posts/post_details.html", {"post_id": post_id})

@router.get("/posts/edit_post/{post_id}")
def render_edit_post(request: Request, post_id: int):
    """Serves the creation form but populates it for editing."""
    return templates.TemplateResponse(request, "posts/post_create_form.html", {"post_id": post_id})

@router.get("/posts/delete_post/{post_id}")
def render_delete_post_confirm(request: Request, post_id: int):
    """Serves the confirmation page before sending the delete API request."""
    return templates.TemplateResponse(request, "posts/post_delete_confirm_form.html", {"post_id": post_id})

@router.get("/posts/{post_id}/offers")
def render_post_offers(request: Request, post_id: int):
    """Serves the detailed view of a post alongside its inbound offers."""
    return templates.TemplateResponse(request, "posts/post_details.html", {"post_id": post_id})


# ==========================================
# 2. OFFERS VIEWS
# ==========================================
@router.get("/offers/create_offer")
def render_create_offer(request: Request):
    """Serves the form to propose a new trade."""
    token = request.cookies.get("access_token")
    if not token:
        print("Token: ",token)
        return templates.TemplateResponse(request, "registration/login.html")
    return templates.TemplateResponse(request, "offers/offer_create_form.html")

@router.get("/offers/edit_offer/{offer_id}")
def render_edit_offer(request: Request, offer_id: int):
    """Serves the offer form but populates it for a counter-offer/edit."""
    return templates.TemplateResponse(request, "offers/offer_create_form.html", {"offer_id": offer_id})

@router.get("/offers/{offer_id}/accept")
def render_accept_offer_confirm(request: Request, offer_id: int):
    """Serves the confirmation screen before finalizing a trade."""
    return templates.TemplateResponse(request, "offers/offer_accept_confirm_form.html", {"offer_id": offer_id})

@router.get("/offers/delete_offer/{offer_id}")
def render_delete_offer_confirm(request: Request, offer_id: int):
    """Serves the confirmation screen to withdraw or decline an offer."""
    return templates.TemplateResponse(request, "offers/offer_delete_confirm_form.html", {"offer_id": offer_id})

@router.get("/offers/my_offers")
def render_my_offers(request: Request):
    """Serves the dashboard showing all outbound offers the user has made."""
    return templates.TemplateResponse(request, "offers/my_offers.html")


# ==========================================
# 3. ACCOUNTS VIEWS
# ==========================================
@router.get("/accounts/register")
def render_register(request: Request):
    """Serves the new user signup form."""
    # Note: Using 'registration' exactly as specified in your URL mapping
    return templates.TemplateResponse(request, "registration/register.html")

@router.get("/accounts/login")
def render_login(request: Request):
    """Serves the user login form."""
    return templates.TemplateResponse(request, "registration/login.html")

@router.get("/accounts/logout")
def render_logout(request: Request):
    """Serves the goodbye/logout confirmation screen."""
    response = templates.TemplateResponse(request, "registration/logged_out.html")
    response.delete_cookie("access_token")
    return response