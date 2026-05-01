/* ===========================================
   PULSE — Messages (DM) Firebase & Local
   =========================================== */
InstaVibe.Messages = {
    _unsubConvs: null,
    _unsubChat: null,

    render() {
        const user = InstaVibe.Utils.getCurrentUser();
        document.getElementById('top-bar').innerHTML = `
            <button class="top-bar-back" onclick="InstaVibe.App.navigate('feed')">${InstaVibe.Utils.icons.back}</button>
            <span class="top-bar-title">${user?.username || 'Messages'}</span>
            <div class="top-bar-actions"><button class="btn-icon">✏️</button></div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        const content = document.getElementById('page-content');
        content.innerHTML = '<div class="messages-page page-enter" id="conv-list-container"><div style="padding:20px;text-align:center">Chargement...</div></div>';

        if (InstaVibe.DEMO_MODE) {
            const convs = InstaVibe.DemoStore.find('conversations', c => c.participants.includes(user?.id));
            this._renderConvList(convs, user);
        } else {
            // FIREBASE REALTIME LISTENER
            if (this._unsubConvs) this._unsubConvs();
            this._unsubConvs = InstaVibe.db.collection('conversations')
                .where('participants', 'array-contains', user.id)
                .onSnapshot(snapshot => {
                    const convs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                    this._renderConvList(convs, user);
                }, err => {
                    console.error("Erreur Firestore conversations:", err);
                    document.getElementById('conv-list-container').innerHTML = `<p>Erreur de connexion serveur.</p>`;
                });
        }
    },

    _renderConvList(convs, user) {
        const container = document.getElementById('conv-list-container');
        if (!container) return;

        if (convs.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Pas de messages</h3><p>Envoyez un message à quelqu\'un!</p></div>';
            return;
        }

        container.innerHTML = convs.sort((a,b) => b.lastMessageAt - a.lastMessageAt).map(c => {
            const otherId = c.participants.find(p => p !== user.id);
            // Si Firebase, il faudrait idéalement fetcher l'utilisateur distant, 
            // pour l'instant on garde la logique synchrone du cache DemoStore ou on met un placeholder
            const other = InstaVibe.DEMO_MODE ? InstaVibe.DemoStore.findOne('users', u => u.id === otherId) : { username: 'Utilisateur', avatarUrl: 'https://i.pravatar.cc/150' };
            const unread = c.unreadCount?.[user.id] || 0;
            return `<div class="conversation-item" onclick="InstaVibe.Messages.openChat('${c.id}', '${otherId}')">
                <div class="avatar avatar-md"><img src="${other?.avatarUrl || 'https://i.pravatar.cc/150'}" alt=""></div>
                <div class="conv-info">
                    <div class="conv-name">${other?.username || 'Utilisateur'}</div>
                    <div class="conv-last-msg">${InstaVibe.Utils.escapeHtml(c.lastMessage || '')} · ${c.lastMessageAt ? InstaVibe.Utils.timeAgo(c.lastMessageAt) : ''}</div>
                </div>
                ${unread > 0 ? '<div class="unread-dot"></div>' : ''}
            </div>`;
        }).join('');
    },

    openChat(convId, otherIdParam) {
        const user = InstaVibe.Utils.getCurrentUser();
        
        // Setup Header
        const other = InstaVibe.DEMO_MODE ? InstaVibe.DemoStore.findOne('users', u => u.id === otherIdParam) : { username: 'Utilisateur', avatarUrl: 'https://i.pravatar.cc/150' };
        document.getElementById('top-bar').innerHTML = `
            <button class="top-bar-back" onclick="InstaVibe.Messages.render()">${InstaVibe.Utils.icons.back}</button>
            <div class="flex items-center gap-sm" onclick="InstaVibe.App.navigate('user/${otherIdParam}')" style="cursor:pointer">
                <div class="avatar avatar-sm"><img src="${other?.avatarUrl || 'https://i.pravatar.cc/150'}" alt=""></div>
                <span style="font-weight:600">${other?.username || 'Chat'}</span>
            </div>
            <div></div>`;

        const content = document.getElementById('page-content');
        content.innerHTML = `<div class="chat-view">
            <div class="chat-messages" id="chat-messages"><div style="text-align:center;padding:20px;">Connexion...</div></div>
            <div class="chat-input-bar">
                <input type="text" class="chat-input" placeholder="Envoyer un message..." id="chat-msg-input">
                <button class="chat-send-btn" id="chat-send-btn">Envoyer</button>
            </div>
        </div>`;

        // Load Messages Realtime
        if (InstaVibe.DEMO_MODE) {
            // Mark read
            const conv = InstaVibe.DemoStore.findOne('conversations', c => c.id === convId);
            if (conv && conv.unreadCount) { conv.unreadCount[user.id] = 0; InstaVibe.DemoStore.update('conversations', convId, { unreadCount: conv.unreadCount }); }
            
            const renderLoop = () => {
                const messages = InstaVibe.DemoStore.find('messages', m => m.conversationId === convId).sort((a, b) => a.createdAt - b.createdAt);
                this._renderMessages(messages, user.id);
            };
            renderLoop(); // No real realtime in DemoMode unless polling, but we only trigger on send.
            
            // Override Send
            this._setupSendBtn(convId, user.id, otherIdParam, (text) => {
                InstaVibe.DemoStore.add('messages', { id: InstaVibe.Utils.generateId('msg_'), conversationId: convId, senderId: user.id, text, createdAt: Date.now() });
                InstaVibe.DemoStore.update('conversations', convId, { lastMessage: text, lastMessageAt: Date.now() });
                renderLoop();
            });
        } else {
            // FIREBASE REALTIME LISTENER
            if (this._unsubChat) this._unsubChat();
            this._unsubChat = InstaVibe.db.collection('messages')
                .where('conversationId', '==', convId)
                .orderBy('createdAt', 'asc')
                .onSnapshot(snapshot => {
                    const messages = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                    this._renderMessages(messages, user.id);
                });
            
            // Mark read async
            InstaVibe.db.collection('conversations').doc(convId).update({
                [`unreadCount.${user.id}`]: 0
            });

            this._setupSendBtn(convId, user.id, otherIdParam, async (text) => {
                await InstaVibe.db.collection('messages').add({
                    conversationId: convId, senderId: user.id, text, createdAt: Date.now()
                });
                await InstaVibe.db.collection('conversations').doc(convId).update({
                    lastMessage: text, lastMessageAt: Date.now(),
                    [`unreadCount.${otherIdParam}`]: firebase.firestore.FieldValue.increment(1)
                });
            });
        }
    },

    _renderMessages(messages, userId) {
        const chatBox = document.getElementById('chat-messages');
        if (!chatBox) return;
        chatBox.innerHTML = messages.map(m => `<div class="chat-bubble ${m.senderId === userId ? 'sent' : 'received'}">
            ${InstaVibe.Utils.escapeHtml(m.text)}
            <div class="bubble-time">${InstaVibe.Utils.timeAgo(m.createdAt)}</div>
        </div>`).join('');
        chatBox.scrollTop = chatBox.scrollHeight;
    },

    _setupSendBtn(convId, userId, otherId, sendCallback) {
        const input = document.getElementById('chat-msg-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const send = () => {
            const text = input.value.trim(); if (!text) return;
            input.value = '';
            sendCallback(text);
        };
        sendBtn.onclick = send;
        input.onkeypress = (e) => { if (e.key === 'Enter') send(); };
    },

    startChat(targetUserId) {
        const user = InstaVibe.Utils.getCurrentUser();
        
        if (InstaVibe.DEMO_MODE) {
            let conv = InstaVibe.DemoStore.findOne('conversations', c =>
                c.participants.includes(user.id) && c.participants.includes(targetUserId)
            );
            if (!conv) {
                conv = InstaVibe.DemoStore.add('conversations', {
                    id: InstaVibe.Utils.generateId('conv_'),
                    participants: [user.id, targetUserId],
                    lastMessage: '', lastMessageAt: Date.now(),
                    unreadCount: { [user.id]: 0, [targetUserId]: 0 }
                });
            }
            this.openChat(conv.id, targetUserId);
        } else {
            // Query Firebase for existing conv
            InstaVibe.db.collection('conversations')
                .where('participants', 'array-contains', user.id)
                .get()
                .then(snap => {
                    const existing = snap.docs.find(d => d.data().participants.includes(targetUserId));
                    if (existing) {
                        this.openChat(existing.id, targetUserId);
                    } else {
                        // Create new
                        InstaVibe.db.collection('conversations').add({
                            participants: [user.id, targetUserId],
                            lastMessage: '', lastMessageAt: Date.now(),
                            unreadCount: { [user.id]: 0, [targetUserId]: 0 }
                        }).then(docRef => {
                            this.openChat(docRef.id, targetUserId);
                        });
                    }
                });
        }
    }
};
