/* ===========================================
   PULSE — Authentication
   =========================================== */
InstaVibe.Auth = {
    currentUser: null,

    renderLoginPage() {
        const container = document.getElementById('auth-container');
        container.innerHTML = `
            <div class="auth-page animate-fadeIn">
                <div class="auth-card">
                    <span class="auth-logo">Pulse</span>
                    <p class="auth-subtitle">Votre univers créatif. Partagez, connectez, vibrez.</p>
                    <button class="google-btn" id="google-login-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continuer avec Google
                    </button>
                    <div class="divider">OU</div>
                    <form class="auth-form" id="login-form">
                        <div id="login-error" class="auth-error hidden"></div>
                        <input type="text" class="input-field" placeholder="Email ou identifiant" id="login-email" required>
                        <input type="password" class="input-field" placeholder="Mot de passe" id="login-password" required>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">Entrer dans Pulse</button>
                        <a class="forgot-password" id="forgot-password-link">Mot de passe oublié ?</a>
                    </form>
                </div>
                <div class="auth-switch">
                    Nouveau sur Pulse ? <a id="goto-signup">Créer un compte</a>
                </div>
            </div>`;
        this._bindLoginEvents();
    },

    renderSignupPage() {
        const container = document.getElementById('auth-container');
        container.innerHTML = `
            <div class="auth-page animate-fadeIn">
                <div class="auth-card">
                    <span class="auth-logo">Pulse</span>
                    <p class="auth-subtitle">Rejoignez une communauté créative unique.</p>
                    <button class="google-btn" id="google-signup-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continuer avec Google
                    </button>
                    <div class="divider">OU</div>
                    <form class="auth-form" id="signup-form">
                        <div id="signup-error" class="auth-error hidden"></div>
                        <input type="email" class="input-field" placeholder="Votre email" id="signup-email" required>
                        <input type="text" class="input-field" placeholder="Nom complet" id="signup-name" required>
                        <input type="text" class="input-field" placeholder="Identifiant unique" id="signup-username" required>
                        <input type="password" class="input-field" placeholder="Mot de passe" id="signup-password" required minlength="6">
                        <button type="submit" class="btn btn-primary btn-block btn-lg">Rejoindre Pulse</button>
                    </form>
                </div>
                <div class="auth-switch">
                    Déjà sur Pulse ? <a id="goto-login">Se connecter</a>
                </div>
            </div>`;
        this._bindSignupEvents();
    },

    _bindLoginEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); this._handleLogin(); });
        document.getElementById('goto-signup').addEventListener('click', () => this.renderSignupPage());
        document.getElementById('google-login-btn').addEventListener('click', () => this._handleGoogleAuth());
        document.getElementById('forgot-password-link').addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            if (!email) { InstaVibe.Utils.showToast('Entrez votre email', 'error'); return; }
            InstaVibe.Utils.showToast('Email de réinitialisation envoyé! (demo)', 'success');
        });
    },

    _bindSignupEvents() {
        document.getElementById('signup-form').addEventListener('submit', (e) => { e.preventDefault(); this._handleSignup(); });
        document.getElementById('goto-login').addEventListener('click', () => this.renderLoginPage());
        document.getElementById('google-signup-btn').addEventListener('click', () => this._handleGoogleAuth());
    },

    async _handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (InstaVibe.DEMO_MODE) {
            this.currentUser = InstaVibe.DemoStore.findOne('users', u => u.id === 'demo_user');
            localStorage.setItem('instavibe_user', JSON.stringify(this.currentUser));
            this._onAuthSuccess(); return;
        }
        try {
            console.log("Tentative de connexion auth...");
            const cred = await InstaVibe.auth.signInWithEmailAndPassword(email, password);
            console.log("Authentification réussie, UID:", cred.user.uid);
            
            console.log("Récupération du profil depuis Firestore...");
            const doc = await InstaVibe.db.collection('users').doc(cred.user.uid).get();
            console.log("Profil récupéré:", doc.exists);
            
            if (doc.exists) {
                const userData = { id: doc.id, ...doc.data() };
                if (!InstaVibe.DemoStore.findOne('users', u => u.id === doc.id)) {
                    InstaVibe.DemoStore.add('users', userData);
                } else {
                    InstaVibe.DemoStore.update('users', doc.id, userData);
                }
                localStorage.setItem('instavibe_user', JSON.stringify(userData));
                this.currentUser = userData; // FIXED: Assign currentUser!
            }
            
            console.log("Lancement de l'application...");
            this._onAuthSuccess();
        } catch (err) {
            console.error("Erreur critique lors de la connexion:", err);
            const el = document.getElementById('login-error');
            el.textContent = err.message || 'Erreur inconnue'; el.classList.remove('hidden');
        }
    },

    async _handleSignup() {
        const email = document.getElementById('signup-email').value.trim();
        const name = document.getElementById('signup-name').value.trim();
        const username = document.getElementById('signup-username').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        if (InstaVibe.DEMO_MODE) {
            InstaVibe.DemoStore.update('users', 'demo_user', { username, displayName: name });
            this.currentUser = InstaVibe.DemoStore.findOne('users', u => u.id === 'demo_user');
            localStorage.setItem('instavibe_user', JSON.stringify(this.currentUser));
            this._onAuthSuccess(); return;
        }
        try {
            const cred = await InstaVibe.auth.createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
            const newUser = {
                username, displayName: name, bio: '', avatarUrl: '',
                followersCount: 0, followingCount: 0, postsCount: 0, createdAt: Date.now()
            };
            await InstaVibe.db.collection('users').doc(cred.user.uid).set(newUser);
            
            // Sync to local DemoStore for hybrid mode
            newUser.id = cred.user.uid;
            InstaVibe.DemoStore.add('users', newUser);
            localStorage.setItem('instavibe_user', JSON.stringify(newUser));
            this.currentUser = newUser; // FIXED: Assign currentUser!
            
            this._onAuthSuccess();
        } catch (err) {
            const el = document.getElementById('signup-error');
            el.textContent = err.message; el.classList.remove('hidden');
        }
    },

    async _handleGoogleAuth() {
        if (InstaVibe.DEMO_MODE) {
            this.currentUser = InstaVibe.DemoStore.findOne('users', u => u.id === 'demo_user');
            localStorage.setItem('instavibe_user', JSON.stringify(this.currentUser));
            this._onAuthSuccess(); return;
        }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await InstaVibe.auth.signInWithPopup(provider);
            this._onAuthSuccess();
        } catch (err) { InstaVibe.Utils.showToast('Erreur Google', 'error'); }
    },

    _onAuthSuccess() {
        document.getElementById('auth-container').innerHTML = '';
        document.getElementById('main-app').classList.remove('hidden');
        InstaVibe.App.init();
    },

    logout() {
        if (InstaVibe.DEMO_MODE) localStorage.removeItem('instavibe_user');
        else InstaVibe.auth.signOut();
        this.currentUser = null;
        document.getElementById('main-app').classList.add('hidden');
        this.renderLoginPage();
    },

    checkSession() {
        const saved = localStorage.getItem('instavibe_user');
        if (saved) { 
            this.currentUser = JSON.parse(saved); 
            // Ensure the user exists in DemoStore
            if (!InstaVibe.DemoStore.findOne('users', u => u.id === this.currentUser.id)) {
                InstaVibe.DemoStore.add('users', this.currentUser);
            }
            return true; 
        }
        return false;
    }
};
