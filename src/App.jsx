// ============================================================================
// Rede social para fumantes com sistema de XP, rankings e comunidade
// Social network for smokers with XP system, rankings and community
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// ÍCONES / ICONS
// ============================================================================
import { 
  Camera, MessageCircle, Trophy, Flame, Wind, User, Send, X, 
  PlusCircle, LogOut, Globe, AlertCircle, Settings, Edit2, 
  Image as ImageIcon, Trash2, AlertTriangle, Users, Search, 
  Crown, ArrowRight, DoorOpen, UserPlus, UserMinus, ShoppingBag, 
  Check, Lock, Skull, Clock, Banknote, MapPin, Medal, Bell,
  Play, Pause, Volume2, VolumeX
} from 'lucide-react';

// ============================================================================
// SENTRY
// ============================================================================
import * as Sentry from "@sentry/react";

// ============================================================================
// FIREBASE
// ============================================================================
import {  
  signInAnonymously, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';

import { 
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

import { 
  auth, 
  db, 
  USERS_COLLECTION, 
  POSTS_COLLECTION, 
  GROUPS_COLLECTION 
} from './config/firebase';

import { Toaster, toast } from 'react-hot-toast';
// ============================================================================
// DADOS E UTILITÁRIOS / DATA AND UTILITIES
// ============================================================================
import { SHOP_ITEMS, getShopItemById } from './data/shopItems';
import { MEDALS, getEarnedMedals } from './data/medals';
import { getLevel } from './utils/levelUtils';
import { compressImage, PRESET_AVATARS, generateDefaultAvatar } from './utils/imageUtils';
import { calculateObituaryStats } from './utils/obituaryUtils';

// ============================================================================
// NOVOS IMPORTS - FEATURES ATUALIZADAS / NEW IMPORTS - UPDATED FEATURES
// ============================================================================
import { CONSUMABLES, applyBoosts } from './data/consumables';
import { updateStreak, getStreakMessage } from './utils/streakUtils';
import { 
  requestNotificationPermission, 
  getNotificationPermission,
  cigaRatsNotifications 
} from './utils/notificationUtils';

// ============================================================================
// COMPONENTES / COMPONENTS
// ============================================================================
import BitucaIcon from './components/shared/BitucaIcon';
import StreakBadge from './components/shared/StreakBadge';
import ActiveBoosts from './components/shared/ActiveBoosts';
import NotificationGuideModal from './components/NotificationGuideModal';

// ============================================================================
// VERSÃO DO APP
// ============================================================================
const APP_VERSION = "v1.3.6 (Beta)";

// ============================================================================
// COMPONENTE DE VIDEO PLAYER (ESTILO INSTAGRAM)
// ============================================================================

function VideoPlayer({ src, activeFilter, hasAudio = true }) { // Recebe hasAudio
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [showControls, setShowControls] = useState(false); 

  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.6 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current.play().catch(e => console.log("Autoplay bloqueado", e));
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      });
    }, options);

    if (videoRef.current) observer.observe(videoRef.current);
    return () => { if (videoRef.current) observer.unobserve(videoRef.current); };
  }, []);

  const togglePlay = (e) => {
    e.stopPropagation(); 
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowControls(true);
    setTimeout(() => setShowControls(false), 1000);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!hasAudio) return; // Se não tem áudio, não faz nada
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="relative w-full h-full bg-black group" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-auto max-h-[500px] object-contain ${activeFilter}`} 
        loop
        muted={true} 
        playsInline 
      />

      {/* SÓ MOSTRA O BOTÃO SE O VÍDEO TIVER ÁUDIO ORIGINAL */}
      {hasAudio && (
        <button 
          onClick={toggleMute}
          className="absolute bottom-3 right-3 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
          {isPlaying ? <Pause className="w-8 h-8 text-white fill-current" /> : <Play className="w-8 h-8 text-white fill-current" />}
        </div>
      </div>
    </div>
  );
}
// ============================================================================
// COMPONENTE PRINCIPAL / MAIN COMPONENT
// ============================================================================
export default function App() {
  // ==========================================================================
  // ESTADOS PRINCIPAIS / MAIN STATES
  // ==========================================================================
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('loading');
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
    
  // ID do perfil sendo visualizado / ID of profile being viewed
  const [viewProfileUid, setViewProfileUid] = useState(null);
  
  // Estado para modal de notificações / State for notifications modal
  const [showNotificationGuide, setShowNotificationGuide] = useState(false);

  // ==========================================================================
  // INICIALIZAÇÃO DE AUTENTICAÇÃO / AUTHENTICATION INITIALIZATION
  // ==========================================================================
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
          // Usuário novo - criar perfil / New user - create profile
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

  // ==========================================================================
  // LISTENERS DO FIREBASE / FIREBASE LISTENERS
  // ==========================================================================
  useEffect(() => {
    if (!user) return;

    // Listener de Posts / Posts listener
    const qPosts = query(
      collection(db, POSTS_COLLECTION), 
      orderBy('timestamp', 'desc')
    );
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })));
    });

    // Listener de Usuários / Users listener
    const qUsers = query(collection(db, USERS_COLLECTION));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      
      // Criar mapa de usuários / Create users map
      const uMap = {};
      usersData.forEach(u => uMap[u.uid] = u);
      setUsersMap(uMap);
      
      // Ordenar por XP para ranking / Sort by XP for ranking
      usersData.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      setUsersList(usersData);
      
      // Atualizar perfil do usuário atual / Update current user profile
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

    // Listener de Grupos / Groups listener
    const qGroups = query(
      collection(db, GROUPS_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })));
    });

    return () => { 
      unsubPosts(); 
      unsubUsers(); 
      unsubGroups(); 
    };
  }, [user]);

  // ==========================================================================
  // FUNÇÕES DE CRIAÇÃO DE PERFIL / PROFILE CREATION FUNCTIONS
  // ==========================================================================
  
  /**
   * Cria perfil para usuário autenticado com Google
   * Creates profile for Google authenticated user
   */
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
        authMethod: 'google',
        
        // Novos campos para features atualizadas
        // New fields for updated features
        currentStreak: 0,
        longestStreak: 0,
        lastPostDate: null,
        activeBoosts: [],
        notificationsEnabled: false
      };
      
      await setDoc(doc(db, USERS_COLLECTION, googleUser.uid), userData);
      setUserProfile(userData);
      setView('feed');
    } catch (e) { 
      console.error('Erro ao criar perfil Google:', e);
      console.error('Error creating Google profile:', e);
    }
  };

  /**
   * Cria perfil para convidado (anônimo)
   * Creates profile for guest (anonymous)
   */
  const handleCreateGuestProfile = async (nickname) => {
    if (!nickname.trim()) return;
    
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
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
        authMethod: 'anonymous',
        
        // Novos campos para features atualizadas
        // New fields for updated features
        currentStreak: 0,
        longestStreak: 0,
        lastPostDate: null,
        activeBoosts: [],
        notificationsEnabled: false
      };
      
      await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), userData);
      setUserProfile(userData);
      setView('feed');
    } catch (e) { 
      toast.error("Erro ao criar perfil / Error creating profile");
      console.error(e);
    }
  };
  // ==========================================================================
  // LOJA - COMPRA E EQUIPAMENTO / SHOP - PURCHASE AND EQUIPMENT
  // ==========================================================================
  
  /**
   * Compra item cosmético da loja
   * Purchases cosmetic item from shop
   */
  const handleBuyItem = async (item) => {
    if (userProfile.balance < item.price) { 
      toast.error("Bitucas insuficientes! Vá fumar um pouco. 🚬"); 
      return; 
    }
    
    if (userProfile.inventory?.includes(item.id)) return;
    
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        balance: increment(-item.price), 
        inventory: arrayUnion(item.id) 
      });
      toast.success(`Você comprou: ${item.name}! 🛒`);
    } catch (e) { 
      console.error('Erro ao comprar item:', e);
      console.error('Error buying item:', e);
    }
  };

  /**
   * Compra e ativa consumível (boost)
   * Purchases and activates consumable (boost)
   */
  const handleBuyConsumable = async (item) => {
    // 1. Verificação de saldo com Toast de Erro
    if (userProfile.balance < item.price) { 
      toast.error("Bitucas insuficientes! Vá farmar mais. 💸");
      return; 
    }
    
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      
      // Ativar boost imediatamente
      const newBoost = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        effect: item.effect,
        activatedAt: Date.now()
      };
      
      await updateDoc(userRef, { 
        balance: increment(-item.price),
        activeBoosts: arrayUnion(newBoost)
      });
      
      // 2. Sucesso com Toast Animado
      toast.success(`⚡ ${item.name} ativado! Aproveite o bônus.`);
      
    } catch (e) { 
      console.error('Erro ao comprar consumível:', e);
      // 3. Segurança extra: avisa se der erro no banco
      toast.error("Erro ao ativar o boost. Tente novamente.");
    }
  };

  /**
   * Equipa item cosmético
   * Equips cosmetic item
   */
  const handleEquipItem = async (item) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        [`equipped.${item.type}`]: item.id 
      });
    } catch (e) { 
      console.error('Erro ao equipar item:', e);
      console.error('Error equipping item:', e);
    }
  };

  /**
   * Remove item equipado
   * Unequips item
   */
  const handleUnequipItem = async (type) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        [`equipped.${type}`]: null 
      });
    } catch (e) { 
      console.error('Erro ao desequipar item:', e);
      console.error('Error unequipping item:', e);
    }
  };

  // ==========================================================================
  // SOCIAL - SEGUIR E GRUPOS / SOCIAL - FOLLOW AND GROUPS
  // ==========================================================================
  
  /**
   * Segue outro usuário
   * Follows another user
   */
  const handleFollowUser = async (targetUid) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        friends: arrayUnion(targetUid) 
      });
    } catch (e) { 
      console.error('Erro ao seguir usuário:', e);
      console.error('Error following user:', e);
    }
  };

  /**
   * Para de seguir usuário
   * Unfollows user
   */
  const handleUnfollowUser = async (targetUid) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        friends: arrayRemove(targetUid) 
      });
    } catch (e) { 
      console.error('Erro ao deixar de seguir:', e);
      console.error('Error unfollowing:', e);
    }
  };

  /**
   * Cria novo grupo
   * Creates new group
   */
  const handleCreateGroup = async (groupName, groupDesc) => {
    if (!groupName.trim()) return;
    
    try {
      const newGroup = { 
        name: groupName, 
        description: groupDesc || "Sem descrição / No description", 
        adminUid: user.uid, 
        adminName: userProfile.name, 
        members: [user.uid], 
        createdAt: serverTimestamp() 
      };
      
      const docRef = await addDoc(collection(db, GROUPS_COLLECTION), newGroup);
      setSelectedGroup({ id: docRef.id, ...newGroup });
      setView('group_detail');
    } catch (e) { 
      toast.error("Erro ao criar grupo / Error creating group");
      console.error(e);
    }
  };

  /**
   * Entra em um grupo
   * Joins a group
   */
  const handleJoinGroup = async (groupId) => {
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, { 
        members: arrayUnion(user.uid) 
      });
      
      if (selectedGroup && selectedGroup.id === groupId) { 
        setSelectedGroup(prev => ({
          ...prev, 
          members: [...prev.members, user.uid]
        })); 
      }
    } catch (e) { 
      console.error('Erro ao entrar no grupo:', e);
      console.error('Error joining group:', e);
    }
  };

  /**
   * Sai de um grupo
   * Leaves a group
   */
  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm("Sair do grupo? / Leave group?")) return;
    
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, { 
        members: arrayRemove(user.uid) 
      });
      setView('community');
    } catch (e) { 
      console.error('Erro ao sair do grupo:', e);
      console.error('Error leaving group:', e);
    }
  };

  /**
   * Deleta grupo (apenas admin)
   * Deletes group (admin only)
   */
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Excluir grupo? / Delete group?")) return;
    
    try { 
      await deleteDoc(doc(db, GROUPS_COLLECTION, groupId)); 
      setView('community'); 
    } catch (e) { 
      console.error('Erro ao deletar grupo:', e);
      console.error('Error deleting group:', e);
    }
  };

  /**
   * Remove membro do grupo (apenas admin)
   * Kicks member from group (admin only)
   */
  const handleKickMember = async (groupId, memberUid) => {
    if (!window.confirm("Remover usuário? / Remove user?")) return;
    
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, { 
        members: arrayRemove(memberUid) 
      });
      
      if (selectedGroup) { 
        setSelectedGroup(prev => ({
          ...prev, 
          members: prev.members.filter(m => m !== memberUid)
        })); 
      }
    } catch (e) { 
      console.error('Erro ao remover membro:', e);
      console.error('Error kicking member:', e);
    }
  };

  // ==========================================================================
  // POSTS E INTERAÇÕES / POSTS AND INTERACTIONS ( handle post v. cloudinary)
  // ==========================================================================
  
  /**
   * Cria novo post (COM STREAK E BOOSTS)
   * Creates new post (WITH STREAK AND BOOSTS)
   */
  const handlePost = async (mediaContent, caption, type = 'image', muteVideo = false) => {
    if (!mediaContent) return;
    
    // Configurações do Cloudinary
    const CLOUD_NAME = "dsva2wdls";
    const UPLOAD_PRESET = "cigarats_videos";
    
    try {
      let finalMediaUrl = mediaContent;

      // Se for vídeo, faz upload pro Cloudinary
      if (type === 'video' && mediaContent instanceof File) {
        
        // Avisa que está subindo (opcional: criar um estado de loading na tela depois)
        console.log("Iniciando upload para o Cloudinary...");

        const formData = new FormData();
        formData.append("file", mediaContent);
        formData.append("upload_preset", UPLOAD_PRESET);
        // O resource_type 'video' é essencial para vídeos
        formData.append("resource_type", "video"); 

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, 
          {
            method: "POST",
            body: formData
          }
        );

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }

        finalMediaUrl = data.secure_url; // Link seguro (https) do vídeo
        console.log("Upload concluído:", finalMediaUrl);
      }

      // Aplicar boosts ativos / Apply active boosts
      const boostResult = applyBoosts(
        userProfile.activeBoosts || [], 10, 10
      );
      const streakData = updateStreak(userProfile, true);
      
      // Criar post / Create post
      await addDoc(collection(db, POSTS_COLLECTION), { 
        uid: user.uid, 
        image: finalMediaUrl, 
        mediaType: type,
        caption: caption,
        hasAudio: !muteVideo, // Se muteVideo é true, hasAudio é false
        timestamp: serverTimestamp(), 
        likes: [], 
        comments: [] 
      });
      
      // Atualizar perfil com XP, bitucas, streak
      // Update profile with XP, bitucas, streak
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        cigarettes: increment(1), 
        xp: increment(boostResult.xp),
        balance: increment(boostResult.bitucas),
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastPostDate: streakData.lastPostDate
      });
      
      // Notificação se tiver boost ativo
      // Notification if boost is active
      if (boostResult.multipliers.xp > 1) {
        toast("🔥 Boost ativo! XP Multiplicado!", { icon: '🔥' });
      }
      
      setView('feed');
    } catch (e) { 
      console.error('Erro ao criar post:', e);
      toast.error(`Falha ao postar: ${e.message}`);
    }
  };

  /**
   * Deleta post (penalidade de XP/Bitucas)
   * Deletes post (XP/Bitucas penalty)
   */
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Apagar post? -10 XP/Bitucas / Delete post? -10 XP/Bitucas")) return;
    
    try {
      await deleteDoc(doc(db, POSTS_COLLECTION, postId));
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        cigarettes: increment(-1), 
        xp: increment(-10), 
        balance: increment(-10) 
      });
    } catch (e) { 
      console.error('Erro ao deletar post:', e);
      console.error('Error deleting post:', e);
    }
  };

  /**
   * Curte/descurte post (+1 bituca)
   * Likes/unlikes post (+1 bituca)
   */
  const handleLike = async (postId, currentLikes) => {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const isLiked = currentLikes.includes(user.uid);
    
    if (isLiked) { 
      await updateDoc(postRef, { 
        likes: currentLikes.filter(id => id !== user.uid) 
      }); 
    } else { 
      await updateDoc(postRef, { 
        likes: arrayUnion(user.uid) 
      }); 
      
      // Recompensa por curtir / Reward for liking
      const userRef = doc(db, USERS_COLLECTION, user.uid); 
      await updateDoc(userRef, { 
        balance: increment(1) 
      }); 
    }
  };

  /**
   * Adiciona comentário (+2 bitucas)
   * Adds comment (+2 bitucas)
   */
  const handleComment = async (postId, text) => {
    if (!text.trim()) return;
    
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const newComment = { 
      authorUid: user.uid, 
      text: text, 
      timestamp: Date.now() 
    };
    
    await updateDoc(postRef, { 
      comments: arrayUnion(newComment) 
    });
    
    // Recompensa por comentar / Reward for commenting
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, { 
      balance: increment(2) 
    });
  };

  // ==========================================================================
  // PERFIL E CONTA / PROFILE AND ACCOUNT
  // ==========================================================================
  
  /**
   * Atualiza perfil do usuário
   * Updates user profile
   */
  const handleUpdateProfile = async (newName, newAvatar) => {
    // Definimos a promessa (o processo de salvar)
    const savePromise = async () => {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { 
        name: newName, 
        avatar: newAvatar 
      });
      
      setUserProfile(prev => ({ 
        ...prev, 
        name: newName, 
        avatar: newAvatar 
      }));
      
      // Espera um pouquinho só pra pessoa ler a mensagem antes de mudar a tela
      setTimeout(() => setView('feed'), 1000); 
    };

    // O toast.promise cuida de tudo: mostra "Carregando", depois "Sucesso" ou "Erro"
    await toast.promise(savePromise(), {
      loading: 'Salvando alterações...',
      success: 'Perfil atualizado com sucesso! ✨',
      error: 'Erro ao salvar. Tente novamente. ❌',
    });
  };

  // ==========================================================================
  // AUTENTICAÇÃO / AUTHENTICATION
  // ==========================================================================
  
  const handleGoogleLogin = async () => { 
    try { 
      const provider = new GoogleAuthProvider(); 
      await signInWithPopup(auth, provider); 
    } catch (error) { 
      toast.error("Erro Google / Google error"); 
      console.error(error);
    } 
  };
  
  const handleGuestLogin = async (nickname) => { 
    try { 
      await signInAnonymously(auth); 
      await handleCreateGuestProfile(nickname); 
    } catch (error) { 
      console.error('Erro login convidado:', error);
      console.error('Guest login error:', error);
    } 
  };
  
  const handleLogout = async () => { 
    await signOut(auth); 
    setUserProfile(null); 
    setPosts([]); 
    setView('login'); 
  };
  
  const handleDeleteAccount = async () => {
    if (!window.confirm("TEM CERTEZA? / ARE YOU SURE?")) return;
    
    try { 
      setLoading(true); 
      await deleteDoc(doc(db, USERS_COLLECTION, user.uid)); 
      await deleteUser(auth.currentUser); 
    } catch (error) { 
      toast.error("Erro. Saia e entre novamente / Error. Logout and login again"); 
      setLoading(false); 
      console.error(error);
    }
  };

  // ==========================================================================
  // NAVEGAÇÃO / NAVIGATION
  // ==========================================================================
  
  /**
   * Navega para perfil de outro usuário
   * Navigates to another user's profile
   */
  const navigateToProfile = (uid) => {
    setViewProfileUid(uid);
    setView('profile_view');
  };

  // ==========================================================================
  // LOADING SCREEN
  // ==========================================================================
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white font-bold animate-pulse">
        Carregando cigaRats...
      </div>
    );
  }

  // ==========================================================================
  // RENDER PRINCIPAL / MAIN RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex justify-center">
      
      {/* TELA DE LOGIN / LOGIN SCREEN */}
      {view === 'login' && (
        <div className="w-full max-w-md">
          <LoginScreen 
            onGoogle={handleGoogleLogin} 
            onGuest={handleGuestLogin} 
          />
        </div>
      )}

      {/* LAYOUT PRINCIPAL / MAIN LAYOUT */}
      {view !== 'login' && (
        <div className="flex w-full max-w-6xl gap-6">
          
          {/* SIDEBAR ESQUERDA / LEFT SIDEBAR */}
          <aside className="fixed bottom-0 left-0 w-full z-20 bg-slate-900 border-t border-slate-800 md:static md:w-64 md:h-screen md:bg-transparent md:border-r md:border-t-0 md:flex md:flex-col md:p-4">
            
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-500 w-8 h-8" />
                <h1 className="text-2xl font-black italic bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                  cigaRats
                </h1>
              </div>
              
              {userProfile && (
                <div 
                  onClick={() => navigateToProfile(user.uid)} 
                  className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2 relative">
                    <div className="relative">
                      <img 
                        src={userProfile.avatar} 
                        className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${
                          userProfile.equipped?.frame 
                            ? SHOP_ITEMS.find(i => i.id === userProfile.equipped.frame)?.cssClass 
                            : ''
                        }`} 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm truncate w-32">
                        {userProfile.name}
                      </p>
                      {userProfile.equipped?.title ? (
                        <p className="text-[10px] text-orange-400 font-bold uppercase">
                          {SHOP_ITEMS.find(i => i.id === userProfile.equipped.title)?.name}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {getLevel(userProfile.xp).title}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs font-mono bg-slate-950 p-2 rounded items-center">
                    <span className="text-purple-400">{userProfile.xp} XP</span>
                    <span className="text-yellow-400 flex items-center gap-1 font-bold">
                      <BitucaIcon className="w-3 h-3" /> {userProfile.balance}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex justify-around items-center h-16 md:h-auto md:flex-col md:items-start md:space-y-4 md:flex-1">
              <NavButton 
                icon={Wind} 
                label="Feed" 
                active={view === 'feed'} 
                onClick={() => setView('feed')} 
              />
              <NavButton 
                icon={Users} 
                label="Comunidade" 
                active={view === 'community' || view === 'group_detail'} 
                onClick={() => setView('community')} 
              />
              <NavButton 
                icon={ShoppingBag} 
                label="Tabacaria" 
                active={view === 'shop'} 
                onClick={() => setView('shop')} 
              />
              <NavButton 
                icon={Trophy} 
                label="Ranking" 
                active={view === 'ranking'} 
                onClick={() => setView('ranking')} 
              />
              <NavButton 
                icon={User} 
                label="Perfil" 
                active={view === 'profile_view' && viewProfileUid === user.uid} 
                onClick={() => navigateToProfile(user.uid)} 
              />
              <NavButton 
                icon={Settings} 
                label="Ajustes" 
                active={view === 'settings'} 
                onClick={() => setView('settings')} 
              />
              
              <div className="md:hidden relative -top-6">
                <button 
                  onClick={() => setView('upload')} 
                  className="bg-orange-600 hover:bg-orange-500 text-white rounded-full p-4 shadow-lg active:scale-95 border-4 border-slate-950"
                >
                  <PlusCircle className="w-8 h-8" />
                </button>
              </div>
              
              <button 
                onClick={() => setView('upload')} 
                className="hidden md:flex w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg"
              >
                <PlusCircle className="w-5 h-5" /> Fumar
              </button>
              
              <button 
                onClick={handleLogout} 
                className="hidden md:flex items-center gap-3 text-slate-500 hover:text-red-500 px-3 py-2 transition-colors mt-auto"
              >
                <LogOut className="w-6 h-6" /> 
                <span className="font-bold">Sair</span>
              </button>
            </nav>
          </aside>

          {/* CONTEÚDO PRINCIPAL / MAIN CONTENT */}
          <main className="flex-1 w-full max-w-xl mx-auto pb-24 md:pb-0 md:pt-4 min-h-screen md:border-r md:border-slate-800/50 pr-0 md:pr-6 pl-0 md:pl-0">
            
            <header className="md:hidden bg-slate-900/90 backdrop-blur-md p-4 sticky top-0 z-10 border-b border-slate-800 flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Flame className="text-orange-500 w-6 h-6" />
                <h1 className="text-xl font-black italic bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                  cigaRats
                </h1>
              </div>
              {userProfile && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                    <BitucaIcon className="w-3 h-3" /> {userProfile.balance}
                  </span>
                </div>
              )}
            </header>

            {view === 'feed' && (
              <Feed 
                posts={posts} 
                usersMap={usersMap} 
                userProfile={userProfile} 
                currentUserUid={user?.uid} 
                onLike={handleLike} 
                onComment={handleComment} 
                onDelete={handleDeletePost} 
                onNavigateProfile={navigateToProfile} 
              />
            )}
            
            {view === 'ranking' && (
              <Ranking 
                users={usersList} 
                title="RANKING GLOBAL" 
                subtitle="Quem vai precisar de um pulmão novo?" 
                currentUserUid={user?.uid} 
                onNavigateProfile={navigateToProfile} 
              />
            )}
            
            {view === 'community' && (
              <CommunityScreen 
                users={usersList} 
                groups={groups} 
                userProfile={userProfile} 
                currentUserUid={user?.uid} 
                onCreateGroup={handleCreateGroup} 
                onSelectGroup={(g) => { 
                  setSelectedGroup(g); 
                  setView('group_detail'); 
                }} 
                onFollow={handleFollowUser} 
                onUnfollow={handleUnfollowUser} 
                onNavigateProfile={navigateToProfile} 
              />
            )}
            
            {view === 'group_detail' && (
              <GroupDetails 
                group={selectedGroup} 
                usersMap={usersMap} 
                currentUserUid={user?.uid} 
                onJoin={handleJoinGroup} 
                onLeave={handleLeaveGroup} 
                onDelete={handleDeleteGroup} 
                onKick={handleKickMember} 
                onBack={() => setView('community')} 
                onNavigateProfile={navigateToProfile} 
              />
            )}
            
            {view === 'shop' && (
              <TabacariaScreen 
                userProfile={userProfile} 
                onBuy={handleBuyItem} 
                onBuyConsumable={handleBuyConsumable}
                onEquip={handleEquipItem} 
                onUnequip={handleUnequipItem} 
              />
            )}
            
            {view === 'settings' && (
              <SettingsScreen 
                profile={userProfile} 
                onUpdate={handleUpdateProfile} 
                onDeleteAccount={handleDeleteAccount}
                onOpenNotifications={() => setShowNotificationGuide(true)}
              />
            )}
            
            {view === 'upload' && (
              <UploadScreen 
                onPost={handlePost} 
                onCancel={() => setView('feed')} 
                userProfile={userProfile} 
              />
            )}
            
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

          {/* PAINEL DIREITO / RIGHT PANEL */}
          <aside className="hidden lg:block w-80 p-4 pt-8 sticky top-0 h-screen overflow-hidden">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <h3 className="font-black text-slate-400 mb-4 text-sm uppercase tracking-wider">
                Top Fumantes
              </h3>
              <div className="space-y-3">
                {usersList.slice(0, 5).map((u, i) => (
                  <div 
                    key={u.uid} 
                    onClick={() => navigateToProfile(u.uid)} 
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-800 p-1 rounded transition-colors"
                  >
                    <span className={`font-bold w-4 ${i === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <div className="relative">
                      <img 
                        src={u.avatar} 
                        className={`w-6 h-6 rounded-full bg-slate-800 ${
                          u.equipped?.frame 
                            ? SHOP_ITEMS.find(it => it.id === u.equipped.frame)?.cssClass 
                            : ''
                        }`} 
                      />
                    </div>
                    <span className="truncate flex-1 text-slate-300">{u.name}</span>
                    <span className="text-orange-500 font-mono text-xs">{u.cigarettes}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MODAL DE NOTIFICAÇÕES / NOTIFICATIONS MODAL */}
      <NotificationGuideModal 
        isOpen={showNotificationGuide}
        onClose={() => setShowNotificationGuide(false)}
        currentPermission={getNotificationPermission()}
      />

      {/* ---------------- TOASTER---------------- */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b', // Cor Slate-800 (Escuro)
            color: '#fff',         // Texto Branco
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#16a34a', // Verde
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // Vermelho
              secondary: '#fff',
            },
          },
        }}
      />
      {/* ----------------------------------------------- */}
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES / HELPER COMPONENTS
// ============================================================================

// ============================================================================
// USER PROFILE SCREEN (COM STREAK E BOOSTS)
// ============================================================================
function UserProfileScreen({ uid, usersMap, currentUserUid, onFollow, onUnfollow, isFollowing, onBack }) {
  const profile = usersMap[uid];
  
  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Usuário não encontrado (ou parou de fumar).
      </div>
    );
  }

  const level = getLevel(profile.xp || 0);
  const joinDate = profile.joinedAt 
    ? new Date(profile.joinedAt.seconds * 1000).toLocaleDateString() 
    : '???';
  const activeFrame = profile.equipped?.frame 
    ? SHOP_ITEMS.find(i => i.id === profile.equipped.frame)?.cssClass 
    : '';
  
  const cigs = profile.cigarettes || 0;
  const moneyWasted = (cigs * 1.00).toFixed(2);
  const lifeLostMinutes = cigs * 11;
  const lifeLostHours = (lifeLostMinutes / 60).toFixed(1);
  const metersSmoked = ((cigs * 8) / 100).toFixed(1);
  const earnedMedals = MEDALS.filter(m => cigs >= m.threshold);

  return (
    <div className="p-4 animate-in fade-in slide-in-from-bottom-4 space-y-6">
      <button 
        onClick={onBack} 
        className="flex items-center gap-1 text-slate-400 hover:text-white mb-2 text-sm font-bold"
      >
        <ArrowRight className="rotate-180 w-4 h-4" /> Voltar
      </button>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-orange-900/20 to-transparent"></div>
        
        <div className="relative inline-block mb-3">
          <img 
            src={profile.avatar} 
            className={`w-24 h-24 rounded-full bg-slate-800 object-cover border-4 border-slate-950 ${activeFrame}`} 
          />
        </div>
        
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          {profile.name}
          {profile.uid === currentUserUid && (
            <span className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400 font-normal">
              Você
            </span>
          )}
        </h2>
        
        {profile.equipped?.title ? (
          <p className="text-orange-500 font-black uppercase text-sm mt-1">
            {SHOP_ITEMS.find(i => i.id === profile.equipped.title)?.name}
          </p>
        ) : (
          <p className={`text-sm font-bold ${level.color}`}>
            {level.title}
          </p>
        )}
        
        <p className="text-slate-500 text-xs mt-2">
          Fumante desde {joinDate}
        </p>

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
              <button 
                onClick={() => onUnfollow(uid)} 
                className="bg-slate-800 text-slate-400 hover:text-red-500 px-6 py-2 rounded-full font-bold text-sm transition-colors border border-slate-700"
              >
                Deixar de Seguir
              </button>
            ) : (
              <button 
                onClick={() => onFollow(uid)} 
                className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-transform active:scale-95"
              >
                Seguir
              </button>
            )}
          </div>
        )}
      </div>

      {/* BADGE DE STREAK */}
      <StreakBadge streakDays={profile.currentStreak || 0} />

      {/* BOOSTS ATIVOS */}
      {profile.activeBoosts && profile.activeBoosts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
            🔥 Boosts Ativos
          </h3>
          <ActiveBoosts activeBoosts={profile.activeBoosts} />
        </div>
      )}

      {/* OBITUÁRIO */}
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-900 shadow-inner">
        <h3 className="text-lg font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <Skull className="w-5 h-5" /> Obituário
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="bg-green-900/20 p-3 rounded-full text-green-500">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Fortuna Queimada</p>
              <p className="text-lg font-mono text-green-400">R$ {moneyWasted}</p>
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="bg-red-900/20 p-3 rounded-full text-red-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Vida Perdida</p>
              <p className="text-lg font-mono text-red-400">{lifeLostHours} horas</p>
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="bg-blue-900/20 p-3 rounded-full text-blue-500">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Torre de Babel</p>
              <p className="text-lg font-mono text-blue-400">{metersSmoked} metros</p>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-4 italic">
          * Estatísticas baseadas em ciência de boteco.
        </p>
      </div>

      {/* SALA DE TROFÉUS */}
      <div>
        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Medal className="w-5 h-5 text-yellow-500" /> SALA DE TROFÉUS
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {MEDALS.map(medal => {
            const hasEarned = earnedMedals.find(m => m.id === medal.id);
            return (
              <div 
                key={medal.id} 
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  hasEarned 
                    ? 'bg-slate-900 border-yellow-900/50' 
                    : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'
                }`}
              >
                <div className="text-2xl">{medal.icon}</div>
                <div>
                  <p className={`text-sm font-bold ${hasEarned ? 'text-white' : 'text-slate-500'}`}>
                    {medal.name}
                  </p>
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

// ============================================================================
// TABACARIA SCREEN (COM ABA DE CONSUMÍVEIS)
// ============================================================================
function TabacariaScreen({ userProfile, onBuy, onBuyConsumable, onEquip, onUnequip }) {
  const [tab, setTab] = useState('cosmetics');
  
  const inventory = userProfile.inventory || [];
  const equipped = userProfile.equipped || {};

  return (
    <div className="p-4 animate-in fade-in">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black italic mb-1 text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> TABACARIA
          </h2>
          <p className="text-slate-400 text-sm">
            Gaste suas bitucas com sabedoria.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase font-bold">Saldo</span>
          <div className="text-2xl font-black text-yellow-400 flex items-center justify-end gap-1">
            <BitucaIcon className="w-6 h-6" /> {userProfile.balance}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setTab('cosmetics')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
            tab === 'cosmetics' 
              ? 'bg-orange-600 text-white' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          🎨 Cosméticos
        </button>
        <button 
          onClick={() => setTab('consumables')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
            tab === 'consumables' 
              ? 'bg-orange-600 text-white' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          ⚡ Consumíveis
        </button>
      </div>

      {/* ABA DE COSMÉTICOS */}
      {tab === 'cosmetics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHOP_ITEMS.map(item => {
            const isOwned = inventory.includes(item.id);
            const isEquipped = equipped[item.type] === item.id;
            
            return (
              <div 
                key={item.id} 
                className={`bg-slate-900 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                  isOwned ? 'border-slate-700' : 'border-slate-800 opacity-90'
                }`}
              >
                {isEquipped && (
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    EQUIPADO
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white">{item.name}</h3>
                  <span className="text-xs font-bold uppercase bg-slate-950 px-2 py-1 rounded text-slate-400">
                    {item.type}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 mb-4 h-8">{item.desc}</p>
                
                <div className="flex justify-center mb-4 h-16 items-center">
                  {item.type === 'frame' && (
                    <div className={`w-12 h-12 rounded-full bg-slate-700 ${item.cssClass}`}></div>
                  )}
                  {item.type === 'filter' && (
                    <div 
                      className={`w-12 h-12 rounded-lg bg-cover bg-center ${item.cssClass}`} 
                      style={{backgroundImage: `url(${userProfile.avatar})`}}
                    ></div>
                  )}
                  {item.type === 'title' && (
                    <span className="text-orange-400 font-bold uppercase text-xs">
                      {item.name}
                    </span>
                  )}
                </div>
                
                {isOwned ? (
                  isEquipped ? (
                    <button 
                      onClick={() => onUnequip(item.type)} 
                      className="w-full py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-500 font-bold text-sm transition-colors"
                    >
                      Desequipar
                    </button>
                  ) : (
                    <button 
                      onClick={() => onEquip(item)} 
                      className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
                    >
                      Equipar
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => onBuy(item)} 
                    disabled={userProfile.balance < item.price}
                    className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-colors ${
                      userProfile.balance < item.price 
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    }`}
                  >
                    {userProfile.balance < item.price ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <BitucaIcon className="w-3 h-3" />
                    )}
                    {item.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ABA DE CONSUMÍVEIS */}
      {tab === 'consumables' && (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-bold mb-1">
                Como funcionam os boosts?
              </p>
              <p className="text-xs text-blue-400/80">
                Consumíveis aplicam multiplicadores temporários em XP e bitucas. 
                Compre e use estrategicamente para maximizar seus ganhos!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONSUMABLES.map(item => {
              const canAfford = userProfile.balance >= item.price;
              
              return (
                <div 
                  key={item.id} 
                  className="bg-slate-900 p-4 rounded-xl border-2 border-slate-800 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {item.name}
                        <span className="text-2xl">{item.icon}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 rounded-lg p-3 mb-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">XP Boost:</span>
                      <span className="text-purple-400 font-bold">
                        {item.effect.xpMultiplier}x
                      </span>
                    </div>

<div className="flex justify-between text-xs">
                      <span className="text-slate-400">Bitucas Boost:</span>
                      <span className="text-yellow-400 font-bold">
                        {item.effect.bitucasMultiplier}x
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Duração:</span>
                      <span className="text-orange-400 font-bold">
                        {item.effect.duration / 3600000}h
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onBuyConsumable(item)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg hover:shadow-orange-500/50'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <BitucaIcon className="w-4 h-4" />
                        <span>Comprar por {item.price}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>{item.price} bitucas</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMMUNITY SCREEN
// ============================================================================
function CommunityScreen({ users, groups, userProfile, currentUserUid, onCreateGroup, onSelectGroup, onFollow, onUnfollow, onNavigateProfile }) {
  const [tab, setTab] = useState('people');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const myFriends = userProfile?.friends || [];

  return (
    <div className="p-4 animate-in fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-black italic mb-4 text-white flex items-center gap-2">
          <Users className="w-6 h-6" /> COMUNIDADE
        </h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder={tab === 'groups' ? "Buscar grupos..." : "Buscar pessoas..."} 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setTab('people')} 
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
              tab === 'people' ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Pessoas
          </button>
          <button 
            onClick={() => setTab('groups')} 
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
              tab === 'groups' ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Grupos
          </button>
        </div>
      </div>

      {tab === 'people' && (
        <div className="space-y-3">
          {filteredUsers.map(u => {
            const isMe = u.uid === currentUserUid;
            const isFriend = myFriends.includes(u.uid);
            
            return (
              <div 
                key={u.uid} 
                className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1" 
                  onClick={() => onNavigateProfile(u.uid)}
                >
                  <div className="relative">
                    <img 
                      src={u.avatar} 
                      className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${
                        u.equipped?.frame 
                          ? SHOP_ITEMS.find(it => it.id === u.equipped.frame)?.cssClass 
                          : ''
                      }`} 
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 flex items-center gap-2">
                      {u.name}
                      {isFriend && (
                        <span className="text-[10px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">
                          Amigo
                        </span>
                      )}
                    </p>
                    {u.equipped?.title && (
                      <p className="text-[10px] text-orange-400 font-bold uppercase">
                        {SHOP_ITEMS.find(i => i.id === u.equipped.title)?.name}
                      </p>
                    )}
                  </div>
                </div>
                
                {!isMe && (
                  isFriend ? (
                    <button 
                      onClick={() => onUnfollow(u.uid)} 
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => onFollow(u.uid)} 
                      className="p-2 text-orange-500 hover:text-white transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'groups' && (
        <div className="space-y-4">
          {!isCreating ? (
            <button 
              onClick={() => setIsCreating(true)} 
              className="w-full bg-slate-800 border-2 border-dashed border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Criar Novo Grupo
            </button>
          ) : (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-white mb-3">Novo Grupo</h3>
              <input 
                type="text" 
                placeholder="Nome do Grupo" 
                className="w-full bg-slate-950 p-2 rounded border border-slate-700 mb-2 text-white focus:ring-2 focus:ring-orange-500 outline-none" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                maxLength={25} 
              />
              <input 
                type="text" 
                placeholder="Descrição curta (opcional)" 
                className="w-full bg-slate-950 p-2 rounded border border-slate-700 mb-3 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                value={newGroupDesc} 
                onChange={e => setNewGroupDesc(e.target.value)} 
                maxLength={50} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    onCreateGroup(newGroupName, newGroupDesc);
                    setIsCreating(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                  }} 
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors"
                >
                  Criar
                </button>
                <button 
                  onClick={() => {
                    setIsCreating(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                  }} 
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          
          {filteredGroups.map(group => (
            <div 
              key={group.id} 
              onClick={() => onSelectGroup(group)} 
              className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all active:scale-[0.99] flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-white">{group.name}</h3>
                <p className="text-xs text-slate-400">{group.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {group.members?.length || 0} membros
                </p>
              </div>
              <ArrowRight className="text-slate-600 w-5 h-5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GROUP DETAILS
// ============================================================================
function GroupDetails({ group, usersMap, currentUserUid, onJoin, onLeave, onDelete, onKick, onBack, onNavigateProfile }) {
  const [activeTab, setActiveTab] = useState('ranking');
  
  const members = group.members?.map(uid => usersMap[uid]).filter(Boolean) || [];
  const rankedMembers = [...members].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const isMember = group.members?.includes(currentUserUid);
  const isAdmin = group.adminUid === currentUserUid;

  return (
    <div className="p-4 animate-in fade-in slide-in-from-right-4">
      <button 
        onClick={onBack} 
        className="flex items-center gap-1 text-slate-400 hover:text-white mb-4 text-sm font-bold"
      >
        <ArrowRight className="rotate-180 w-4 h-4" /> Voltar
      </button>
      
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
        
        <h2 className="text-2xl font-black text-white mb-1">{group.name}</h2>
        <p className="text-slate-400 text-sm mb-4">{group.description}</p>
        
        {isMember ? (
          <span className="bg-green-900/30 text-green-500 border border-green-900/50 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
            <Users className="w-3 h-3" /> Membro
          </span>
        ) : (
          <button 
            onClick={() => onJoin(group.id)} 
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 rounded-full shadow-lg transition-colors"
          >
            Entrar
          </button>
        )}
        
        {isAdmin && (
          <button 
            onClick={() => onDelete(group.id)} 
            className="absolute top-4 right-4 text-slate-600 hover:text-red-500 p-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {isMember && (
        <>
          <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
            <button 
              onClick={() => setActiveTab('ranking')} 
              className={`flex-1 pb-2 font-bold text-sm transition-colors ${
                activeTab === 'ranking' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-slate-500'
              }`}
            >
              Ranking
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={`flex-1 pb-2 font-bold text-sm transition-colors ${
                activeTab === 'members' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-slate-500'
              }`}
            >
              Membros
            </button>
          </div>

          {activeTab === 'ranking' ? (
            <Ranking 
              users={rankedMembers} 
              title="" 
              subtitle="" 
              currentUserUid={currentUserUid} 
              onNavigateProfile={onNavigateProfile} 
            />
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div 
                  key={m.uid} 
                  className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800"
                >
                  <div 
                    className="flex items-center gap-3 cursor-pointer" 
                    onClick={() => onNavigateProfile(m.uid)}
                  >
                    <img src={m.avatar} className="w-8 h-8 rounded-full" />
                    <span className={m.uid === currentUserUid ? "text-orange-400 font-bold" : "text-slate-200"}>
                      {m.name}
                    </span>
                    {group.adminUid === m.uid && <Crown className="w-3 h-3 text-yellow-500" />}
                  </div>
                  
                  {isAdmin && m.uid !== currentUserUid && (
                    <button 
                      onClick={() => onKick(group.id, m.uid)} 
                      className="text-xs text-red-500 hover:text-red-400 font-bold"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
              
              <div className="pt-4 flex justify-center">
                <button 
                  onClick={() => onLeave(group.id)} 
                  className="text-red-500 text-sm font-bold flex items-center gap-2 hover:text-red-400 transition-colors"
                >
                  <DoorOpen className="w-4 h-4" /> Sair do Grupo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// FEED
// ============================================================================
function Feed({ posts, usersMap, userProfile, currentUserUid, onLike, onComment, onDelete, onNavigateProfile }) {
  const [feedMode, setFeedMode] = useState('global');
  
  const filteredPosts = feedMode === 'global' 
    ? posts 
    : posts.filter(post => 
        (userProfile?.friends || []).includes(post.uid) || post.uid === currentUserUid
      );

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <button 
          onClick={() => setFeedMode('global')} 
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            feedMode === 'global' 
              ? 'text-white border-b-2 border-orange-500' 
              : 'text-slate-500'
          }`}
        >
          Global
        </button>
        <button 
          onClick={() => setFeedMode('friends')} 
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            feedMode === 'friends' 
              ? 'text-white border-b-2 border-orange-500' 
              : 'text-slate-500'
          }`}
        >
          Amigos
        </button>
      </div>
      
      <div className="flex flex-col gap-6 p-4">
        {filteredPosts.map(post => {
          const author = usersMap[post.uid] || {
            name: 'Parou de fumar',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PF&backgroundColor=gray'
          };
          
          return (
            <PostCard 
              key={post.id} 
              post={post} 
              author={author} 
              usersMap={usersMap} 
              currentUserUid={currentUserUid} 
              onLike={onLike} 
              onComment={onComment} 
              onDelete={onDelete} 
              onNavigateProfile={onNavigateProfile} 
            />
          );
        })}
        
        {filteredPosts.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            Nada aqui... Seja o primeiro a fumar!
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// POST CARD
// ============================================================================
function PostCard({ post, author, usersMap, currentUserUid, onLike, onComment, onDelete, onNavigateProfile }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  
  const isLiked = post.likes?.includes(currentUserUid);
  const isMyPost = post.uid === currentUserUid;
  
  const dateObj = post.timestamp ? new Date(post.timestamp.seconds * 1000) : new Date();
  const dateStr = dateObj.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const activeFrame = author.equipped?.frame 
    ? SHOP_ITEMS.find(i => i.id === author.equipped.frame)?.cssClass 
    : '';
  const activeFilter = author.equipped?.filter 
    ? SHOP_ITEMS.find(i => i.id === author.equipped.filter)?.cssClass 
    : '';

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative">
      {/* Modal de Likes */}
      {showLikesModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
          onClick={() => setShowLikesModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Quem Tossiu</h3>
              <button onClick={() => setShowLikesModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {post.likes && post.likes.length > 0 ? (
                post.likes.map(uid => {
                  const liker = usersMap[uid] || {
                    name: 'Parou de fumar',
                    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PF&backgroundColor=gray'
                  };
                  return (
                    <div 
                      key={uid} 
                      className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors" 
                      onClick={() => {
                        setShowLikesModal(false);
                        onNavigateProfile(uid);
                      }}
                    >
                      <img src={liker.avatar} className="w-8 h-8 rounded-full bg-slate-700" />
                      <span className="font-medium text-slate-200">{liker.name}</span>
                    </div>
                  );
                })
              ) : (
                <p className="p-4 text-center text-slate-500">Ninguém curtiu ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Header do Post */}
      <div className="p-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => onNavigateProfile(author.uid || post.uid)}
        >
          <div className="relative">
            <img 
              src={author.avatar} 
              className={`w-10 h-10 rounded-full bg-slate-800 object-cover ${activeFrame}`} 
            />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-200 flex items-center gap-2">
              {author.name}
              {author.equipped?.title && (
                <span className="text-[10px] text-orange-400 font-bold uppercase bg-slate-950 px-1 rounded">
                  {SHOP_ITEMS.find(i => i.id === author.equipped.title)?.name}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">{dateStr}</p>
          </div>
        </div>
        {isMyPost && (
          <button 
            onClick={() => onDelete(post.id)} 
            className="text-slate-600 hover:text-red-500 p-2 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Mídia do Post (Imagem ou Vídeo) - COM BORDAS ARREDONDADAS */}
      <div className="px-3 pb-2"> {/* Adicionei padding lateral para o arredondamento ficar bonito no card */}
        <div className={`relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] rounded-2xl border border-slate-800/50 ${post.mediaType === 'image' ? activeFilter : ''}`}>
          {post.mediaType === 'video' ? (
            // Usa o novo Player Inteligente
            <VideoPlayer src={post.image} activeFilter={''} hasAudio={post.hasAudio !== false} />
          ) : (
            // Imagem normal com arredondamento
            <img 
              src={post.image} 
              className="w-full h-auto max-h-[500px] object-contain" 
              alt="post" 
            />
          )}
        </div>
      </div>
      
      {/* Legenda */}
      <div className="p-3 pb-2">
        {post.caption && (
          <p className="text-slate-300 text-sm mb-3 leading-relaxed">
            <span className="font-bold text-slate-100">{author.name}</span> {post.caption}
          </p>
        )}
      </div>
      
      {/* Ações (Like e Comentário) */}
      <div className="px-3 pb-3 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onLike(post.id, post.likes || [])} 
              className={`transition-all active:scale-90 ${
                isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wind className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} strokeWidth={2} />
            </button>
            <button 
              onClick={() => setShowLikesModal(true)} 
              className="text-sm font-bold text-slate-200 hover:underline cursor-pointer"
            >
              {post.likes?.length || 0}
            </button>
          </div>
          
          <button 
            onClick={() => setShowComments(!showComments)} 
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>
      
      {/* Seção de Comentários */}
      {showComments && (
        <div className="bg-slate-950/50 p-3 animate-in slide-in-from-top-2">
          <div className="max-h-40 overflow-y-auto space-y-3 mb-3 scrollbar-thin scrollbar-thumb-slate-700 pr-2">
            {post.comments?.map((c, i) => {
              const commenter = usersMap[c.authorUid] || { name: c.author || 'Parou de fumar' };
              return (
                <div key={i} className="text-sm flex gap-2">
                  <span 
                    className="font-bold text-slate-300 shrink-0 cursor-pointer hover:underline" 
                    onClick={() => onNavigateProfile(c.authorUid)}
                  >
                    {commenter.name}
                  </span>
                  <span className="text-slate-400 break-words">{c.text}</span>
                </div>
              );
            })}
            {(!post.comments || post.comments.length === 0) && (
              <p className="text-xs text-slate-600 italic text-center py-2">
                Sem comentários... Solte a fumaça nos comentários.
              </p>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Comente algo..." 
              className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 placeholder-slate-500 outline-none" 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onComment(post.id, commentText);
                  setCommentText('');
                }
              }} 
            />
            <button 
              onClick={() => {
                onComment(post.id, commentText);
                setCommentText('');
              }} 
              className="text-orange-500 hover:text-orange-400 p-2 bg-slate-800 rounded-full transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RANKING
// ============================================================================
function Ranking({ users, title, subtitle, currentUserUid, onNavigateProfile }) {
  return (
    <div className="p-4">
      {title && (
        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
          <Wind className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" />
          <h2 className="text-3xl font-black italic mb-1 tracking-tighter">{title}</h2>
          <p className="text-orange-100 text-sm font-medium opacity-90">{subtitle}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {users.map((user, index) => {
          const level = getLevel(user.xp || 0);
          const isMe = user.uid === currentUserUid;
          
          return (
            <div 
              key={user.uid} 
              onClick={() => onNavigateProfile(user.uid)} 
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:bg-slate-800 ${
                isMe 
                  ? 'bg-slate-800 border-orange-500/50 shadow-md shadow-orange-900/10' 
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center font-black text-lg ${
                index === 0 
                  ? 'text-yellow-400 text-2xl drop-shadow-sm' 
                  : index === 1 
                  ? 'text-slate-300 text-xl' 
                  : index === 2 
                  ? 'text-amber-700 text-xl' 
                  : 'text-slate-600'
              }`}>
                {index <= 2 ? <Trophy className="w-5 h-5" /> : `#${index + 1}`}
              </div>
              
              <img 
                
src={user.avatar} 
                className="w-10 h-10 rounded-full bg-slate-800 object-cover" 
                alt="avatar" 
              />
              
              <div className="flex-1">
                <p className={`font-bold ${isMe ? 'text-orange-400' : 'text-slate-200'}`}>
                  {user.name} 
                  {isMe && (
                    <span className="text-[10px] ml-1 bg-slate-700 px-1.5 py-0.5 rounded text-white">
                      Você
                    </span>
                  )}
                </p>
                <p className={`text-xs ${level.color}`}>{level.title}</p>
              </div>
              
              <div className="text-right">
                <p className="font-black text-white text-lg">
                  {user.cigarettes || 0} <span className="text-xs font-normal text-slate-500">cigs</span>
                </p>
                <p className="text-xs text-slate-500 font-mono">{user.xp || 0} XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// UPLOAD SCREEN
// ============================================================================
function UploadScreen({ onPost, onCancel, userProfile }) {
  const [media, setMedia] = useState(null); // Substitui 'image'
  const [mediaType, setMediaType] = useState('image'); // 'image' ou 'video'
  const [caption, setCaption] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. LIMITE DE TAMANHO (100MB)
    // Cálculo correto: 100 * 1024 * 1024 = 104.857.600 bytes
    const maxSizeInBytes = 100 * 1024 * 1024; 
    
    if (file.size > maxSizeInBytes) {
      toast.error("O arquivo é muito grande! O limite é 100MB.");
      return;
    }

    // 2. VERIFICAÇÃO SE É VÍDEO
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        
        // 3. LIMITE DE TEMPO (15 Segundos)
                if (video.duration > 10) {
          toast.error("Vídeo muito longo! O limite é 15 segundos para não virar palestra.");
          return;
        }
        
        setMediaType('video');
        setMedia(file); // Salva o arquivo pronto para o Cloudinary
      }
      video.src = URL.createObjectURL(file);
      
    } else {
      // Lógica para Imagem (Se não for vídeo)
      setMediaType('image');
      setMedia(await compressImage(file));
    }
  };
  
  const activeFilter = userProfile?.equipped?.filter 
    ? SHOP_ITEMS.find(i => i.id === userProfile.equipped.filter)?.cssClass 
    : '';

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
        <button 
          onClick={onCancel} 
          className="text-slate-400 p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X />
        </button>
        <span className="font-bold text-white">Registrar Fumaça</span>
        <button 
          // Passamos o tipo junto com a mídia
          onClick={() => onPost(media, caption, mediaType, isMuted)} 
          disabled={!media} 
          className={`font-bold px-4 py-1.5 rounded-full transition-colors ${
            media 
              ? 'bg-orange-600 text-white hover:bg-orange-500' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Postar
        </button>
      </div>
      
      <div className="flex-1 flex flex-col p-4 gap-4">
        {!media ? (
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-slate-900 transition-all group"
          >
            <div className="bg-slate-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform group-hover:bg-slate-700">
              <Camera className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-slate-300 font-bold text-lg">Foto ou Vídeo Curto</p>
            <p className="text-slate-500 text-sm mt-1">Máx 15seg ou 100MB</p>
          </div>
        ) : (
          <div className={`flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 ${mediaType === 'image' ? activeFilter : ''}`}>
            
            {/* PRÉ-VISUALIZAÇÃO CORRIGIDA */}
            {mediaType === 'video' ? (
              <>
                <video 
                  src={media instanceof File ? URL.createObjectURL(media) : media} 
                  className="max-w-full max-h-full object-contain" 
                  controls={false} // Tira os controles nativos pra usar o nosso botão
                  autoPlay 
                  loop
                  muted={isMuted} // O vídeo obedece ao estado
                  playsInline
                />
                
                {/* BOTÃO DE MUTE VISUAL */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-full text-white hover:bg-slate-800 transition-all z-20 border border-white/10"
                >
                  {isMuted ? (
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-bold">Sem Som</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-bold">Com Som</span>
                    </div>
                  )}
                </button>
              </>
            ) : (
              <img src={media} className="max-w-full max-h-full object-contain" alt="Preview" />
            )}

            <button 
              onClick={() => { setMedia(null); setMediaType('image'); }} 
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-600/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          // ACEITAR VÍDEO E IMAGEM
          accept="image/*, video/mp4, video/webm" 
          className="hidden" 
          onChange={handleFileChange} 
        />
        
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 focus-within:border-orange-500 transition-colors">
          <input 
            type="text" 
            placeholder="Escreva uma legenda..." 
            className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-lg" 
            value={caption} 
            onChange={e => setCaption(e.target.value)} 
            maxLength={150}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS SCREEN (CORRIGIDA E LIMPA)
// ============================================================================
function SettingsScreen({ profile, onUpdate, onDeleteAccount, onOpenNotifications }) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const fileInputRef = useRef(null);
  
  const handleFileChange = async (e) => {
    if (e.target.files[0]) {
      setAvatar(await compressImage(e.target.files[0]));
    }
  };
  
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-black italic text-white flex items-center gap-2">
        <Settings className="w-6 h-6" /> CONFIGURAÇÕES
      </h2>
      
      {/* Seção de Perfil */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <User className="w-5 h-5" /> Perfil
        </h3>
        
        <div className="flex justify-center">
          <div className="relative">
            <img 
              src={avatar} 
              onClick={() => fileInputRef.current?.click()} 
              className="w-24 h-24 rounded-full border-4 border-slate-700 cursor-pointer hover:opacity-80 transition-opacity object-cover" 
              alt="Avatar"
            />
            <div className="absolute bottom-0 right-0 bg-orange-600 p-2 rounded-full border-2 border-slate-900">
              <Edit2 className="w-3 h-3 text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*"
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>
        
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
          placeholder="Seu nome"
          maxLength={20}
        />
        
        <button 
          onClick={() => onUpdate(name, avatar)} 
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Salvar Alterações
        </button>
      </div>
      
      {/* Seção de Notificações */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notificações
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Receba alertas sobre streak, curtidas e comentários.
          Mantenha sua ofensiva ativa!
        </p>
        <button 
          onClick={onOpenNotifications}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" />
          Configurar Notificações
        </button>
      </div>
      
      {/* Zona de Perigo */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-red-900/50">
        <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Zona de Perigo
        </h3>
        <button 
          onClick={onDeleteAccount} 
          className="w-full bg-red-950/50 hover:bg-red-950 text-red-500 border border-red-900/50 font-bold py-3 rounded-xl flex justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Excluir Conta
        </button>
      </div>
      
      {/* RODAPÉ DA VERSÃO */}
      <div className="text-center pb-8 pt-4">
        <p className="text-slate-600 text-xs font-mono font-bold uppercase tracking-widest opacity-50">
          cigaRats {APP_VERSION}
        </p>
        <p className="text-[10px] text-slate-700 mt-1">
          Feito com 🚬 e ☕
        </p>
      </div>
    </div>
  );
}
// ============================================================================
// NAV BUTTON
// ============================================================================
function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex md:flex-row flex-col items-center md:gap-3 gap-1 p-2 md:px-4 md:py-3 w-16 md:w-full transition-all duration-300 rounded-xl md:hover:bg-slate-800 ${
        active 
          ? 'text-orange-500 md:bg-slate-800' 
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon 
        className={`w-6 h-6 md:w-5 md:h-5 ${
          active 
            ? 'fill-current md:fill-none drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] md:drop-shadow-none' 
            : ''
        }`} 
        strokeWidth={active ? 2.5 : 2} 
      />
      <span className={`text-[10px] md:text-sm font-bold transition-opacity ${
        active ? 'opacity-100' : 'opacity-0 md:opacity-100'
      } md:opacity-100`}>
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// LOGIN SCREEN
// ============================================================================
function LoginScreen({ onGoogle, onGuest }) {
  const [mode, setMode] = useState('main');
  const [name, setName] = useState('');
  
  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full shadow-2xl text-center">
        <Flame className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-4xl font-black italic mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          cigaRats
        </h1>
        <p className="text-slate-400 mb-8 text-sm">A rede social para quem queima um.</p>
        
        {mode === 'main' ? (
          <div className="space-y-3 w-full">
            <button 
              onClick={onGoogle} 
              className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg group"
            >
              <Globe className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              Entrar com Google
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">ou</span>
              </div>
            </div>
            
            <button 
              onClick={() => setMode('guest_form')} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Entrar como Convidado
            </button>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4">
            <input 
              type="text" 
              placeholder="Escolha seu vulgo..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white mb-4 focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-600 text-center font-bold" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              maxLength={15} 
              autoFocus 
            />
            <button 
              onClick={() => onGuest(name)} 
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mb-3"
            >
              Começar
            </button>
            <button 
              onClick={() => setMode('main')} 
              className="text-slate-500 text-xs hover:text-white transition-colors"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}