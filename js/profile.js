/* ===========================================
   PULSE — Profile
   =========================================== */
InstaVibe.Profile = {
    render(userId) {
        const isOwn = !userId || userId === InstaVibe.Utils.getCurrentUser()?.id;
        const targetId = isOwn ? InstaVibe.Utils.getCurrentUser()?.id : userId;
        const user = InstaVibe.DemoStore.findOne('users', u => u.id === targetId);
        if (!user) { document.getElementById('page-content').innerHTML = '<div class="empty-state"><h3>Introuvable</h3></div>'; return; }

        const cur = InstaVibe.Utils.getCurrentUser();
        const isFollowing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === cur?.id && f.followingId === targetId);
        const posts = InstaVibe.DemoStore.find('posts', p => p.userId === targetId).sort((a, b) => b.createdAt - a.createdAt);

        document.getElementById('top-bar').innerHTML = `
            ${!isOwn ? `<button class="top-bar-back" onclick="history.back()">${InstaVibe.Utils.icons.back}</button>` : '<div></div>'}
            <span class="top-bar-title">${user.username}</span>
            <div class="top-bar-actions">
                ${isOwn ? `<button class="btn-icon" onclick="InstaVibe.Profile.showSettings()">${InstaVibe.Utils.icons.settings}</button>` : ''}
            </div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        document.getElementById('page-content').innerHTML = `<div class="profile-page page-enter">
            <div class="profile-header">
                <div class="avatar-spark"><div class="avatar avatar-xxl"><img src="${user.avatarUrl}" alt=""></div></div>
                <div class="profile-stats">
                    <div class="profile-stat"><span class="stat-number">${user.postsCount}</span><span class="stat-label">Posts</span></div>
                    <div class="profile-stat" onclick="InstaVibe.Profile.showFollowList('${targetId}','followers')"><span class="stat-number">${InstaVibe.Utils.formatNumber(user.followersCount)}</span><span class="stat-label">Followers</span></div>
                    <div class="profile-stat" onclick="InstaVibe.Profile.showFollowList('${targetId}','following')"><span class="stat-number">${InstaVibe.Utils.formatNumber(user.followingCount)}</span><span class="stat-label">Abonnés</span></div>
                </div>
            </div>
            <div class="profile-bio">
                <div class="display-name">${InstaVibe.Utils.escapeHtml(user.displayName)}</div>
                <div class="bio-text">${InstaVibe.Utils.escapeHtml(user.bio||'').replace(/\n/g,'<br>')}</div>
            </div>
            <div class="profile-actions">
                ${isOwn
                    ? `<button class="btn btn-secondary btn-sm" onclick="InstaVibe.Profile.editProfile()">Modifier</button>
                       <button class="btn btn-glow btn-sm" onclick="InstaVibe.App.navigate('explore')">Découvrir</button>`
                    : `<button class="btn ${isFollowing?'btn-secondary':'btn-primary'} btn-sm" id="follow-btn" onclick="InstaVibe.Profile.toggleFollow('${targetId}')">${isFollowing?'Suivi(e)':'Suivre'}</button>
                       <button class="btn btn-secondary btn-sm" onclick="InstaVibe.App.navigate('chat/${targetId}')">Message</button>`}
            </div>
            <div class="tabs">
                <button class="tab-item active" onclick="InstaVibe.Profile._showTab('posts',this)">${InstaVibe.Utils.icons.grid}</button>
                ${isOwn ? `<button class="tab-item" onclick="InstaVibe.Profile._showTab('saved',this)">${InstaVibe.Utils.icons.bookmark}</button>` : ''}
            </div>
            <div id="profile-tab-content">${this._renderPostGrid(posts)}</div>
        </div>`;
    },

    _renderPostGrid(posts) {
        if (!posts.length) return '<div class="empty-state"><div class="empty-state-icon">⚡</div><h3>Rien ici</h3></div>';
        return `<div class="post-grid">${posts.map(p => `
            <div class="post-grid-item stagger-item" onclick="InstaVibe.Post.showComments('${p.id}')">
                <img src="${p.imageUrl}" class="${p.filter||''}" loading="lazy">
                <div class="grid-overlay"><span>⚡ ${InstaVibe.Utils.formatNumber(p.likesCount)}</span><span>💬 ${p.commentsCount}</span></div>
            </div>`).join('')}</div>`;
    },

    _showTab(tab, el) {
        el.closest('.tabs').querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        const tc = document.getElementById('profile-tab-content');
        if (tab === 'posts') {
            const posts = InstaVibe.DemoStore.find('posts', p => p.userId === InstaVibe.Utils.getCurrentUser().id).sort((a,b) => b.createdAt - a.createdAt);
            tc.innerHTML = this._renderPostGrid(posts);
        } else {
            const bIds = InstaVibe.DemoStore.find('bookmarks', b => b.userId === InstaVibe.Utils.getCurrentUser().id).map(b => b.postId);
            const saved = InstaVibe.DemoStore.find('posts', p => bIds.includes(p.id));
            tc.innerHTML = saved.length ? this._renderPostGrid(saved) : '<div class="empty-state"><div class="empty-state-icon">⭐</div><h3>Rien de sauvegardé</h3></div>';
        }
    },

    toggleFollow(targetId) {
        const cur = InstaVibe.Utils.getCurrentUser();
        const existing = InstaVibe.DemoStore.findOne('follows', f => f.followerId === cur.id && f.followingId === targetId);
        const target = InstaVibe.DemoStore.findOne('users', u => u.id === targetId);
        const btn = document.getElementById('follow-btn');
        if (existing) {
            InstaVibe.DemoStore.delete('follows', existing.id);
            if (target) InstaVibe.DemoStore.update('users', targetId, { followersCount: Math.max(0, target.followersCount - 1) });
            InstaVibe.DemoStore.update('users', cur.id, { followingCount: Math.max(0, cur.followingCount - 1) });
            if (btn) { btn.className = 'btn btn-primary btn-sm'; btn.textContent = 'Suivre'; }
        } else {
            InstaVibe.DemoStore.add('follows', { id: InstaVibe.Utils.generateId('f_'), followerId: cur.id, followingId: targetId, createdAt: Date.now() });
            if (target) InstaVibe.DemoStore.update('users', targetId, { followersCount: target.followersCount + 1 });
            InstaVibe.DemoStore.update('users', cur.id, { followingCount: cur.followingCount + 1 });
            if (btn) { btn.className = 'btn btn-secondary btn-sm'; btn.textContent = 'Suivi(e)'; }
            InstaVibe.DemoStore.add('notifications', { id: InstaVibe.Utils.generateId('n_'), userId: targetId, fromUserId: cur.id, fromUsername: cur.username, fromAvatar: cur.avatarUrl, type: 'follow', read: false, createdAt: Date.now() });
        }
    },

    showFollowList(userId, type) {
        const list = type === 'followers'
            ? InstaVibe.DemoStore.find('follows', f => f.followingId === userId)
            : InstaVibe.DemoStore.find('follows', f => f.followerId === userId);
        const ids = list.map(f => type === 'followers' ? f.followerId : f.followingId);
        const users = InstaVibe.DemoStore.find('users', u => ids.includes(u.id));
        let html = `<div class="modal-header"><button onclick="InstaVibe.Utils.closeModal()">${InstaVibe.Utils.icons.close}</button><h3>${type === 'followers' ? 'Followers' : 'Abonnés'}</h3><div></div></div>
        <div style="max-height:60vh;overflow-y:auto;">${users.map(u => `
            <div class="user-list-item" onclick="InstaVibe.Utils.closeModal();InstaVibe.App.navigate('user/${u.id}')">
                <div class="avatar"><img src="${u.avatarUrl}" alt=""></div>
                <div class="user-info"><div class="username">${u.username}</div><div class="fullname">${u.displayName}</div></div>
            </div>`).join('')||'<div class="empty-state"><p>Aucun</p></div>'}</div>`;
        InstaVibe.Utils.showModal(html);
    },

    editProfile() {
        const user = InstaVibe.Utils.getCurrentUser();
        let html = `<div class="modal-header"><button onclick="InstaVibe.Utils.closeModal()">Annuler</button><h3>Modifier</h3><button class="btn btn-primary btn-sm" id="save-profile-btn">OK</button></div>
        <div class="edit-profile-page">
            <div class="edit-avatar-section">
                <div class="avatar-spark"><div class="avatar avatar-xxl"><img src="${user.avatarUrl}" id="edit-avatar-img"></div></div>
                <button class="edit-avatar-btn" id="change-avatar-btn">Changer la photo</button>
                <input type="file" id="avatar-input" accept="image/*" style="display:none">
            </div>
            <div class="edit-form-group"><label>Nom</label><input type="text" class="input-field" id="edit-name" value="${InstaVibe.Utils.escapeHtml(user.displayName)}"></div>
            <div class="edit-form-group"><label>Identifiant</label><input type="text" class="input-field" id="edit-username" value="${InstaVibe.Utils.escapeHtml(user.username)}"></div>
            <div class="edit-form-group"><label>Bio</label><textarea class="input-field" id="edit-bio" rows="3">${InstaVibe.Utils.escapeHtml(user.bio||'')}</textarea></div>
        </div>`;
        InstaVibe.Utils.showModal(html);
        setTimeout(() => {
            document.getElementById('change-avatar-btn')?.addEventListener('click', () => document.getElementById('avatar-input').click());
            document.getElementById('avatar-input')?.addEventListener('change', async (e) => {
                const file = e.target.files[0]; if (!file) return;
                user._rawAvatarFile = file;
                const d = await InstaVibe.Utils.fileToDataUrl(file);
                document.getElementById('edit-avatar-img').src = d; user._newAvatar = d;
            });
            document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
                document.getElementById('save-profile-btn').disabled = true;
                const u = { displayName: document.getElementById('edit-name').value.trim(), username: document.getElementById('edit-username').value.trim().toLowerCase(), bio: document.getElementById('edit-bio').value.trim() };
                
                if (user._rawAvatarFile) {
                    try {
                        const path = `users/${user.id}/avatar.jpg`;
                        u.avatarUrl = await InstaVibe.Utils.uploadFile(user._rawAvatarFile, path);
                    } catch (e) {
                        InstaVibe.Utils.showToast("Erreur d'upload de l'avatar", 'error');
                    }
                } else if (user._newAvatar) {
                    u.avatarUrl = user._newAvatar;
                }
                
                InstaVibe.DemoStore.update('users', user.id, u);
                Object.assign(InstaVibe.Auth.currentUser, u);
                localStorage.setItem('instavibe_user', JSON.stringify(InstaVibe.Auth.currentUser));
                
                // Mettre à jour Firestore
                if (!InstaVibe.DEMO_MODE) {
                    try {
                        await InstaVibe.db.collection('users').doc(user.id).update(u);
                        
                        // Mettre à jour les posts dans Firestore (optionnel mais bon pour le flux)
                        const postsSnap = await InstaVibe.db.collection('posts').where('userId', '==', user.id).get();
                        const batch = InstaVibe.db.batch();
                        postsSnap.docs.forEach(doc => batch.update(doc.ref, { username: u.username, userAvatar: u.avatarUrl || user.avatarUrl }));
                        await batch.commit();
                    } catch (e) {
                        console.error("Erreur màj Firestore:", e);
                    }
                }
                
                // Mettre à jour le DemoStore pour les posts existants
                InstaVibe.DemoStore.get('posts').filter(p => p.userId === user.id).forEach(p => {
                    InstaVibe.DemoStore.update('posts', p.id, { username: u.username, userAvatar: u.avatarUrl || user.avatarUrl });
                });

                InstaVibe.Utils.closeModal(); this.render();
                InstaVibe.Utils.showToast('Profil mis à jour ⚡', 'success');
            });
        }, 100);
    },

    showSettings() {
        const theme = document.documentElement.dataset.theme;
        const user = InstaVibe.Utils.getCurrentUser();
        const isAdmin = user && user.id === 'demo_user';
        
        let html = `<div class="modal-header"><button onclick="InstaVibe.Utils.closeModal()">${InstaVibe.Utils.icons.close}</button><h3>Paramètres</h3><div></div></div>
        ${isAdmin ? `<div class="settings-item" onclick="InstaVibe.Utils.closeModal();InstaVibe.App.navigate('admin')"><span class="settings-label" style="color:var(--accent-magenta);font-weight:700;">⚙️ Dashboard Admin</span></div>` : ''}
        <div class="settings-item" onclick="InstaVibe.Profile._toggleTheme()"><span class="settings-label">🌗 Thème</span><div class="toggle-switch ${theme==='dark'?'active':''}"></div></div>
        <div class="settings-item" onclick="InstaVibe.Profile.editProfile();InstaVibe.Utils.closeModal()"><span class="settings-label">✏️ Modifier le profil</span></div>
        <div class="settings-item danger" onclick="InstaVibe.Profile._resetData()"><span class="settings-label">🗑️ Réinitialiser</span></div>
        <div class="settings-item danger" onclick="InstaVibe.Utils.closeModal();InstaVibe.Auth.logout()"><span class="settings-label">🚪 Déconnexion</span></div>`;
        InstaVibe.Utils.showModal(html);
    },

    _toggleTheme() {
        const h = document.documentElement;
        h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('instavibe_theme', h.dataset.theme);
        InstaVibe.Utils.closeModal(); this.showSettings();
    },

    _resetData() {
        if (confirm('Réinitialiser toutes les données?')) {
            localStorage.removeItem('instavibe_data'); InstaVibe.DemoStore.init();
            InstaVibe.Utils.closeModal(); InstaVibe.App.navigate('feed');
        }
    }
};
