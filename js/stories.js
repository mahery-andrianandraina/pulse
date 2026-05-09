/* ===========================================
   InstaVibe — Stories
   =========================================== */
InstaVibe.Stories = {
    storyTimer: null,

    renderStoriesBar() {
        const container = document.getElementById('stories-bar-container');
        const currentUser = InstaVibe.Utils.getCurrentUser();
        // Show all non-expired stories
        const stories = InstaVibe.DemoStore.find('stories', s => s.expiresAt > Date.now());
        const userStories = {};
        stories.forEach(s => { if (!userStories[s.userId]) userStories[s.userId] = []; userStories[s.userId].push(s); });

        const hasOwnStory = userStories[currentUser?.id]?.length > 0;

        let html = '<div class="stories-bar">';
        // Your story button — if you have a story, show it as clickable
        if (hasOwnStory) {
            html += `<div class="story-item" id="own-story-btn">
                <div class="avatar-story has-story"><div class="avatar avatar-lg"><img src="${currentUser?.avatarUrl || ''}" alt="You"></div></div>
                <span>Votre story</span>
            </div>`;
        } else {
            html += `<div class="story-item story-add" id="add-story-btn">
                <div class="avatar-story"><div class="avatar avatar-lg"><img src="${currentUser?.avatarUrl || ''}" alt="You"></div></div>
                <div class="add-badge">+</div>
                <span>Votre story</span>
            </div>`;
        }

        // Other users' stories
        Object.keys(userStories).forEach(userId => {
            if (userId === currentUser?.id) return;
            const story = userStories[userId][0];
            html += `<div class="story-item" data-user-id="${userId}" onclick="InstaVibe.Stories.openViewer('${userId}')">
                <div class="avatar-story has-story"><div class="avatar avatar-lg"><img src="${story.userAvatar}" alt="${story.username}"></div></div>
                <span>${story.username}</span>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

        // Bind events
        document.getElementById('add-story-btn')?.addEventListener('click', () => this.createStory());
        document.getElementById('own-story-btn')?.addEventListener('click', () => this.openViewer(currentUser.id));
    },

    createStory() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const dataUrl = await InstaVibe.Utils.fileToDataUrl(file);
            this._openEditor(dataUrl);
        };
        input.click();
    },

    _openEditor(imageUrl) {
        // Full-screen story editor
        const editor = document.createElement('div');
        editor.id = 'story-editor';
        editor.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:var(--max-width,480px);height:100%;z-index:1100;background:#000;display:flex;flex-direction:column;';
        editor.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;position:absolute;top:0;left:0;right:0;z-index:3;">
                <button onclick="document.getElementById('story-editor').remove()" style="color:white;font-size:28px;font-weight:300;cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">✕</button>
                <div style="display:flex;gap:8px;">
                    <button id="story-add-text-btn" style="background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:white;padding:8px 14px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;">Aa Texte</button>
                    <button id="story-filter-btn" style="background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:white;padding:8px 14px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;">🎨 Filtre</button>
                </div>
            </div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;" id="story-canvas-wrap">
                <img src="${imageUrl}" id="story-editor-img" style="width:100%;height:100%;object-fit:cover;" class="">
                <div id="story-text-overlay" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:24px;font-weight:700;text-shadow:0 2px 10px rgba(0,0,0,0.7);text-align:center;pointer-events:none;max-width:80%;word-wrap:break-word;"></div>
            </div>
            <div id="story-filter-bar" style="display:none;padding:12px;overflow-x:auto;background:rgba(0,0,0,0.8);">
                <div style="display:flex;gap:8px;" id="story-filter-options"></div>
            </div>
            <div style="padding:12px 16px;display:flex;gap:10px;align-items:center;background:rgba(0,0,0,0.8);">
                <input type="text" id="story-text-input" placeholder="Ajouter un texte à votre story..." style="flex:1;padding:10px 16px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:20px;color:white;font-size:14px;outline:none;">
                <button id="story-publish-btn" style="background:var(--gradient-pulse);color:white;padding:10px 20px;border-radius:20px;font-weight:700;font-size:14px;cursor:pointer;border:none;white-space:nowrap;">Publier ⚡</button>
            </div>`;

        document.body.appendChild(editor);
        this._bindEditorEvents(imageUrl);
    },

    _bindEditorEvents(imageUrl) {
        const filters = ['none','clarendon','gingham','moon','lark','reyes','juno','slumber','aden','inkwell'];
        let selectedFilter = '';
        let storyText = '';

        // Text input → live update overlay
        document.getElementById('story-text-input').addEventListener('input', (e) => {
            storyText = e.target.value;
            document.getElementById('story-text-overlay').textContent = storyText;
        });

        // Add text button — focus the input
        document.getElementById('story-add-text-btn').addEventListener('click', () => {
            document.getElementById('story-text-input').focus();
        });

        // Filter toggle
        document.getElementById('story-filter-btn').addEventListener('click', () => {
            const bar = document.getElementById('story-filter-bar');
            if (bar.style.display === 'none') {
                bar.style.display = 'block';
                const optionsEl = document.getElementById('story-filter-options');
                optionsEl.innerHTML = filters.map(f => `
                    <div style="flex-shrink:0;text-align:center;cursor:pointer;" onclick="InstaVibe.Stories._applyFilter('${f}')">
                        <div style="width:56px;height:56px;border-radius:8px;overflow:hidden;border:2px solid ${f === 'none' ? 'var(--accent-cyan)' : 'transparent'};">
                            <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" class="filter-${f}">
                        </div>
                        <span style="color:white;font-size:10px;margin-top:4px;display:block;">${f === 'none' ? 'Original' : f}</span>
                    </div>
                `).join('');
            } else {
                bar.style.display = 'none';
            }
        });

        // Publish
        document.getElementById('story-publish-btn').addEventListener('click', () => {
            const currentUser = InstaVibe.Utils.getCurrentUser();
            const now = Date.now();
            InstaVibe.DemoStore.add('stories', {
                id: InstaVibe.Utils.generateId('story_'), userId: currentUser.id,
                username: currentUser.username, userAvatar: currentUser.avatarUrl,
                imageUrl: imageUrl, text: storyText, filter: selectedFilter,
                createdAt: now, expiresAt: now + 86400000
            });
            document.getElementById('story-editor').remove();
            this.renderStoriesBar();
            InstaVibe.Utils.showToast('Story publiée! 📸', 'success');
        });

        // Store filter selection reference for publish
        this._applyFilter = (filterName) => {
            selectedFilter = filterName === 'none' ? '' : `filter-${filterName}`;
            document.getElementById('story-editor-img').className = selectedFilter;
            // Update border highlights
            document.querySelectorAll('#story-filter-options > div > div').forEach(d => d.style.borderColor = 'transparent');
            event.currentTarget.querySelector('div').style.borderColor = 'var(--accent-cyan)';
        };
    },


    openViewer(userId) {
        const allStories = InstaVibe.DemoStore.find('stories', s => s.expiresAt > Date.now());
        const userStories = {};
        allStories.forEach(s => { if (!userStories[s.userId]) userStories[s.userId] = []; userStories[s.userId].push(s); });
        const userIds = Object.keys(userStories);
        let userIdx = userIds.indexOf(userId);
        if (userIdx === -1) userIdx = 0;
        this._showStory(userStories, userIds, userIdx, 0);
    },

    _showStory(userStories, userIds, userIdx, storyIdx) {
        if (userIdx >= userIds.length) { this.closeViewer(); return; }
        const userId = userIds[userIdx];
        const stories = userStories[userId];
        if (storyIdx >= stories.length) { this._showStory(userStories, userIds, userIdx + 1, 0); return; }
        const story = stories[storyIdx];

        const progressHtml = stories.map((_, i) =>
            `<div class="story-progress-segment ${i < storyIdx ? 'complete' : ''} ${i === storyIdx ? 'active' : ''}"><div class="fill"></div></div>`
        ).join('');

        const html = `<div class="story-viewer" id="story-viewer">
            <div class="story-progress-bar">${progressHtml}</div>
            <div class="story-header">
                <div class="avatar avatar-sm"><img src="${story.userAvatar}" alt=""></div>
                <span class="username">${story.username}${InstaVibe.Utils.renderVerifiedBadge(story.userId)}</span>
                <span class="time">${InstaVibe.Utils.timeAgo(story.createdAt)}</span>
                <button class="close-btn" onclick="InstaVibe.Stories.closeViewer()">${InstaVibe.Utils.icons.close}</button>
            </div>
            <div class="story-image"><img src="${story.imageUrl}" alt="Story"></div>
            ${story.text ? `<div style="position:absolute;bottom:80px;left:0;right:0;text-align:center;color:white;font-size:18px;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,0.7);padding:0 20px;">${InstaVibe.Utils.escapeHtml(story.text)}</div>` : ''}
            <div class="story-reactions">
                <div class="story-reaction-emojis">
                    <button class="story-reaction-btn" onclick="InstaVibe.Stories.sendReaction('${story.userId}','❤️',this)">❤️</button>
                    <button class="story-reaction-btn" onclick="InstaVibe.Stories.sendReaction('${story.userId}','🔥',this)">🔥</button>
                    <button class="story-reaction-btn" onclick="InstaVibe.Stories.sendReaction('${story.userId}','😍',this)">😍</button>
                    <button class="story-reaction-btn" onclick="InstaVibe.Stories.sendReaction('${story.userId}','😂',this)">😂</button>
                    <button class="story-reaction-btn" onclick="InstaVibe.Stories.sendReaction('${story.userId}','😮',this)">😮</button>
                    <button class="story-reaction-btn" onclick="InstaVibe.Stories.sendReaction('${story.userId}','👏',this)">👏</button>
                </div>
            </div>
            <div class="story-nav prev" onclick="InstaVibe.Stories._prevStory()"></div>
            <div class="story-nav next" onclick="InstaVibe.Stories._nextStory()"></div>
        </div>`;

        // Store current state
        this._current = { userStories, userIds, userIdx, storyIdx };
        document.body.insertAdjacentHTML('beforeend', html);

        // Auto-advance after 5s
        clearTimeout(this.storyTimer);
        this.storyTimer = setTimeout(() => this._nextStory(), 5000);
    },

    _nextStory() {
        if (!this._current) return;
        const { userStories, userIds, userIdx, storyIdx } = this._current;
        this.closeViewer();
        this._showStory(userStories, userIds, userIdx, storyIdx + 1);
    },

    _prevStory() {
        if (!this._current) return;
        const { userStories, userIds, userIdx, storyIdx } = this._current;
        this.closeViewer();
        if (storyIdx > 0) this._showStory(userStories, userIds, userIdx, storyIdx - 1);
        else if (userIdx > 0) this._showStory(userStories, userIds, userIdx - 1, 0);
    },

    closeViewer() {
        clearTimeout(this.storyTimer);
        document.getElementById('story-viewer')?.remove();
        this._current = null;
    },

    sendReaction(toUserId, emoji, btn) {
        // Floating emoji animation
        const viewer = document.getElementById('story-viewer');
        if (viewer) {
            const floater = document.createElement('div');
            floater.className = 'story-reaction-sent';
            floater.textContent = emoji;
            viewer.appendChild(floater);
            setTimeout(() => floater.remove(), 1000);
        }

        // Create notification
        const user = InstaVibe.Utils.getCurrentUser();
        if (user && toUserId !== user.id) {
            const notifId = InstaVibe.Utils.generateId('n_');
            const notifData = {
                id: notifId, userId: toUserId, fromUserId: user.id,
                fromUsername: user.username, fromAvatar: user.avatarUrl,
                type: 'reaction', emoji: emoji,
                read: false, createdAt: Date.now()
            };
            InstaVibe.DemoStore.add('notifications', notifData);
            if (!InstaVibe.DEMO_MODE) {
                InstaVibe.db.collection('notifications').doc(notifId).set(notifData).catch(e => console.error(e));
            }
        }

        // Pulse button
        btn.style.transform = 'scale(1.4)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
        InstaVibe.Utils.showToast(`${emoji} envoyé!`, 'success');
    }
};
