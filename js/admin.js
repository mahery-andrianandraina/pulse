/* ===========================================
   PULSE — Admin Dashboard Logic
   =========================================== */
InstaVibe.Admin = {
    isAdmin() {
        const user = InstaVibe.Utils.getCurrentUser();
        if (!user) return false;

        console.log("🔒 Vérification Admin. Votre UID actuel est :", user.id);

        // Ajoutez ici les UID (depuis la console Firebase) de tous les comptes qui doivent être administrateurs
        const adminUIDs = [
            'demo_user',
            'thfmhxcvdrbClM8Nev9a5EDJ0OP2' // Le compte de la capture d'écran
            // Ajoutez d'autres UID ici entre apostrophes, séparés par des virgules
        ];

        return adminUIDs.includes(user.id);
    },

    render() {
        if (!this.isAdmin()) {
            InstaVibe.App.navigate('feed');
            InstaVibe.Utils.showToast('Accès refusé', 'error');
            return;
        }

        document.getElementById('top-bar').innerHTML = `
            <button class="top-bar-back" onclick="InstaVibe.App.navigate('profile')">${InstaVibe.Utils.icons.back}</button>
            <span class="top-bar-title">Back-Office</span><div></div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        const content = document.getElementById('page-content');
        const users = InstaVibe.DemoStore.get('users');
        const posts = InstaVibe.DemoStore.get('posts');
        const interactions = InstaVibe.DemoStore.get('likes').length + InstaVibe.DemoStore.get('comments').length;

        content.innerHTML = `
            <div class="admin-page page-enter">
                <div class="admin-header">
                    <div class="admin-title">Pulse Admin</div>
                    <button class="btn btn-primary btn-sm" onclick="InstaVibe.App.navigate('feed')">Retour au site</button>
                </div>

                <div class="admin-stats-grid">
                    <div class="admin-stat-card">
                        <div class="stat-value">${users.length}</div>
                        <div class="stat-label">Utilisateurs</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${posts.length}</div>
                        <div class="stat-label">Publications</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${interactions}</div>
                        <div class="stat-label">Interactions</div>
                    </div>
                </div>

                <div class="admin-section-title">
                    <span>Gestion des Utilisateurs</span>
                    <div class="search-input-wrapper" style="width: 200px;">
                        ${InstaVibe.Utils.icons.search}
                        <input type="text" class="search-input" id="admin-search" placeholder="Rechercher..." style="padding: 6px;">
                    </div>
                </div>

                <div class="admin-user-list" id="admin-user-list">
                    ${this._renderUserList(users)}
                </div>
            </div>
        `;

        document.getElementById('admin-search')?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = users.filter(u => u.username.toLowerCase().includes(term) || (u.displayName && u.displayName.toLowerCase().includes(term)));
            document.getElementById('admin-user-list').innerHTML = this._renderUserList(filtered);
        });
    },

    _renderUserList(users) {
        if (users.length === 0) return '<div class="empty-state"><p>Aucun utilisateur trouvé</p></div>';

        return users.map(user => {
            const isAdmin = user.id === 'demo_user';
            const isBanned = user.banned;

            return `
            <div class="admin-user-card stagger-item">
                <div class="admin-user-info">
                    <div class="avatar avatar-md"><img src="${user.avatarUrl || 'https://i.pravatar.cc/150'}" alt=""></div>
                    <div class="admin-user-details">
                        <div class="admin-username">
                            ${user.username} 
                            ${isAdmin ? '<span class="admin-badge badge-admin">Admin</span>' : ''}
                            ${isBanned ? '<span class="admin-badge badge-banned">Banni</span>' : ''}
                        </div>
                        <div class="admin-email">${user.displayName || 'Sans nom'}</div>
                        <div class="admin-user-metrics">
                            <span>📝 ${user.postsCount || 0} posts</span>
                            <span>👥 ${user.followersCount || 0} abonnés</span>
                        </div>
                    </div>
                </div>
                <div class="admin-user-actions">
                    ${!isAdmin ? `
                        <button class="btn btn-warning btn-sm" onclick="InstaVibe.Admin.toggleBan('${user.id}')">
                            ${isBanned ? 'Débannir' : 'Bannir'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="InstaVibe.Admin.deleteUser('${user.id}')">
                            Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>`;
        }).join('');
    },

    toggleBan(userId) {
        const user = InstaVibe.DemoStore.findOne('users', u => u.id === userId);
        if (!user) return;

        const isBanned = !user.banned;
        InstaVibe.DemoStore.update('users', userId, { banned: isBanned });
        InstaVibe.Utils.showToast(isBanned ? 'Utilisateur suspendu' : 'Utilisateur rétabli', isBanned ? 'error' : 'success');
        this.render(); // Re-render the dashboard
    },

    deleteUser(userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur et TOUTES ses données ?')) return;

        // Delete User
        InstaVibe.DemoStore.delete('users', userId);

        // Delete their posts
        const userPosts = InstaVibe.DemoStore.find('posts', p => p.userId === userId);
        userPosts.forEach(post => {
            InstaVibe.DemoStore.delete('posts', post.id);
            // Delete likes and comments for these posts
            InstaVibe.DemoStore.find('likes', l => l.postId === post.id).forEach(l => InstaVibe.DemoStore.delete('likes', l.id));
            InstaVibe.DemoStore.find('comments', c => c.postId === post.id).forEach(c => InstaVibe.DemoStore.delete('comments', c.id));
        });

        // Delete their likes & comments on other posts
        InstaVibe.DemoStore.find('likes', l => l.userId === userId).forEach(l => InstaVibe.DemoStore.delete('likes', l.id));
        InstaVibe.DemoStore.find('comments', c => c.userId === userId).forEach(c => InstaVibe.DemoStore.delete('comments', c.id));

        // Delete Follows
        InstaVibe.DemoStore.find('follows', f => f.followerId === userId || f.followingId === userId).forEach(f => InstaVibe.DemoStore.delete('follows', f.id));

        InstaVibe.Utils.showToast('Utilisateur supprimé', 'success');
        this.render();
    }
};
