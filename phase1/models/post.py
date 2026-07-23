class TradePost:
    def __init__(
        self, 
        post_id: int, 
        title: str, 
        description: str, 
        owner_id: int, 
        status: str = "Open"
    ):
        self.post_id = post_id
        self.title = title
        self.description = description
        self.owner_id = owner_id
        self.status = status  # Expected values: "Open", "Traded"

    def to_dict(self) -> dict:
        """Serializes the Post object into a standard dictionary."""
        return {
            "post_id": self.post_id,
            "title": self.title,
            "description": self.description,
            "owner_id": self.owner_id,
            "status": self.status
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TradePost":
        """Reconstructs a Post object from a dictionary."""
        return cls(
            post_id=data["post_id"],
            title=data["title"],
            description=data["description"],
            owner_id=data["owner_id"],
            status=data.get("status", "Open")
        )