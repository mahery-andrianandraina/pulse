/* ===========================================
   InstaVibe — Reels
   =========================================== */
InstaVibe.Reels = {
    render() {
        document.getElementById('top-bar').innerHTML = `
            <span class="top-bar-title" style="position:static;">Reels</span>
            <div class="top-bar-actions"><button class="btn-icon">${InstaVibe.Utils.icons.camera}</button></div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        const posts = InstaVibe.DemoStore.get('posts').sort(() => Math.random() - 0.5);
        const content = document.getElementById('page-content');

        content.innerHTML = `<div class="reels-page page-enter">
            <div class="reel-container" id="reel-container">
                ${posts.map(p => this._renderReel(p)).join('')}
            </div>
        </div>`;
    },

    _renderReel(post) {
        const user = InstaVibe.Utils.getCurrentUser();
        const isLiked = InstaVibe.DemoStore.findOne('likes', l => l.postId === post.id && l.userId === user?.id);

        return `<div class="reel-item">
            <img src="${post.imageUrl}" alt="" class="${post.filter || ''}" style="width:100%;height:100%;object-fit:cover;">
            <div class="reel-overlay">
                <div class="reel-user" onclick="InstaVibe.App.navigate('user/${post.userId}')">
                    <div class="avatar avatar-sm"><img src="${post.userAvatar}" alt=""></div>
                    <span class="username">${post.username}</span>
                    <button class="btn-follow btn-sm" style="margin-left:8px">Suivre</button>
                </div>
                <div class="reel-caption">${InstaVibe.Utils.escapeHtml(post.caption)}</div>
            </div>
            <div class="reel-actions">
                <div class="reel-action" onclick="InstaVibe.Post.toggleLike('${post.id}')">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="${isLiked?'#ed4956':'none'}" stroke="${isLiked?'#ed4956':'white'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    <span>${InstaVibe.Utils.formatNumber(post.likesCount)}</span>
                </div>
                <div class="reel-action" onclick="InstaVibe.Post.showComments('${post.id}')">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    <span>${post.commentsCount}</span>
                </div>
                <div class="reel-action">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    <span>Envoyer</span>
                </div>
            </div>
        </div>`;
    }
};
