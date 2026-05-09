/* ===========================================
   PULSE — Messages (DM) Firebase & Local
   Advanced Features: Voice, Photos, Emojis,
   Reactions, Reply, Auto-response
   =========================================== */
InstaVibe.Messages = {
    _unsubConvs: null,
    _unsubChat: null,
    _showTyping: false,
    _replyTo: null,
    _autoReplies: [
        "Hey! Comment ça va? 😊", "Trop cool! 🔥", "J'adore ça!", "Haha 😂",
        "On se voit bientôt?", "Pas mal du tout 👏", "Ça me plaît!", "Merci! 🙏",
        "Envoie-moi plus de détails", "C'est génial ⚡", "Je suis d'accord 💯",
        "Wow, incroyable! 😍", "Tu as raison", "Bonne idée!", "À plus tard! 👋"
    ],

    async render() {
        const user = InstaVibe.Utils.getCurrentUser();
        const content = document.getElementById('page-content');
        InstaVibe.Utils.renderLoading(content);

        document.getElementById('top-bar').innerHTML = `
            <button class="top-bar-back" onclick="InstaVibe.App.navigate('feed')">${InstaVibe.Utils.icons.back}</button>
            <span class="top-bar-title">Messages</span>
            <div class="top-bar-actions"><button class="btn-icon">✏️</button></div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        await new Promise(r => setTimeout(r, 400));
        content.innerHTML = '<div class="messages-page page-enter" id="conv-list-container"></div>';

        if (InstaVibe.DEMO_MODE) {
            const convs = InstaVibe.DemoStore.find('conversations', c => c.participants.includes(user?.id));
            await this._renderConvList(convs, user);
        } else {
            try {
                const snapshot = await InstaVibe.db.collection('conversations')
                    .where('participants', 'array-contains', user.id).get();
                const convs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                await this._renderConvList(convs, user);
                if (this._unsubConvs) this._unsubConvs();
                this._unsubConvs = InstaVibe.db.collection('conversations')
                    .where('participants', 'array-contains', user.id)
                    .onSnapshot(snapshot => {
                        const convs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                        this._renderConvList(convs, user);
                    });
            } catch (err) {
                console.error("Erreur Firestore conversations:", err);
                document.getElementById('conv-list-container').innerHTML = `<p>Erreur de connexion serveur.</p>`;
            }
        }
    },

    async _renderConvList(convs, user) {
        const container = document.getElementById('conv-list-container');
        if (!container) return;
        if (convs.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Pas de messages</h3><p>Envoyez un message à quelqu\'un!</p></div>';
            return;
        }
        const htmls = await Promise.all(convs.sort((a,b) => b.lastMessageAt - a.lastMessageAt).map(async c => {
            const otherId = c.participants.find(p => p !== user.id);
            let other = InstaVibe.DemoStore.findOne('users', u => u.id === otherId);
            if (!other && !InstaVibe.DEMO_MODE) {
                try { const doc = await InstaVibe.db.collection('users').doc(otherId).get();
                    if (doc.exists) { other = { id: doc.id, ...doc.data() }; InstaVibe.DemoStore.add('users', other); }
                } catch(e) {}
            }
            if (!other) other = { username: 'Utilisateur', avatarUrl: `https://ui-avatars.com/api/?name=U&background=random` };
            const unread = c.unreadCount?.[user.id] || 0;
            const isOnline = Math.random() > 0.5;
            let lastMsgPreview = InstaVibe.Utils.escapeHtml(c.lastMessage || '');
            if (lastMsgPreview.startsWith('[photo]')) lastMsgPreview = '📷 Photo';
            if (lastMsgPreview.startsWith('[voice]')) lastMsgPreview = '🎤 Message vocal';
            return `<div class="conversation-item" onclick="InstaVibe.Messages.openChat('${c.id}', '${otherId}')">
                <div class="avatar-online-wrapper">
                    <div class="avatar avatar-md"><img src="${other.avatarUrl}" alt=""></div>
                    ${isOnline ? '<div class="online-dot"></div>' : ''}
                </div>
                <div class="conv-info">
                    <div class="conv-name">${other.username}${InstaVibe.Utils.renderVerifiedBadge(otherId)}</div>
                    <div class="conv-last-msg">${lastMsgPreview} · ${c.lastMessageAt ? InstaVibe.Utils.timeAgo(c.lastMessageAt) : ''}</div>
                </div>
                ${unread > 0 ? '<div class="unread-dot"></div>' : ''}
            </div>`;
        }));
        container.innerHTML = htmls.join('');
    },

    async openChat(convId, otherIdParam) {
        const user = InstaVibe.Utils.getCurrentUser();
        this._replyTo = null;
        let other = InstaVibe.DemoStore.findOne('users', u => u.id === otherIdParam);
        if (!other && !InstaVibe.DEMO_MODE) {
            try { const doc = await InstaVibe.db.collection('users').doc(otherIdParam).get();
                if (doc.exists) { other = { id: doc.id, ...doc.data() }; InstaVibe.DemoStore.add('users', other); }
            } catch(e) {}
        }
        if (!other) other = { username: 'Utilisateur', avatarUrl: `https://ui-avatars.com/api/?name=U&background=random` };
        const isOnline = Math.random() > 0.5;

        document.getElementById('top-bar').innerHTML = `
            <button class="top-bar-back" onclick="InstaVibe.Messages.render()">${InstaVibe.Utils.icons.back}</button>
            <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="InstaVibe.App.navigate('user/${otherIdParam}')">
                <div class="avatar-online-wrapper" style="width:32px;height:32px;">
                    <div class="avatar avatar-sm"><img src="${other.avatarUrl}" alt=""></div>
                    ${isOnline ? '<div class="online-dot online-dot--sm"></div>' : ''}
                </div>
                <div>
                    <span style="font-weight:600;font-size:14px;">${other.username}${InstaVibe.Utils.renderVerifiedBadge(otherIdParam)}</span>
                    <div style="font-size:11px;color:${isOnline ? 'var(--accent-green)' : 'var(--text-tertiary)'};">${isOnline ? 'En ligne' : 'Hors ligne'}</div>
                </div>
            </div>
            <div></div>`;

        const content = document.getElementById('page-content');
        content.innerHTML = `<div class="chat-view">
            <div class="chat-messages" id="chat-messages"></div>
            <div id="chat-reply-preview" class="chat-reply-preview hidden"></div>
            <div id="chat-emoji-panel" class="chat-emoji-panel hidden"></div>
            <div class="chat-input-bar">
                <button class="chat-action-btn" id="chat-emoji-btn" title="Emojis">${InstaVibe.Utils.icons.smile}</button>
                <button class="chat-action-btn" id="chat-photo-btn" title="Photo">${InstaVibe.Utils.icons.camera}</button>
                <input type="text" class="chat-input" placeholder="Message..." id="chat-msg-input">
                <button class="chat-action-btn" id="chat-voice-btn" title="Vocal">${InstaVibe.Utils.icons.mic}</button>
                <button class="chat-send-btn" id="chat-send-btn">Envoyer</button>
                <input type="file" id="chat-photo-input" accept="image/*" style="display:none">
            </div>
        </div>`;

        // Load & render messages
        if (InstaVibe.DEMO_MODE) {
            const conv = InstaVibe.DemoStore.findOne('conversations', c => c.id === convId);
            if (conv?.unreadCount) { conv.unreadCount[user.id] = 0; InstaVibe.DemoStore.update('conversations', convId, { unreadCount: conv.unreadCount }); }
            const renderLoop = () => {
                const messages = InstaVibe.DemoStore.find('messages', m => m.conversationId === convId).sort((a, b) => a.createdAt - b.createdAt);
                this._renderMessages(messages, user.id);
            };
            renderLoop();
            this._setupAdvancedChat(convId, user.id, otherIdParam, (text, type, extra) => {
                const msgData = { id: InstaVibe.Utils.generateId('msg_'), conversationId: convId, senderId: user.id, text, type: type || 'text', createdAt: Date.now() };
                if (extra) Object.assign(msgData, extra);
                InstaVibe.DemoStore.add('messages', msgData);
                const preview = type === 'photo' ? '[photo]' : type === 'voice' ? '[voice]' : text;
                InstaVibe.DemoStore.update('conversations', convId, { lastMessage: preview, lastMessageAt: Date.now() });
                renderLoop();
                // Auto-reply after 2s
                this._scheduleAutoReply(convId, user.id, otherIdParam, renderLoop);
            });
        } else {
            if (this._unsubChat) this._unsubChat();
            this._unsubChat = InstaVibe.db.collection('messages')
                .where('conversationId', '==', convId).orderBy('createdAt', 'asc')
                .onSnapshot(snapshot => {
                    const messages = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                    this._renderMessages(messages, user.id);
                });
            InstaVibe.db.collection('conversations').doc(convId).update({ [`unreadCount.${user.id}`]: 0 });
            this._setupAdvancedChat(convId, user.id, otherIdParam, async (text, type, extra) => {
                const msgData = { conversationId: convId, senderId: user.id, text, type: type || 'text', createdAt: Date.now() };
                if (extra) Object.assign(msgData, extra);
                await InstaVibe.db.collection('messages').add(msgData);
                const preview = type === 'photo' ? '[photo]' : type === 'voice' ? '[voice]' : text;
                await InstaVibe.db.collection('conversations').doc(convId).update({
                    lastMessage: preview, lastMessageAt: Date.now(),
                    [`unreadCount.${otherIdParam}`]: firebase.firestore.FieldValue.increment(1)
                });
            });
        }
    },

    _renderMessages(messages, userId) {
        const chatBox = document.getElementById('chat-messages');
        if (!chatBox) return;
        chatBox.innerHTML = messages.map(m => {
            const isSent = m.senderId === userId;
            const readCheck = isSent ? '<span class="read-receipt read-receipt--read"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1.5 8.5 5 12 14.5 3"/><polyline points="5.5 8.5 9 12" opacity="0.5"/></svg></span>' : '';
            const reaction = m.reaction ? `<div class="msg-reaction">${m.reaction}</div>` : '';
            const replyHtml = m.replyTo ? `<div class="msg-reply-quote">${InstaVibe.Utils.escapeHtml(m.replyTo)}</div>` : '';
            let body = '';
            if (m.type === 'photo') {
                body = `<img src="${m.imageUrl}" class="chat-photo" onclick="window.open('${m.imageUrl}','_blank')">`;
            } else if (m.type === 'voice') {
                body = `<div class="voice-msg"><button class="voice-play-btn" onclick="InstaVibe.Messages._playVoice(this,'${m.audioUrl}')">▶</button><div class="voice-wave"></div><span class="voice-dur">${m.duration || '0:03'}</span></div>`;
            } else {
                body = InstaVibe.Utils.escapeHtml(m.text);
            }
            return `<div class="chat-bubble ${isSent ? 'sent' : 'received'}" data-msg-id="${m.id}" ondblclick="InstaVibe.Messages._reactToMsg('${m.id}')">
                ${replyHtml}${body}
                <div class="bubble-time">${InstaVibe.Utils.timeAgo(m.createdAt)}${readCheck}</div>
                ${reaction}
            </div>`;
        }).join('');
        if (this._showTyping) {
            chatBox.innerHTML += '<div class="typing-indicator"><div class="typing-dots"><span></span><span></span><span></span></div><span class="typing-label">écrit...</span></div>';
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    },

    _setupAdvancedChat(convId, userId, otherId, sendCallback) {
        const input = document.getElementById('chat-msg-input');
        const sendBtn = document.getElementById('chat-send-btn');

        // === TEXT SEND ===
        const send = () => {
            const text = input.value.trim(); if (!text) return;
            const extra = this._replyTo ? { replyTo: this._replyTo } : {};
            input.value = '';
            this._replyTo = null;
            document.getElementById('chat-reply-preview')?.classList.add('hidden');
            sendCallback(text, 'text', extra);
        };
        sendBtn.onclick = send;
        input.onkeypress = (e) => { if (e.key === 'Enter') send(); };

        // === EMOJI PICKER ===
        const emojiBtn = document.getElementById('chat-emoji-btn');
        const emojiPanel = document.getElementById('chat-emoji-panel');
        const emojis = ['😀','😂','😍','🥰','😎','🤔','😭','🔥','❤️','👍','👏','🙏','💯','⚡','✨','🎉','🥺','😤','🤩','💀','👀','🫶','💜','🖤'];
        emojiPanel.innerHTML = emojis.map(e => `<span class="emoji-pick" onclick="document.getElementById('chat-msg-input').value+='${e}';document.getElementById('chat-msg-input').focus();">${e}</span>`).join('');
        emojiBtn.onclick = () => emojiPanel.classList.toggle('hidden');

        // === PHOTO SEND ===
        const photoBtn = document.getElementById('chat-photo-btn');
        const photoInput = document.getElementById('chat-photo-input');
        photoBtn.onclick = () => photoInput.click();
        photoInput.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const dataUrl = await InstaVibe.Utils.fileToDataUrl(file);
            sendCallback('', 'photo', { imageUrl: dataUrl });
        };

        // === VOICE RECORDING ===
        const voiceBtn = document.getElementById('chat-voice-btn');
        let mediaRecorder = null;
        let audioChunks = [];
        let recording = false;
        voiceBtn.onclick = async () => {
            if (recording) {
                mediaRecorder?.stop();
                voiceBtn.innerHTML = InstaVibe.Utils.icons.mic;
                voiceBtn.style.color = '';
                recording = false;
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    stream.getTracks().forEach(t => t.stop());
                    const blob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(blob);
                    sendCallback('', 'voice', { audioUrl, duration: '0:03' });
                };
                mediaRecorder.start();
                recording = true;
                voiceBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>';
                voiceBtn.style.color = 'var(--accent-coral)';
                // Auto-stop after 30s
                setTimeout(() => { if (recording) { mediaRecorder?.stop(); voiceBtn.innerHTML = InstaVibe.Utils.icons.mic; voiceBtn.style.color = ''; recording = false; } }, 30000);
            } catch (err) {
                InstaVibe.Utils.showToast('Micro non disponible', 'error');
            }
        };

        // Close emoji panel on outside click
        input.onfocus = () => emojiPanel.classList.add('hidden');
    },

    // === REACTIONS ===
    _reactToMsg(msgId) {
        const emojis = ['❤️','😂','😮','😢','👍','🔥'];
        const bubble = document.querySelector(`[data-msg-id="${msgId}"]`);
        if (!bubble) return;
        // Remove existing picker
        document.querySelectorAll('.reaction-picker').forEach(p => p.remove());
        const picker = document.createElement('div');
        picker.className = 'reaction-picker';
        picker.innerHTML = emojis.map(e => `<span onclick="InstaVibe.Messages._setReaction('${msgId}','${e}')">${e}</span>`).join('');
        bubble.style.position = 'relative';
        bubble.appendChild(picker);
        setTimeout(() => picker.remove(), 4000);
    },

    _setReaction(msgId, emoji) {
        InstaVibe.DemoStore.update('messages', msgId, { reaction: emoji });
        document.querySelectorAll('.reaction-picker').forEach(p => p.remove());
        // Re-render
        const convId = InstaVibe.DemoStore.findOne('messages', m => m.id === msgId)?.conversationId;
        if (convId) {
            const userId = InstaVibe.Utils.getCurrentUser()?.id;
            const messages = InstaVibe.DemoStore.find('messages', m => m.conversationId === convId).sort((a, b) => a.createdAt - b.createdAt);
            this._renderMessages(messages, userId);
        }
    },

    // === VOICE PLAYBACK ===
    _playVoice(btn, audioUrl) {
        const audio = new Audio(audioUrl);
        btn.textContent = '⏸';
        audio.play();
        audio.onended = () => { btn.textContent = '▶'; };
    },

    // === AUTO-REPLY (Demo) ===
    _scheduleAutoReply(convId, userId, otherId, renderLoop) {
        clearTimeout(this._autoReplyTimer);
        this._autoReplyTimer = setTimeout(() => {
            this._showTyping = true;
            renderLoop();
            setTimeout(() => {
                this._showTyping = false;
                const other = InstaVibe.DemoStore.findOne('users', u => u.id === otherId);
                const reply = this._autoReplies[Math.floor(Math.random() * this._autoReplies.length)];
                InstaVibe.DemoStore.add('messages', {
                    id: InstaVibe.Utils.generateId('msg_'), conversationId: convId,
                    senderId: otherId, text: reply, type: 'text', createdAt: Date.now()
                });
                InstaVibe.DemoStore.update('conversations', convId, { lastMessage: reply, lastMessageAt: Date.now() });
                renderLoop();
            }, 1500);
        }, 2000);
    },

    startChat(targetUserId) {
        const user = InstaVibe.Utils.getCurrentUser();
        if (InstaVibe.DEMO_MODE) {
            let conv = InstaVibe.DemoStore.findOne('conversations', c =>
                c.participants.includes(user.id) && c.participants.includes(targetUserId));
            if (!conv) {
                conv = InstaVibe.DemoStore.add('conversations', {
                    id: InstaVibe.Utils.generateId('conv_'), participants: [user.id, targetUserId],
                    lastMessage: '', lastMessageAt: Date.now(),
                    unreadCount: { [user.id]: 0, [targetUserId]: 0 }
                });
            }
            this.openChat(conv.id, targetUserId);
        } else {
            InstaVibe.db.collection('conversations')
                .where('participants', 'array-contains', user.id).get()
                .then(snap => {
                    const existing = snap.docs.find(d => d.data().participants.includes(targetUserId));
                    if (existing) { this.openChat(existing.id, targetUserId); }
                    else {
                        InstaVibe.db.collection('conversations').add({
                            participants: [user.id, targetUserId],
                            lastMessage: '', lastMessageAt: Date.now(),
                            unreadCount: { [user.id]: 0, [targetUserId]: 0 }
                        }).then(docRef => this.openChat(docRef.id, targetUserId));
                    }
                });
        }
    }
};
