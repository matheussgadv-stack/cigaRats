import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Wind, MessageCircle, Heart, Share2, User, 
  ShoppingBag, Trophy, Camera, X, Send, PlusCircle, 
  Users, Crown, DoorOpen, Trash2, ArrowRight, Settings,
  MapPin, Clock, Banknote, Skull, Medal, Lock, Search,
  UserPlus, UserMinus, Bell, BellOff, Zap, Coffee
} from 'lucide-react';

// --- CONSTANTES E DADOS DO JOGO ---

const LEVELS = [
  { min: 0, title: 'Pulmão Virgem', color: 'text-slate-400' },
  { min: 100, title: 'Tossidor Iniciante', color: 'text-green-400' },
  { min: 500, title: 'Chaminé Humana', color: 'text-yellow-400' },
  { min: 1000, title: 'Rei do Alcatrão', color: 'text-orange-500' },
  { min: 2000, title: 'Entidade de Fumaça', color: 'text-red-600' },
  { min: 5000, title: 'Vulto da Neblina', color: 'text-purple-500' }
];

const MEDALS = [
  { id: 'first_pack', name: 'Primeiro Maço', desc: 'Fumou 20 cigarros.', threshold: 20, icon: '📦' },
  { id: 'cancer_bronze', name: 'Tosse Seca', desc: 'Fumou 100 cigarros.', threshold: 100, icon: '🥉' },
  { id: 'cancer_silver', name: 'Pulmão Preto', desc: 'Fumou 500 cigarros.', threshold: 500, icon: '🥈' },
  { id: 'cancer_gold', name: 'Chaminé', desc: 'Fumou 1.000 cigarros.', threshold: 1000, icon: '🥇' },
  { id: 'legend', name: 'Lenda do Câncer', desc: 'Fumou 5.000 cigarros.', threshold: 5000, icon: '👑' }
];

const SHOP_ITEMS = [
  { id: 'frame_neon', type: 'frame', name: 'Moldura Neon', desc: 'Brilha no escuro.', price: 50, cssClass: 'border-2 border-green-400 shadow-[0_0_10px_green]' },
  { id: 'frame_fire', type: 'frame', name: 'Moldura de Fogo', desc: 'Pegando fogo bicho.', price: 150, cssClass: 'border-2 border-red-500 shadow-[0_0_10px_red]' },
  { id: 'title_boss', type: 'title', name: 'O Chefão', desc: 'Título exclusivo.', price: 300, cssClass: '' },
  { id: 'filter_bw', type: 'filter', name: 'Noir', desc: 'Filtro Preto e Branco.', price: 100, cssClass: 'grayscale' },
  { id: 'filter_sepia', type: 'filter', name: 'Velho Oeste', desc: 'Filtro Sépia.', price: 100, cssClass: 'sepia' },
];

// NOVOS ITENS E CONSUMÍVEIS (VERSÃO 5)
const CONSUMABLES = [
    { id: 'boost_coffee', type: 'consumable', name: 'Café Preto', desc: 'Aumenta ganho de XP em 1.5x por 30 min.', price: 50, duration: 1800, multiplier: 1.5, icon: '☕' },
    { id: 'boost_energy', type: 'consumable', name: 'Energético Duvidoso', desc: 'Aumenta ganho de XP em 2x por 1 hora.', price: 120, duration: 3600, multiplier: 2.0, icon: '⚡' },
    { id: 'boost_vape', type: 'consumable', name: 'Vape de Guaraná', desc: 'Aumenta XP em 3x por 2h (Cuidado!).', price: 300, duration: 7200, multiplier: 3.0, icon: '💨' }
];

const PREMIUM_SKINS = [
    { id: 'skin_cyber', type: 'frame', name: 'Cyberpunk', desc: 'Futurista.', price: 1000, cssClass: 'border-4 border-cyan-400 shadow-[0_0_15px_cyan]' },
    { id: 'skin_gold', type: 'frame', name: 'Ouro Puro', desc: 'Ostentação.', price: 5000, cssClass: 'border-4 border-yellow-400 shadow-[0_0_15px_gold]' },
    { id: 'filter_glitch', type: 'filter', name: 'Glitch', desc: 'Visual bugado.', price: 800, cssClass: 'grayscale contrast-125 brightness-90 hue-rotate-15' }
];

// --- UTILITÁRIOS ---

