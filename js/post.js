/* ===========================================
   PULSE — Post Creation & Detail
   =========================================== */
InstaVibe.Post = {
    selectedFilter: 'filter-none',
    selectedImage: null, // Base64 preview
    selectedFile: null,  // Raw file to upload

    renderCreatePage() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
        <div class="create-page animate-fadeIn">
            <div class="modal-header">
                <button onclick="InstaVibe.App.navigate('feed')" style="font-size:16px;font-weight:600;color:var(--accent-coral)">Annuler</button>
                <h3>Créer</h3>
                <button class="btn btn-primary btn-sm" id="publish-btn" disabled>Publier</button>
            </div>
            <div class="create-preview" id="create-preview">
                <div class="create-upload-area" id="upload-area">
                    ${InstaVibe.Utils.icons.image}
                    <p>Choisissez une photo</p>
                    <button class="btn btn-glow">Sélectionner</button>
                </div>
            </div>
            <div class="filter-grid hidden" id="filter-grid"></div>
            <div class="create-caption-area">
                <textarea placeholder="Racontez votre moment..." id="post-caption" maxlength="2200"></textarea>
            </div>
            <div class="create-options">
                <div class="create-option-item" id="add-location-btn">
                    <span>📍 Lieu</span><span id="location-value" style="color:var(--text-secondary)"></span>
                </div>
            </div>
            <input type="file" id="file-input" accept="image/*" style="display:none">
        </div>`;
        this._bindCreateEvents();
    },

    _bindCreateEvents() {
        const fileInput = document.getElementById('file-input');
        document.getElementById('upload-area')?.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0]; if (!file) return;
            this.selectedFile = file;
            const dataUrl = await InstaVibe.Utils.fileToDataUrl(file);
            this.selectedImage = dataUrl;
            document.getElementById('create-preview').innerHTML = `<img src="${dataUrl}" class="${this.selectedFilter}" id="preview-img">`;
            this._renderFilters(dataUrl);
            document.getElementById('publish-btn').disabled = false;
        });
        document.getElementById('publish-btn')?.addEventListener('click', () => this._publishPost());
        document.getElementById('add-location-btn')?.addEventListener('click', () => {
            const loc = prompt('Lieu:');
            if (loc) document.getElementById('location-value').textContent = loc;
        });
    },

    _renderFilters(imageUrl) {
        const filters = ['none','clarendon','gingham','moon','lark','reyes','juno','slumber','ludwig','aden','perpetua','amaro','valencia','xpro2','lofi','inkwell','nashville'];
        const grid = document.getElementById('filter-grid');
        grid.classList.remove('hidden');
        grid.innerHTML = filters.map(f => `
            <div class="filter-option ${f==='none'?'active':''}" data-filter="filter-${f}">
                <div class="filter-preview"><img src="${imageUrl}" class="filter-${f}"></div>
                <span>${f==='none'?'Original':f}</span>
            </div>`).join('');
        grid.addEventListener('click', (e) => {
            const opt = e.target.closest('.filter-option'); if (!opt) return;
            grid.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            this.selectedFilter = opt.dataset.filter;
            const img = document.getElementById('preview-img');
            if (img) img.className = this.selectedFilter;
        });
    },

    async _publishPost() {
        if (!this.selectedImage || !this.selectedFile) return;
        const user = InstaVibe.Utils.getCurrentUser();
        const postId = InstaVibe.Utils.generateId('post_');
        
        try {
            document.getElementById('publish-btn').disabled = true;
            document.getElementById('publish-btn').textContent = 'Publication...';
            
            // 1. Upload the physical file
            const path = `users/${user.id}/posts/${postId}.jpg`;
            const publicUrl = await InstaVibe.Utils.uploadFile(this.selectedFile, path);
            
            // 2. Create the post object
            const post = {
                id: postId, userId: user.id,
                username: user.username, userAvatar: user.avatarUrl,
                imageUrl: publicUrl,
                caption: document.getElementById('post-caption')?.value || '',
                filter: this.selectedFilter,
                location: document.getElementById('location-value')?.textContent || '',
                likesCount: 0, commentsCount: 0, createdAt: Date.now()
            };
            
            // 3. Save to database (DemoStore + Firestore)
            InstaVibe.DemoStore.add('posts', post);
            InstaVibe.DemoStore.update('users', user.id, { postsCount: (user.postsCount || 0) + 1 });
            
            // Sauvegarder dans Firestore pour les autres utilisateurs
            if (!InstaVibe.DEMO_MODE) {
                InstaVibe.db.collection('posts').doc(postId).set(post)
                    .then(() => console.log("✅ Post publié sur Firestore"))
                    .catch(e => console.error("Erreur Firestore post:", e));
            }
            
            this.selectedImage = null; this.selectedFile = null; this.selectedFilter = 'filter-none';
            InstaVibe.Utils.showToast('Publié avec succès ⚡', 'success');
            InstaVibe.App.navigate('feed');
        } catch (e) {
            InstaVibe.Utils.showToast('Erreur lors de la publication', 'error');
            document.getElementById('publish-btn').disabled = false;
            document.getElementById('publish-btn').textContent = 'Publier';
        }
    },

    renderPostCard(post) {
        const user = InstaVibe.Utils.getCurrentUser();
        const isLiked = InstaVibe.DemoStore.findOne('likes', l => l.postId === post.id && l.userId === user?.id);
        const isSaved = InstaVibe.DemoStore.findOne('bookmarks', b => b.postId === post.id && b.userId === user?.id);
        const isFollowing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === user?.id && f.followingId === post.userId);
        const isMe = post.userId === user?.id;
        const icons = InstaVibe.Utils.icons;

        return `<article class="post-card stagger-item" data-post-id="${post.id}">
            <div class="post-header">
                <div class="avatar-spark${Math.random()>0.5?' viewed':''}"><div class="avatar" onclick="InstaVibe.App.navigate('user/${post.userId}')" style="cursor:pointer"><img src="${post.userAvatar}" alt=""></div></div>
                <div class="post-header-info" onclick="InstaVibe.App.navigate('user/${post.userId}')" style="cursor:pointer">
                    <div class="username">${post.username}</div>
                    ${post.location ? `<div class="location">📍 ${post.location}</div>` : ''}
                </div>
                ${!isMe ? `
                    <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm" 
                        onclick="event.stopPropagation(); InstaVibe.Post.toggleFollowFromFeed('${post.userId}', this)"
                        style="margin-right: 8px; font-size: 11px; padding: 4px 10px;">
                        ${isFollowing ? 'Suivi(e)' : 'Suivre'}
                    </button>
                ` : ''}
                <button class="btn-icon" style="width:32px;height:32px; flex-shrink:0;">${icons.more}</button>
            </div>
            <div class="post-image-container" ondblclick="InstaVibe.Post.doubleTapLike('${post.id}', this)">
                <img src="${post.imageUrl}" alt="" class="${post.filter || ''}" loading="lazy">
                <div class="double-tap-heart" id="heart-${post.id}">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--accent-cyan)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>
                </div>
            </div>
            <div class="post-actions">
                <button class="post-action-btn ${isLiked?'liked':''}" onclick="InstaVibe.Post.toggleLike('${post.id}')" data-like-btn="${post.id}">${isLiked ? icons.heartFilled : icons.heart}</button>
                <button class="post-action-btn" onclick="InstaVibe.Post.showComments('${post.id}')">${icons.comment}</button>
                <button class="post-action-btn">${icons.share}</button>
                <div class="right-actions">
                    <button class="post-action-btn ${isSaved?'saved':''}" onclick="InstaVibe.Post.toggleBookmark('${post.id}')" data-save-btn="${post.id}">${isSaved ? icons.bookmarkFilled : icons.bookmark}</button>
                </div>
            </div>
            <div class="post-info">
                <div class="post-likes" data-likes-count="${post.id}">${InstaVibe.Utils.formatNumber(post.likesCount)} vibes</div>
                <div class="post-caption"><span class="username">${post.username}</span> ${InstaVibe.Utils.escapeHtml(post.caption)}</div>
                ${post.commentsCount > 0 ? `<div class="post-comments-link" onclick="InstaVibe.Post.showComments('${post.id}')">Voir les ${post.commentsCount} réactions</div>` : ''}
                <div class="post-time">${InstaVibe.Utils.timeAgo(post.createdAt)}</div>
            </div>
        </article>`;
    },

    toggleFollowFromFeed(targetId, btn) {
        InstaVibe.Profile.toggleFollow(targetId);
        const currentUser = InstaVibe.Utils.getCurrentUser();
        const isNowFollowing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === currentUser?.id && f.followingId === targetId);
        if (isNowFollowing) {
            btn.className = 'btn btn-secondary btn-sm';
            btn.textContent = 'Suivi(e)';
        } else {
            btn.className = 'btn btn-primary btn-sm';
            btn.textContent = 'Suivre';
        }
        // Force refresh feed to re-order? Or just keep it as is.
    },

    toggleLike(postId) {
        const user = InstaVibe.Utils.getCurrentUser();
        const existing = InstaVibe.DemoStore.findOne('likes', l => l.postId === postId && l.userId === user.id);
        const post = InstaVibe.DemoStore.findOne('posts', p => p.id === postId);
        const btn = document.querySelector(`[data-like-btn="${postId}"]`);
        const countEl = document.querySelector(`[data-likes-count="${postId}"]`);

        if (existing) {
            InstaVibe.DemoStore.delete('likes', existing.id);
            post.likesCount = Math.max(0, post.likesCount - 1);
            if (btn) { btn.classList.remove('liked'); btn.innerHTML = InstaVibe.Utils.icons.heart; }
        } else {
            InstaVibe.DemoStore.add('likes', { id: InstaVibe.Utils.generateId('l_'), postId, userId: user.id, createdAt: Date.now() });
            post.likesCount++;
            if (btn) { btn.classList.add('liked', 'animate-likeGlow'); btn.innerHTML = InstaVibe.Utils.icons.heartFilled; setTimeout(() => btn.classList.remove('animate-likeGlow'), 500); }
        }
        InstaVibe.DemoStore.update('posts', postId, { likesCount: post.likesCount });
        if (countEl) countEl.textContent = `${InstaVibe.Utils.formatNumber(post.likesCount)} vibes`;
    },

    doubleTapLike(postId, container) {
        const user = InstaVibe.Utils.getCurrentUser();
        const existing = InstaVibe.DemoStore.findOne('likes', l => l.postId === postId && l.userId === user.id);
        if (!existing) this.toggleLike(postId);
        const heart = document.getElementById(`heart-${postId}`);
        if (heart) { heart.classList.add('animate-pulseRipple'); setTimeout(() => heart.classList.remove('animate-pulseRipple'), 800); }
    },

    toggleBookmark(postId) {
        const user = InstaVibe.Utils.getCurrentUser();
        const existing = InstaVibe.DemoStore.findOne('bookmarks', b => b.postId === postId && b.userId === user.id);
        const btn = document.querySelector(`[data-save-btn="${postId}"]`);
        if (existing) {
            InstaVibe.DemoStore.delete('bookmarks', existing.id);
            if (btn) { btn.classList.remove('saved'); btn.innerHTML = InstaVibe.Utils.icons.bookmark; }
        } else {
            InstaVibe.DemoStore.add('bookmarks', { id: InstaVibe.Utils.generateId('b_'), postId, userId: user.id, createdAt: Date.now() });
            if (btn) { btn.classList.add('saved'); btn.innerHTML = InstaVibe.Utils.icons.bookmarkFilled; }
            InstaVibe.Utils.showToast('Sauvegardé ⭐', 'success');
        }
    },

    showComments(postId) {
        const post = InstaVibe.DemoStore.findOne('posts', p => p.id === postId);
        const comments = InstaVibe.DemoStore.find('comments', c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
        const user = InstaVibe.Utils.getCurrentUser();
        let html = `<div class="modal-header">
            <button onclick="InstaVibe.Utils.closeModal()">${InstaVibe.Utils.icons.close}</button>
            <h3>Réactions</h3><div></div></div>
        <div style="max-height:60vh;overflow-y:auto;padding-bottom:60px;">
            <div class="comment-item" style="border-bottom:1px solid var(--border-glass);">
                <div class="avatar avatar-sm"><img src="${post.userAvatar}" alt=""></div>
                <div class="comment-content"><span class="comment-username">${post.username}</span>
                <span class="comment-text">${InstaVibe.Utils.escapeHtml(post.caption)}</span>
                <div class="comment-meta"><span>${InstaVibe.Utils.timeAgo(post.createdAt)}</span></div></div></div>
            ${comments.map(c => `<div class="comment-item">
                <div class="avatar avatar-sm"><img src="${c.userAvatar}" alt=""></div>
                <div class="comment-content"><span class="comment-username">${c.username}</span>
                <span class="comment-text">${InstaVibe.Utils.escapeHtml(c.text)}</span>
                <div class="comment-meta"><span>${InstaVibe.Utils.timeAgo(c.createdAt)}</span></div></div></div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-top:1px solid var(--border-glass);">
            <div class="avatar avatar-sm"><img src="${user?.avatarUrl||''}" alt=""></div>
            <input type="text" class="input-field" placeholder="Réagir..." id="comment-input" style="border-radius:var(--radius-pill);padding:10px 16px;">
            <button style="color:var(--accent-cyan);font-weight:600;cursor:pointer;" id="post-comment-btn" onclick="InstaVibe.Post.addComment('${postId}')">Envoyer</button>
        </div>`;
        InstaVibe.Utils.showModal(html);
    },

    addComment(postId) {
        const input = document.getElementById('comment-input');
        const text = input?.value.trim(); if (!text) return;
        const user = InstaVibe.Utils.getCurrentUser();
        InstaVibe.DemoStore.add('comments', {
            id: InstaVibe.Utils.generateId('com_'), postId, userId: user.id,
            username: user.username, userAvatar: user.avatarUrl, text, createdAt: Date.now()
        });
        const post = InstaVibe.DemoStore.findOne('posts', p => p.id === postId);
        InstaVibe.DemoStore.update('posts', postId, { commentsCount: (post.commentsCount || 0) + 1 });
        InstaVibe.Utils.closeModal();
        this.showComments(postId);
    }
};
