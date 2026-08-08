document.addEventListener("DOMContentLoaded", () => {
    
    const myUserId = getUserIdFromToken();
    const pathname = window.location.pathname;

    function getTurnBadge(offer) {
        if (offer.status !== "Pending") {
            const cls = offer.status === "Accepted" ? "bg-success" : "bg-secondary";
            return { badge: `<span class="badge ${cls}">${offer.status}</span>`, myTurn: false };
        }
        const myTurn = offer.turn_holder_id == myUserId;
        return {
            badge: myTurn
                ? `<span class="badge bg-warning text-dark">Your Turn</span>`
                : `<span class="badge bg-secondary">Waiting for Peer</span>`,
            myTurn
        };
    }

    function avatar(name) {
    return `<span class="trade-card__avatar">${(name || "?").charAt(0).toUpperCase()}</span>`;
    }

    // Helper to safely extract the relevant ID from the URL path
    function getPathId() {
        const parts = pathname.split("/").filter(Boolean);
        const idPart = parts.reverse().find(p => /^\d+$/.test(p));
        return idPart ? parseInt(idPart, 10) : null;
    }

    // ==========================================
    // 1. POST DETAILS & INBOUND OFFERS
    // ==========================================
    const detailsContainer = document.getElementById("post-details-container");
    const offersContainer = document.getElementById("post-offers-container");
    const makeOfferBtn = document.getElementById("makeOfferBtn");
    const offersHeading = document.getElementById("offersHeading");

    if (detailsContainer) {
        const postId = getPathId();
        (async function loadPostDetails() {
            try {
                const postRes = await fetch(`/api/posts/${postId}`, { headers: getAuthHeaders(true) });
                if (!postRes.ok) throw new Error("Post not found");
                const post = await postRes.json();

                detailsContainer.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <h3 class="fw-bold mb-2">${post.title}</h3>
                        <span class="badge ${post.status === "Open" ? "bg-success" : "bg-secondary"}">${post.status}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-3">
                        ${avatar(post.owner_username)}
                        <span class="text-muted">Listed by ${post.owner_username}</span>
                    </div>
                    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mb-3" style="max-height: 300px;">` : ""}
                    <p class="mb-0">${post.description}</p>
                `;

                const isOwner = post.owner_id == myUserId;

                if (makeOfferBtn) {
                    if (isOwner || post.status !== "Open") {
                        makeOfferBtn.classList.add("d-none");
                        makeOfferBtn.style.display = "none";
                    } else {
                        makeOfferBtn.classList.remove("d-none");
                        makeOfferBtn.style.display = "inline-block";
                        makeOfferBtn.href = `/offers/create_offer?post_id=${post.post_id}`;
                    }
                }

                if (offersHeading) {
                    offersHeading.textContent = isOwner 
                    ? "Offers Received"
                    : "My Offer";
                }

                const offersRes = await fetch(`/api/posts/${postId}/offers`, { headers: getAuthHeaders(true) });
                const offersData = await offersRes.json();
                const offers = offersData.offers || [];

                if (offers.length === 0) {
                    offersContainer.innerHTML = isOwner
                        ? `<div class="feed-state"><i class="bi bi-inbox"></i>No offers received yet.</div>`
                        : `<div class="feed-state"><i class="bi bi-inbox"></i>You haven't made an offer on this listing.</div>`;

                    return;
                }

                offers.forEach(offer => {
                    const { badge, myTurn } = getTurnBadge(offer);

                    // View Post button
                    const viewPostBtn = offer.offered_post_id
                        ? `<a href="/posts/${offer.offered_post_id}" class="btn btn-sm btn-outline-info">View Offered Item</a>`
                        : "";
                    
                    // Handle actions based on whose turn it is
                    let actions = "";
                    if (offer.status === "Pending") {
                        if (myTurn) {
                            // It is your turn to respond
                            actions = `<a href="/offers/${offer.offer_id}/accept" class="btn btn-sm btn-success">Accept Trade</a>
                                       <a href="/offers/edit_offer/${offer.offer_id}" class="btn btn-sm btn-outline-primary">Counter Offer</a>
                                       <a href="/offers/delete_offer/${offer.offer_id}" class="btn btn-sm btn-outline-danger">Decline</a>`;
                        } else {
                            // You are waiting for the other party, so you can withdraw
                            actions = `<a href="/offers/delete_offer/${offer.offer_id}" class="btn btn-sm btn-outline-danger">Withdraw</a>`;
                        }
                    }

                    offersContainer.insertAdjacentHTML("beforeend", `
                        <div class="offer-card">
                            <div class="offer-card__head">
                                <div class="offer-card__who">
                                    ${avatar(offer.proposer_username)}
                                    <span class="offer-card__name">${offer.proposer_username}</span>
                                </div>
                                ${badge}
                            </div>
                            <p class="offer-card__details">${offer.offered_item_details}</p>
                            <div class="offer-card__actions">
                                ${viewPostBtn}
                                ${actions}
                            </div>
                        </div>
                    `);
                });
            } catch (e) {
                detailsContainer.innerHTML = `<p class="text-danger">Failed to load details.</p>`;
            }
        })();
    }

    // ==========================================
    // 2. CREATE OR EDIT (COUNTER) OUTBOUND OFFER
    // ==========================================
    const offerCreateForm = document.getElementById("offerCreateForm");
    if (offerCreateForm) {
        const isEditMode = pathname.includes("/edit_offer/");
        const editOfferId = isEditMode ? getPathId() : null;

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get("post_id");
        if (postId && !isEditMode) {
            document.getElementById("targetPostId").value = postId;
        }

        const selectEl = document.getElementById("offeredPostSelect");

        if (isEditMode) {
            const heading = document.querySelector(".auth-card h2") || document.querySelector("h2.page-heading");
            if (heading) heading.innerText = "Submit Counter Offer";
            const submitBtn = document.getElementById("submitOfferBtn");
            if (submitBtn) submitBtn.innerText = "Send Counter Offer";

            const messageLabel = document.querySelector('label[for="offerMessage"]');
            if (messageLabel) messageLabel.innerText = "Enter Your Counter Offer";

            const offeredPostLabel = document.querySelector('label[for="offeredPostSelect"]');
            if (offeredPostLabel) offeredPostLabel.innerText = "Selected Listing to Trade";

            // Fetch the exact offer details directly from the database!
            (async function fetchOfferDetails() {
                try {
                    const res = await fetch(`/api/offers/${editOfferId}`, { headers: getAuthHeaders(true) });
                    if (!res.ok) throw new Error("Could not fetch offer details");
                    const offerData = await res.json();

                    const targetInput = document.getElementById("targetPostId");
                    if (targetInput && offerData.post_id) {
                        targetInput.value = offerData.post_id;
                    }

                    // 1. Lock and fill the dropdown menu using the database data
                    if (selectEl) {
                        // Assuming your enriched offer returns the post title inside an 'post' object
                        const lockedTitle = offerData.post
                            ? offerData.post.title
                            : "Message / Custom Offer";
                        selectEl.innerHTML = `<option value="" selected>${lockedTitle} (Locked)</option>`;
                        selectEl.disabled = true;
                    }

                    // 2. Un-hide the message box and inject the database data
                    const prevContainer = document.getElementById("previousOfferContainer");
                    const prevText = document.getElementById("previousOfferText");
                    if (prevContainer && prevText) {
                        prevText.innerText = offerData.offered_item_details;
                        prevContainer.classList.remove("d-none"); 
                    }
                } catch (e) {
                    selectEl.innerHTML = `<option value="" disabled selected>Error loading listings</option>`;
                }
            })();
        } else if (selectEl && !isEditMode) {
            (async function populateListings() {
                try {
                    const res = await fetch("/api/posts/", { headers: getAuthHeaders(true) });
                    const posts = await res.json();
                    const openPosts = posts.filter(p => p.owner_id == myUserId && p.status === "Open");

                    if (openPosts.length === 0) {
                        selectEl.innerHTML = `<option value="" disabled selected>No open listings available</option>`;
                        return;
                    }
                    
                    selectEl.innerHTML = `<option value="" selected>No Listing Selected</option>`;
                    openPosts.forEach(post => {
                        selectEl.insertAdjacentHTML("beforeend", `<option value="${post.post_id}">${post.title}</option>`);
                    });
                } catch (e) {
                    selectEl.innerHTML = `<option value="" disabled selected>Error loading listings</option>`;
                }
            })();
        }

        offerCreateForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const notes = document.getElementById("offerMessage").value;
            const postIdVal = parseInt(document.getElementById("targetPostId").value, 10);

            if (isEditMode) {
                try {
                    const res = await fetch(`/api/offers/edit_offer/${editOfferId}`, {
                        method: "PUT",
                        headers: getAuthHeaders(true),
                        body: JSON.stringify({ offered_item_details: notes })
                    });
                    if (!res.ok) throw new Error("Failed to send counter offer");
                    window.location.href = `/posts/${postIdVal}`;
                } catch (e) {
                    alert("Failed to send counter offer.");
                }
            } else {
                if (!postIdVal) return alert("Missing target post.");

                const payload = {
                    post_id: postIdVal,
                    offered_item_details: notes,
                    offered_post_id: (selectEl && selectEl.value) ? parseInt(selectEl.value, 10) : null
                };

                try {
                    const res = await fetch("/api/offers/create_offer", {
                        method: "POST",
                        headers: getAuthHeaders(true),
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error("Failed to send offer");
                    window.location.href = `/posts/${postIdVal}`;
                } catch (e) {
                    alert("Failed to send offer.");
                }
            }
        });
    }

    // ==========================================
    // 3. MY OFFERS DASHBOARD
    // ==========================================
    const myOffersGrid = document.getElementById("my-offers-grid");
    if (myOffersGrid) {
        (async function fetchMyOffers() {
            try {
                const res = await fetch("/api/offers/my_offers", { headers: getAuthHeaders(true) });
                const offers = await res.json();

                if (offers.length === 0) {
                    myOffersGrid.innerHTML = `<div class="feed-state"><i class="bi bi-arrow-left-right"></i>You haven't made any offers yet.</div>`;
                    return;
                }

                myOffersGrid.innerHTML = "";
                offers.forEach(offer => {
                    const { badge } = getTurnBadge(offer);
                    const title = offer.post ? offer.post.title : `Post #${offer.post_id}`;
                    
                    myOffersGrid.insertAdjacentHTML("beforeend", `
                        <div class="offer-summary-card">
                            <div class="offer-summary-card__head">
                                <span class="offer-summary-card__target">Target: <strong>${title}</strong></span>
                                ${badge}
                            </div>
                            <div class="offer-summary-card__body">
                                <p><strong>Your Proposal:</strong> ${offer.offered_item_details}</p>
                            </div>
                            <div class="offer-summary-card__footer d-flex justify-content-end gap-2">
                                <a href="/posts/${offer.post_id}" class="btn btn-sm btn-outline-primary">View Trade</a>
                                ${offer.status === "Pending" ? `<a href="/offers/delete_offer/${offer.offer_id}" class="btn btn-sm btn-outline-danger">Withdraw</a>` : ""}
                            </div>
                        </div>
                    `);
                });
            } catch (e) {
                myOffersGrid.innerHTML = `<div class="feed-state is-error"><i class="bi bi-exclamation-circle"></i>Failed to load offers.</div>`;
            }
        })();
    }

    // ==========================================
    // 4. ACTION CONFIRMATIONS (Accept/Delete)
    // ==========================================
    const acceptBtn = document.getElementById("confirmAcceptOfferBtn");
    if (acceptBtn) {
        acceptBtn.addEventListener("click", async () => {
            const offerId = getPathId();
            try {
                // Fetch the offer to get the associated post_id before accepting
                const offerRes = await fetch(`/api/offers/${offerId}`, { headers: getAuthHeaders(true) });
                if (!offerRes.ok) throw new Error("Could not fetch offer details");
                const offerData = await offerRes.json();
                const targetPostId = offerData.post_id;

                const res = await fetch(`/api/offers/${offerId}/accept`, { method: "POST", headers: getAuthHeaders(true) });
                if (!res.ok) throw new Error();
                window.location.href = `/posts/${targetPostId}`;
            } catch (e) { alert("Could not accept trade."); }
        });
    }

    const deleteOfferBtn = document.getElementById("confirmDeleteOfferBtn");
    if (deleteOfferBtn) {
        deleteOfferBtn.addEventListener("click", async () => {
            const offerId = getPathId();
            try {
                // Fetch the offer to get the associated post_id before accepting
                const offerRes = await fetch(`/api/offers/${offerId}`, { headers: getAuthHeaders(true) });
                if (!offerRes.ok) throw new Error("Could not fetch offer details");
                const offerData = await offerRes.json();
                const targetPostId = offerData.post_id;

                const res = await fetch(`/api/offers/delete_offer/${offerId}`, { method: "DELETE", headers: getAuthHeaders(true) });
                if (!res.ok) throw new Error();

                window.location.href = `/posts/${targetPostId}`;
            } catch (e) { alert("Could not withdraw offer."); }
        });
    }
});