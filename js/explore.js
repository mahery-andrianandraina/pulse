/* ===========================================
   PULSE — Discover (style Facebook)
   =========================================== */
InstaVibe.Explore = {
    async render() {
        document.getElementById('top-bar').innerHTML = `<div class="search-bar" style="flex:1;">
            <div class="search-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-input" placeholder="Rechercher des personnes..." id="search-input">
            </div>
        </div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        const content = document.getElementById('page-content');

        // Fetch all users from Firestore
        if (!InstaVibe.DEMO_MODE) {
            try {
                const snap = await InstaVibe.db.collection('users').get();
                snap.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    if (InstaVibe.DemoStore.findOne('users', u => u.id === doc.id)) {
                        InstaVibe.DemoStore.update('users', doc.id, data);
                    } else {
                        InstaVibe.DemoStore.add('users', data);
                    }
                });
            } catch (e) { console.error("Erreur sync utilisateurs explore", e); }
        }

        this._renderDiscover(content);

        document.getElementById('search-input').addEventListener('input',
            InstaVibe.Utils.debounce((e) => this._handleSearch(e.target.value, content), 300)
        );
    },

    _renderDiscover(container) {
        const currentUser = InstaVibe.Utils.getCurrentUser();
        const allUsers = InstaVibe.DemoStore.get('users')
            .filter(u => u.id !== 'demo_user' && !u.id.startsWith('user_') && u.id !== currentUser?.id);

        if (allUsers.length === 0) {
            container.innerHTML = '<div class="empty-state page-enter"><div class="empty-state-icon">🔍</div><h3>Aucun utilisateur</h3><p>Soyez le premier à inviter vos amis !</p></div>';
            return;
        }

        let html = '<div class="page-enter" style="padding: 16px;">';
        html += '<div style="font-weight:700;font-size:17px;margin-bottom:12px;color:var(--text-primary);">Suggestions pour vous</div>';
        html += '<div class="discover-grid">';

        allUsers.forEach(u => {
            const isFollowing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === currentUser?.id && f.followingId === u.id);
            html += `
            <div class="discover-card stagger-item">
                <div class="discover-card-bg"></div>
                <div class="discover-avatar" onclick="InstaVibe.App.navigate('user/${u.id}')">
                    <img src="${u.avatarUrl || 'https://ui-avatars.com/api/?name=' + (u.username || 'U') + '&background=random&color=fff'}" alt="">
                </div>
                <div class="discover-name" onclick="InstaVibe.App.navigate('user/${u.id}')">${u.displayName || u.username}</div>
                <div class="discover-username">@${u.username}</div>
                ${u.bio ? `<div class="discover-bio">${InstaVibe.Utils.escapeHtml(u.bio).substring(0, 60)}</div>` : ''}
                <div class="discover-stats">
                    <span>${u.postsCount || 0} posts</span>
                    <span>${u.followersCount || 0} abonnés</span>
                </div>
                <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm discover-follow-btn" 
                    data-uid="${u.id}"
                    onclick="event.stopPropagation(); InstaVibe.Explore._toggleFollowFromDiscover('${u.id}', this)">
                    ${isFollowing ? 'Suivi(e)' : 'Suivre'}
                </button>
            </div>`;
        });

        html += '</div></div>';
        container.innerHTML = html;
    },

    _toggleFollowFromDiscover(targetId, btn) {
        InstaVibe.Profile.toggleFollow(targetId);
        const currentUser = InstaVibe.Utils.getCurrentUser();
        const isNowFollowing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === currentUser?.id && f.followingId === targetId);
        if (isNowFollowing) {
            btn.className = 'btn btn-secondary btn-sm discover-follow-btn';
            btn.textContent = 'Suivi(e)';
        } else {
            btn.className = 'btn btn-primary btn-sm discover-follow-btn';
            btn.textContent = 'Suivre';
        }
    },

    _handleSearch(query, container) {
        if (!query.trim()) { this._renderDiscover(container); return; }
        const q = query.toLowerCase();
        const currentUser = InstaVibe.Utils.getCurrentUser();
        const users = InstaVibe.DemoStore.find('users', u =>
            u.username.toLowerCase().includes(q) || (u.displayName && u.displayName.toLowerCase().includes(q))
        ).filter(u => u.id !== 'demo_user' && !u.id.startsWith('user_') && u.id !== currentUser?.id);

        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state page-enter"><div class="empty-state-icon">🔍</div><p>Aucun résultat pour "' + InstaVibe.Utils.escapeHtml(query) + '"</p></div>';
            return;
        }
        
        let html = '<div class="page-enter" style="padding: 16px;">';
        html += `<div style="font-weight:700;font-size:17px;margin-bottom:12px;color:var(--text-primary);">Résultats pour "${InstaVibe.Utils.escapeHtml(query)}"</div>`;
        
        users.forEach(u => {
            const isFollowing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === currentUser?.id && f.followingId === u.id);
            html += `
            <div class="user-list-item" style="display:flex;align-items:center;padding:12px 0;gap:12px;">
                <div class="avatar avatar-md" onclick="InstaVibe.App.navigate('user/${u.id}')" style="cursor:pointer;flex-shrink:0;">
                    <img src="${u.avatarUrl || 'https://ui-avatars.com/api/?name=' + (u.username || 'U') + '&background=random&color=fff'}" alt="">
                </div>
                <div class="user-info" onclick="InstaVibe.App.navigate('user/${u.id}')" style="cursor:pointer;flex:1;min-width:0;">
                    <div class="username" style="font-weight:600;">${u.username}</div>
                    <div class="fullname" style="color:var(--text-secondary);font-size:13px;">${u.displayName || ''}</div>
                </div>
                <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm" 
                    onclick="event.stopPropagation(); InstaVibe.Explore._toggleFollowFromDiscover('${u.id}', this)">
                    ${isFollowing ? 'Suivi(e)' : 'Suivre'}
                </button>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
};
