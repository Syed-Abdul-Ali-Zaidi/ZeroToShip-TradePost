import json
import os
from typing import Dict, Any

class JSONStore:
    def __init__(self, filepath: str = "tradepost_db.json"):
        self.filepath = filepath
        self._ensure_db_exists()

    def _ensure_db_exists(self):
        """Creates the base JSON structure if the file is missing or empty."""
        if not os.path.exists(self.filepath) or os.path.getsize(self.filepath) == 0:
            initial_data = {"users": [], "posts": [], "offers": []}
            self._write_data(initial_data)

    def read_data(self) -> Dict[str, Any]:
        """Reads and parses the entire JSON database."""
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            # Fallback just in case the file gets corrupted
            return {"users": [], "posts": [], "offers": []}

    def _write_data(self, data: Dict[str, Any]):
        """Writes the dictionary back to the JSON file with pretty formatting."""
        with open(self.filepath, "w") as f:
            json.dump(data, f, indent=4)

    def generate_id(self, table_name: str, id_field: str) -> int:
        """
        Scans a specific table (e.g., 'posts') to find the highest existing ID 
        (e.g., 'post_id') and returns the next available integer.
        """
        data = self.read_data()
        table = data.get(table_name, [])
        
        if not table:
            return 1
            
        # Find the max ID using a generator expression
        max_id = max((item.get(id_field, 0) for item in table), default=0)
        return max_id + 1

    def insert_record(self, table_name: str, record: dict):
        """Appends a new dictionary record into the specified table."""
        data = self.read_data()
        
        # Failsafe if table doesn't exist
        if table_name not in data:
            data[table_name] = []
            
        data[table_name].append(record)
        self._write_data(data)

    # ---------------------------------------------------------
    # USER HELPER METHODS
    # ---------------------------------------------------------
    def get_user_by_id(self, user_id: int) -> dict | None:
        """Fetches a user by ID, essential for attaching usernames to posts in templates."""
        data = self.read_data()
        for user in data.get("users", []):
            if user["user_id"] == user_id:
                return user
        return None

    def get_user_by_username(self, username: str) -> dict | None:
        """Finds a user by username to check for duplicates before registration."""
        data = self.read_data()
        for user in data.get("users", []):
            if user["username"] == username:
                return user
        return None

    # ---------------------------------------------------------
    # POST HELPER METHODS
    # ---------------------------------------------------------
    def get_all_posts(self) -> list[dict]:
        """Returns all posts in the database."""
        data = self.read_data()
        return data.get("posts", [])

    def get_posts_by_user(self, owner_id: int) -> list[dict]:
        """Returns all posts owned by a specific user."""
        data = self.read_data()
        return [post for post in data.get("posts", []) if post["owner_id"] == owner_id]

    def get_post_by_id(self, post_id: int) -> dict | None:
        """Fetches a single post. Useful for checking ownership or attaching post data."""
        data = self.read_data()
        for post in data.get("posts", []):
            if post["post_id"] == post_id:
                return post
        return None

    def update_post(self, post_id: int, updated_fields: dict) -> bool:
        """
        Updates specific fields of an existing post (like changing status to 'Traded').
        Returns True if successful, False if post not found.
        """
        data = self.read_data()
        for i, post in enumerate(data.get("posts", [])):
            if post["post_id"] == post_id:
                # Update the existing post dictionary with the new fields
                data["posts"][i].update(updated_fields)
                self._write_data(data)
                return True
        return False

    def process_offer_acceptance(self, accepted_offer_id: int, target_post_id: int) -> bool:
        """
        Marks one offer as 'Accepted', all competing offers on the same post as 'Declined',
        and changes the main post's status to 'Traded'.
        """
        data = self.read_data()
        
        # 1. Change the main post's status to "Traded"
        post_updated = False
        for post in data.get("posts", []):
            if post["post_id"] == target_post_id:
                post["status"] = "Traded"
                post_updated = True
                break
                
        if not post_updated:
            return False # Failsafe if the post doesn't exist
            
        # 2. Sweep and update all offers attached to this post
        for offer in data.get("offers", []):
            if offer["post_id"] == target_post_id:
                if offer["offer_id"] == accepted_offer_id:
                    offer["status"] = "Accepted"
                else:
                    offer["status"] = "Declined"
                    
        self._write_data(data)
        return True

    # ---------------------------------------------------------
    # OFFER HELPER METHODS
    # ---------------------------------------------------------
    def get_offer_by_id(self, offer_id: int) -> dict | None:
        """Fetches a specific offer by its ID for the negotiation engine."""
        data = self.read_data()
        for offer in data.get("offers", []):
            if offer["offer_id"] == offer_id:
                return offer
        return None
    
    def get_offers_by_user(self, proposer_id: int) -> list[dict]:
        """
        Returns only the OUTBOUND offers this specific user has made.
        (Fetch the associated posts in the router using get_post_by_id).
        """
        data = self.read_data()
        return [
            offer for offer in data.get("offers", []) 
            if offer["proposer_id"] == proposer_id
        ]

    def get_offers_by_post(self, post_id: int) -> list[dict]:
        """
        Returns all INBOUND offers made on a specific post.
        Visibility security (checking if current_user == post.owner_id) 
        must be handled in the API router before returning this data.
        """
        data = self.read_data()
        return [
            offer for offer in data.get("offers", []) 
            if offer["post_id"] == post_id
        ]

    def update_offer(self, offer_id: int, updated_fields: dict) -> bool:
        """
        Updates specific fields of an existing offer (like editing what you are trading).
        Returns True if successful, False if offer not found.
        """
        data = self.read_data()
        for i, offer in enumerate(data.get("offers", [])):
            if offer["offer_id"] == offer_id:
                data["offers"][i].update(updated_fields)
                self._write_data(data)
                return True
        return False

    # ---------------------------------------------------------
    # DELETION & CASCADE METHODS
    # ---------------------------------------------------------
    def delete_offer(self, offer_id: int) -> bool:
        """
        Deletes a specific offer by ID. 
        Returns True if deleted, False if the offer wasn't found.
        """
        data = self.read_data()
        initial_length = len(data.get("offers", []))
        
        # Keep only the offers that DO NOT match the offer_id
        data["offers"] = [o for o in data.get("offers", []) if o.get("offer_id") != offer_id]
        
        if len(data["offers"]) < initial_length:
            self._write_data(data)
            return True
        return False

    def delete_post(self, post_id: int) -> bool:
        """
        Deletes a post by ID and performs a CASCADE DELETE on all related offers.
        Returns True if the post was deleted, False if not found.
        """
        data = self.read_data()
        initial_posts_length = len(data.get("posts", []))
        
        # 1. Delete the post itself
        data["posts"] = [p for p in data.get("posts", []) if p.get("post_id") != post_id]
        
        # If the post wasn't found, stop here
        if len(data["posts"]) == initial_posts_length:
            return False
            
        # 2. CASCADE DELETE: Clean up orphaned offers
        # We remove the offer if the deleted post was what they WANTED (post_id) 
        # OR what they were OFFERING (offered_post_id)
        data["offers"] = [
            o for o in data.get("offers", []) 
            if o.get("post_id") != post_id and o.get("offered_post_id") != post_id
        ]
        
        self._write_data(data)
        return True

# Instantiate a single global instance to be imported by your routers
db = JSONStore()