class TradePost:
    def __init__(
        self, 
        post_id: int, 
        title: str, 
        description: str,
        owner_id: int, 
        image_url: str | None = None,
        status: str = "Open"
    ):
        self.post_id = post_id
        self.title = title
        self.description = description
        self.owner_id = owner_id
        self.image_url = image_url
        self.status = status  # Expected values: "Open", "Traded"

    def to_dict(self) -> dict:
        """Serializes the Post object into a standard dictionary."""
        return {
            "post_id": self.post_id,
            "title": self.title,
            "description": self.description,
            "owner_id": self.owner_id,
            "image_url": self.image_url,
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
            image_url=data.get("image_url"),
            status=data.get("status", "Open")
        )