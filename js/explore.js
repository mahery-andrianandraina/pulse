/* ===========================================
   InstaVibe — Explore & Search
   =========================================== */
InstaVibe.Explore = {
    async render() {
        document.getElementById('top-bar').innerHTML = `<div class="search-bar" style="flex:1;">
            <div class="search-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-input" placeholder="Rechercher..." id="search-input">
            </div>
        </div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        const content = document.getElementById('page-content');
        this._renderExploreGrid(content);

        // Fetch all users from Firestore to allow searching
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

        document.getElementById('search-input').addEventListener('input',
            InstaVibe.Utils.debounce((e) => this._handleSearch(e.target.value, content), 300)
        );
    },

    _renderExploreGrid(container) {
        const posts = InstaVibe.DemoStore.get('posts').sort((a, b) => b.likesCount - a.likesCount);
        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>Rien à explorer</h3></div>';
            return;
        }
        let html = '<div class="explore-grid page-enter">';
        posts.forEach((p, i) => {
            const isLarge = i % 9 === 0;
            html += `<div class="explore-grid-item ${isLarge ? 'large' : ''}" onclick="InstaVibe.Post.showComments('${p.id}')">
                <img src="${p.imageUrl}" alt="" class="${p.filter||''}" loading="lazy">
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    _handleSearch(query, container) {
        if (!query.trim()) { this._renderExploreGrid(container); return; }
        const q = query.toLowerCase();
        const users = InstaVibe.DemoStore.find('users', u =>
            u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
        ).filter(u => u.id !== 'demo_user');

        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Aucun résultat pour "' + InstaVibe.Utils.escapeHtml(query) + '"</p></div>';
            return;
        }
        container.innerHTML = `<div class="page-enter">${users.map(u => `
            <div class="user-list-item" onclick="InstaVibe.App.navigate('user/${u.id}')">
                <div class="avatar avatar-md"><img src="${u.avatarUrl}" alt=""></div>
                <div class="user-info"><div class="username">${u.username}</div><div class="fullname">${u.displayName}</div></div>
            </div>`).join('')}</div>`;
    }
};
