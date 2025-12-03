import React, { useState, useEffect, useRef } from 'react';
import { Camera, MessageCircle, Trophy, Flame, Wind, User, Send, X, PlusCircle, LogOut, Globe, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
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
  setDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE (COLE SUAS CHAVES AQUI) ---
// Substitua tudo dentro deste objeto pelo que você copiou no console do Firebase
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

// Coleções (Nomes simples para o banco real)
const USERS_COLLECTION = 'users';
const POSTS_COLLECTION = 'posts';

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

// --- COMPONENTES ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('loading');
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inicialização de Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Verificar se o usuário já tem perfil
        const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
          setView('feed');
        } else {
          // Se for login via Google mas ainda não tem registro no banco
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

  // Listeners de Dados
  useEffect(() => {
    if (!user) return;

    const qPosts = query(collection(db, POSTS_COLLECTION), orderBy('timestamp', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Erro posts:", error));

    const qUsers = query(collection(db, USERS_COLLECTION));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      usersData.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      setLeaderboard(usersData);
      
      const myProfile = usersData.find(u => u.uid === user.uid);
      if (myProfile) setUserProfile(myProfile);
    }, (error) => console.error("Erro ranking:", error));

    return () => {
      unsubPosts();
      unsubUsers();
    };
  }, [user]);

  // --- AÇÕES ---

  const handleCreateGoogleProfile = async (googleUser) => {
    try {
      const userData = {
        uid: googleUser.uid,
        name: googleUser.displayName || "Fumante Misterioso",
        xp: 0,
        cigarettes: 0,
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.uid}`,
        joinedAt: serverTimestamp(),
        authMethod: 'google'
      };
      await setDoc(doc(db, USERS_COLLECTION, googleUser.uid), userData);
      setUserProfile(userData);
      setView('feed');
    } catch (e) {
      console.error("Erro criar perfil Google:", e);
    }
  };

  const handleCreateGuestProfile = async (nickname) => {
    if (!nickname.trim()) return;
    try {
      if (!auth.currentUser) {
        // Se a sessão caiu, tenta logar de novo
        await signInAnonymously(auth);
      }
      
      // Aguarda um momento para garantir que o auth state atualizou
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userData = {
        uid: currentUser.uid,
        name: nickname,
        xp: 0,
        cigarettes: 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}&backgroundColor=b6e3f4`,
        joinedAt: serverTimestamp(),
        authMethod: 'anonymous'
      };
      await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), userData);
      setUserProfile(userData);
      setView('feed');
    } catch (e) {
      console.error("Erro criar perfil convidado:", e);
      alert("Erro ao criar perfil. Tente recarregar a página.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro login Google:", error);
      alert("Erro ao entrar com Google. Verifique se o domínio está autorizado no Firebase Console.");
    }
  };

  const handleGuestLogin = async (nickname) => {
     try {
        await signInAnonymously(auth);
        await handleCreateGuestProfile(nickname);
     } catch (error) {
        console.error("Erro login anônimo:", error);
     }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setPosts([]);
    setLeaderboard([]);
    setView('login');
  };

  const handlePost = async (imageData, caption) => {
    if (!imageData) return;
    try {
      await addDoc(collection(db, POSTS_COLLECTION), {
        uid: user.uid,
        authorName: userProfile.name,
        authorAvatar: userProfile.avatar,
        image: imageData,
        caption: caption,
        timestamp: serverTimestamp(),
        likes: [],
        comments: []
      });
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, { cigarettes: increment(1), xp: increment(10) });
      setView('feed');
    } catch (e) { console.error(e); }
  };

  const handleLike = async (postId, currentLikes) => {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const isLiked = currentLikes.includes(user.uid);
    if (isLiked) {
      await updateDoc(postRef, { likes: currentLikes.filter(id => id !== user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  const handleComment = async (postId, text) => {
    if (!text.trim()) return;
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const newComment = { author: userProfile.name, text: text, timestamp: Date.now() };
    await updateDoc(postRef, { comments: arrayUnion(newComment) });
  };

  if (loading) return <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white font-bold animate-pulse">Carregando cigaRats...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-800">
      
      {view === 'login' && (
        <LoginScreen onGoogle={handleGoogleLogin} onGuest={handleGuestLogin} />
      )}

      {view !== 'login' && (
        <>
          <header className="bg-slate-900/90 backdrop-blur-md p-4 sticky top-0 z-10 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Flame className="text-orange-500 w-6 h-6 animate-pulse" />
              <h1 className="text-xl font-black tracking-tighter italic bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">cigaRats</h1>
            </div>
            {userProfile && (
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 text-xs font-bold border border-slate-700">
                  <span className="text-orange-400">{userProfile.cigarettes} 🚬</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-purple-400">{userProfile.xp} XP</span>
                </div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
              </div>
            )}
          </header>

          <main className="pb-20">
            {view === 'feed' && <Feed posts={posts} currentUserUid={user?.uid} onLike={handleLike} onComment={handleComment} />}
            {view === 'ranking' && <Ranking leaderboard={leaderboard} currentUserUid={user?.uid} />}
            {view === 'upload' && <UploadScreen onPost={handlePost} onCancel={() => setView('feed')} />}
          </main>

          {view !== 'upload' && (
            <nav className="fixed bottom-0 w-full max-w-md bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-20 safe-area-bottom">
              <NavButton icon={Wind} label="Feed" active={view === 'feed'} onClick={() => setView('feed')} />
              <div className="relative -top-6">
                <button 
                  onClick={() => setView('upload')}
                  className="bg-orange-600 hover:bg-orange-500 text-white rounded-full p-4 shadow-lg shadow-orange-900/50 transition-transform active:scale-95 border-4 border-slate-950"
                >
                  <PlusCircle className="w-8 h-8" />
                </button>
              </div>
              <NavButton icon={Trophy} label="Rank" active={view === 'ranking'} onClick={() => setView('ranking')} />
            </nav>
          )}
        </>
      )}
    </div>
  );
}

// --- TELAS ---

function LoginScreen({ onGoogle, onGuest }) {
  const [mode, setMode] = useState('main'); // main, guest_form
  const [name, setName] = useState('');

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full shadow-2xl text-center">
        <Flame className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-4xl font-black italic mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">cigaRats</h1>
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
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">ou</span></div>
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
              className="text-slate-500 text-xs hover:text-white"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-xs text-slate-600 max-w-xs text-center">
        Nota: Login Google garante que você não perca seu Ranking ao limpar o celular.
      </p>
    </div>
  );
}

function Feed({ posts, currentUserUid, onLike, onComment }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Wind className="w-12 h-12 mb-2 opacity-20" />
        <p>Ninguém fumou ainda hoje...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post} 
          currentUserUid={currentUserUid} 
          onLike={onLike}
          onComment={onComment}
        />
      ))}
    </div>
  );
}

