import React, { useState, useEffect, useRef } from 'react';
import { Camera, MessageCircle, Trophy, Flame, Wind, User, Send, X, PlusCircle, LogOut, Globe, AlertCircle, Settings, Edit2, Image as ImageIcon, Trash2, AlertTriangle, Users, Search, Crown, ArrowRight, DoorOpen, UserPlus, UserMinus, ShoppingBag, Check, Lock, Skull, Clock, Banknote, MapPin, Medal } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAu4CdKcPyB3Cp-EOgH_IXC_Iunip9L3wo",
  authDomain: "cigarats.firebaseapp.com",
  projectId: "cigarats",
  storageBucket: "cigarats.firebasestorage.app",
  messagingSenderId: "15257458742",
  appId: "1:15257458742:web:cb7e0b55f5a705fdcde097",
  measurementId: "G-JV5BZJ84F7"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Coleções
const USERS_COLLECTION = 'users';
const POSTS_COLLECTION = 'posts';
const GROUPS_COLLECTION = 'groups';

// --- CATALOGO DA TABACARIA ---
const SHOP_ITEMS = [
  { id: 'frame_neon', type: 'frame', name: 'Vibe Radioativa', price: 50, cssClass: 'ring-4 ring-green-400 shadow-[0_0_10px_#4ade80]', desc: 'Brilha no escuro (mentira).' },
  { id: 'frame_fire', type: 'frame', name: 'Em Chamas', price: 100, cssClass: 'ring-4 ring-orange-600 shadow-[0_0_15px_#ea580c]', desc: 'Literalmente pegando fogo.' },
  { id: 'frame_gold', type: 'frame', name: 'Rei do Camelo', price: 300, cssClass: 'ring-4 ring-yellow-400 border-yellow-200 shadow-xl', desc: 'Ostentação pura.' },
  { id: 'filter_noir', type: 'filter', name: 'Noir Depressivo', price: 75, cssClass: 'grayscale contrast-125', desc: 'Para momentos reflexivos.' },
  { id: 'filter_toxic', type: 'filter', name: 'Névoa Tóxica', price: 75, cssClass: 'sepia hue-rotate-90 saturate-200', desc: 'Parece que você fuma urânio.' },
  { id: 'title_sus', type: 'title', name: 'Futuro Cliente do SUS', price: 150, desc: 'Título honesto.' },
  { id: 'title_oms', type: 'title', name: 'Terror da OMS', price: 200, desc: 'Ameaça à saúde pública.' },
  { id: 'title_investor', type: 'title', name: 'Sócio da Souza Cruz', price: 500, desc: 'Você pagou o iate do dono.' },
];

// --- MEDALHAS (Sistema Automático) ---
const MEDALS = [
    { id: 'bronze', name: 'Pulmão de Bronze', threshold: 50, icon: '🥉', desc: '50 cigarros fumados.' },
    { id: 'silver', name: 'Pulmão de Prata', threshold: 200, icon: '🥈', desc: '200 cigarros. Haja fôlego.' },
    { id: 'gold', name: 'Pulmão de Ouro', threshold: 500, icon: '🥇', desc: '500 cigarros. Lenda urbana.' },
    { id: 'diamond', name: 'Chaminé Industrial', threshold: 1000, icon: '💎', desc: '1000 cigarros. Como você tá vivo?' },
];

// --- UTILITÁRIOS ---

const getLevel = (xp) => {
  if (xp < 50) return { title: "Fumante de Fim de Semana", color: "text-gray-400" };
  if (xp < 150) return { title: "Pulmão de Aço", color: "text-green-400" };
  if (xp < 300) return { title: "Chaminé Humana", color: "text-yellow-400" };
  if (xp < 600) return { title: "Dragão Urbano", color: "text-orange-500" };
  return { title: "Lorde da Nicotina", color: "text-red-600 font-bold" };
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CigarBot",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smoke",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Captain",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Witch",
];

const BitucaIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17,2H7C5.9,2,5,2.9,5,4v16c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V4C19,2.9,18.1,2,17,2z M7,16h10v4H7V16z M7,14V4h10v10H7z" fillOpacity="0.3" />
    <path d="M16 5H8v2h8V5zM16 9H8v2h8V9z" />
    <circle cx="9" cy="18" r="1" className="text-orange-500" fill="currentColor" />
    <circle cx="12" cy="19" r="1" className="text-orange-500" fill="currentColor" />
    <path d="M18 20l2 2m-2-2l2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400 opacity-50" />
  </svg>
);

