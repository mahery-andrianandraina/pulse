/* ===========================================
   InstaVibe — Notifications
   =========================================== */
InstaVibe.Notifications = {
    render() {
        document.getElementById('top-bar').innerHTML = `
            <button class="top-bar-back" onclick="InstaVibe.App.navigate('feed')">${InstaVibe.Utils.icons.back}</button>
            <span class="top-bar-title">Notifications</span><div></div>`;
        document.getElementById('stories-bar-container').classList.add('hidden');

        const user = InstaVibe.Utils.getCurrentUser();
        const notifs = InstaVibe.DemoStore.find('notifications', n => n.userId === user?.id).sort((a, b) => b.createdAt - a.createdAt);
        const content = document.getElementById('page-content');

        if (notifs.length === 0) {
            content.innerHTML = '<div class="empty-state page-enter"><div class="empty-state-icon">🔔</div><h3>Aucune notification</h3><p>Les interactions apparaîtront ici.</p></div>';
            return;
        }

        // Mark all as read
        notifs.forEach(n => { if (!n.read) InstaVibe.DemoStore.update('notifications', n.id, { read: true }); });

        const today = notifs.filter(n => Date.now() - n.createdAt < 86400000);
        const earlier = notifs.filter(n => Date.now() - n.createdAt >= 86400000);

        let html = '<div class="page-enter">';
        if (today.length > 0) {
            html += '<div class="notif-section-title">Aujourd\'hui</div>';
            html += today.map(n => this._renderNotif(n)).join('');
        }
        if (earlier.length > 0) {
            html += '<div class="notif-section-title">Plus tôt</div>';
            html += earlier.map(n => this._renderNotif(n)).join('');
        }
        html += '</div>';
        content.innerHTML = html;
    },

    _renderNotif(n) {
        let text = '';
        let action = '';
        switch (n.type) {
            case 'like': text = 'a aimé votre publication.'; action = `onclick="InstaVibe.Post.showComments('${n.postId}')"`; break;
            case 'comment': text = 'a commenté votre publication.'; action = `onclick="InstaVibe.Post.showComments('${n.postId}')"`; break;
            case 'follow': text = 'a commencé à vous suivre.'; action = `onclick="InstaVibe.App.navigate('user/${n.fromUserId}')"` ; break;
        }
        return `<div class="notification-item ${n.read ? '' : 'unread'}" ${action}>
            <div class="avatar"><img src="${n.fromAvatar}" alt=""></div>
            <div class="notif-content">
                <span class="username">${n.fromUsername}</span> ${text}
                <span class="notif-time"> ${InstaVibe.Utils.timeAgo(n.createdAt)}</span>
            </div>
            ${n.postImage ? `<div class="notif-thumb"><img src="${n.postImage}" alt=""></div>` : ''}
            ${n.type === 'follow' ? `<button class="btn-follow btn-sm" onclick="event.stopPropagation();InstaVibe.Profile.toggleFollow('${n.fromUserId}')">Suivre</button>` : ''}
        </div>`;
    },

    getUnreadCount() {
        const user = InstaVibe.Utils.getCurrentUser();
        return InstaVibe.DemoStore.find('notifications', n => n.userId === user?.id && !n.read).length;
    }
};
