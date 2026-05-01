/* ===========================================
   InstaVibe — Firebase Configuration
   =========================================== */
window.InstaVibe = window.InstaVibe || {};

const firebaseConfig = {
    apiKey: "AIzaSyBi_qmhL99LG6APLWC1S2g1ATpt4oERd2U",
    authDomain: "pulse-app-86499.firebaseapp.com",
    projectId: "pulse-app-86499",
    storageBucket: "pulse-app-86499.firebasestorage.app",
    messagingSenderId: "22379382180",
    appId: "1:22379382180:web:f8fa948cdd176be036ad31"
};

const DEMO_MODE = firebaseConfig.apiKey === "YOUR_API_KEY";
let db, auth, storage;

if (!DEMO_MODE) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    // storage = firebase.storage(); // DÉSACTIVÉ (Option 2 : Pas de carte bancaire)
} else {
    console.log('🎮 DEMO mode (localStorage)');
}

/* Demo Data Store */
const DemoStore = {
    _data: null,
    init() {
        const saved = localStorage.getItem('instavibe_data');
        this._data = saved ? JSON.parse(saved) : this._seedData();
        this.save();
    },
    save() { localStorage.setItem('instavibe_data', JSON.stringify(this._data)); },
    get(c) { return this._data[c] || []; },
    add(c, item) { if (!this._data[c]) this._data[c] = []; this._data[c].push(item); this.save(); return item; },
    update(c, id, u) { const arr = this._data[c] || []; const i = arr.findIndex(x => x.id === id); if (i !== -1) { arr[i] = { ...arr[i], ...u }; this.save(); return arr[i]; } return null; },
    delete(c, id) { if (this._data[c]) { this._data[c] = this._data[c].filter(x => x.id !== id); this.save(); } },
    find(c, fn) { return (this._data[c] || []).filter(fn); },
    findOne(c, fn) { return (this._data[c] || []).find(fn); },
    _seedData() {
        const now = Date.now(), h = 3600000, d = 86400000;
        const users = [
            { id: 'user_1', username: 'sophie.lens', displayName: 'Sophie Laurent', bio: '📷 Photographe | Paris 🇫🇷\n✨ La vie en couleurs', avatarUrl: 'https://i.pravatar.cc/150?img=1', followersCount: 1243, followingCount: 567, postsCount: 89, createdAt: now - 90 * d },
            { id: 'user_2', username: 'marc.travel', displayName: 'Marc Dubois', bio: '✈️ 30 pays | Voyageur\n🌍 Next: Japan 🇯🇵', avatarUrl: 'https://i.pravatar.cc/150?img=3', followersCount: 3421, followingCount: 892, postsCount: 156, createdAt: now - 120 * d },
            { id: 'user_3', username: 'lea.foodie', displayName: 'Léa Martin', bio: '🍽️ Food blogger | Lyon\n👩‍🍳 Recettes & bons plans', avatarUrl: 'https://i.pravatar.cc/150?img=5', followersCount: 8790, followingCount: 445, postsCount: 234, createdAt: now - 200 * d },
            { id: 'user_4', username: 'alex.fit', displayName: 'Alexandre Petit', bio: '💪 Coach sportif\n🏋️ Transform your life', avatarUrl: 'https://i.pravatar.cc/150?img=8', followersCount: 15600, followingCount: 312, postsCount: 445, createdAt: now - 300 * d },
            { id: 'user_5', username: 'emma.art', displayName: 'Emma Rousseau', bio: '🎨 Digital artist\n🖌️ Commissions open', avatarUrl: 'https://i.pravatar.cc/150?img=9', followersCount: 6234, followingCount: 678, postsCount: 178, createdAt: now - 150 * d },
            { id: 'user_6', username: 'lucas.music', displayName: 'Lucas Bernard', bio: '🎵 Musicien | Producer\n🎸 New single out!', avatarUrl: 'https://i.pravatar.cc/150?img=11', followersCount: 2100, followingCount: 543, postsCount: 67, createdAt: now - 80 * d },
            { id: 'user_7', username: 'chloe.style', displayName: 'Chloé Moreau', bio: '👗 Fashion & Lifestyle\n💄 Collab: chloe@mail.com', avatarUrl: 'https://i.pravatar.cc/150?img=16', followersCount: 12400, followingCount: 234, postsCount: 321, createdAt: now - 250 * d },
        ];
        const demoUser = { id: 'demo_user', username: 'mon.profil', displayName: 'Mon Profil', bio: '✨ Bienvenue sur Pulse!\n⚡ Créez, partagez, vibrez', avatarUrl: 'https://i.pravatar.cc/150?img=32', followersCount: 3, followingCount: 5, postsCount: 0, createdAt: now };
        const posts = [
            { id: 'post_1', userId: 'user_2', username: 'marc.travel', userAvatar: 'https://i.pravatar.cc/150?img=3', imageUrl: 'https://picsum.photos/seed/travel1/600/600', caption: 'Coucher de soleil à Santorin 🌅 #travel #greece', filter: 'filter-clarendon', location: 'Santorin, Grèce', likesCount: 234, commentsCount: 2, createdAt: now - 2 * h },
            { id: 'post_2', userId: 'user_3', username: 'lea.foodie', userAvatar: 'https://i.pravatar.cc/150?img=5', imageUrl: 'https://picsum.photos/seed/food1/600/600', caption: 'Brunch du dimanche 🥐🍳 #foodie #brunch', filter: 'filter-juno', location: 'Lyon, France', likesCount: 567, commentsCount: 1, createdAt: now - 4 * h },
            { id: 'post_3', userId: 'user_1', username: 'sophie.lens', userAvatar: 'https://i.pravatar.cc/150?img=1', imageUrl: 'https://picsum.photos/seed/paris1/600/600', caption: 'Paris sera toujours Paris 🗼❤️ #paris', filter: 'filter-lark', location: 'Paris, France', likesCount: 892, commentsCount: 1, createdAt: now - 6 * h },
            { id: 'post_4', userId: 'user_4', username: 'alex.fit', userAvatar: 'https://i.pravatar.cc/150?img=8', imageUrl: 'https://picsum.photos/seed/fitness1/600/600', caption: 'No excuses 💪 Jour 365! #fitness #motivation', filter: 'filter-ludwig', location: 'Salle de sport', likesCount: 1205, commentsCount: 1, createdAt: now - 8 * h },
            { id: 'post_5', userId: 'user_5', username: 'emma.art', userAvatar: 'https://i.pravatar.cc/150?img=9', imageUrl: 'https://picsum.photos/seed/art1/600/600', caption: 'Nouvelle création 🎨 "Dreams in Color" #art', filter: 'filter-perpetua', location: '', likesCount: 445, commentsCount: 0, createdAt: now - 12 * h },
            { id: 'post_6', userId: 'user_7', username: 'chloe.style', userAvatar: 'https://i.pravatar.cc/150?img=16', imageUrl: 'https://picsum.photos/seed/fashion1/600/600', caption: 'New collection 👗✨ #fashion #ootd', filter: 'filter-reyes', location: 'Milan, Italie', likesCount: 2340, commentsCount: 0, createdAt: now - d },
            { id: 'post_7', userId: 'user_6', username: 'lucas.music', userAvatar: 'https://i.pravatar.cc/150?img=11', imageUrl: 'https://picsum.photos/seed/music1/600/600', caption: 'Studio session 🎵 Stay tuned! #music', filter: 'filter-moon', location: 'Home Studio', likesCount: 178, commentsCount: 0, createdAt: now - 1.5 * d },
            { id: 'post_8', userId: 'user_2', username: 'marc.travel', userAvatar: 'https://i.pravatar.cc/150?img=3', imageUrl: 'https://picsum.photos/seed/travel2/600/600', caption: 'Fjords de Norvège 🏔️ #norway #nature', filter: 'filter-hudson', location: 'Norvège', likesCount: 3456, commentsCount: 0, createdAt: now - 2 * d },
        ];
        const comments = [
            { id: 'com_1', postId: 'post_1', userId: 'user_1', username: 'sophie.lens', userAvatar: 'https://i.pravatar.cc/150?img=1', text: 'Magnifique! 😍', createdAt: now - 1.5 * h },
            { id: 'com_2', postId: 'post_1', userId: 'user_5', username: 'emma.art', userAvatar: 'https://i.pravatar.cc/150?img=9', text: 'Couleurs incroyables 🌅', createdAt: now - h },
            { id: 'com_3', postId: 'post_2', userId: 'user_7', username: 'chloe.style', userAvatar: 'https://i.pravatar.cc/150?img=16', text: 'Ça donne faim 🤤', createdAt: now - 3 * h },
            { id: 'com_4', postId: 'post_3', userId: 'user_2', username: 'marc.travel', userAvatar: 'https://i.pravatar.cc/150?img=3', text: 'La plus belle ville ❤️', createdAt: now - 5 * h },
            { id: 'com_5', postId: 'post_4', userId: 'user_3', username: 'lea.foodie', userAvatar: 'https://i.pravatar.cc/150?img=5', text: 'Bravo 💪🔥', createdAt: now - 7 * h },
        ];
        const stories = [
            { id: 'story_1', userId: 'user_1', username: 'sophie.lens', userAvatar: 'https://i.pravatar.cc/150?img=1', imageUrl: 'https://picsum.photos/seed/story1/400/700', text: '', createdAt: now - 2 * h, expiresAt: now + 22 * h },
            { id: 'story_2', userId: 'user_2', username: 'marc.travel', userAvatar: 'https://i.pravatar.cc/150?img=3', imageUrl: 'https://picsum.photos/seed/story2/400/700', text: 'On the road 🚗', createdAt: now - 4 * h, expiresAt: now + 20 * h },
            { id: 'story_3', userId: 'user_3', username: 'lea.foodie', userAvatar: 'https://i.pravatar.cc/150?img=5', imageUrl: 'https://picsum.photos/seed/story3/400/700', text: 'Recette du jour!', createdAt: now - h, expiresAt: now + 23 * h },
            { id: 'story_4', userId: 'user_5', username: 'emma.art', userAvatar: 'https://i.pravatar.cc/150?img=9', imageUrl: 'https://picsum.photos/seed/story4/400/700', text: 'Work in progress 🎨', createdAt: now - 6 * h, expiresAt: now + 18 * h },
            { id: 'story_5', userId: 'user_7', username: 'chloe.style', userAvatar: 'https://i.pravatar.cc/150?img=16', imageUrl: 'https://picsum.photos/seed/story5/400/700', text: '', createdAt: now - 3 * h, expiresAt: now + 21 * h },
        ];
        const follows = [
            { id: 'f1', followerId: 'demo_user', followingId: 'user_1', createdAt: now - 30 * d }, { id: 'f2', followerId: 'demo_user', followingId: 'user_2', createdAt: now - 25 * d },
            { id: 'f3', followerId: 'demo_user', followingId: 'user_3', createdAt: now - 20 * d }, { id: 'f4', followerId: 'demo_user', followingId: 'user_4', createdAt: now - 15 * d },
            { id: 'f5', followerId: 'demo_user', followingId: 'user_5', createdAt: now - 10 * d }, { id: 'f6', followerId: 'user_1', followingId: 'demo_user', createdAt: now - 28 * d },
            { id: 'f7', followerId: 'user_3', followingId: 'demo_user', createdAt: now - 18 * d }, { id: 'f8', followerId: 'user_5', followingId: 'demo_user', createdAt: now - 8 * d },
        ];
        const likes = [{ id: 'l1', postId: 'post_1', userId: 'demo_user', createdAt: now - h }, { id: 'l2', postId: 'post_3', userId: 'demo_user', createdAt: now - 5 * h }];
        const bookmarks = [{ id: 'b1', postId: 'post_3', userId: 'demo_user', createdAt: now - 5 * h }];
        const conversations = [
            { id: 'conv_1', participants: ['demo_user', 'user_1'], lastMessage: 'On se voit bientôt? 😊', lastMessageAt: now - 30 * 60000, unreadCount: { demo_user: 1, user_1: 0 } },
            { id: 'conv_2', participants: ['demo_user', 'user_3'], lastMessage: 'Merci pour la recette! 🍳', lastMessageAt: now - 2 * h, unreadCount: { demo_user: 0, user_3: 0 } },
        ];
        const messages = [
            { id: 'msg_1', conversationId: 'conv_1', senderId: 'demo_user', text: 'Salut Sophie! J\'adore tes photos!', createdAt: now - 2 * h },
            { id: 'msg_2', conversationId: 'conv_1', senderId: 'user_1', text: 'Merci beaucoup! 😊', createdAt: now - 1.5 * h },
            { id: 'msg_3', conversationId: 'conv_1', senderId: 'user_1', text: 'On se voit bientôt? 😊', createdAt: now - 30 * 60000 },
            { id: 'msg_4', conversationId: 'conv_2', senderId: 'user_3', text: 'Tu as essayé ma recette?', createdAt: now - 3 * h },
            { id: 'msg_5', conversationId: 'conv_2', senderId: 'demo_user', text: 'Merci pour la recette! 🍳', createdAt: now - 2 * h },
        ];
        const notifications = [
            { id: 'notif_1', userId: 'demo_user', fromUserId: 'user_1', fromUsername: 'sophie.lens', fromAvatar: 'https://i.pravatar.cc/150?img=1', type: 'like', postId: 'post_1', postImage: 'https://picsum.photos/seed/travel1/100/100', read: false, createdAt: now - 30 * 60000 },
            { id: 'notif_2', userId: 'demo_user', fromUserId: 'user_5', fromUsername: 'emma.art', fromAvatar: 'https://i.pravatar.cc/150?img=9', type: 'follow', read: false, createdAt: now - 2 * h },
            { id: 'notif_3', userId: 'demo_user', fromUserId: 'user_3', fromUsername: 'lea.foodie', fromAvatar: 'https://i.pravatar.cc/150?img=5', type: 'comment', postId: 'post_3', postImage: 'https://picsum.photos/seed/paris1/100/100', read: true, createdAt: now - 6 * h },
        ];
        return { users: [...users, demoUser], posts, comments, stories, follows, likes, bookmarks, conversations, messages, notifications };
    }
};

InstaVibe.DEMO_MODE = DEMO_MODE;
InstaVibe.DemoStore = DemoStore;
InstaVibe.db = db;
InstaVibe.auth = auth;
InstaVibe.storage = storage;
