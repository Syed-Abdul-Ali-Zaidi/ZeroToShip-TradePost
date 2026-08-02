document.addEventListener("DOMContentLoaded", () => {

    const targetId = getIdFromPath(); // from auth.js -- works for /posts/5, /offers/9/accept, /offers/delete_offer/9
    const myUserId = getUserIdFromToken(); // from auth.js

    // Badge + action markup for a single offer, from the CURRENT user's point of view.
    // Turn state is driven by turn_holder_id, NOT offer.status -- status stays
    // "Pending" for the whole back-and-forth, only turn_holder_id changes each round.
    function turnBadge(offer) {
        if (offer.status !== "Pending") {
            const cls = offer.status === "Accepted" ? "bg-success" : "bg-secondary";
            return { badge: `<span class="badge ${cls}">${offer.status}</span>`, myTurn: false };
        }
        const myTurn = offer.turn_holder_id === myUserId;
        return {
            badge: myTurn
                ? `<span class="badge bg-warning text-dark">Your Turn</span>`
                : `<span class="badge bg-secondary">Waiting for Peer</span>`,
            myTurn
        };
    }

    // ==========================================
    // 1. POST DETAILS & INBOUND OFFERS (owner-only panel)
    // ==========================================
    const detailsContainer = document.getElementById("post-details-container");
    const offersContainer = document.getElementById("post-offers-container");
    const makeOfferBtn = document.getElementById("makeOfferBtn");

    if (detailsContainer) {
        async function loadPostAndOffers() {
            try {
                const postRes = await fetch(`/api/posts/${targetId}`, { headers: getAuthHeaders(true) });
                if (!postRes.ok) throw new Error("Post not found");
                const post = await postRes.json();

                detailsContainer.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <h3 class="fw-bold mb-2">${post.title}</h3>
                        <span class="badge ${post.status === "Open" ? "bg-success" : "bg-secondary"}">${post.status}</span>
                    </div>
                    <p class="text-muted">Listed by: ${post.owner_username}</p>
                    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mb-3" style="max-height: 300px;">` : ""}
                    <p class="mb-0">${post.description}</p>
                `;

                const isOwner = post.owner_id === myUserId;

                // "Propose Trade" only makes sense if you don't already own this post
                if (makeOfferBtn) {
                    if (isOwner) {
                        makeOfferBtn.classList.add("d-none");
                    } else {
                        makeOfferBtn.href = `/offers/create_offer?post_id=${post.post_id}`;
                    }
                }

                // Inbound offers are only visible to the post's owner (the API
                // itself enforces this and returns 403 for anyone else), so
                // don't even try to render the panel for non-owners.
                if (!offersContainer) return;
                if (!isOwner) {
                    offersContainer.innerHTML = "";
                    return;
                }

                const offersRes = await fetch(`/api/posts/${targetId}/offers`, { headers: getAuthHeaders(true) });
                if (!offersRes.ok) throw new Error("Could not load offers");
                const data = await offersRes.json();
                const offers = data.offers || [];

                if (offers.length === 0) {
                    offersContainer.innerHTML = `<p class="text-muted">No offers received yet.</p>`;
                    return;
                }

                offersContainer.innerHTML = "";
                offers.forEach((offer) => {
                    const { badge, myTurn } = turnBadge(offer);
                    const actions =
                        offer.status === "Pending" && myTurn
                            ? `<a href="/offers/${offer.offer_id}/accept" class="btn btn-sm btn-success">Accept Trade</a>
                               <a href="/offers/delete_offer/${offer.offer_id}" class="btn btn-sm btn-outline-danger">Decline</a>`
                            : "";

                    offersContainer.insertAdjacentHTML("beforeend", `
                        <div class="card shadow-sm mb-3 border-start border-4 border-primary">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="mb-0 fw-bold">Offer from: ${offer.proposer_username}</h6>
                                    ${badge}
                                </div>
                                <p class="mb-3">${offer.offered_item_details}</p>
                                <div class="d-flex justify-content-end gap-2">
                                    ${actions}
                                </div>
                            </div>
                        </div>
                    `);
                });
            } catch (error) {
                console.error(error);
                detailsContainer.innerHTML = `<p class="text-danger">Failed to load details.</p>`;
            }
        }
        loadPostAndOffers();
    }

    // ==========================================
    // 2. CREATE OUTBOUND OFFER
    // ==========================================
    const offerCreateForm = document.getElementById("offerCreateForm");
    if (offerCreateForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get("post_id");
        if (postId) document.getElementById("targetPostId").value = postId;

        offerCreateForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const postIdVal = parseInt(document.getElementById("targetPostId").value, 10);
            if (!postIdVal) {
                alert("Missing target post -- go back to the item you want to trade for and click Propose Offer again.");
                return;
            }

            const payload = {
                post_id: postIdVal,
                offered_item_details: document.getElementById("offerMessage").value
            };

            try {
                const res = await fetch("/api/offers/create_offer", {
                    method: "POST",
                    headers: getAuthHeaders(true),
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Could not send offer");
                window.location.href = "/offers/my_offers";
            } catch (error) {
                alert("Failed to propose trade.");
            }
        });
    }

    // ==========================================
    // 3. MY OFFERS DASHBOARD
    // ==========================================
    const myOffersGrid = document.getElementById("my-offers-grid");
    if (myOffersGrid) {
        async function fetchMyOffers() {
            try {
                const res = await fetch("/api/offers/my_offers", { headers: getAuthHeaders(true) });
                if (!res.ok) throw new Error("Failed to load offers");
                const offers = await res.json();

                myOffersGrid.innerHTML = "";
                if (offers.length === 0) {
                    myOffersGrid.innerHTML = `<p class="text-center text-muted">You haven't made any offers yet.</p>`;
                    return;
                }

                offers.forEach((offer) => {
                    const { badge } = turnBadge(offer);
                    const targetTitle = offer.post ? offer.post.title : `Post #${offer.post_id}`;
                    myOffersGrid.insertAdjacentHTML("beforeend", `
                        <div class="card shadow-sm mb-4">
                             <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                 <small class="text-muted">Target: <strong>${targetTitle}</strong></small>
                                 ${badge}
                             </div>
                             <div class="card-body">
                                 <p><strong>Your Proposal:</strong> ${offer.offered_item_details}</p>
                             </div>
                             <div class="card-footer d-flex justify-content-end bg-white">
                                 ${offer.status === "Pending"
                                     ? `<a href="/offers/delete_offer/${offer.offer_id}" class="btn btn-sm btn-outline-danger">Withdraw</a>`
                                     : ""}
                             </div>
                         </div>
                    `);
                });
            } catch (error) {
                myOffersGrid.innerHTML = `<p class="text-danger">Failed to load offers.</p>`;
            }
        }
        fetchMyOffers();
    }

    // ==========================================
    // 4. ACCEPT / DELETE CONFIRMATIONS
    // ==========================================
    const acceptBtn = document.getElementById("confirmAcceptOfferBtn");
    if (acceptBtn) {
        acceptBtn.addEventListener("click", async () => {
            try {
                const res = await fetch(`/api/offers/${targetId}/accept`, {
                    method: "POST",
                    headers: getAuthHeaders(true)
                });
                if (!res.ok) throw new Error("Failed");
                window.location.href = "/posts/my_posts";
            } catch (e) {
                alert("Could not accept trade.");
            }
        });
    }

    const deleteOfferBtn = document.getElementById("confirmDeleteOfferBtn");
    if (deleteOfferBtn) {
        deleteOfferBtn.addEventListener("click", async () => {
            try {
                const res = await fetch(`/api/offers/delete_offer/${targetId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(true)
                });
                if (!res.ok) throw new Error("Failed");
                window.location.href = "/offers/my_offers";
            } catch (e) {
                alert("Could not withdraw offer.");
            }
        });
    }
});