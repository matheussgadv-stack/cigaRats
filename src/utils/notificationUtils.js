// --- SISTEMA DE NOTIFICAÇÕES DO NAVEGADOR ---

/**
 * Verifica se notificações são suportadas
 * @returns {boolean}
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Verifica permissão atual
 * @returns {string} 'granted' | 'denied' | 'default'
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Solicita permissão de notificação
 * @returns {Promise<string>} Permissão concedida
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    throw new Error('Notificações não suportadas neste navegador');
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return 'denied';
  }
};

/**
 * Envia notificação local
 * @param {string} title - Título da notificação
 * @param {Object} options - Opções da notificação
 */
export const sendNotification = (title, options = {}) => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Permissão de notificação negada');
    return null;
  }
  
  const defaultOptions = {
    icon: '/vite.svg', // Ícone do app
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    ...options
  };
  
  try {
    return new Notification(title, defaultOptions);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return null;
  }
};

/**
 * Notificações específicas do cigaRats
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

/**
 * Guia de ativação por navegador
 */
export const NOTIFICATION_GUIDES = {
  chrome: {
    name: 'Google Chrome',
    steps: [
      'Clique no ícone de cadeado 🔒 na barra de endereço',
      'Procure por "Notificações"',
      'Selecione "Permitir"',
      'Recarregue a página'
    ],
    icon: '🌐'
  },
  firefox: {
    name: 'Mozilla Firefox',
    steps: [
      'Clique no ícone (i) na barra de endereço',
      'Vá em "Permissões"',
      'Ao lado de "Notificações", clique em "Bloquear" e mude para "Permitir"',
      'Recarregue a página'
    ],
    icon: '🦊'
  },
  safari: {
    name: 'Safari',
    steps: [
      'Abra Preferências do Safari',
      'Vá em "Sites" > "Notificações"',
      'Encontre cigarats e permita',
      'Recarregue a página'
    ],
    icon: '🧭'
  },
  edge: {
    name: 'Microsoft Edge',
    steps: [
      'Clique no cadeado na barra de endereço',
      'Clique em "Permissões para este site"',
      'Ative "Notificações"',
      'Recarregue a página'
    ],
    icon: '🌊'
  },
  default: {
    name: 'Seu Navegador',
    steps: [
      'Procure pelo ícone de configurações na barra de endereço',
      'Encontre as configurações de "Notificações"',
      'Permita notificações para este site',
      'Recarregue a página'
    ],
    icon: '🌐'
  }
};

/**
 * Detecta navegador do usuário
 * @returns {string} Nome do navegador
 */
export const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('edg')) return 'edge';
  
  return 'default';
};