document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // POST RENDERER HELPERS
    // ==========================================
    const statusBadge = (status) =>
        status === "Open"
            ? `<span class="badge bg-success">Open</span>`
            : `<span class="badge bg-secondary">${status}</span>`;

    const myUserId = getUserIdFromToken();
    
    function buildPostCard(post) {
        const imageHtml = post.image_url
            ? `<img src="${post.image_url}" class="card-img-top mb-3 rounded" style="max-height: 200px; object-fit: cover;">`
            : "";

        const isOwner = post.owner_id == myUserId;

        let actionsHtml;

        if (isOwner) {
            actionsHtml = `
                <a href="/posts/${post.post_id}/offers" class="btn btn-sm btn-primary">View Offers</a>
                <a href="/posts/delete_post/${post.post_id}" class="btn btn-sm btn-outline-danger">Delete</a>
            `;
        } else if (post.status === "Open") {
            actionsHtml = `
                <a href="/offers/create_offer?post_id=${post.post_id}" class="btn btn-sm btn-primary">Propose Offer</a>
                <a href="/posts/${post.post_id}" class="btn btn-sm btn-outline-secondary">View Details</a>
            `;
        } else {
            actionsHtml = `
                <a href="/posts/${post.post_id}" class="btn btn-sm btn-outline-secondary">View Details</a>
            `;
        }

        return `
            <div class="card feed-card mb-4 shadow-sm p-3">
                <div class="d-flex justify-content-between align-items-start">

                    <!-- Left Section -->
                    <div class="flex-grow-1">

                        <!-- Avatar + Username -->
                        <div class="d-flex align-items-center mb-2">

                            <div
                                class="rounded-circle bg-success text-white fw-bold d-flex justify-content-center align-items-center me-2"
                                style="width:40px; height:40px; font-size:18px;"
                            >
                                ${post.owner_username.charAt(0).toUpperCase()}
                            </div>

                            <span class="fw-bold fs-5">
                                ${post.owner_username}
                            </span>

                        </div>

                        <!-- Title BELOW avatar/username -->
                        <h4 class="fw-bold mb-0">
                            ${post.title}
                        </h4>

                    </div>

                    <!-- Right Section -->
                    ${statusBadge(post.status)}

                </div>
                ${imageHtml}
                <p class="text-muted mt-2">${post.description}</p>
                <div class="d-flex justify-content-end gap-2 border-top pt-3 mt-2">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    function renderPosts(container, posts, emptyMessage) {
        container.innerHTML = "";
        if (posts.length === 0) {
            container.innerHTML = `<p class="text-center text-muted mt-4">${emptyMessage}</p>`;
            return;
        }
        posts.forEach(post => container.insertAdjacentHTML("beforeend", buildPostCard(post)));
    }

    // ==========================================
    // FEED LOADING (Marketplace & My Listings)
    // ==========================================
    const marketGrid = document.getElementById("marketplace-grid");
    const myPostsGrid = document.getElementById("my-posts-grid");
    const statusFilter = document.getElementById("statusFilter");

    const getStatusQuery = () => statusFilter && statusFilter.value ? `?status=${encodeURIComponent(statusFilter.value)}` : "";

    async function loadFeeds() {
        if (marketGrid) {
            try {
                const res = await fetch(`/api/posts/${getStatusQuery()}`, { headers: getAuthHeaders(true) });
                const posts = await res.json();
                renderPosts(marketGrid, posts, "No items listed yet.");
            } catch (e) {
                marketGrid.innerHTML = `<p class="text-danger text-center">Failed to load marketplace.</p>`;
            }
        }
        if (myPostsGrid) {
            try {
                const res = await fetch(`/api/posts/my_posts${getStatusQuery()}`, { headers: getAuthHeaders(true) });
                const posts = await res.json();
                renderPosts(myPostsGrid, posts, "You haven't listed anything yet.");
            } catch (e) {
                myPostsGrid.innerHTML = `<p class="text-danger text-center">Failed to load your listings.</p>`;
            }
        }
    }

    if (marketGrid || myPostsGrid) {
        if (statusFilter) {
            statusFilter.classList.remove("d-none");
            statusFilter.addEventListener("change", loadFeeds);
        }
        loadFeeds();
    }

    // ==========================================
    // CREATE LISTING
    // ==========================================
    const createForm = document.getElementById("postCreateForm");
    if (createForm) {
        createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("submitPostBtn");
            submitBtn.disabled = true;
            submitBtn.innerText = "Uploading...";

            let imageUrl = null;
            const imageFile = document.getElementById("postImage").files[0];

            try {
                if (imageFile) {
                    const imgData = new FormData();
                    imgData.append("file", imageFile);
                    const imgRes = await fetch("/api/posts/upload_image", {
                        method: "POST",
                        headers: getAuthHeaders(false), // No JSON content-type for FormData
                        body: imgData
                    });
                    if (!imgRes.ok) throw new Error("Image upload failed");
                    imageUrl = (await imgRes.json()).image_url;
                }

                const postPayload = {
                    title: document.getElementById("postTitle").value,
                    description: document.getElementById("postDescription").value,
                    image_url: imageUrl
                };

                const postRes = await fetch("/api/posts/create_post", {
                    method: "POST",
                    headers: getAuthHeaders(true),
                    body: JSON.stringify(postPayload)
                });

                if (!postRes.ok) throw new Error("Failed to create post");
                window.location.href = "/posts/my_posts";
            } catch (error) {
                alert(error.message);
                submitBtn.disabled = false;
                submitBtn.innerText = "Publish Listing";
            }
        });
    }

    // ==========================================
    // DELETE LISTING
    // ==========================================
    const deleteBtn = document.getElementById("confirmDeletePostBtn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            const postId = getIdFromPath();
            try {
                const res = await fetch(`/api/posts/delete_post/${postId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(true)
                });
                if (!res.ok) throw new Error("Could not delete");
                window.location.href = "/posts/my_posts";
            } catch (e) {
                alert("Error deleting listing.");
            }
        });
    }
});