// --- COMPONENTES ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('loading'); 
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewProfileUid, setViewProfileUid] = useState(null); // ID do perfil sendo visitado
  const [loading, setLoading] = useState(true);

  // Inicialização de Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({
            ...data,
            balance: data.balance || 0,
            inventory: data.inventory || [],
            equipped: data.equipped || {}
          });
          setView('feed');
        } else {
          if (!currentUser.isAnonymous) {
             await handleCreateGoogleProfile(currentUser);
          } else {
             setView('login');
          }
        }
      } else {
        setView('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listeners
  useEffect(() => {
    if (!user) return;
    const qPosts = query(collection(db, POSTS_COLLECTION), orderBy('timestamp', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const qUsers = query(collection(db, USERS_COLLECTION));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      const uMap = {};
      usersData.forEach(u => uMap[u.uid] = u);
      setUsersMap(uMap);
      usersData.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      setUsersList(usersData);
      const myProfile = usersData.find(u => u.uid === user.uid);
      if (myProfile) {
          setUserProfile(prev => ({
              ...prev,
              ...myProfile,
              balance: myProfile.balance || 0,
              inventory: myProfile.inventory || [],
              equipped: myProfile.equipped || {}
          }));
      }
    });
    const qGroups = query(collection(db, GROUPS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubPosts(); unsubUsers(); unsubGroups(); };
  }, [user]);

  // --- AÇÕES ---
  const handleCreateGoogleProfile = async (googleUser) => {
    try {
      const userData = {
        uid: googleUser.uid,
        name: googleUser.displayName || "Fumante Misterioso",
        xp: 0,
        cigarettes: 0,
        balance: 50,
        friends: [],
        inventory: [],
        equipped: {},
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.uid}`,
        joinedAt: serverTimestamp(),
        authMethod: 'google'
      };
      await setDoc(doc(db, USERS_COLLECTION, googleUser.uid), userData);
      setUserProfile(userData);
      setView('feed');
    } catch (e) { console.error(e); }
  };

  const handleCreateGuestProfile = async (nickname) => {
    if (!nickname.trim()) return;
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userData = {
        uid: currentUser.uid,
        name: nickname,
        xp: 0,
        cigarettes: 0,
        balance: 50,
        friends: [],
        inventory: [],
        equipped: {},
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}&backgroundColor=b6e3f4`,
        joinedAt: serverTimestamp(),
        authMethod: 'anonymous'
      };
      await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), userData);
      setUserProfile(userData);
      setView('feed');
    } catch (e) { alert("Erro ao criar perfil."); }
  };

  const handleBuyItem = async (item) => {
    if (userProfile.balance < item.price) { alert("Bitucas insuficientes!"); return; }
    if (userProfile.inventory?.includes(item.id)) return;
    try {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        await updateDoc(userRef, { balance: increment(-item.price), inventory: arrayUnion(item.id) });
        alert(`Você comprou: ${item.name}!`);
    } catch (e) { console.error(e); }
  };

  const handleEquipItem = async (item) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        await updateDoc(userRef, { [`equipped.${item.type}`]: item.id });
    } catch (e) { console.error(e); }
  };

  const handleUnequipItem = async (type) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        await updateDoc(userRef, { [`equipped.${type}`]: null });
    } catch (e) { console.error(e); }
  };

  const handleFollowUser = async (targetUid) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        await updateDoc(userRef, { friends: arrayUnion(targetUid) });
    } catch (e) { console.error(e); }
  };

  const handleUnfollowUser = async (targetUid) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        await updateDoc(userRef, { friends: arrayRemove(targetUid) });
    } catch (e) { console.error(e); }
  };

  const handleCreateGroup = async (groupName, groupDesc) => {
    if (!groupName.trim()) return;
    try {
      const newGroup = { name: groupName, description: groupDesc || "Sem descrição", adminUid: user.uid, adminName: userProfile.name, members: [user.uid], createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, GROUPS_COLLECTION), newGroup);
      setSelectedGroup({ id: docRef.id, ...newGroup });
      setView('group_detail');
    } catch (e) { alert("Erro ao criar grupo."); }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, { members: arrayUnion(user.uid) });
      if (selectedGroup && selectedGroup.id === groupId) { setSelectedGroup(prev => ({...prev, members: [...prev.members, user.uid]})); }
    } catch (e) { console.error(e); }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm("Sair do grupo?")) return;
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, { members: arrayRemove(user.uid) });
      setView('community');
    } catch (e) { console.error(e); }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Excluir grupo?")) return;
    try { await deleteDoc(doc(db, GROUPS_COLLECTION, groupId)); setView('community'); } catch (e) { console.error(e); }
  };

  const handleKickMember = async (groupId, memberUid) => {
    if (!window.confirm("Remover usuário?")) return;
    try {
        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        await updateDoc(groupRef, { members: arrayRemove(memberUid) });
        if (selectedGroup) { setSelectedGroup(prev => ({...prev, members: prev.members.filter(m => m !== memberUid)})); }
    } catch (e) { console.error(e); }
  };

  const handleGoogleLogin = async () => { try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); } catch (error) { alert("Erro Google."); } };
  const handleGuestLogin = async (nickname) => { try { await signInAnonymously(auth); await handleCreateGuestProfile(nickname); } catch (error) { console.error(error); } };
  const handleLogout = async () => { await signOut(auth); setUserProfile(null); setPosts([]); setView('login'); };
  
  const handleDeleteAccount = async () => {
    if (!window.confirm("TEM CERTEZA?")) return;
    try { setLoading(true); await deleteDoc(doc(db, USERS_COLLECTION, user.uid)); await deleteUser(auth.currentUser); } catch (error) { alert("Erro. Saia e entre novamente."); setLoading(false); }
  };

  const handlePost = async (imageData, caption) => {
    if (!imageData) return;
    try {
      await addDoc(collection(db, POSTS_COLLECTION), { uid: user.uid, image: imageData, caption: caption, timestamp: serverTimestamp(), likes: [], comments: [] });
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { cigarettes: increment(1), xp: increment(10), balance: increment(10) });
      setView('feed');
    } catch (e) { console.error(e); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Apagar post? -10 XP/Bitucas.")) return;
    try {
        await deleteDoc(doc(db, POSTS_COLLECTION, postId));
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        await updateDoc(userRef, { cigarettes: increment(-1), xp: increment(-10), balance: increment(-10) });
    } catch (e) { console.error(e); }
  };

  const handleUpdateProfile = async (newName, newAvatar) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { name: newName, avatar: newAvatar });
      setUserProfile(prev => ({ ...prev, name: newName, avatar: newAvatar }));
      setView('feed');
    } catch (e) { alert("Erro ao salvar."); }
  };

  const handleLike = async (postId, currentLikes) => {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const isLiked = currentLikes.includes(user.uid);
    if (isLiked) { await updateDoc(postRef, { likes: currentLikes.filter(id => id !== user.uid) }); } else { await updateDoc(postRef, { likes: arrayUnion(user.uid) }); const userRef = doc(db, USERS_COLLECTION, user.uid); await updateDoc(userRef, { balance: increment(1) }); }
  };

  const handleComment = async (postId, text) => {
    if (!text.trim()) return;
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const newComment = { authorUid: user.uid, text: text, timestamp: Date.now() };
    await updateDoc(postRef, { comments: arrayUnion(newComment) });
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, { balance: increment(2) });
  };

  // Navegar para perfil de outro usuário
  const navigateToProfile = (uid) => {
      setViewProfileUid(uid);
      setView('profile_view');
  };

  if (loading) return <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white font-bold animate-pulse">Carregando cigaRats...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex justify-center">
      {view === 'login' && <div className="w-full max-w-md"><LoginScreen onGoogle={handleGoogleLogin} onGuest={handleGuestLogin} /></div>}

      {view !== 'login' && (
        <div className="flex w-full max-w-6xl gap-6">
          <aside className="fixed bottom-0 left-0 w-full z-20 bg-slate-900 border-t border-slate-800 md:static md:w-64 md:h-screen md:bg-transparent md:border-r md:border-t-0 md:flex md:flex-col md:p-4">
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-500 w-8 h-8" />
                <h1 className="text-2xl font-black italic bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">cigaRats</h1>
              </div>
              {userProfile && (
                <div onClick={() => navigateToProfile(user.uid)} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3 mb-2 relative">
                    <div className="relative"><img src={userProfile.avatar} className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${userProfile.equipped?.frame ? SHOP_ITEMS.find(i => i.id === userProfile.equipped.frame)?.cssClass : ''}`} /></div>
                    <div>
                      <p className="font-bold text-sm truncate w-32">{userProfile.name}</p>
                      {userProfile.equipped?.title ? <p className="text-[10px] text-orange-400 font-bold uppercase">{SHOP_ITEMS.find(i => i.id === userProfile.equipped.title)?.name}</p> : <p className="text-xs text-slate-400">{getLevel(userProfile.xp).title}</p>}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-mono bg-slate-950 p-2 rounded items-center"><span className="text-purple-400">{userProfile.xp} XP</span><span className="text-yellow-400 flex items-center gap-1 font-bold"><BitucaIcon className="w-3 h-3" /> {userProfile.balance}</span></div>
                </div>
              )}
            </div>
            <nav className="flex justify-around items-center h-16 md:h-auto md:flex-col md:items-start md:space-y-4 md:flex-1">
              <NavButton icon={Wind} label="Feed" active={view === 'feed'} onClick={() => setView('feed')} />
              <NavButton icon={Users} label="Comunidade" active={view === 'community' || view === 'group_detail'} onClick={() => setView('community')} />
              <NavButton icon={ShoppingBag} label="Tabacaria" active={view === 'shop'} onClick={() => setView('shop')} />
              <NavButton icon={Trophy} label="Ranking" active={view === 'ranking'} onClick={() => setView('ranking')} />
              <NavButton icon={User} label="Perfil" active={view === 'profile_view' && viewProfileUid === user.uid} onClick={() => navigateToProfile(user.uid)} />
              <NavButton icon={Settings} label="Ajustes" active={view === 'settings'} onClick={() => setView('settings')} />
              <div className="md:hidden relative -top-6"><button onClick={() => setView('upload')} className="bg-orange-600 hover:bg-orange-500 text-white rounded-full p-4 shadow-lg active:scale-95 border-4 border-slate-950"><PlusCircle className="w-8 h-8" /></button></div>
              <button onClick={() => setView('upload')} className="hidden md:flex w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg"><PlusCircle className="w-5 h-5" /> Fumar</button>
              <button onClick={handleLogout} className="hidden md:flex items-center gap-3 text-slate-500 hover:text-red-500 px-3 py-2 transition-colors mt-auto"><LogOut className="w-6 h-6" /> <span className="font-bold">Sair</span></button>
            </nav>
          </aside>

          <main className="flex-1 w-full max-w-xl mx-auto pb-24 md:pb-0 md:pt-4 min-h-screen md:border-r md:border-slate-800/50 pr-0 md:pr-6 pl-0 md:pl-0">
            <header className="md:hidden bg-slate-900/90 backdrop-blur-md p-4 sticky top-0 z-10 border-b border-slate-800 flex justify-between items-center mb-4">
              <div className="flex items-center gap-2"><Flame className="text-orange-500 w-6 h-6" /><h1 className="text-xl font-black italic bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">cigaRats</h1></div>
              {userProfile && <div className="flex items-center gap-3"><span className="text-xs font-bold text-yellow-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full border border-slate-700"><BitucaIcon className="w-3 h-3" /> {userProfile.balance}</span></div>}
            </header>

            {view === 'feed' && <Feed posts={posts} usersMap={usersMap} userProfile={userProfile} currentUserUid={user?.uid} onLike={handleLike} onComment={handleComment} onDelete={handleDeletePost} onNavigateProfile={navigateToProfile} />}
            {view === 'ranking' && <Ranking users={usersList} title="RANKING GLOBAL" subtitle="Quem vai precisar de um pulmão novo?" currentUserUid={user?.uid} onNavigateProfile={navigateToProfile} />}
            {view === 'community' && <CommunityScreen users={usersList} groups={groups} userProfile={userProfile} currentUserUid={user?.uid} onCreateGroup={handleCreateGroup} onSelectGroup={(g) => { setSelectedGroup(g); setView('group_detail'); }} onFollow={handleFollowUser} onUnfollow={handleUnfollowUser} onNavigateProfile={navigateToProfile} />}
            {view === 'group_detail' && <GroupDetails group={selectedGroup} usersMap={usersMap} currentUserUid={user?.uid} onJoin={handleJoinGroup} onLeave={handleLeaveGroup} onDelete={handleDeleteGroup} onKick={handleKickMember} onBack={() => setView('community')} onNavigateProfile={navigateToProfile} />}
            {view === 'shop' && <TabacariaScreen userProfile={userProfile} onBuy={handleBuyItem} onEquip={handleEquipItem} onUnequip={handleUnequipItem} />}
            {view === 'settings' && <SettingsScreen profile={userProfile} onUpdate={handleUpdateProfile} onDeleteAccount={handleDeleteAccount} />}
            {view === 'upload' && <UploadScreen onPost={handlePost} onCancel={() => setView('feed')} userProfile={userProfile} />}
            
            {/* NOVO: TELA DE PERFIL PÚBLICO */}
            {view === 'profile_view' && (
                <UserProfileScreen 
                    uid={viewProfileUid} 
                    usersMap={usersMap} 
                    currentUserUid={user.uid} 
                    onFollow={handleFollowUser} 
                    onUnfollow={handleUnfollowUser}
                    isFollowing={userProfile?.friends?.includes(viewProfileUid)}
                    onBack={() => setView('feed')}
                />
            )}
          </main>

          <aside className="hidden lg:block w-80 p-4 pt-8 sticky top-0 h-screen overflow-hidden">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <h3 className="font-black text-slate-400 mb-4 text-sm uppercase tracking-wider">Top Fumantes</h3>
              <div className="space-y-3">
                {usersList.slice(0, 5).map((u, i) => (
                   <div key={u.uid} onClick={() => navigateToProfile(u.uid)} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-800 p-1 rounded transition-colors">
                      <span className={`font-bold w-4 ${i===0?'text-yellow-400':'text-slate-500'}`}>{i+1}</span>
                      <div className="relative"><img src={u.avatar} className={`w-6 h-6 rounded-full bg-slate-800 ${u.equipped?.frame ? SHOP_ITEMS.find(it => it.id === u.equipped.frame)?.cssClass : ''}`} /></div>
                      <span className="truncate flex-1 text-slate-300">{u.name}</span>
                      <span className="text-orange-500 font-mono text-xs">{u.cigarettes}</span>
                   </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
// --- NOVA TELA: PERFIL PÚBLICO (Com Obituário e Medalhas) ---
function UserProfileScreen({ uid, usersMap, currentUserUid, onFollow, onUnfollow, isFollowing, onBack }) {
    const profile = usersMap[uid];
    if (!profile) return <div className="p-8 text-center text-slate-500">Usuário não encontrado (ou parou de fumar).</div>;

    const level = getLevel(profile.xp || 0);
    const joinDate = profile.joinedAt ? new Date(profile.joinedAt.seconds * 1000).toLocaleDateString() : '???';
    const activeFrame = profile.equipped?.frame ? SHOP_ITEMS.find(i => i.id === profile.equipped.frame)?.cssClass : '';
    
    // Cálculos do Obituário (Estatísticas)
    const cigs = profile.cigarettes || 0;
    const moneyWasted = (cigs * 1.00).toFixed(2); // Média R$ 1,00 por cigarro
    const lifeLostMinutes = cigs * 11; // 11 min por cigarro
    const lifeLostHours = (lifeLostMinutes / 60).toFixed(1);
    const metersSmoked = ((cigs * 8) / 100).toFixed(1); // 8cm por cigarro -> metros

    // Medalhas Conquistadas
    const earnedMedals = MEDALS.filter(m => cigs >= m.threshold);

    return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white mb-2 text-sm font-bold"><ArrowRight className="rotate-180 w-4 h-4" /> Voltar</button>

            {/* Cabeçalho do Perfil */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-orange-900/20 to-transparent"></div>
                <div className="relative inline-block mb-3">
                    <img src={profile.avatar} className={`w-24 h-24 rounded-full bg-slate-800 object-cover border-4 border-slate-950 ${activeFrame}`} />
                </div>
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                    {profile.name}
                    {profile.uid === currentUserUid && <span className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400 font-normal">Você</span>}
                </h2>
                {profile.equipped?.title ? (
                    <p className="text-orange-500 font-black uppercase text-sm mt-1">{SHOP_ITEMS.find(i => i.id === profile.equipped.title)?.name}</p>
                ) : (
                    <p className={`text-sm font-bold ${level.color}`}>{level.title}</p>
                )}
                
                <p className="text-slate-500 text-xs mt-2">Fumante desde {joinDate}</p>

                <div className="flex justify-center gap-4 mt-6">
                    <div className="text-center">
                        <p className="text-2xl font-black text-white">{profile.cigarettes}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold">Cigarros</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-purple-400">{profile.xp}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold">XP</p>
                    </div>
                </div>

                {profile.uid !== currentUserUid && (
                    <div className="mt-6">
                        {isFollowing ? (
                            <button onClick={() => onUnfollow(uid)} className="bg-slate-800 text-slate-400 hover:text-red-500 px-6 py-2 rounded-full font-bold text-sm transition-colors border border-slate-700">Deixar de Seguir</button>
                        ) : (
                            <button onClick={() => onFollow(uid)} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-transform active:scale-95">Seguir</button>
                        )}
                    </div>
                )}
            </div>

            {/* OBITUÁRIO */}
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-900 shadow-inner">
                <h3 className="text-lg font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest"><Skull className="w-5 h-5" /> Obituário</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                        <div className="bg-green-900/20 p-3 rounded-full text-green-500"><Banknote className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Fortuna Queimada</p>
                            <p className="text-lg font-mono text-green-400">R$ {moneyWasted}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                        <div className="bg-red-900/20 p-3 rounded-full text-red-500"><Clock className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Vida Perdida</p>
                            <p className="text-lg font-mono text-red-400">{lifeLostHours} horas</p>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                        <div className="bg-blue-900/20 p-3 rounded-full text-blue-500"><MapPin className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Torre de Babel</p>
                            <p className="text-lg font-mono text-blue-400">{metersSmoked} metros</p>
                        </div>
                    </div>
                </div>
                <p className="text-center text-[10px] text-slate-600 mt-4 italic">* Estatísticas baseadas em ciência de boteco.</p>
            </div>

            {/* SALA DE TROFÉUS */}
            <div>
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Medal className="w-5 h-5 text-yellow-500" /> SALA DE TROFÉUS</h3>
                <div className="grid grid-cols-2 gap-3">
                    {MEDALS.map(medal => {
                        const hasEarned = earnedMedals.find(m => m.id === medal.id);
                        return (
                            <div key={medal.id} className={`p-3 rounded-xl border flex items-center gap-3 ${hasEarned ? 'bg-slate-900 border-yellow-900/50' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}>
                                <div className="text-2xl">{medal.icon}</div>
                                <div>
                                    <p className={`text-sm font-bold ${hasEarned ? 'text-white' : 'text-slate-500'}`}>{medal.name}</p>
                                    <p className="text-[10px] text-slate-500">{medal.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ... Mantendo TabacariaScreen e outras telas, apenas ajustando links ...

function TabacariaScreen({ userProfile, onBuy, onEquip, onUnequip }) {
    const inventory = userProfile.inventory || [];
    const equipped = userProfile.equipped || {};
    return (
        <div className="p-4 animate-in fade-in">
            <div className="mb-6 flex justify-between items-end">
                <div><h2 className="text-2xl font-black italic mb-1 text-white flex items-center gap-2"><ShoppingBag className="w-6 h-6" /> TABACARIA</h2><p className="text-slate-400 text-sm">Gaste suas bitucas com sabedoria.</p></div>
                <div className="text-right"><span className="text-xs text-slate-500 uppercase font-bold">Saldo</span><div className="text-2xl font-black text-yellow-400 flex items-center justify-end gap-1"><BitucaIcon className="w-6 h-6" /> {userProfile.balance}</div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SHOP_ITEMS.map(item => {
                    const isOwned = inventory.includes(item.id); const isEquipped = equipped[item.type] === item.id;
                    return (
                        <div key={item.id} className={`bg-slate-900 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${isOwned ? 'border-slate-700' : 'border-slate-800 opacity-90'}`}>
                            {isEquipped && <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">EQUIPADO</div>}
                            <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-white">{item.name}</h3><span className="text-xs font-bold uppercase bg-slate-950 px-2 py-1 rounded text-slate-400">{item.type}</span></div>
                            <p className="text-xs text-slate-500 mb-4 h-8">{item.desc}</p>
                            <div className="flex justify-center mb-4 h-16 items-center">
                                {item.type === 'frame' && <div className={`w-12 h-12 rounded-full bg-slate-700 ${item.cssClass}`}></div>}
                                {item.type === 'filter' && <div className={`w-12 h-12 rounded-lg bg-cover bg-center ${item.cssClass}`} style={{backgroundImage: `url(${userProfile.avatar})`}}></div>}
                                {item.type === 'title' && <span className="text-orange-400 font-bold uppercase text-xs">{item.name}</span>}
                            </div>
                            {isOwned ? (isEquipped ? <button onClick={() => onUnequip(item.type)} className="w-full py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-500 font-bold text-sm">Desequipar</button> : <button onClick={() => onEquip(item)} className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm">Equipar</button>) : (<button onClick={() => onBuy(item)} disabled={userProfile.balance < item.price} className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${userProfile.balance < item.price ? 'bg-slate-800 text-slate-600' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>{userProfile.balance < item.price ? <Lock className="w-3 h-3" /> : <BitucaIcon className="w-3 h-3" />}{item.price}</button>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CommunityScreen({ users, groups, userProfile, currentUserUid, onCreateGroup, onSelectGroup, onFollow, onUnfollow, onNavigateProfile }) {
  const [tab, setTab] = useState('people'); const [searchTerm, setSearchTerm] = useState(''); const [isCreating, setIsCreating] = useState(false); const [newGroupName, setNewGroupName] = useState('');
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())); const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())); const myFriends = userProfile?.friends || [];
  return (
    <div className="p-4 animate-in fade-in">
      <div className="mb-6"><h2 className="text-2xl font-black italic mb-4 text-white flex items-center gap-2"><Users className="w-6 h-6" /> COMUNIDADE</h2><div className="relative mb-4"><Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" /><input type="text" placeholder={tab==='groups'?"Buscar grupos...":"Buscar pessoas..."} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="flex gap-2"><button onClick={() => setTab('people')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${tab==='people'?'bg-orange-600 text-white':'bg-slate-900 text-slate-400'}`}>Pessoas</button><button onClick={() => setTab('groups')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${tab==='groups'?'bg-orange-600 text-white':'bg-slate-900 text-slate-400'}`}>Grupos</button></div></div>
      {tab === 'people' && <div className="space-y-3">{filteredUsers.map(u => { const isMe = u.uid === currentUserUid; const isFriend = myFriends.includes(u.uid); return (<div key={u.uid} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800"><div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateProfile(u.uid)}><div className="relative"><img src={u.avatar} className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${u.equipped?.frame ? SHOP_ITEMS.find(it => it.id === u.equipped.frame)?.cssClass : ''}`} /></div><div><p className="font-bold text-slate-200 flex items-center gap-2">{u.name}{isFriend && <span className="text-[10px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">Amigo</span>}</p>{u.equipped?.title && <p className="text-[10px] text-orange-400 font-bold uppercase">{SHOP_ITEMS.find(i => i.id === u.equipped.title)?.name}</p>}</div></div>{!isMe && (isFriend ? <button onClick={() => onUnfollow(u.uid)} className="p-2 text-slate-500 hover:text-red-500"><UserMinus className="w-5 h-5" /></button> : <button onClick={() => onFollow(u.uid)} className="p-2 text-orange-500 hover:text-white"><UserPlus className="w-5 h-5" /></button>)}</div>); })}</div>}
      {tab === 'groups' && <div className="space-y-4">{!isCreating ? <button onClick={() => setIsCreating(true)} className="w-full bg-slate-800 border-2 border-dashed border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"><PlusCircle className="w-5 h-5" /> Criar Novo Grupo</button> : <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-white mb-3">Novo Grupo</h3><input type="text" placeholder="Nome do Grupo" className="w-full bg-slate-950 p-2 rounded border border-slate-700 mb-2 text-white" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} maxLength={25} />
              <input type="text" placeholder="Descrição curta (opcional)" className="w-full bg-slate-950 p-2 rounded border border-slate-700 mb-3 text-white text-sm" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} maxLength={50} />
              <div className="flex gap-2"><button onClick={() => onCreateGroup(newGroupName, newGroupDesc)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded">Criar</button><button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded">Cancelar</button></div></div>}{filteredGroups.map(group => (<div key={group.id} onClick={() => onSelectGroup(group)} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all active:scale-[0.99] flex justify-between items-center"><div><h3 className="font-bold text-white">{group.name}</h3><p className="text-xs text-slate-400">{group.description}</p><p className="text-xs text-slate-500 mt-1">{group.members?.length || 0} membros</p></div><ArrowRight className="text-slate-600 w-5 h-5" /></div>))}</div>}
    </div>
  );
}

function GroupDetails({ group, usersMap, currentUserUid, onJoin, onLeave, onDelete, onKick, onBack, onNavigateProfile }) {
  const [activeTab, setActiveTab] = useState('ranking'); const members = group.members?.map(uid => usersMap[uid]).filter(Boolean) || []; const rankedMembers = [...members].sort((a, b) => (b.xp || 0) - (a.xp || 0)); const isMember = group.members?.includes(currentUserUid); const isAdmin = group.adminUid === currentUserUid;
  return (
    <div className="p-4 animate-in fade-in slide-in-from-right-4"><button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white mb-4 text-sm font-bold"><ArrowRight className="rotate-180 w-4 h-4" /> Voltar</button><div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6 text-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div><h2 className="text-2xl font-black text-white mb-1">{group.name}</h2><p className="text-slate-400 text-sm mb-4">{group.description}</p>{isMember ? <span className="bg-green-900/30 text-green-500 border border-green-900/50 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto"><Users className="w-3 h-3" /> Membro</span> : <button onClick={() => onJoin(group.id)} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 rounded-full shadow-lg">Entrar</button>}{isAdmin && <button onClick={() => onDelete(group.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>}</div>{isMember && <><div className="flex gap-2 mb-4 border-b border-slate-800 pb-2"><button onClick={() => setActiveTab('ranking')} className={`flex-1 pb-2 font-bold text-sm ${activeTab==='ranking' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500'}`}>Ranking</button><button onClick={() => setActiveTab('members')} className={`flex-1 pb-2 font-bold text-sm ${activeTab==='members' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500'}`}>Membros</button></div>{activeTab === 'ranking' ? <Ranking users={rankedMembers} title="" subtitle="" currentUserUid={currentUserUid} onNavigateProfile={onNavigateProfile} /> : <div className="space-y-2">{members.map(m => (<div key={m.uid} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800"><div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateProfile(m.uid)}><img src={m.avatar} className="w-8 h-8 rounded-full" /><span className={m.uid === currentUserUid ? "text-orange-400 font-bold" : "text-slate-200"}>{m.name}</span>{group.adminUid === m.uid && <Crown className="w-3 h-3 text-yellow-500" />}</div>{isAdmin && m.uid !== currentUserUid && <button onClick={() => onKick(group.id, m.uid)} className="text-xs text-red-500">Remover</button>}</div>))} <div className="pt-4 flex justify-center"><button onClick={() => onLeave(group.id)} className="text-red-500 text-sm font-bold flex items-center gap-2"><DoorOpen className="w-4 h-4" /> Sair</button></div></div>}</>}</div>
  );
}

function Feed({ posts, usersMap, userProfile, currentUserUid, onLike, onComment, onDelete, onNavigateProfile }) {
  const [feedMode, setFeedMode] = useState('global'); const filteredPosts = feedMode === 'global' ? posts : posts.filter(post => (userProfile?.friends || []).includes(post.uid) || post.uid === currentUserUid);
  return (
    <div className="flex flex-col h-full"><div className="flex border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm"><button onClick={() => setFeedMode('global')} className={`flex-1 py-3 text-sm font-bold ${feedMode==='global' ? 'text-white border-b-2 border-orange-500' : 'text-slate-500'}`}>Global</button><button onClick={() => setFeedMode('friends')} className={`flex-1 py-3 text-sm font-bold ${feedMode==='friends' ? 'text-white border-b-2 border-orange-500' : 'text-slate-500'}`}>Amigos</button></div><div className="flex flex-col gap-6 p-4">{filteredPosts.map(post => { const author = usersMap[post.uid] || { name: 'Parou de fumar', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PF&backgroundColor=gray' }; return <PostCard key={post.id} post={post} author={author} usersMap={usersMap} currentUserUid={currentUserUid} onLike={onLike} onComment={onComment} onDelete={onDelete} onNavigateProfile={onNavigateProfile} />; })}{filteredPosts.length === 0 && <div className="text-center text-slate-500 py-10">Nada aqui...</div>}</div></div>
  );
}

function PostCard({ post, author, usersMap, currentUserUid, onLike, onComment, onDelete, onNavigateProfile }) {
  const [commentText, setCommentText] = useState(''); const [showComments, setShowComments] = useState(false); const [showLikesModal, setShowLikesModal] = useState(false);
  const isLiked = post.likes?.includes(currentUserUid); const isMyPost = post.uid === currentUserUid;
  // NOVA FORMATAÇÃO DE DATA
  const dateObj = post.timestamp ? new Date(post.timestamp.seconds * 1000) : new Date();
  const dateStr = dateObj.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  const activeFrame = author.equipped?.frame ? SHOP_ITEMS.find(i => i.id === author.equipped.frame)?.cssClass : '';
  const activeFilter = author.equipped?.filter ? SHOP_ITEMS.find(i => i.id === author.equipped.filter)?.cssClass : '';

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative">
      {showLikesModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowLikesModal(false)}><div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="font-bold text-white">Quem Tossiu</h3><button onClick={() => setShowLikesModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div><div className="max-h-[60vh] overflow-y-auto p-2">{post.likes && post.likes.length > 0 ? (post.likes.map(uid => { const liker = usersMap[uid] || { name: 'Parou de fumar', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PF&backgroundColor=gray' }; return (<div key={uid} className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl cursor-pointer" onClick={() => {setShowLikesModal(false); onNavigateProfile(uid)}}><img src={liker.avatar} className="w-8 h-8 rounded-full bg-slate-700" /><span className="font-medium text-slate-200">{liker.name}</span></div>) })) : <p className="p-4 text-center text-slate-500">Ninguém curtiu ainda.</p>}</div></div></div>}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateProfile(author.uid || post.uid)}>
            <div className="relative"><img src={author.avatar} className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${activeFrame}`} /></div>
            <div><p className="font-bold text-sm text-slate-200 flex items-center gap-2">{author.name}{author.equipped?.title && <span className="text-[10px] text-orange-400 font-bold uppercase bg-slate-950 px-1 rounded">{SHOP_ITEMS.find(i => i.id === author.equipped.title)?.name}</span>}</p><p className="text-xs text-slate-500">{dateStr}</p></div>
        </div>
        {isMyPost && <button onClick={() => onDelete(post.id)} className="text-slate-600 hover:text-red-500 p-2 transition-colors"><Trash2 className="w-5 h-5" /></button>}
      </div>
      <div className={`relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] ${activeFilter}`}><img src={post.image} className="w-full h-auto max-h-[500px] object-contain" alt="post" /></div>
      <div className="p-3 pb-2">{post.caption && <p className="text-slate-300 text-sm mb-3 leading-relaxed"><span className="font-bold text-slate-100">{author.name}</span> {post.caption}</p>}</div>
      <div className="px-3 pb-3 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex gap-6"><div className="flex items-center gap-2"><button onClick={() => onLike(post.id, post.likes || [])} className={`transition-all active:scale-90 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}><Wind className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} strokeWidth={2} /></button><button onClick={() => setShowLikesModal(true)} className="text-sm font-bold text-slate-200 hover:underline cursor-pointer">{post.likes?.length || 0}</button></div><button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"><MessageCircle className="w-6 h-6" /> <span className="font-bold">{post.comments?.length || 0}</span></button></div>
      </div>
      {showComments && <div className="bg-slate-950/50 p-3 animate-in slide-in-from-top-2"><div className="max-h-40 overflow-y-auto space-y-3 mb-3 scrollbar-thin scrollbar-thumb-slate-700 pr-2">{post.comments?.map((c, i) => { const commenter = usersMap[c.authorUid] || { name: c.author || 'Parou de fumar' }; return (<div key={i} className="text-sm flex gap-2"><span className="font-bold text-slate-300 shrink-0 cursor-pointer hover:underline" onClick={() => onNavigateProfile(c.authorUid)}>{commenter.name}</span><span className="text-slate-400 break-words">{c.text}</span></div>); })}{(!post.comments || post.comments.length === 0) && <p className="text-xs text-slate-600 italic text-center py-2">Sem comentários... Solte a fumaça nos comentários.</p>}</div><div className="flex gap-2 items-center"><input type="text" placeholder="Comente algo..." className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 placeholder-slate-500" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { onComment(post.id, commentText); setCommentText(''); }}} /><button onClick={() => { onComment(post.id, commentText); setCommentText(''); }} className="text-orange-500 hover:text-orange-400 p-2 bg-slate-800 rounded-full"><Send className="w-4 h-4" /></button></div></div>}
    </div>
  );
}

function Ranking({ users, title, subtitle, currentUserUid, onNavigateProfile }) {
  return (
    <div className="p-4">
      {title && <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden"><Wind className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" /><h2 className="text-3xl font-black italic mb-1 tracking-tighter">{title}</h2><p className="text-orange-100 text-sm font-medium opacity-90">{subtitle}</p></div>}
      <div className="space-y-3">{users.map((user, index) => { const level = getLevel(user.xp || 0); const isMe = user.uid === currentUserUid; return (<div key={user.uid} onClick={() => onNavigateProfile(user.uid)} className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:bg-slate-800 ${isMe ? 'bg-slate-800 border-orange-500/50 shadow-md shadow-orange-900/10' : 'bg-slate-900 border-slate-800'}`}><div className={`w-8 h-8 flex items-center justify-center font-black text-lg ${index === 0 ? 'text-yellow-400 text-2xl drop-shadow-sm' : index === 1 ? 'text-slate-300 text-xl' : index === 2 ? 'text-amber-700 text-xl' : 'text-slate-600'}`}>{index <= 2 ? <Trophy className="w-5 h-5" /> : `#${index + 1}`}</div><img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-800 object-cover" alt="avatar" /><div className="flex-1"><p className={`font-bold ${isMe ? 'text-orange-400' : 'text-slate-200'}`}>{user.name} {isMe && <span className="text-[10px] ml-1 bg-slate-700 px-1.5 py-0.5 rounded text-white">Você</span>}</p><p className={`text-xs ${level.color}`}>{level.title}</p></div><div className="text-right"><p className="font-black text-white text-lg">{user.cigarettes || 0} <span className="text-xs font-normal text-slate-500">cigs</span></p><p className="text-xs text-slate-500 font-mono">{user.xp || 0} XP</p></div></div>); })}</div>
    </div>
  );
}

function UploadScreen({ onPost, onCancel, userProfile }) { /* Mantido igual */
  const [image, setImage] = useState(null); const [caption, setCaption] = useState(''); const fileInputRef = useRef(null);
  const handleFileChange = async (e) => { if (e.target.files[0]) setImage(await compressImage(e.target.files[0])); };
  const activeFilter = userProfile?.equipped?.filter ? SHOP_ITEMS.find(i => i.id === userProfile.equipped.filter)?.cssClass : '';
  return (<div className="fixed inset-0 bg-slate-950 z-50 flex flex-col"><div className="p-4 flex items-center justify-between bg-slate-900 border-b border-slate-800"><button onClick={onCancel} className="text-slate-400 p-2 hover:bg-slate-800 rounded-full"><X /></button><span className="font-bold text-white">Registrar Fumaça</span><button onClick={() => onPost(image, caption)} disabled={!image} className={`font-bold px-4 py-1.5 rounded-full transition-colors ${image ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Postar</button></div><div className="flex-1 flex flex-col p-4 gap-4">{!image ? <div onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-slate-900 transition-all group"><div className="bg-slate-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform group-hover:bg-slate-700"><Camera className="w-10 h-10 text-orange-500" /></div><p className="text-slate-300 font-bold text-lg">Tirar foto</p><p className="text-slate-500 text-sm mt-1">Registre o momento do câncer</p></div> : <div className={`flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 ${activeFilter}`}><img src={image} className="max-w-full max-h-full object-contain" /><button onClick={() => setImage(null)} className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-600/80 transition-colors"><X className="w-5 h-5" /></button></div>}<input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} /><div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 focus-within:border-orange-500 transition-colors"><input type="text" placeholder="Escreva uma legenda..." className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-lg" value={caption} onChange={e => setCaption(e.target.value)} /></div></div></div>);
}

function NavButton({ icon: Icon, label, active, onClick }) { return <button onClick={onClick} className={`flex md:flex-row flex-col items-center md:gap-3 gap-1 p-2 md:px-4 md:py-3 w-16 md:w-full transition-all duration-300 rounded-xl md:hover:bg-slate-800 ${active ? 'text-orange-500 md:bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}><Icon className={`w-6 h-6 md:w-5 md:h-5 ${active ? 'fill-current md:fill-none drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] md:drop-shadow-none' : ''}`} strokeWidth={active ? 2.5 : 2} /><span className={`text-[10px] md:text-sm font-bold transition-opacity ${active ? 'opacity-100' : 'opacity-0 md:opacity-100'} md:opacity-100`}>{label}</span></button>; }
function LoginScreen({ onGoogle, onGuest }) { const [mode, setMode] = useState('main'); const [name, setName] = useState(''); return (<div className="h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black"><div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full shadow-2xl text-center"><Flame className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h1 className="text-4xl font-black italic mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">cigaRats</h1><p className="text-slate-400 mb-8 text-sm">A rede social para quem queima um.</p>{mode === 'main' ? (<div className="space-y-3 w-full"><button onClick={onGoogle} className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg group"><Globe className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" /> Entrar com Google</button><div className="relative py-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">ou</span></div></div><button onClick={() => setMode('guest_form')} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm">Entrar como Convidado</button></div>) : (<div className="w-full animate-in fade-in slide-in-from-bottom-4"><input type="text" placeholder="Escolha seu vulgo..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white mb-4 focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-600 text-center font-bold" value={name} onChange={e => setName(e.target.value)} maxLength={15} autoFocus /><button onClick={() => onGuest(name)} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mb-3">Começar</button><button onClick={() => setMode('main')} className="text-slate-500 text-xs hover:text-white">Voltar</button></div>)}</div></div>); }
function SettingsScreen({ profile, onUpdate, onDeleteAccount }) { /* Mantido igual */ const [name, setName] = useState(profile.name); const [avatar, setAvatar] = useState(profile.avatar); const fileInputRef = useRef(null); const handleFileChange = async (e) => { if (e.target.files[0]) setAvatar(await compressImage(e.target.files[0])); }; return (<div className="p-4 space-y-6"><h2 className="text-2xl font-black italic text-white flex gap-2"><Settings /> CONFIGURAÇÕES</h2><div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6"><div className="flex justify-center"><img src={avatar} onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-4 border-slate-700" /><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} /></div><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 p-3 rounded text-white font-bold" /><button onClick={() => onUpdate(name, avatar)} className="w-full bg-green-600 text-white font-bold py-3 rounded">Salvar</button><button onClick={onDeleteAccount} className="w-full bg-red-950/50 text-red-500 border border-red-900/50 font-bold py-3 rounded flex justify-center gap-2"><Trash2 className="w-4 h-4" /> Excluir Conta</button></div></div>); }