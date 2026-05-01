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
    },

    navigate(page) { window.location.hash = page; },

    _handleRoute() {
        const hash = (window.location.hash || '#feed').replace('#', '');
        const parts = hash.split('/');
        const page = parts[0] || 'feed';
        const param = parts[1] || null;
        this.currentPage = page;
        this._updateNav(page);
        InstaVibe.Utils.closeModal();

        switch (page) {
            case 'feed': InstaVibe.Feed.render(); break;
            case 'explore': InstaVibe.Explore.render(); break;
            case 'create':
                InstaVibe.Post.renderCreatePage();
                document.getElementById('stories-bar-container').classList.add('hidden');
                break;
            case 'reels': InstaVibe.Reels.render(); break;
            case 'profile': InstaVibe.Profile.render(); break;
            case 'user': InstaVibe.Profile.render(param); break;
            case 'messages': InstaVibe.Messages.render(); break;
            case 'chat': if (param) InstaVibe.Messages.startChat(param); break;
            case 'notifications': InstaVibe.Notifications.render(); break;
            case 'admin': InstaVibe.Admin.render(); break;
            default: InstaVibe.Feed.render();
        }
        document.getElementById('page-content').scrollTop = 0;
    },

    _updateNav(page) {
        document.querySelectorAll('#floating-nav .fnav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        const hideNav = ['create', 'chat', 'messages', 'notifications', 'admin'].includes(page);
        const floatingNav = document.getElementById('floating-nav');
        if (floatingNav) floatingNav.style.display = hideNav ? 'none' : 'block';
        document.getElementById('page-content').style.paddingBottom = hideNav ? '0' : 'calc(var(--nav-height) + 24px)';
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
