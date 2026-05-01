/* ===========================================
   PULSE — Feed
   =========================================== */
InstaVibe.Feed = {
    async render() {
        document.getElementById('top-bar').innerHTML = `
            <span class="top-bar-brand">Pulse</span>
            <div class="top-bar-actions">
                <button class="btn-icon" onclick="InstaVibe.App.navigate('notifications')" style="position:relative;">
                    ${InstaVibe.Utils.icons.heart}
                    <span class="notification-badge hidden" id="notif-badge"></span>
                </button>
                <button class="btn-icon" onclick="InstaVibe.App.navigate('messages')">
                    ${InstaVibe.Utils.icons.messenger}
                </button>
            </div>`;

        const user = InstaVibe.Utils.getCurrentUser();
        const unread = InstaVibe.DemoStore.find('notifications', n => n.userId === user?.id && !n.read);
        if (unread.length > 0) document.getElementById('notif-badge')?.classList.remove('hidden');

        InstaVibe.Stories.renderStoriesBar();
        document.getElementById('stories-bar-container').classList.remove('hidden');

        // Charger les posts depuis Firestore
        if (!InstaVibe.DEMO_MODE) {
            try {
                const snap = await InstaVibe.db.collection('posts')
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();
                snap.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    if (!InstaVibe.DemoStore.findOne('posts', p => p.id === doc.id)) {
                        InstaVibe.DemoStore.add('posts', data);
                    } else {
                        InstaVibe.DemoStore.update('posts', doc.id, data);
                    }
                });
            } catch (e) { console.error("Erreur chargement posts:", e); }
        }

        const content = document.getElementById('page-content');
        const followingIds = InstaVibe.DemoStore.find('follows', f => f.followerId === user?.id).map(f => f.followingId);
        
        // Afficher TOUS les posts des vrais utilisateurs (suivis en premier, puis les autres)
        const allRealPosts = InstaVibe.DemoStore.get('posts')
            .filter(p => !p.userId.startsWith('user_') && p.userId !== 'demo_user');
        
        const followedPosts = allRealPosts
            .filter(p => followingIds.includes(p.userId) || p.userId === user?.id)
            .sort((a, b) => b.createdAt - a.createdAt);
        
        const otherPosts = allRealPosts
            .filter(p => !followingIds.includes(p.userId) && p.userId !== user?.id)
            .sort((a, b) => b.createdAt - a.createdAt);
        
        let posts = [...followedPosts, ...otherPosts];

        if (posts.length === 0) {
            content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚡</div>
                <h3>Bienvenue sur Pulse!</h3><p>Suivez des créateurs pour voir leurs publications.</p>
                <button class="btn btn-primary" onclick="InstaVibe.App.navigate('explore')">Découvrir</button></div>`;
            return;
        }
        content.innerHTML = `<div class="feed-page page-enter" style="padding:var(--space-md) var(--space-sm);">
            ${posts.map(p => InstaVibe.Post.renderPostCard(p)).join('')}</div>`;
    }
};
