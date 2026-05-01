/* ===========================================
   InstaVibe — Stories
   =========================================== */
InstaVibe.Stories = {
    storyTimer: null,

    renderStoriesBar() {
        const container = document.getElementById('stories-bar-container');
        const currentUser = InstaVibe.Utils.getCurrentUser();
        const stories = InstaVibe.DemoStore.find('stories', s => s.expiresAt > Date.now());
        const userStories = {};
        stories.forEach(s => { if (!userStories[s.userId]) userStories[s.userId] = []; userStories[s.userId].push(s); });

        let html = '<div class="stories-bar">';
        // Add story button (your story)
        html += `<div class="story-item story-add" id="add-story-btn">
            <div class="avatar-story"><div class="avatar avatar-lg"><img src="${currentUser?.avatarUrl || 'https://i.pravatar.cc/150?img=32'}" alt="You"></div></div>
            <div class="add-badge">+</div>
            <span>Votre story</span>
        </div>`;

        // Other users' stories
        Object.keys(userStories).forEach(userId => {
            if (userId === currentUser?.id) return;
            const story = userStories[userId][0];
            html += `<div class="story-item" data-user-id="${userId}" onclick="InstaVibe.Stories.openViewer('${userId}')">
                <div class="avatar-story"><div class="avatar avatar-lg"><img src="${story.userAvatar}" alt="${story.username}"></div></div>
                <span>${story.username}</span>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

        document.getElementById('add-story-btn')?.addEventListener('click', () => this.createStory());
    },

    createStory() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const dataUrl = await InstaVibe.Utils.fileToDataUrl(file);
            const currentUser = InstaVibe.Utils.getCurrentUser();
            const now = Date.now();
            InstaVibe.DemoStore.add('stories', {
                id: InstaVibe.Utils.generateId('story_'), userId: currentUser.id,
                username: currentUser.username, userAvatar: currentUser.avatarUrl,
                imageUrl: dataUrl, text: '', createdAt: now, expiresAt: now + 86400000
            });
            this.renderStoriesBar();
            InstaVibe.Utils.showToast('Story publiée! 📸', 'success');
        };
        input.click();
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
                <span class="username">${story.username}</span>
                <span class="time">${InstaVibe.Utils.timeAgo(story.createdAt)}</span>
                <button class="close-btn" onclick="InstaVibe.Stories.closeViewer()">${InstaVibe.Utils.icons.close}</button>
            </div>
            <div class="story-image"><img src="${story.imageUrl}" alt="Story"></div>
            ${story.text ? `<div style="position:absolute;bottom:60px;left:0;right:0;text-align:center;color:white;font-size:18px;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,0.7);padding:0 20px;">${InstaVibe.Utils.escapeHtml(story.text)}</div>` : ''}
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
    }
};
