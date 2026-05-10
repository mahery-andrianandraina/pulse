/* ===========================================
   PULSE — Premium Monetization Module
   =========================================== */

InstaVibe.Premium = {
    showPaywall(source = 'general') {
        let title = "Débloquez Pulse Premium";
        let message = "Passez au niveau supérieur et profitez d'une expérience sans limite.";
        
        if (source === 'posts') {
            title = "Limite de Publications Atteinte";
            message = "Vous avez publié 3 posts. Abonnez-vous pour publier en illimité et continuer à partager vos moments.";
        } else if (source === 'groups') {
            title = "Création de Groupe Premium";
            message = "Seuls les membres Premium peuvent créer et administrer des groupes privés.";
        }

        const html = `
        <div class="modal-header" style="border-bottom: none;">
            <button onclick="InstaVibe.Utils.closeModal()">${InstaVibe.Utils.icons.close}</button>
            <h3>Premium</h3>
            <div></div>
        </div>
        <div style="padding: 20px; text-align: center; overflow-y: auto; max-height: 80vh;">
            <div style="font-size: 64px; margin-bottom: 10px;">👑</div>
            <h2 style="margin: 0 0 10px 0; background: var(--gradient-pulse); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 30px; font-size: 15px;">${message}</p>
            
            <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--accent-cyan); border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; text-align: center;">Avantages Exclusifs</h3>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                    <li style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--accent-cyan);">✔️</span> Publications illimitées
                    </li>
                    <li style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--accent-cyan);">✔️</span> Créer vos groupes privés
                    </li>
                    <li style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--accent-cyan);">✔️</span> Badge Premium Doré ${InstaVibe.Utils.icons.premium || '⭐'}
                    </li>
                    <li style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--accent-cyan);">✔️</span> Priorité dans le fil d'actualité
                    </li>
                </ul>
                <div style="margin-top: 20px; text-align: center; font-size: 24px; font-weight: 800;">
                    4.99€ <span style="font-size: 14px; color: var(--text-secondary); font-weight: 400;">/ mois</span>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 18px; border-radius: 30px; background: var(--gradient-pulse); border: none;" onclick="InstaVibe.Premium.showPaymentForm()">
                S'abonner maintenant ⚡
            </button>
            <p style="margin-top: 15px; font-size: 12px; color: var(--text-secondary);">Annulable à tout moment. Paiement sécurisé.</p>
        </div>`;

        InstaVibe.Utils.showModal(html);
    },

    showPaymentForm() {
        const html = `
        <div class="modal-header" style="border-bottom: none;">
            <button onclick="InstaVibe.Premium.showPaywall()">${InstaVibe.Utils.icons.back}</button>
            <h3>Paiement Sécurisé</h3>
            <div></div>
        </div>
        <div style="padding: 20px;">
            <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Abonnement Pulse Premium</span>
                    <span style="font-weight: bold;">4.99€</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
                    <span>Renouvellement mensuel</span>
                    <span>TTC</span>
                </div>
            </div>

            <div class="edit-form-group">
                <label>Nom sur la carte</label>
                <input type="text" class="input-field" placeholder="John Doe" value="${InstaVibe.Utils.getCurrentUser()?.displayName || ''}">
            </div>
            <div class="edit-form-group">
                <label>Numéro de carte</label>
                <input type="text" class="input-field" placeholder="•••• •••• •••• ••••" maxlength="19">
            </div>
            <div style="display: flex; gap: 10px;">
                <div class="edit-form-group" style="flex: 1;">
                    <label>Expiration</label>
                    <input type="text" class="input-field" placeholder="MM/AA" maxlength="5">
                </div>
                <div class="edit-form-group" style="flex: 1;">
                    <label>CVC</label>
                    <input type="text" class="input-field" placeholder="123" maxlength="3">
                </div>
            </div>

            <button class="btn btn-primary" id="process-payment-btn" style="width: 100%; padding: 16px; margin-top: 20px; font-size: 16px;" onclick="InstaVibe.Premium.processPayment()">
                Payer 4.99€ 🔒
            </button>
        </div>`;

        InstaVibe.Utils.showModal(html);
    },

    async processPayment() {
        const btn = document.getElementById('process-payment-btn');
        if (!btn) return;

        // Mock payment processing
        btn.disabled = true;
        btn.innerHTML = '<div class="loader" style="width:20px;height:20px;border-width:2px;margin:auto;"></div>';

        // Fake network delay
        await new Promise(r => setTimeout(r, 2000));

        const user = InstaVibe.Utils.getCurrentUser();
        if (!user) return;

        // Update database
        try {
            InstaVibe.DemoStore.update('users', user.id, { isPremium: true });
            if (!InstaVibe.DEMO_MODE) {
                await InstaVibe.db.collection('users').doc(user.id).update({ isPremium: true });
            }
            
            // Sync current user object in RAM
            if (InstaVibe.Auth && InstaVibe.Auth.currentUser) {
                InstaVibe.Auth.currentUser.isPremium = true;
            }
            // Update the persistent token if hybrid
            try {
                let saved = localStorage.getItem('instavibe_user');
                if (saved) {
                    let p = JSON.parse(saved);
                    p.isPremium = true;
                    localStorage.setItem('instavibe_user', JSON.stringify(p));
                }
            } catch(e) {}
            
            this.showSuccess(user);
        } catch (error) {
            console.error(error);
            InstaVibe.Utils.showToast("Erreur de paiement", "error");
            btn.disabled = false;
            btn.textContent = "Réessayer";
        }
    },

    showSuccess(user) {
        const html = `
        <div style="padding: 40px 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="font-size: 80px; animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);">🎉</div>
            <h2 style="margin: 20px 0 10px 0; color: gold;">Félicitations !</h2>
            <p style="color: var(--text-secondary); margin-bottom: 30px; line-height: 1.5;">
                Votre paiement a été accepté. Vous êtes maintenant membre <b>Pulse Premium</b>.<br><br>
                Profitez de toutes vos nouvelles fonctionnalités illimitées !
            </p>
            <button class="btn btn-primary" style="width: 100%; padding: 16px; border-radius: 30px;" onclick="InstaVibe.Utils.closeModal(); InstaVibe.App.navigate('profile/${user.id}');">
                Voir mon profil VIP
            </button>
        </div>`;

        InstaVibe.Utils.showModal(html);
        
        // Refresh UI components
        if (InstaVibe.App.currentPage === 'feed') InstaVibe.Feed.renderFeed();
        if (InstaVibe.App.currentPage === 'profile') InstaVibe.Profile.renderProfile(user.id);
        if (InstaVibe.App.currentPage === 'groups') InstaVibe.Groups.renderHub();
    }
};
