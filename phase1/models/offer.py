class NegotiationOffer:
    def __init__(
        self, 
        offer_id: int, 
        post_id: int, 
        proposer_id: int, 
        offered_post_id: int, 
        offered_item_details: str, 
        turn_holder_id: int
    ):
        self.offer_id = offer_id
        self.post_id = post_id                            # The item being requested
        self.proposer_id = proposer_id                    # The user making the offer
        self.offered_post_id = offered_post_id            # The user's item selected from the dropdown
        self.offered_item_details = offered_item_details  # Text notes/descriptions for the offer
        self.turn_holder_id = turn_holder_id              # ID of the user whose turn it is to respond

    def to_dict(self) -> dict:
        """Serializes the NegotiationOffer object into a standard dictionary."""
        return {
            "offer_id": self.offer_id,
            "post_id": self.post_id,
            "proposer_id": self.proposer_id,
            "offered_post_id": self.offered_post_id,
            "offered_item_details": self.offered_item_details,
            "turn_holder_id": self.turn_holder_id
        }

    @classmethod
    def from_dict(cls, data: dict) -> "NegotiationOffer":
        """Reconstructs a NegotiationOffer object from a dictionary."""
        return cls(
            offer_id=data["offer_id"],
            post_id=data["post_id"],
            proposer_id=data["proposer_id"],
            offered_post_id=data["offered_post_id"],
            offered_item_details=data["offered_item_details"],
            turn_holder_id=data["turn_holder_id"]
        )