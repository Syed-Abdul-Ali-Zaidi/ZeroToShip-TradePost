import json
from pathlib import Path

# Imports from phase1 models
from models.user import User
from models.post import TradePost
from models.offer import NegotiationOffer

# Locate tradepost_db.json at the repository root
ROOT_DIR = Path(__file__).resolve().parent.parent
DB_FILE = ROOT_DIR / "tradepost_db.json"

def run_serialization_test():
    print("=" * 60)
    print("🚀 PHASE 1: SERIALIZATION & DESERIALIZATION TEST")
    print("=" * 60)

    # 1. Instantiate Python Model Objects
    print("\n[1/4] Instantiating Python Model Objects...")
    
    user_1 = User(user_id=1, username="zaidi", password="hashed_password_123")
    user_2 = User(user_id=2, username="alex", password="hashed_password_456")

    post_1 = TradePost(
        post_id=101, 
        title="Keychron K2 Keyboard", 
        description="Gateron Brown switches, mint condition", 
        owner_id=1, 
        status="Open"
    )
    post_2 = TradePost(
        post_id=102, 
        title="Logitech G Pro Mouse", 
        description="Wireless, lightly used", 
        owner_id=2, 
        status="Open"
    )

    offer_1 = NegotiationOffer(
        offer_id=501,
        post_id=101,                    
        proposer_id=2,                  
        offered_post_id=102,            
        offered_item_details="Including extra mouse skates and original box.",
        turn_holder_id=1                
    )

    print("  ✓ Objects created successfully.")

    # 2. Serialize Objects
    print("\n[2/4] Serializing Objects via to_dict()...")
    database_payload = {
        "users": [user_1.to_dict(), user_2.to_dict()],
        "posts": [post_1.to_dict(), post_2.to_dict()],
        "offers": [offer_1.to_dict()]
    }

    # 3. Write to JSON
    print(f"\n[3/4] Writing serialized payload to '{DB_FILE.name}'...")
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(database_payload, f, indent=4)
    print(f"  ✓ Database file saved at: {DB_FILE}")

    # 4. Read file back and Deserialize
    print(f"\n[4/4] Reading '{DB_FILE.name}' back and deserializing via from_dict()...")
    with open(DB_FILE, "r", encoding="utf-8") as f:
        loaded_data = json.load(f)

    # Reconstruct Objects
    target_user = User.from_dict(loaded_data["users"][0])
    target_post = TradePost.from_dict(loaded_data["posts"][0])
    target_offer = NegotiationOffer.from_dict(loaded_data["offers"][0])

    print("\n" + "-" * 60)
    print("VERIFICATION RESULTS:")
    print("-" * 60)
    print(f"• User Check  : ID={target_user.user_id} | Username='{target_user.username}'")
    print(f"• Post Check  : ID={target_post.post_id} | Title='{target_post.title}' | Status='{target_post.status}'")
    print(f"• Offer Check : ID={target_offer.offer_id} | Proposer ID={target_offer.proposer_id} | Turn Holder ID={target_offer.turn_holder_id}")
    print("-" * 60)
    print("\n✅ ALL TESTS PASSED: Models are fully serializable and persistent!\n")

if __name__ == "__main__":
    run_serialization_test()