/* ===========================================
   PULSE — Main App (Router & Init)
   =========================================== */
InstaVibe.App = {
    currentPage: 'feed',

    init() {
        InstaVibe.DemoStore.init();
        const savedTheme = localStorage.getItem('instavibe_theme');
        if (savedTheme) document.documentElement.dataset.theme = savedTheme;

        // Update nav avatar
        const user = InstaVibe.Utils.getCurrentUser();
        const navAvatarImg = document.getElementById('nav-avatar-img');
        if (navAvatarImg && user?.avatarUrl) navAvatarImg.src = user.avatarUrl;

        // Bind floating nav
        document.querySelectorAll('#floating-nav .fnav-item').forEach(btn => {
            btn.addEventListener('click', () => this.navigate(btn.dataset.page));
        });

        window.addEventListener('hashchange', () => this._handleRoute());
        this._handleRoute();
        
        // Vérifier les notifications toutes les 30 secondes
        this._checkNotifications();
        if (this._notifInterval) clearInterval(this._notifInterval);
        this._notifInterval = setInterval(() => this._checkNotifications(), 30000);
    },

    navigate(page) { window.location.hash = page; },

    async _handleRoute() {
        InstaVibe.Utils.showPageLoading();
        
        const hash = (window.location.hash || '#feed').replace('#', '');
        const parts = hash.split('/');
        const page = parts[0] || 'feed';
        const param = parts[1] || null;
        this.currentPage = page;
        
        // UI Reset
        InstaVibe.Utils.closeModal();
        document.getElementById('stories-bar-container')?.classList.add('hidden');
        
        this._updateNav(page);

        try {
            switch (page) {
                case 'feed': await InstaVibe.Feed.render(); break;
                case 'explore': await InstaVibe.Explore.render(); break;
                case 'groups': await InstaVibe.Groups.render(); break;
                case 'create':
                    InstaVibe.Post.renderCreatePage();
                    document.getElementById('stories-bar-container').classList.add('hidden');
                    break;
                case 'reels': await InstaVibe.Reels.render(); break;
                case 'profile': await InstaVibe.Profile.render(); break;
                case 'user': await InstaVibe.Profile.render(param); break;
                case 'messages': await InstaVibe.Messages.render(); break;
                case 'chat': if (param) await InstaVibe.Messages.startChat(param); break;
                case 'notifications': await InstaVibe.Notifications.render(); break;
                case 'admin': await InstaVibe.Admin.render(); break;
                default: await InstaVibe.Feed.render();
            }
        } catch (e) {
            console.error("Navigation error:", e);
        }

        document.getElementById('page-content').scrollTop = 0;
        InstaVibe.Utils.hidePageLoading();
        InstaVibe.Utils.hideLoading();
    },

    _updateNav(page) {
        document.querySelectorAll('#floating-nav .fnav-item').forEach(btn => {
            const isPage = btn.dataset.page === page;
            const isUser = page === 'user' && btn.dataset.page === 'profile';
            btn.classList.toggle('active', isPage || isUser);
        });
        const hideNav = ['create', 'chat', 'messages', 'notifications', 'admin'].includes(page);
        const floatingNav = document.getElementById('floating-nav');
        if (floatingNav) floatingNav.style.display = hideNav ? 'none' : 'block';
        document.getElementById('page-content').style.paddingBottom = hideNav ? '0' : 'calc(var(--nav-height) + 24px)';
    },

    async _checkNotifications() {
        const user = InstaVibe.Utils.getCurrentUser();
        if (!user || InstaVibe.DEMO_MODE) return;
        
        try {
            const snap = await InstaVibe.db.collection('notifications')
                .where('userId', '==', user.id)
                .where('read', '==', false)
                .get();
            
            const count = snap.docs.length;
            
            // Mettre à jour le badge dans le top-bar du feed
            const badge = document.getElementById('notif-badge');
            if (badge) {
                if (count > 0) {
                    badge.classList.remove('hidden');
                    badge.textContent = count > 9 ? '9+' : count;
                } else {
                    badge.classList.add('hidden');
                }
            }
            
            // Mettre à jour aussi le badge dans la nav (Flux/Reels tab)
            let navBadge = document.getElementById('nav-notif-badge');
            if (!navBadge) {
                // Créer le badge sur le bouton Feed de la nav
                const feedBtn = document.getElementById('nav-feed');
                if (feedBtn) {
                    feedBtn.style.position = 'relative';
                    const b = document.createElement('span');
                    b.id = 'nav-notif-badge';
                    b.className = 'nav-notif-badge';
                    feedBtn.querySelector('.fnav-icon')?.appendChild(b);
                    navBadge = b;
                }
            }
            if (navBadge) {
                if (count > 0) {
                    navBadge.style.display = 'flex';
                    navBadge.textContent = count > 9 ? '9+' : count;
                } else {
                    navBadge.style.display = 'none';
                }
            }
        } catch (e) { /* silencieux */ }
    }
};

/* Boot */
document.addEventListener('DOMContentLoaded', () => {
    InstaVibe.DemoStore.init();
    if (InstaVibe.Auth.checkSession()) {
        document.getElementById('main-app').classList.remove('hidden');
        InstaVibe.App.init();
    } else {
        InstaVibe.Auth.renderLoginPage();
    }
});
