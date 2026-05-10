/* ===========================================
   PULSE — Groups
   =========================================== */
InstaVibe.Groups = {
    async renderHub() {
        const content = document.getElementById('page-content');
        InstaVibe.Utils.renderLoading(content);

        document.getElementById('top-bar').innerHTML = `
            <div style="display:flex; align-items:center; gap: 12px;">
                <button class="btn-icon" onclick="InstaVibe.App.navigate('feed')">${InstaVibe.Utils.icons.back}</button>
                <span class="top-bar-brand" style="font-size: 18px;">Groupes</span>
            </div>
            <div class="top-bar-actions">
                <button class="btn-icon" onclick="InstaVibe.Groups.showCreateGroupModal()" style="color:var(--accent-cyan);">
                    ${InstaVibe.Utils.icons.plus}
                </button>
            </div>`;

        await new Promise(r => setTimeout(r, 400));

        const user = InstaVibe.Utils.getCurrentUser();
        
        // Fetch groups and memberships from Firestore
        if (!InstaVibe.DEMO_MODE) {
            try {
                const memSnap = await InstaVibe.db.collection('groupMembers').where('userId', '==', user.id).get();
                memSnap.docs.forEach(doc => {
                    if (!InstaVibe.DemoStore.findOne('groupMembers', m => m.id === doc.id)) {
                        InstaVibe.DemoStore.add('groupMembers', { id: doc.id, ...doc.data() }, true);
                    }
                });

                const groupSnap = await InstaVibe.db.collection('groups').get();
                groupSnap.docs.forEach(doc => {
                    if (!InstaVibe.DemoStore.findOne('groups', g => g.id === doc.id)) {
                        InstaVibe.DemoStore.add('groups', { id: doc.id, ...doc.data() }, true);
                    }
                });
            } catch (e) {
                console.error("Erreur récupération Firestore pour les groupes:", e);
            }
        }

        // Fetch groups where user is a member
        const memberships = InstaVibe.DemoStore.find('groupMembers', m => m.userId === user.id);
        const myGroups = InstaVibe.DemoStore.find('groups', g => memberships.some(m => m.groupId === g.id));

        let html = `<div class="page-enter" style="padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 18px;">Mes Groupes</h3>
            </div>`;

        if (myGroups.length === 0) {
            html += `<div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>Aucun groupe</h3>
                <p>Vous ne faites partie d'aucun groupe.</p>
                <button class="btn btn-primary" onclick="InstaVibe.Groups.showCreateGroupModal()">Créer un groupe</button>
            </div>`;
        } else {
            html += `<div class="group-grid" style="display: grid; gap: 16px;">`;
            myGroups.forEach(g => {
                const memberCount = InstaVibe.DemoStore.find('groupMembers', m => m.groupId === g.id).length;
                html += `
                <div class="group-card stagger-item" onclick="InstaVibe.App.navigate('group/${g.id}')" style="background: var(--bg-secondary); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-glass); cursor: pointer;">
                    <div class="group-cover" style="height: 80px; background: url('${g.coverUrl}') center/cover; background-color: var(--accent-cyan);"></div>
                    <div style="padding: 12px;">
                        <div style="font-weight: 700; font-size: 16px;">${InstaVibe.Utils.escapeHtml(g.name)}</div>
                        <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">${memberCount} membre(s)</div>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        html += `</div>`;
        content.innerHTML = html;
    },

    async renderDetail(groupId) {
        const content = document.getElementById('page-content');
        InstaVibe.Utils.renderLoading(content);

        let group = InstaVibe.DemoStore.findOne('groups', g => g.id === groupId);
        
        if (!group && !InstaVibe.DEMO_MODE) {
            try {
                const doc = await InstaVibe.db.collection('groups').doc(groupId).get();
                if (doc.exists) {
                    group = { id: doc.id, ...doc.data() };
                    InstaVibe.DemoStore.add('groups', group, true);
                }
            } catch (e) { console.error(e); }
        }

        if (!group) {
            content.innerHTML = '<div class="empty-state"><h3>Groupe introuvable</h3></div>';
            return;
        }

        const user = InstaVibe.Utils.getCurrentUser();
        
        if (!InstaVibe.DEMO_MODE) {
            try {
                const memSnap = await InstaVibe.db.collection('groupMembers').where('groupId', '==', groupId).get();
                memSnap.docs.forEach(doc => {
                    if (!InstaVibe.DemoStore.findOne('groupMembers', m => m.id === doc.id)) {
                        InstaVibe.DemoStore.add('groupMembers', { id: doc.id, ...doc.data() }, true);
                    }
                });
            } catch(e) {}
        }

        const isMember = InstaVibe.DemoStore.findOne('groupMembers', m => m.groupId === groupId && m.userId === user.id);
        const membersCount = InstaVibe.DemoStore.find('groupMembers', m => m.groupId === groupId).length;

        document.getElementById('top-bar').innerHTML = `
            <div style="display:flex; align-items:center; gap: 12px;">
                <button class="btn-icon" onclick="InstaVibe.App.navigate('groups')">${InstaVibe.Utils.icons.back}</button>
                <span class="top-bar-brand" style="font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${InstaVibe.Utils.escapeHtml(group.name)}</span>
            </div>
            <div class="top-bar-actions">
                ${isMember ? `<button class="btn-icon" onclick="InstaVibe.Groups.showAddMembersModal('${groupId}')">${InstaVibe.Utils.icons.plus}</button>` : ''}
            </div>`;

        await new Promise(r => setTimeout(r, 400));

        let html = `
        <div class="group-header animate-fadeIn" style="position: relative; padding: 20px 16px; background: linear-gradient(to bottom, rgba(0,0,0,0.5), var(--bg-primary)), url('${group.coverUrl}') center/cover; border-bottom: 1px solid var(--border-glass); min-height: 150px; display: flex; align-items: flex-end;">
            <div style="position: relative; z-index: 2;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${InstaVibe.Utils.escapeHtml(group.name)}</h2>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8); text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${InstaVibe.Utils.escapeHtml(group.description)}</p>
                <div style="margin-top: 8px; font-size: 13px; color: var(--accent-cyan); font-weight: 600;">🔒 Groupe Privé • ${membersCount} membre(s)</div>
            </div>
        </div>`;

        if (!isMember) {
            html += `<div class="empty-state page-enter">
                <div class="empty-state-icon">🔒</div>
                <h3>Groupe Privé</h3>
                <p>Seuls les membres peuvent voir et publier dans ce groupe.</p>
            </div>`;
        } else {
            // Group actions and feed
            html += `
            <div class="group-create-post" style="padding: 16px; border-bottom: 1px solid var(--border-glass); display: flex; gap: 12px; align-items: center; cursor: pointer;" onclick="InstaVibe.Post.renderCreatePage('${groupId}')">
                <div class="avatar avatar-sm">
                    <img src="${user.avatarUrl}" alt="">
                </div>
                <div style="flex: 1; background: var(--bg-secondary); padding: 12px 16px; border-radius: 20px; color: var(--text-secondary); font-size: 14px;">
                    Exprimez-vous dans ce groupe...
                </div>
                <button class="btn-icon" style="color: var(--accent-cyan); pointer-events: none;">${InstaVibe.Utils.icons.image}</button>
            </div>
            
            <div class="feed-page" style="padding: var(--space-md) var(--space-sm);">`;

            let allPosts = InstaVibe.DemoStore.find('posts', p => p.groupId === groupId);
            allPosts.sort((a, b) => b.createdAt - a.createdAt);

            if (allPosts.length === 0) {
                html += `<div class="empty-state"><div class="empty-state-icon">👋</div>
                    <h3>Bienvenue dans le groupe!</h3><p>Soyez le premier à publier.</p></div>`;
            } else {
                html += allPosts.map(p => InstaVibe.Post.renderPostCard(p)).join('');
            }
            html += `</div>`;
        }

        content.innerHTML = html;
    },

    showCreateGroupModal() {
        let html = `
        <div class="modal-header">
            <button onclick="InstaVibe.Utils.closeModal()">Annuler</button>
            <h3>Nouveau Groupe</h3>
            <button class="btn btn-primary btn-sm" id="create-group-btn">Créer</button>
        </div>
        <div style="padding: 16px;">
            <div class="edit-form-group">
                <label>Nom du groupe</label>
                <input type="text" class="input-field" id="group-name" placeholder="Ex: Les fans de tech">
            </div>
            <div class="edit-form-group">
                <label>Description</label>
                <textarea class="input-field" id="group-desc" rows="3" placeholder="De quoi parle ce groupe ?"></textarea>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary);">Le groupe sera privé par défaut.</p>
        </div>`;
        
        InstaVibe.Utils.showModal(html);

        setTimeout(() => {
            document.getElementById('create-group-btn')?.addEventListener('click', () => {
                const name = document.getElementById('group-name').value.trim();
                const desc = document.getElementById('group-desc').value.trim();
                if (!name) {
                    InstaVibe.Utils.showToast('Le nom est requis', 'error');
                    return;
                }

                const user = InstaVibe.Utils.getCurrentUser();
                const groupId = InstaVibe.Utils.generateId('g_');
                
                const groupData = {
                    id: groupId,
                    name: name,
                    description: desc,
                    coverUrl: `https://picsum.photos/seed/${groupId}/800/300`,
                    ownerId: user.id,
                    createdAt: Date.now()
                };

                const memberData = {
                    id: InstaVibe.Utils.generateId('gm_'),
                    groupId: groupId,
                    userId: user.id,
                    role: 'admin',
                    createdAt: Date.now()
                };

                InstaVibe.DemoStore.add('groups', groupData);
                InstaVibe.DemoStore.add('groupMembers', memberData);

                if (!InstaVibe.DEMO_MODE) {
                    InstaVibe.db.collection('groups').doc(groupId).set(groupData).catch(console.error);
                    InstaVibe.db.collection('groupMembers').doc(memberData.id).set(memberData).catch(console.error);
                }

                InstaVibe.Utils.closeModal();
                InstaVibe.Utils.showToast('Groupe créé!', 'success');
                InstaVibe.App.navigate(`group/${groupId}`);
            });
        }, 100);
    },

    showAddMembersModal(groupId) {
        const user = InstaVibe.Utils.getCurrentUser();
        // Get users we are following or are following us
        const follows = InstaVibe.DemoStore.find('follows', f => f.followerId === user.id || f.followingId === user.id);
        const userIds = [...new Set(follows.map(f => f.followerId === user.id ? f.followingId : f.followerId))];
        
        // Filter out existing members
        const existingMembers = InstaVibe.DemoStore.find('groupMembers', m => m.groupId === groupId).map(m => m.userId);
        const eligibleUsers = InstaVibe.DemoStore.find('users', u => userIds.includes(u.id) && !existingMembers.includes(u.id));

        let html = `
        <div class="modal-header">
            <button onclick="InstaVibe.Utils.closeModal()">${InstaVibe.Utils.icons.close}</button>
            <h3>Ajouter des membres</h3>
            <div></div>
        </div>
        <div style="max-height: 60vh; overflow-y: auto; padding: 16px;">`;

        if (eligibleUsers.length === 0) {
            html += `<div class="empty-state"><p>Tous vos amis sont déjà dans le groupe ou vous n'avez pas d'amis à inviter.</p></div>`;
        } else {
            eligibleUsers.forEach(u => {
                html += `
                <div class="user-list-item" style="display:flex; align-items:center; padding:12px 0; border-bottom: 1px solid var(--border-glass);">
                    <div class="avatar avatar-md"><img src="${u.avatarUrl}" alt=""></div>
                    <div class="user-info" style="flex:1; margin-left:12px;">
                        <div class="username">${u.username}</div>
                        <div class="fullname" style="font-size:12px; color:var(--text-secondary);">${u.displayName}</div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="InstaVibe.Groups.addMember('${groupId}', '${u.id}', this)">Ajouter</button>
                </div>`;
            });
        }

        html += `</div>`;
        InstaVibe.Utils.showModal(html);
    },

    addMember(groupId, targetUserId, btnEl) {
        const memberData = {
            id: InstaVibe.Utils.generateId('gm_'),
            groupId: groupId,
            userId: targetUserId,
            role: 'member',
            createdAt: Date.now()
        };

        InstaVibe.DemoStore.add('groupMembers', memberData);

        if (!InstaVibe.DEMO_MODE) {
            InstaVibe.db.collection('groupMembers').doc(memberData.id).set(memberData).catch(console.error);
        }

        btnEl.className = 'btn btn-secondary btn-sm';
        btnEl.textContent = 'Ajouté';
        btnEl.disabled = true;
        InstaVibe.Utils.showToast('Membre ajouté !', 'success');
        
        // Refresh detail view if we are on it
        if (InstaVibe.App.currentPage === 'group') {
            this.renderDetail(groupId);
        }
    }
};
