/* ===========================================
   PULSE — Groups (Pulse Community)
   =========================================== */
InstaVibe.Groups = {
    async render() {
        const content = document.getElementById('page-content');
        InstaVibe.Utils.renderLoading(content);

        // Update Top Bar
        document.getElementById('top-bar').innerHTML = `
            <div style="display:flex; align-items:center; gap: 12px;">
                <button class="btn-icon" onclick="InstaVibe.App.navigate('feed')">${InstaVibe.Utils.icons.back}</button>
                <span class="top-bar-brand" style="font-size: 18px;">Pulse Community</span>
            </div>
            <div class="top-bar-actions">
                <button class="btn-icon" onclick="InstaVibe.App.navigate('notifications')" style="position:relative;">
                    ${InstaVibe.Utils.icons.heart}
                    <span class="notification-badge hidden" id="notif-badge"></span>
                </button>
            </div>`;

        // Wait a bit to simulate loading
        await new Promise(r => setTimeout(r, 400));

        // Fetch Group Posts
        let allPosts = InstaVibe.DemoStore.get('posts').filter(p => p.groupId === 'global');

        // Sort by newest
        allPosts.sort((a, b) => b.createdAt - a.createdAt);

        let html = `
        <div class="group-header animate-fadeIn" style="padding: 20px 16px; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), transparent); border-bottom: 1px solid var(--border-glass);">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div class="group-cover" style="width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(45deg, var(--accent-cyan), var(--accent-purple)); display: flex; align-items: center; justify-content: center; color: white;">
                    ${InstaVibe.Utils.icons.users}
                </div>
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Pulse Community</h2>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary);">Groupe Public • Tout le monde peut poster</p>
                </div>
            </div>
        </div>
        
        <div class="group-create-post" style="padding: 16px; border-bottom: 1px solid var(--border-glass); display: flex; gap: 12px; align-items: center;" onclick="InstaVibe.Post.renderCreatePage('global')">
            <div class="avatar avatar-sm">
                <img src="${InstaVibe.Utils.getCurrentUser()?.avatarUrl || ''}" alt="">
            </div>
            <div style="flex: 1; background: var(--bg-secondary); padding: 12px 16px; border-radius: 20px; color: var(--text-secondary); font-size: 14px; cursor: text;">
                Exprimez-vous dans le groupe...
            </div>
            <button class="btn-icon" style="color: var(--accent-cyan);">${InstaVibe.Utils.icons.image}</button>
        </div>
        
        <div class="feed-page" style="padding: var(--space-md) var(--space-sm);">`;

        if (allPosts.length === 0) {
            html += `<div class="empty-state"><div class="empty-state-icon">👋</div>
                <h3>Bienvenue dans le groupe!</h3><p>Soyez le premier à publier dans la communauté Pulse.</p></div>`;
        } else {
            html += allPosts.map(p => InstaVibe.Post.renderPostCard(p)).join('');
        }

        html += `</div>`;
        content.innerHTML = html;
    }
};
