/* ===========================================
   InstaVibe — Utility Functions
   =========================================== */

InstaVibe.Utils = {
    // Generate unique ID
    generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // Time ago formatting
    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'maintenant';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}j`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}sem`;
        return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    },

    // Format number (1200 -> 1.2K)
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    },

    // Compress image using canvas
    async compressImage(file, maxWidth = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    // File to Data URL
    fileToDataUrl(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    // Upload file to Firebase Storage (or fallback to Base64)
    async uploadFile(file, path) {
        if (!InstaVibe.DEMO_MODE && InstaVibe.storage) {
            // Tentative d'upload réel sur Firebase Storage
            try {
                const storageRef = InstaVibe.storage.ref(path);
                const snapshot = await storageRef.put(file);
                const downloadUrl = await snapshot.ref.getDownloadURL();
                return downloadUrl;
            } catch (error) {
                console.warn("Erreur Storage Firebase (non activé?). Bascule sur l'encodage local.", error);
                // On continue pour faire le fallback en dessous
            }
        }

        // Fallback local (Demo Mode ou Storage désactivé)
        // Compression stricte pour éviter de saturer Firestore (limite de 1Mo par document)
        console.log(`Fallback local pour ${path}: Compression de l'image...`);
        const compressedBlob = await this.compressImage(file, 800, 0.6);
        return await this.fileToDataUrl(compressedBlob);
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // Debounce
    debounce(fn, delay = 300) {
        let timer;
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
    },

    // Escape HTML
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Get current user (sync)
    getCurrentUser() {
        if (InstaVibe.DEMO_MODE) {
            return InstaVibe.DemoStore.findOne('users', u => u.id === 'demo_user');
        }
        // Use the synchronously cached user from Auth (populated by checkSession or login)
        if (InstaVibe.Auth && InstaVibe.Auth.currentUser) {
            return InstaVibe.Auth.currentUser;
        }
        return null;
    },

    // SVG Icons
    icons: {
        heart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
        heartFilled: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
        comment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
        share: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
        bookmark: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
        bookmarkFilled: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
        back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        more: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>',
        camera: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
        messenger: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
        settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
        grid: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        plus: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        image: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        verified: '<svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.396 11c.1-.14.19-.3.27-.47.08-.17.14-.35.18-.54.04-.19.06-.38.05-.58-.01-.2-.04-.39-.1-.57-.06-.19-.14-.36-.25-.52-.1-.16-.23-.3-.37-.42l-.02-.02c-.14-.13-.3-.24-.47-.33-.17-.09-.35-.15-.54-.19-.19-.04-.39-.05-.58-.03-.2.01-.39.06-.57.12-.18.07-.36.16-.51.27-.16.11-.3.24-.42.38l-.02.02c-.13.14-.23.31-.32.48a2.45 2.45 0 00-.17.54c-.03.19-.04.39-.02.58.01.2.05.39.11.57.06.18.15.35.26.51.11.16.24.3.38.42l.02.02c.14.13.3.23.48.32.17.08.36.14.54.17.19.03.38.04.58.02.2-.01.39-.05.57-.11.18-.06.35-.15.51-.26.16-.11.3-.24.42-.38z" fill="#00d4ff"/><path d="M9.585 14.8l-3.39-3.39a.75.75 0 111.06-1.06l2.33 2.33 5.15-5.15a.75.75 0 111.06 1.06l-5.68 5.68a.75.75 0 01-1.06 0l-.47.53z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11 21.75c5.937 0 10.75-4.813 10.75-10.75S16.937 1.25 11 1.25.25 6.063.25 11 5.063 21.75 11 21.75z" fill="#00d4ff"/><path d="M8.43 11.34l2.07 2.07 4.54-4.54" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    },

    // Show modal
    showModal(content, fullScreen = false) {
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = fullScreen
            ? `<div class="modal-full">${content}</div>`
            : `<div class="modal-content">${content}</div>`;
        overlay.classList.remove('hidden');
        if (!fullScreen) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) InstaVibe.Utils.closeModal();
            }, { once: true });
        }
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('hidden');
        overlay.innerHTML = '';
    },

    // Navigate
    navigate(hash) {
        window.location.hash = hash;
    },

    // Loading
    showLoading() {
        document.getElementById('global-loader')?.classList.remove('hidden');
    },

    hideLoading() {
        setTimeout(() => {
            document.getElementById('global-loader')?.classList.add('hidden');
        }, 300); // Petit délai pour éviter le flash
    },

    // Page Loading (Top progress bar)
    showPageLoading() {
        let bar = document.getElementById('nav-progress-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'nav-progress-bar';
            document.body.appendChild(bar);
        }
        bar.classList.remove('complete');
        bar.classList.add('active');
        bar.style.opacity = '1';
    },

    hidePageLoading() {
        const bar = document.getElementById('nav-progress-bar');
        if (!bar) return;
        bar.classList.add('complete');
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => {
                bar.classList.remove('active', 'complete');
                bar.style.width = '0';
            }, 300);
        }, 200);
    },

    // Inline loading spinner
    renderLoading(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="empty-state animate-fadeIn" style="min-height:200px;">
                <div class="pulse-loader-logo" style="width:60px;height:auto;margin-bottom:10px;">
                    <img src="icons/logo.svg" alt="Pulse" style="width:100%;height:auto;">
                </div>
                <div class="loader-bar" style="width:100px;"><div class="loader-bar-inner"></div></div>
                <p style="font-size:12px;opacity:0.6;margin-top:8px;">Chargement des données...</p>
            </div>`;
    },

    // Render verified badge for a user
    renderVerifiedBadge(userId, large = false) {
        const user = InstaVibe.DemoStore.findOne('users', u => u.id === userId);
        if (!user || !user.verified) return '';
        return `<span class="verified-badge ${large ? 'verified-badge--lg' : ''}">${this.icons.verified}</span>`;
    },

    // Render verified badge by username lookup
    renderVerifiedBadgeByUsername(username, large = false) {
        const user = InstaVibe.DemoStore.findOne('users', u => u.username === username);
        if (!user || !user.verified) return '';
        return `<span class="verified-badge ${large ? 'verified-badge--lg' : ''}">${this.icons.verified}</span>`;
    },

    // Share post
    async sharePost(postId) {
        const post = InstaVibe.DemoStore.findOne('posts', p => p.id === postId);
        if (!post) return;

        const shareUrl = window.location.origin + window.location.pathname + '#feed';
        const shareData = {
            title: `Pulse — ${post.username}`,
            text: post.caption || `Découvrez ce post de ${post.username} sur Pulse!`,
            url: shareUrl
        };

        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this.showToast('Partagé avec succès!', 'success');
                return;
            } catch (e) {
                if (e.name === 'AbortError') return;
            }
        }

        // Fallback: show share menu
        this._showShareMenu(shareUrl, post);
    },

    _showShareMenu(url, post) {
        // Remove existing
        document.getElementById('share-backdrop')?.remove();
        document.getElementById('share-menu')?.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'share-backdrop';
        backdrop.className = 'share-backdrop';
        backdrop.onclick = () => this._closeShareMenu();

        const menu = document.createElement('div');
        menu.id = 'share-menu';
        menu.className = 'share-menu';
        menu.innerHTML = `
            <div class="share-menu-header">
                <h3>Partager</h3>
                <button onclick="InstaVibe.Utils._closeShareMenu()" style="font-size:20px;">${this.icons.close}</button>
            </div>
            <div class="share-menu-options">
                <div class="share-option" onclick="InstaVibe.Utils._copyLink('${url}')">
                    <div class="share-option-icon">🔗</div>
                    <span class="share-option-label">Copier</span>
                </div>
                <div class="share-option" onclick="window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.caption || '')}','_blank')">
                    <div class="share-option-icon">𝕏</div>
                    <span class="share-option-label">Twitter</span>
                </div>
                <div class="share-option" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}','_blank')">
                    <div class="share-option-icon">📘</div>
                    <span class="share-option-label">Facebook</span>
                </div>
                <div class="share-option" onclick="window.open('https://wa.me/?text=${encodeURIComponent((post.caption || 'Regarde ça!') + ' ' + url)}','_blank')">
                    <div class="share-option-icon">💬</div>
                    <span class="share-option-label">WhatsApp</span>
                </div>
            </div>`;

        document.body.appendChild(backdrop);
        document.body.appendChild(menu);
    },

    _closeShareMenu() {
        document.getElementById('share-backdrop')?.remove();
        document.getElementById('share-menu')?.remove();
    },

    _copyLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Lien copié! 📋', 'success');
            this._closeShareMenu();
        }).catch(() => {
            this.showToast('Erreur de copie', 'error');
        });
    }
};
