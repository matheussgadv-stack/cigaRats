// src/utils/notificationUtils.js
import { getToken } from "firebase/messaging";
import { messaging, db, USERS_COLLECTION } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

// --- COLE AQUI A SUA VAPID KEY (A QUE VOCÊ GEROU NA ABA CLOUD MESSAGING) ---
const VAPID_KEY = "BK6kwy30xUToQumGQNBWO6YjuTWRMgEym24oQ16FrVlALVP_ubrS2_PgRfZ7z39MKCHOmIYkhPidfFqIFe5xfnQ"; 

/**
 * Verifica se o navegador suporta notificações
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Verifica o status atual da permissão
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Solicita permissão e, se aceito, pega o Token do Firebase
 */
export const requestNotificationPermission = async (uid) => {
  if (!isNotificationSupported()) {
    console.log("Navegador não suporta notificações.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Permissão concedida! Buscando token...");
      
      // Tenta pegar o token do Firebase (Push)
      try {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken && uid) {
          console.log("Token gerado:", currentToken);
          const userRef = doc(db, USERS_COLLECTION, uid);
          await updateDoc(userRef, { 
            fcmToken: currentToken,
            notificationsEnabled: true 
          });
        }
      } catch (err) {
        console.warn("Erro ao pegar token do Firebase (pode ser localhost):", err);
        // Não retorna false aqui, pois a permissão local foi concedida
      }
      return true;
    }
  } catch (error) {
    console.error("Erro ao configurar notificações:", error);
  }
  return false;
};

// ============================================================================
// NOTIFICAÇÕES LOCAIS (RESTAURADO)
// ============================================================================

/**
 * Envia notificação local simples
 */
export const sendNotification = (title, options = {}) => {
  if (getNotificationPermission() !== 'granted') return null;
  
  const defaultOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    ...options
  };
  
  try {
    return new Notification(title, defaultOptions);
  } catch (error) {
    console.error('Erro ao enviar notificação local:', error);
    return null;
  }
};

/**
 * Objeto com as mensagens padrão do app (O QUE FALTAVA)
 */
export const cigaRatsNotifications = {
  streakReminder: () => {
    sendNotification('🔥 Sua ofensiva está em risco!', {
      body: 'Você não fumou hoje. Mantenha o streak vivo!',
      tag: 'streak-reminder',
      requireInteraction: false
    });
  },
  
  streakBroken: (days) => {
    sendNotification('💔 Ofensiva perdida!', {
      body: `Seu streak de ${days} dias acabou. Comece de novo!`,
      tag: 'streak-broken'
    });
  },
  
  levelUp: (newLevel) => {
    sendNotification('🎉 Level Up!', {
      body: `Você alcançou: ${newLevel}`,
      tag: 'level-up'
    });
  },
  
  newComment: (authorName, postId) => {
    sendNotification('💬 Novo comentário', {
      body: `${authorName} comentou na sua foto`,
      tag: `comment-${postId}`,
      data: { type: 'comment', postId }
    });
  },
  
  newLike: (likerName) => {
    sendNotification('❤️ Nova curtida', {
      body: `${likerName} curtiu sua foto`,
      tag: 'new-like'
    });
  },
  
  boostExpiring: (boostName, minutes) => {
    sendNotification('⏰ Boost expirando!', {
      body: `"${boostName}" acaba em ${minutes} minutos`,
      tag: 'boost-expiring'
    });
  }
};

// ============================================================================
// UTILITÁRIOS DE NAVEGADOR
// ============================================================================
export const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('edg')) return 'edge';
  return 'default';
};

export const NOTIFICATION_GUIDES = {
  chrome: { name: 'Google Chrome', icon: '🌐', steps: ['Clique no cadeado 🔒', 'Permissões > Notificações', 'Permitir'] },
  firefox: { name: 'Mozilla Firefox', icon: '🦊', steps: ['Clique no ícone (i)', 'Permissões', 'Permitir'] },
  safari: { name: 'Safari', icon: '🧭', steps: ['Ajustes do Safari', 'Sites > Notificações', 'Permitir'] },
  edge: { name: 'Microsoft Edge', icon: '🌊', steps: ['Clique no cadeado', 'Permissões', 'Ativar Notificações'] },
  default: { name: 'Seu Navegador', icon: '🌐', steps: ['Configurações do site', 'Permitir notificações'] }
};