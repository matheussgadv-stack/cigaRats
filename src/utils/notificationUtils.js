// src/utils/notificationUtils.js
import { getToken } from "firebase/messaging";
import { messaging, db, USERS_COLLECTION } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

// --- (GERADA NA ABA CLOUD MESSAGING DO FIREBASE "Par de chaves") ---
const VAPID_KEY = "BK6kwy30xUToQumGQNBWO6YjuTWRMgEym24oQ16FrVlALVP_ubrS2_PgRfZ7z39MKCHOmIYkhPidfFqIFe5xfnQ"; 

/**
 * Verifica se o navegador suporta notificações
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Verifica o status atual da permissão ('granted', 'denied', 'default')
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Solicita permissão e, se aceito, pega o Token do Firebase
 * @param {string} uid - ID do usuário logado (para salvar o token no perfil dele)
 */
export const requestNotificationPermission = async (uid) => {
  if (!isNotificationSupported()) {
    console.log("Navegador não suporta notificações push.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Permissão concedida! Buscando token...");
      
      // Pega o endereço digital (Token) do celular
      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
      });

      if (currentToken) {
        console.log("Token gerado:", currentToken);
        
        // Se tiver usuário logado, salva o token no banco de dados
        if (uid) {
          const userRef = doc(db, USERS_COLLECTION, uid);
          await updateDoc(userRef, { 
            fcmToken: currentToken,
            notificationsEnabled: true 
          });
          console.log("Token salvo no perfil do usuário.");
        }
        return true;
      } else {
        console.log("Nenhum token de registro disponível. Peça permissão para gerar um.");
        return false;
      }
    } else {
      console.log("Permissão de notificação negada.");
      return false;
    }
  } catch (error) {
    console.error("Erro ao configurar notificações:", error);
    return false;
  }
};

/**
 * Detecta navegador (apenas visual, mantido do seu código antigo)
 */
export const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('edg')) return 'edge';
  return 'default';
};

// Mantivemos o objeto de guias para o seu Modal não quebrar
export const NOTIFICATION_GUIDES = {
  chrome: { name: 'Google Chrome', icon: '🌐' },
  firefox: { name: 'Mozilla Firefox', icon: '🦊' },
  safari: { name: 'Safari', icon: '🧭' },
  edge: { name: 'Microsoft Edge', icon: '🌊' },
  default: { name: 'Seu Navegador', icon: '🌐' }
};