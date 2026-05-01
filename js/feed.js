/* ===========================================
   PULSE — Feed
   =========================================== */
InstaVibe.Feed = {
    render() {
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

        const content = document.getElementById('page-content');
        const followingIds = InstaVibe.DemoStore.find('follows', f => f.followerId === user?.id).map(f => f.followingId);
        let posts = InstaVibe.DemoStore.get('posts')
            .filter(p => !p.userId.startsWith('user_') && p.userId !== 'demo_user')
            .filter(p => followingIds.includes(p.userId) || p.userId === user?.id)
            .sort((a, b) => b.createdAt - a.createdAt);
        if (posts.length === 0) posts = InstaVibe.DemoStore.get('posts').filter(p => !p.userId.startsWith('user_') && p.userId !== 'demo_user').sort((a, b) => b.createdAt - a.createdAt);

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
