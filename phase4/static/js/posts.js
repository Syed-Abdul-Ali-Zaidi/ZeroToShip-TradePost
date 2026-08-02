document.addEventListener("DOMContentLoaded", () => {

    const statusBadge = (status) =>
        status === "Open"
            ? `<span class="badge bg-success">Open</span>`
            : `<span class="badge bg-secondary">${status}</span>`;

    // Builds one post card. `ownerView=true` shows Edit/Delete/View Offers
    // (used on "My Listings"); otherwise shows View Details/Propose Offer
    // (used on the public marketplace).
    function buildPostCard(post, ownerView) {
        const imageHtml = post.image_url
            ? `<img src="${post.image_url}" class="card-img-top mb-3 rounded" style="max-height: 200px; object-fit: cover;" alt="Item">`
            : "";

        const actionsHtml = ownerView
            ? `<a href="/posts/${post.post_id}/offers" class="btn btn-sm btn-primary">View Offers</a>
               <a href="/posts/edit_post/${post.post_id}" class="btn btn-sm btn-outline-secondary">Edit</a>
               <a href="/posts/delete_post/${post.post_id}" class="btn btn-sm btn-outline-danger">Delete</a>`
            : `<a href="/posts/${post.post_id}" class="btn btn-sm btn-outline-secondary">View Details</a>
               <a href="/offers/create_offer?post_id=${post.post_id}" class="btn btn-sm btn-primary">Propose Offer</a>`;

        return `
            <div class="card feed-card mb-4 shadow-sm p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <h5 class="fw-bold">${post.title}</h5>
                    <div class="d-flex gap-2 align-items-center">
                        ${statusBadge(post.status)}
                        ${ownerView ? "" : `<span class="badge bg-light text-dark border">By: ${post.owner_username}</span>`}
                    </div>
                </div>
                ${imageHtml}
                <p class="text-muted mt-2">${post.description}</p>
                <div class="d-flex justify-content-end gap-2 border-top pt-3 mt-2">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    function renderPosts(container, posts, ownerView, emptyMessage) {
        container.innerHTML = "";
        if (posts.length === 0) {
            container.innerHTML = `<p class="text-center text-muted mt-4">${emptyMessage}</p>`;
            return;
        }
        posts.forEach((post) => container.insertAdjacentHTML("beforeend", buildPostCard(post, ownerView)));
    }

    // ==========================================
    // STATUS FILTER (shared by marketplace + my listings)
    // ==========================================
    const statusFilter = document.getElementById("statusFilter");
    const marketGrid = document.getElementById("marketplace-grid");
    const myPostsGrid = document.getElementById("my-posts-grid");

    function currentStatusQuery() {
        const val = statusFilter ? statusFilter.value : "";
        return val ? `?status=${encodeURIComponent(val)}` : "";
    }

    // ==========================================
    // 1. MARKETPLACE FEED (public)
    // ==========================================
    async function fetchPosts() {
        try {
            const response = await fetch(`/api/posts/${currentStatusQuery()}`, {
                headers: getAuthHeaders(true)
            });
            if (!response.ok) throw new Error("Failed to load posts");
            const posts = await response.json();
            renderPosts(marketGrid, posts, false, "No items listed yet.");
        } catch (error) {
            marketGrid.innerHTML = `<p class="text-danger text-center mt-4">Error loading marketplace data.</p>`;
        }
    }

    // ==========================================
    // 2. MY LISTINGS (was completely missing before)
    // ==========================================
    async function fetchMyPosts() {
        try {
            const response = await fetch(`/api/posts/my_posts${currentStatusQuery()}`, {
                headers: getAuthHeaders(true)
            });
            if (!response.ok) throw new Error("Failed to load your posts");
            const posts = await response.json();
            renderPosts(myPostsGrid, posts, true, "You haven't listed anything yet.");
        } catch (error) {
            myPostsGrid.innerHTML = `<p class="text-danger text-center mt-4">Error loading your listings.</p>`;
        }
    }

    if (marketGrid || myPostsGrid) {
        if (statusFilter) {
            statusFilter.classList.remove("d-none");
            statusFilter.addEventListener("change", () => {
                if (marketGrid) fetchPosts();
                if (myPostsGrid) fetchMyPosts();
            });
        }
        if (marketGrid) fetchPosts();
        if (myPostsGrid) fetchMyPosts();
    }

    // ==========================================
    // 3. CREATE POST (WITH IMAGE UPLOAD)
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
                        headers: getAuthHeaders(false), // don't set JSON content-type for FormData
                        body: imgData
                    });
                    if (!imgRes.ok) throw new Error("Image upload failed");
                    const imgJson = await imgRes.json();
                    imageUrl = imgJson.image_url;
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

                if (!postRes.ok) throw new Error("Post creation failed");
                window.location.href = "/posts/my_posts";
            } catch (error) {
                alert(error.message);
                submitBtn.disabled = false;
                submitBtn.innerText = "Publish Listing";
            }
        });
    }

    // ==========================================
    // 4. DELETE POST CONFIRMATION
    // ==========================================
    const deletePostBtn = document.getElementById("confirmDeletePostBtn");
    if (deletePostBtn) {
        deletePostBtn.addEventListener("click", async () => {
            const postId = getIdFromPath(); // from auth.js
            try {
                const res = await fetch(`/api/posts/delete_post/${postId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(true)
                });
                if (!res.ok) throw new Error("Could not delete post");
                window.location.href = "/posts/my_posts";
            } catch (error) {
                alert("Error deleting listing.");
            }
        });
    }
});