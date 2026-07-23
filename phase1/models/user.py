class User:
    def __init__(self, user_id: int, username: str, password: str):
        self.user_id = user_id
        self.username = username
        self.password = password

    def to_dict(self) -> dict:
        """Serializes the User object into a standard dictionary."""
        return {
            "user_id": self.user_id,
            "username": self.username,
            "password": self.password
        }

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Reconstructs a User object from a dictionary."""
        return cls(
            user_id=data["user_id"],
            username=data["username"],
            password=data["password"]
        )