function PostCard({ post, currentUserUid, onLike, onComment }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  const isLiked = post.likes?.includes(currentUserUid);
  const date = post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : '...';

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
      <div className="p-3 flex items-center gap-3">
        <img src={post.authorAvatar} className="w-10 h-10 rounded-full bg-slate-800 object-cover border border-slate-700" alt="avatar" />
        <div>
          <p className="font-bold text-sm text-slate-200">{post.authorName}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            {date} <span className="w-1 h-1 rounded-full bg-slate-600"></span> via {post.uid === currentUserUid ? 'Você' : 'cigaRats'}
          </p>
        </div>
      </div>

      <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
        <img src={post.image} className="w-full h-auto max-h-[500px] object-contain" alt="post" />
      </div>

      <div className="p-3 pb-2">
         {post.caption && (
             <p className="text-slate-300 text-sm mb-3 leading-relaxed"><span className="font-bold text-slate-100">{post.authorName}</span> {post.caption}</p>
         )}
      </div>

      <div className="px-3 pb-3 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex gap-6">
          <button 
            onClick={() => onLike(post.id, post.likes || [])}
            className={`flex items-center gap-2 text-sm transition-all active:scale-90 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
          >
            <Wind className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} strokeWidth={2} />
            <span className="font-bold">{post.likes?.length || 0}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-slate-950/50 p-3 animate-in slide-in-from-top-2">
          <div className="max-h-40 overflow-y-auto space-y-3 mb-3 scrollbar-thin scrollbar-thumb-slate-700 pr-2">
            {post.comments?.map((c, i) => (
              <div key={i} className="text-sm flex gap-2">
                <span className="font-bold text-slate-300 shrink-0">{c.author}</span>
                <span className="text-slate-400 break-words">{c.text}</span>
              </div>
            ))}
            {(!post.comments || post.comments.length === 0) && (
              <p className="text-xs text-slate-600 italic text-center py-2">Sem comentários... Solte a fumaça nos comentários.</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Comente algo..." 
              className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 placeholder-slate-500"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
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
              className="text-orange-500 hover:text-orange-400 p-2 bg-slate-800 rounded-full"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Ranking({ leaderboard, currentUserUid }) {
  return (
    <div className="p-4">
      <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
        <Wind className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" />
        <h2 className="text-3xl font-black italic mb-1 tracking-tighter">RANKING</h2>
        <p className="text-orange-100 text-sm font-medium opacity-90">Quem vai precisar de um pulmão novo primeiro?</p>
      </div>

      <div className="space-y-3">
        {leaderboard.map((user, index) => {
          const level = getLevel(user.xp || 0);
          const isMe = user.uid === currentUserUid;
          return (
            <div key={user.uid} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isMe ? 'bg-slate-800 border-orange-500/50 shadow-md shadow-orange-900/10' : 'bg-slate-900 border-slate-800'}`}>
              <div className={`w-8 h-8 flex items-center justify-center font-black text-lg ${index === 0 ? 'text-yellow-400 text-2xl drop-shadow-sm' : index === 1 ? 'text-slate-300 text-xl' : index === 2 ? 'text-amber-700 text-xl' : 'text-slate-600'}`}>
                {index <= 2 ? <Trophy className="w-5 h-5" /> : `#${index + 1}`}
              </div>
              
              <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-800 object-cover" alt="avatar" />
              
              <div className="flex-1">
                <p className={`font-bold ${isMe ? 'text-orange-400' : 'text-slate-200'}`}>
                  {user.name} {isMe && <span className="text-[10px] ml-1 bg-slate-700 px-1.5 py-0.5 rounded text-white">Você</span>}
                </p>
                <p className={`text-xs ${level.color}`}>{level.title}</p>
              </div>

              <div className="text-right">
                <p className="font-black text-white text-lg">{user.cigarettes || 0} <span className="text-xs font-normal text-slate-500">cigs</span></p>
                <p className="text-xs text-slate-500 font-mono">{user.xp || 0} XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadScreen({ onPost, onCancel }) {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setImage(compressed);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col animate-in fade-in duration-200">
      <div className="p-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
        <button onClick={onCancel} className="text-slate-400 p-2 hover:bg-slate-800 rounded-full"><X /></button>
        <span className="font-bold text-white">Registrar Fumaça</span>
        <button 
          onClick={() => onPost(image, caption)} 
          disabled={!image}
          className={`font-bold px-4 py-1.5 rounded-full transition-colors ${image ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}
        >
          Postar
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-slate-900 transition-all group"
          >
            <div className="bg-slate-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform group-hover:bg-slate-700">
              <Camera className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-slate-300 font-bold text-lg">Tirar foto</p>
            <p className="text-slate-500 text-sm mt-1">Registre o momento do câncer</p>
          </div>
        ) : (
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
            <img src={image} className="max-w-full max-h-full object-contain" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-600/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
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
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 w-16 transition-all duration-300 ${active ? 'text-orange-500 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <Icon className={`w-6 h-6 ${active ? 'fill-current drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : ''}`} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] font-bold transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  );
}