const getLevel = (xp) => LEVELS.reverse().find(l => xp >= l.min) || LEVELS[LEVELS.length - 1];

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  // Estados Globais
  const [user, setUser] = useState(null); // { uid, name, avatar, xp, cigarettes, balance, inventory, equipped, friends, streak, activeBoost }
  const [view, setView] = useState('login'); // login, feed, profile, shop, upload, community, group_details, user_profile, settings, notifications
  const [posts, setPosts] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingProfileUid, setViewingProfileUid] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Mock de Inicialização
  useEffect(() => {
    // Simulando dados iniciais
    const initialUsers = {
      'user1': { uid: 'user1', name: 'Zé Fumaça', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', xp: 1200, cigarettes: 600, balance: 100, inventory: ['frame_fire'], equipped: { frame: 'frame_fire' }, friends: [], streak: 5, activeBoost: null },
      'user2': { uid: 'user2', name: 'Maria Vapor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', xp: 450, cigarettes: 200, balance: 50, inventory: [], equipped: {}, friends: [], streak: 0, activeBoost: { multiplier: 1.5, expiresAt: Date.now() + 900000 } },
    };
    setUsersMap(initialUsers);

    const initialPosts = [
      { id: 1, uid: 'user1', image: 'https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?w=500&q=80', caption: 'O de hoje tá pago.', likes: [], comments: [], timestamp: { seconds: Date.now() / 1000 } },
      { id: 2, uid: 'user2', image: 'https://images.unsplash.com/photo-1542407512-320d36636787?w=500&q=80', caption: 'Só relaxando.', likes: [], comments: [], timestamp: { seconds: (Date.now() / 1000) - 3600 } }
    ];
    setPosts(initialPosts);

    const initialGroups = [
      { id: 'g1', name: 'Fumantes do Centro', description: 'Galera que fuma na praça.', members: ['user1', 'user2'], adminUid: 'user1' },
      { id: 'g2', name: 'Vape Nation', description: 'Só eletrônico.', members: ['user2'], adminUid: 'user2' }
    ];
    setGroups(initialGroups);

    // Mock Notifications
    setNotifications([
      { id: 1, type: 'system', text: 'Bem-vindo à versão 5.0!', read: false, timestamp: Date.now() },
      { id: 2, type: 'like', text: 'Maria Vapor curtiu sua foto.', read: true, timestamp: Date.now() - 10000 }
    ]);
  }, []);

  // --- ACTIONS ---

  const handleLogin = (name) => {
    const newUser = { 
      uid: 'me', 
      name: name || 'Convidado', 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`, 
      xp: 0, cigarettes: 0, balance: 50, 
      inventory: [], equipped: {}, friends: [],
      streak: 1, activeBoost: null,
      joinedAt: { seconds: Date.now() / 1000 }
    };
    setUser(newUser);
    setUsersMap(prev => ({ ...prev, 'me': newUser }));
    setView('feed');
    // Verifica se precisa mostrar o modal de notificações
    if ("Notification" in window && Notification.permission === "default") {
        setTimeout(() => setShowNotifModal(true), 2000);
    }
  };

  const handlePost = (image, caption) => {
    const newPost = {
      id: Date.now(),
      uid: user.uid,
      image,
      caption,
      likes: [],
      comments: [],
      timestamp: { seconds: Date.now() / 1000 }
    };
    
    // Lógica de XP com Boost
    let xpGain = 10;
    if (user.activeBoost && user.activeBoost.expiresAt > Date.now()) {
        xpGain = Math.floor(xpGain * user.activeBoost.multiplier);
    }

    setPosts([newPost, ...posts]);
    
    // Atualiza status do usuário
    const updatedUser = { 
        ...user, 
        xp: user.xp + xpGain, 
        cigarettes: user.cigarettes + 1,
        balance: user.balance + 2 
    };
    setUser(updatedUser);
    setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
    setView('feed');
  };

  const handleLike = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const isLiked = p.likes.includes(user.uid);
        return { ...p, likes: isLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid] };
      }
      return p;
    }));
  };

  const handleBuy = (item) => {
    if (user.balance >= item.price) {
      const updatedUser = { 
        ...user, 
        balance: user.balance - item.price, 
        inventory: [...user.inventory, item.id] 
      };
      setUser(updatedUser);
      setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
      alert(`Você comprou: ${item.name}!`);
    } else {
      alert("Saldo insuficiente!");
    }
  };

  const handleUseConsumable = (item) => {
     if (user.balance >= item.price) {
        const expiresAt = Date.now() + (item.duration * 1000);
        const updatedUser = {
            ...user,
            balance: user.balance - item.price,
            activeBoost: { multiplier: item.multiplier, expiresAt }
        };
        setUser(updatedUser);
        setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
        alert(`Você usou ${item.name}! XP Multiplicado por ${item.multiplier}x.`);
     } else {
         alert("Sem bitucas suficientes.");
     }
  };

  const handleEquip = (item) => {
    const updatedUser = { ...user, equipped: { ...user.equipped, [item.type]: item.id } };
    setUser(updatedUser);
    setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
  };

  const handleUnequip = (type) => {
      const newEquipped = { ...user.equipped };
      delete newEquipped[type];
      const updatedUser = { ...user, equipped: newEquipped };
      setUser(updatedUser);
      setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
  };

  // Funções de Comunidade
  const handleFollow = (targetUid) => {
      const updatedUser = { ...user, friends: [...user.friends, targetUid] };
      setUser(updatedUser);
      setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
  };
  
  const handleUnfollow = (targetUid) => {
      const updatedUser = { ...user, friends: user.friends.filter(uid => uid !== targetUid) };
      setUser(updatedUser);
      setUsersMap(prev => ({ ...prev, [user.uid]: updatedUser }));
  };

  // Navegação
  const navigateToProfile = (uid) => {
      if (uid === user.uid) {
          setView('profile');
      } else {
          setViewingProfileUid(uid);
          setView('user_profile');
      }
  };

  // --- RENDERIZADORES ---

  if (!user) return <LoginScreen onGuest={handleLogin} />;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans pb-20 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Top Bar Genérica */}
      {view !== 'login' && view !== 'upload' && (
        <div className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800">
          <div className="flex items-center gap-2">
             <Flame className="w-6 h-6 text-orange-600 fill-orange-600 animate-pulse" />
             <h1 className="font-black italic text-xl tracking-tighter">cigaRats</h1>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  <span className="text-yellow-500 text-xs">🚬</span>
                  <span className="font-bold text-xs">{user.cigarettes}</span>
              </div>
              <button onClick={() => setView('settings')}><Settings className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO */}
      <div className="h-full">
        {view === 'feed' && (
            <Feed 
                posts={posts} usersMap={usersMap} userProfile={user} currentUserUid={user.uid}
                onLike={handleLike} onNavigateProfile={navigateToProfile}
                onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                onComment={(id, text) => {
                    setPosts(posts.map(p => p.id === id ? {...p, comments: [...p.comments, {author: user.name, authorUid: user.uid, text}]} : p));
                }}
            />
        )}
        
        {view === 'community' && (
            <CommunityScreen 
                users={Object.values(usersMap)} groups={groups} userProfile={user} currentUserUid={user.uid}
                onCreateGroup={(name, desc) => {
                    const newGroup = { id: Date.now(), name, description: desc, members: [user.uid], adminUid: user.uid };
                    setGroups([...groups, newGroup]);
                }}
                onSelectGroup={(g) => { setSelectedGroup(g); setView('group_details'); }}
                onNavigateProfile={navigateToProfile}
                onFollow={handleFollow} onUnfollow={handleUnfollow}
            />
        )}

        {view === 'group_details' && selectedGroup && (
            <GroupDetails 
                group={selectedGroup} usersMap={usersMap} currentUserUid={user.uid}
                onBack={() => setView('community')}
                onJoin={(gid) => {
                    const updatedGroups = groups.map(g => g.id === gid ? {...g, members: [...g.members, user.uid]} : g);
                    setGroups(updatedGroups); setSelectedGroup(updatedGroups.find(g => g.id === gid));
                }}
                onLeave={(gid) => {
                    const updatedGroups = groups.map(g => g.id === gid ? {...g, members: g.members.filter(m => m !== user.uid)} : g);
                    setGroups(updatedGroups); setView('community');
                }}
                onNavigateProfile={navigateToProfile}
            />
        )}

        {view === 'shop' && (
            <TabacariaScreen 
                userProfile={user} 
                onBuy={handleBuy} 
                onEquip={handleEquip} 
                onUnequip={handleUnequip}
                onUseConsumable={handleUseConsumable}
            />
        )}

        {view === 'profile' && (
            <UserProfileScreen 
                uid={user.uid} usersMap={usersMap} currentUserUid={user.uid}
                isFollowing={false} onBack={() => setView('feed')}
            />
        )}

        {view === 'user_profile' && viewingProfileUid && (
            <UserProfileScreen 
                uid={viewingProfileUid} usersMap={usersMap} currentUserUid={user.uid}
                isFollowing={user.friends.includes(viewingProfileUid)}
                onFollow={handleFollow} onUnfollow={handleUnfollow}
                onBack={() => setView('community')} // ou feed, dependendo de onde veio (simplificado)
            />
        )}

        {view === 'notifications' && (
            <NotificationScreen 
                notifications={notifications} 
                onClear={() => setNotifications([])}
                onBack={() => setView('feed')}
            />
        )}

        {view === 'upload' && (
            <UploadScreen 
                userProfile={user}
                onPost={handlePost} 
                onCancel={() => setView('feed')} 
            />
        )}

        {view === 'settings' && (
            <SettingsScreen 
                profile={user} 
                onUpdate={(name, avatar) => {
                    const updated = { ...user, name, avatar };
                    setUser(updated);
                    setUsersMap(prev => ({ ...prev, [user.uid]: updated }));
                    setView('feed');
                }}
                onDeleteAccount={() => { setUser(null); setView('login'); }}
            />
        )}
      </div>

      {/* MENU INFERIOR */}
      {view !== 'login' && view !== 'upload' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 flex justify-around items-center z-50 max-w-md mx-auto safe-area-bottom">
          <NavButton icon={Wind} label="Feed" active={view === 'feed'} onClick={() => setView('feed')} />
          <NavButton icon={Users} label="Social" active={view === 'community' || view === 'group_details' || view === 'user_profile'} onClick={() => setView('community')} />
          <NavButton icon={PlusCircle} label="Fumar" active={false} onClick={() => setView('upload')} />
          <NavButton icon={ShoppingBag} label="Loja" active={view === 'shop'} onClick={() => setView('shop')} />
          <NavButton icon={Bell} label="Notif." active={view === 'notifications'} onClick={() => setView('notifications')} badge={notifications.filter(n => !n.read).length} />
          <NavButton icon={User} label="Perfil" active={view === 'profile'} onClick={() => setView('profile')} />
        </nav>
      )}

      {/* MODAL DE NOTIFICAÇÕES (Sistema) */}
      {showNotifModal && <NotificationGuideModal onClose={() => setShowNotifModal(false)} />}

    </div>
  );
}

// --- SUB-COMPONENTES (TELAS E MODAIS) ---

function NotificationScreen({ notifications = [], onClear, onBack }) {
    return (
        <div className="p-4 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-bold"><ArrowRight className="rotate-180 w-4 h-4" /> Voltar</button>
                <h2 className="text-xl font-black italic text-white flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" /> NOTIFICAÇÕES</h2>
                {notifications.length > 0 && <button onClick={onClear} className="text-xs text-slate-500 hover:text-red-500 font-bold">Limpar</button>}
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pb-20">
                {notifications.length === 0 ? (
                    <div className="text-center text-slate-600 mt-20 flex flex-col items-center">
                        <BellOff className="w-12 h-12 mb-2 opacity-20" />
                        <p>Tudo quieto por aqui.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 rounded-xl border flex items-start gap-3 ${notif.read ? 'bg-slate-900 border-slate-800 opacity-70' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="bg-slate-950 p-2 rounded-full">
                                {notif.type === 'like' && <Heart className="w-4 h-4 text-red-500" />}
                                {notif.type === 'comment' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                                {notif.type === 'follow' && <UserPlus className="w-4 h-4 text-green-500" />}
                                {notif.type === 'system' && <Zap className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div>
                                <p className="text-sm text-slate-200">{notif.text}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function NotificationGuideModal({ onClose }) {
    const handleEnable = async () => {
        if (!("Notification" in window)) {
            alert("Este navegador não suporta notificações.");
        } else {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification("cigaRats", { body: "Notificações ativadas! Fique ligado nas bitucas." });
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
                <Bell className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-2xl font-black text-white mb-2">Fique Ligado!</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Ative as notificações para saber quando ganharem medalhas, curtirem sua fumaça ou quando sua ofensiva estiver em risco!
                </p>
                <div className="space-y-3">
                    <button onClick={handleEnable} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                        Ativar Notificações
                    </button>
                    <button onClick={onClose} className="w-full text-slate-500 text-xs font-bold py-2 hover:text-white">Agora não</button>
                </div>
            </div>
        </div>
    );
}

function UserProfileScreen({ uid, usersMap, currentUserUid, onFollow, onUnfollow, isFollowing, onBack }) {
    const profile = usersMap[uid];
    if (!profile) return <div className="p-8 text-center text-slate-500">Usuário não encontrado.</div>;

    const level = getLevel(profile.xp || 0);
    const joinDate = profile.joinedAt ? new Date(profile.joinedAt.seconds * 1000).toLocaleDateString() : '???';
    const activeFrame = profile.equipped?.frame ? [...SHOP_ITEMS, ...PREMIUM_SKINS].find(i => i.id === profile.equipped.frame)?.cssClass : '';
    
    // Cálculos do Obituário
    const cigs = profile.cigarettes || 0;
    const moneyWasted = (cigs * 1.00).toFixed(2);
    const lifeLostHours = ((cigs * 11) / 60).toFixed(1);
    const metersSmoked = ((cigs * 8) / 100).toFixed(1);
    const earnedMedals = MEDALS.filter(m => cigs >= m.threshold);

    // Dados de Ofensiva e Boost
    const streak = profile.streak || 0;
    const activeBoost = profile.activeBoost || null; 
    const isBoostActive = activeBoost && activeBoost.expiresAt > Date.now();

    return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-20">
            {profile.uid !== currentUserUid && (
                <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white mb-2 text-sm font-bold"><ArrowRight className="rotate-180 w-4 h-4" /> Voltar</button>
            )}

            {/* Cabeçalho do Perfil */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
                {isBoostActive && <div className="absolute top-2 right-2 flex items-center gap-1 bg-purple-900/50 border border-purple-500/30 text-purple-400 px-2 py-1 rounded text-xs font-bold animate-pulse"><Zap className="w-3 h-3" /> {activeBoost.multiplier}x XP</div>}
                
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-orange-900/20 to-transparent"></div>
                <div className="relative inline-block mb-3">
                    <img src={profile.avatar} className={`w-24 h-24 rounded-full bg-slate-800 object-cover border-4 border-slate-950 ${activeFrame}`} />
                    {streak > 0 && (
                        <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-slate-900 shadow-lg" title={`Ofensiva de ${streak} dias`}>
                            <div className="flex flex-col items-center leading-none">
                                <Flame className="w-3 h-3 fill-white" />
                                <span>{streak}</span>
                            </div>
                        </div>
                    )}
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
                        <div><p className="text-xs text-slate-500 font-bold uppercase">Fortuna</p><p className="text-lg font-mono text-green-400">R$ {moneyWasted}</p></div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                        <div className="bg-red-900/20 p-3 rounded-full text-red-500"><Clock className="w-6 h-6" /></div>
                        <div><p className="text-xs text-slate-500 font-bold uppercase">Tempo Perdido</p><p className="text-lg font-mono text-red-400">{lifeLostHours} h</p></div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                        <div className="bg-blue-900/20 p-3 rounded-full text-blue-500"><MapPin className="w-6 h-6" /></div>
                        <div><p className="text-xs text-slate-500 font-bold uppercase">Torre</p><p className="text-lg font-mono text-blue-400">{metersSmoked} m</p></div>
                    </div>
                </div>
            </div>

            {/* TROFÉUS */}
            <div>
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Medal className="w-5 h-5 text-yellow-500" /> SALA DE TROFÉUS</h3>
                <div className="grid grid-cols-2 gap-3">
                    {MEDALS.map(medal => {
                        const hasEarned = earnedMedals.find(m => m.id === medal.id);
                        return (
                            <div key={medal.id} className={`p-3 rounded-xl border flex items-center gap-3 ${hasEarned ? 'bg-slate-900 border-yellow-900/50' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}>
                                <div className="text-2xl">{medal.icon}</div>
                                <div><p className={`text-sm font-bold ${hasEarned ? 'text-white' : 'text-slate-500'}`}>{medal.name}</p><p className="text-[10px] text-slate-500">{medal.desc}</p></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TabacariaScreen({ userProfile, onBuy, onEquip, onUnequip, onUseConsumable }) {
    const [tab, setTab] = useState('items'); 
    const inventory = userProfile.inventory || [];
    const equipped = userProfile.equipped || {};
    const ALL_EQUIPMENT = [...SHOP_ITEMS, ...PREMIUM_SKINS];

    return (
        <div className="p-4 animate-in fade-in pb-20">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black italic mb-1 text-white flex items-center gap-2"><ShoppingBag className="w-6 h-6" /> TABACARIA</h2>
                    <p className="text-slate-400 text-sm">Gaste bitucas para ganhar estilo ou XP.</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase font-bold">Saldo</span>
                    <div className="text-2xl font-black text-yellow-400 flex items-center justify-end gap-1">🚬 {userProfile.balance}</div>
                </div>
            </div>

            <div className="flex gap-2 mb-4 bg-slate-900/50 p-1 rounded-xl">
                <button onClick={() => setTab('items')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'items' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Equipamentos</button>
                <button onClick={() => setTab('consumables')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'consumables' ? 'bg-slate-800 text-orange-500 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Consumíveis (XP)</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tab === 'items' && ALL_EQUIPMENT.map(item => {
                    const isOwned = inventory.includes(item.id); 
                    const isEquipped = equipped[item.type] === item.id;
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
                            {isOwned ? (isEquipped ? <button onClick={() => onUnequip(item.type)} className="w-full py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-500 font-bold text-sm">Desequipar</button> : <button onClick={() => onEquip(item)} className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm">Equipar</button>) : (<button onClick={() => onBuy(item)} disabled={userProfile.balance < item.price} className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${userProfile.balance < item.price ? 'bg-slate-800 text-slate-600' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>{userProfile.balance < item.price ? <Lock className="w-3 h-3" /> : '🚬'}{item.price}</button>)}
                        </div>
                    );
                })}

                {tab === 'consumables' && CONSUMABLES.map(item => (
                    <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-orange-500/50 transition-all relative group">
                         <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white flex items-center gap-2">{item.icon} {item.name}</h3>
                            <span className="text-xs font-bold uppercase bg-purple-900/30 text-purple-400 px-2 py-1 rounded">Buff</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 h-8">{item.desc}</p>
                        <button 
                            onClick={() => onUseConsumable ? onUseConsumable(item) : onBuy(item)} 
                            disabled={userProfile.balance < item.price} 
                            className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${userProfile.balance < item.price ? 'bg-slate-800 text-slate-600' : 'bg-purple-700 hover:bg-purple-600 text-white shadow-lg shadow-purple-900/20'}`}
                        >
                            {userProfile.balance < item.price ? <Lock className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {userProfile.balance < item.price ? item.price : `Comprar e Usar (${item.price})`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Feed({ posts, usersMap, userProfile, currentUserUid, onLike, onComment, onDelete, onNavigateProfile }) {
  const [feedMode, setFeedMode] = useState('global'); 
  const filteredPosts = feedMode === 'global' ? posts : posts.filter(post => (userProfile?.friends || []).includes(post.uid) || post.uid === currentUserUid);
  
  return (
    <div className="flex flex-col h-full pb-20">
        <div className="flex border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
            <button onClick={() => setFeedMode('global')} className={`flex-1 py-3 text-sm font-bold ${feedMode==='global' ? 'text-white border-b-2 border-orange-500' : 'text-slate-500'}`}>Global</button>
            <button onClick={() => setFeedMode('friends')} className={`flex-1 py-3 text-sm font-bold ${feedMode==='friends' ? 'text-white border-b-2 border-orange-500' : 'text-slate-500'}`}>Amigos</button>
        </div>
        <div className="flex flex-col gap-6 p-4">
            {filteredPosts.map(post => { 
                const author = usersMap[post.uid] || { name: 'Desconhecido', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PF&backgroundColor=gray' }; 
                return <PostCard key={post.id} post={post} author={author} usersMap={usersMap} currentUserUid={currentUserUid} onLike={onLike} onComment={onComment} onDelete={onDelete} onNavigateProfile={onNavigateProfile} />; 
            })}
            {filteredPosts.length === 0 && <div className="text-center text-slate-500 py-10">Nada aqui...</div>}
        </div>
    </div>
  );
}

function PostCard({ post, author, usersMap, currentUserUid, onLike, onComment, onDelete, onNavigateProfile }) {
  const [commentText, setCommentText] = useState(''); const [showComments, setShowComments] = useState(false);
  const isLiked = post.likes?.includes(currentUserUid); const isMyPost = post.uid === currentUserUid;
  const dateStr = new Date(post.timestamp.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  const activeFrame = author.equipped?.frame ? [...SHOP_ITEMS, ...PREMIUM_SKINS].find(i => i.id === author.equipped.frame)?.cssClass : '';
  const activeFilter = author.equipped?.filter ? [...SHOP_ITEMS, ...PREMIUM_SKINS].find(i => i.id === author.equipped.filter)?.cssClass : '';

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative">
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
        <div className="flex gap-6"><div className="flex items-center gap-2"><button onClick={() => onLike(post.id)} className={`transition-all active:scale-90 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}><Wind className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} strokeWidth={2} /></button><span className="text-sm font-bold text-slate-200">{post.likes?.length || 0}</span></div><button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"><MessageCircle className="w-6 h-6" /> <span className="font-bold">{post.comments?.length || 0}</span></button></div>
      </div>
      {showComments && <div className="bg-slate-950/50 p-3 animate-in slide-in-from-top-2"><div className="max-h-40 overflow-y-auto space-y-3 mb-3 scrollbar-thin pr-2">{post.comments?.map((c, i) => { const commenter = usersMap[c.authorUid] || { name: c.author }; return (<div key={i} className="text-sm flex gap-2"><span className="font-bold text-slate-300 shrink-0 cursor-pointer hover:underline" onClick={() => onNavigateProfile(c.authorUid)}>{commenter.name}</span><span className="text-slate-400 break-words">{c.text}</span></div>); })}</div><div className="flex gap-2 items-center"><input type="text" placeholder="Comente..." className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500" value={commentText} onChange={(e) => setCommentText(e.target.value)} /><button onClick={() => { onComment(post.id, commentText); setCommentText(''); }} className="text-orange-500 hover:text-orange-400 p-2 bg-slate-800 rounded-full"><Send className="w-4 h-4" /></button></div></div>}
    </div>
  );
}

function CommunityScreen({ users, groups, userProfile, currentUserUid, onCreateGroup, onSelectGroup, onFollow, onUnfollow, onNavigateProfile }) {
  const [tab, setTab] = useState('people'); const [searchTerm, setSearchTerm] = useState(''); const [isCreating, setIsCreating] = useState(false); const [newGroupName, setNewGroupName] = useState(''); const [newGroupDesc, setNewGroupDesc] = useState('');
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())); const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())); const myFriends = userProfile?.friends || [];
  return (
    <div className="p-4 animate-in fade-in pb-20">
      <div className="mb-6"><h2 className="text-2xl font-black italic mb-4 text-white flex items-center gap-2"><Users className="w-6 h-6" /> COMUNIDADE</h2><div className="relative mb-4"><Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" /><input type="text" placeholder={tab==='groups'?"Buscar grupos...":"Buscar pessoas..."} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="flex gap-2"><button onClick={() => setTab('people')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${tab==='people'?'bg-orange-600 text-white':'bg-slate-900 text-slate-400'}`}>Pessoas</button><button onClick={() => setTab('groups')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${tab==='groups'?'bg-orange-600 text-white':'bg-slate-900 text-slate-400'}`}>Grupos</button></div></div>
      {tab === 'people' && <div className="space-y-3">{filteredUsers.map(u => { const isMe = u.uid === currentUserUid; const isFriend = myFriends.includes(u.uid); return (<div key={u.uid} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800"><div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateProfile(u.uid)}><div className="relative"><img src={u.avatar} className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${u.equipped?.frame ? [...SHOP_ITEMS, ...PREMIUM_SKINS].find(it => it.id === u.equipped.frame)?.cssClass : ''}`} /></div><div><p className="font-bold text-slate-200 flex items-center gap-2">{u.name}{isFriend && <span className="text-[10px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">Amigo</span>}</p></div></div>{!isMe && (isFriend ? <button onClick={() => onUnfollow(u.uid)} className="p-2 text-slate-500 hover:text-red-500"><UserMinus className="w-5 h-5" /></button> : <button onClick={() => onFollow(u.uid)} className="p-2 text-orange-500 hover:text-white"><UserPlus className="w-5 h-5" /></button>)}</div>); })}</div>}
      {tab === 'groups' && <div className="space-y-4">{!isCreating ? <button onClick={() => setIsCreating(true)} className="w-full bg-slate-800 border-2 border-dashed border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"><PlusCircle className="w-5 h-5" /> Criar Novo Grupo</button> : <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-white mb-3">Novo Grupo</h3><input type="text" placeholder="Nome" className="w-full bg-slate-950 p-2 rounded mb-2 text-white" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /><input type="text" placeholder="Descrição" className="w-full bg-slate-950 p-2 rounded mb-3 text-white text-sm" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} /><div className="flex gap-2"><button onClick={() => onCreateGroup(newGroupName, newGroupDesc)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded">Criar</button><button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded">Cancelar</button></div></div>}{filteredGroups.map(group => (<div key={group.id} onClick={() => onSelectGroup(group)} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer flex justify-between items-center"><div><h3 className="font-bold text-white">{group.name}</h3><p className="text-xs text-slate-400">{group.description}</p><p className="text-xs text-slate-500 mt-1">{group.members?.length || 0} membros</p></div><ArrowRight className="text-slate-600 w-5 h-5" /></div>))}</div>}
    </div>
  );
}

function GroupDetails({ group, usersMap, currentUserUid, onJoin, onLeave, onNavigateProfile, onBack }) {
    const isMember = group.members.includes(currentUserUid);
    return (
        <div className="p-4 pb-20">
             <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white mb-4 text-sm font-bold"><ArrowRight className="rotate-180 w-4 h-4" /> Voltar</button>
             <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center mb-6">
                 <h2 className="text-2xl font-black text-white">{group.name}</h2>
                 <p className="text-slate-400 mb-4">{group.description}</p>
                 {isMember ? <button onClick={() => onLeave(group.id)} className="bg-red-900/30 text-red-500 px-4 py-2 rounded-full text-sm font-bold">Sair do Grupo</button> : <button onClick={() => onJoin(group.id)} className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold">Entrar</button>}
             </div>
             {isMember && <div className="space-y-2"><h3 className="font-bold text-white mb-2">Membros</h3>{group.members.map(uid => { const u = usersMap[uid]; if(!u) return null; return <div key={uid} onClick={() => onNavigateProfile(uid)} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg cursor-pointer"><img src={u.avatar} className="w-8 h-8 rounded-full"/><span className="text-slate-200 text-sm font-bold">{u.name}</span></div>})}</div>}
        </div>
    );
}

function UploadScreen({ onPost, onCancel, userProfile }) {
  const [image, setImage] = useState(null); const [caption, setCaption] = useState(''); const fileInputRef = useRef(null);
  const handleFileChange = async (e) => { if (e.target.files[0]) setImage(await compressImage(e.target.files[0])); };
  const activeFilter = userProfile?.equipped?.filter ? [...SHOP_ITEMS, ...PREMIUM_SKINS].find(i => i.id === userProfile.equipped.filter)?.cssClass : '';
  return (<div className="fixed inset-0 bg-slate-950 z-50 flex flex-col"><div className="p-4 flex items-center justify-between bg-slate-900 border-b border-slate-800"><button onClick={onCancel} className="text-slate-400 p-2 hover:bg-slate-800 rounded-full"><X /></button><span className="font-bold text-white">Registrar Fumaça</span><button onClick={() => onPost(image, caption)} disabled={!image} className={`font-bold px-4 py-1.5 rounded-full transition-colors ${image ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Postar</button></div><div className="flex-1 flex flex-col p-4 gap-4">{!image ? <div onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-slate-900 transition-all group"><div className="bg-slate-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform group-hover:bg-slate-700"><Camera className="w-10 h-10 text-orange-500" /></div><p className="text-slate-300 font-bold text-lg">Tirar foto</p><p className="text-slate-500 text-sm mt-1">Registre o momento do câncer</p></div> : <div className={`flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 ${activeFilter}`}><img src={image} className="max-w-full max-h-full object-contain" /><button onClick={() => setImage(null)} className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-600/80 transition-colors"><X className="w-5 h-5" /></button></div>}<input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} /><div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 focus-within:border-orange-500 transition-colors"><input type="text" placeholder="Escreva uma legenda..." className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-lg" value={caption} onChange={e => setCaption(e.target.value)} /></div></div></div>);
}

function NavButton({ icon: Icon, label, active, onClick, badge }) { 
    return (
        <button onClick={onClick} className={`relative flex flex-col items-center gap-1 p-2 w-full transition-all duration-300 rounded-xl ${active ? 'text-orange-500' : 'text-slate-500 hover:text-slate-300'}`}>
            {badge > 0 && <span className="absolute top-1 right-4 bg-red-600 text-white text-[10px] font-bold px-1.5 rounded-full z-10 animate-bounce">{badge}</span>}
            <Icon className={`w-6 h-6 ${active ? 'fill-current drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : ''}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] font-bold transition-opacity ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
        </button>
    ); 
}

function LoginScreen({ onGuest }) { const [name, setName] = useState(''); return (<div className="h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black"><div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full shadow-2xl text-center"><Flame className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h1 className="text-4xl font-black italic mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">cigaRats</h1><p className="text-slate-400 mb-8 text-sm">A rede social para quem queima um.</p><input type="text" placeholder="Seu vulgo..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white mb-4 text-center font-bold" value={name} onChange={e => setName(e.target.value)} /><button onClick={() => onGuest(name)} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mb-3">Entrar</button></div></div>); }

function SettingsScreen({ profile, onUpdate, onDeleteAccount }) { const [name, setName] = useState(profile.name); const [avatar, setAvatar] = useState(profile.avatar); const fileInputRef = useRef(null); const handleFileChange = async (e) => { if (e.target.files[0]) setAvatar(await compressImage(e.target.files[0])); }; return (<div className="p-4 space-y-6"><h2 className="text-2xl font-black italic text-white flex gap-2"><Settings /> CONFIGURAÇÕES</h2><div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6"><div className="flex justify-center"><img src={avatar} onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-4 border-slate-700" /><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} /></div><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 p-3 rounded text-white font-bold" /><button onClick={() => onUpdate(name, avatar)} className="w-full bg-green-600 text-white font-bold py-3 rounded">Salvar</button><button onClick={onDeleteAccount} className="w-full bg-red-950/50 text-red-500 border border-red-900/50 font-bold py-3 rounded flex justify-center gap-2"><Trash2 className="w-4 h-4" /> Excluir Conta</button></div></div>); }