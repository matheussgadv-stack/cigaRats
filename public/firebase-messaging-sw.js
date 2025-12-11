importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Configuração básica (Pode copiar do seu firebase.js, mas aqui precisa ser hardcoded)
// Substitua pelos SEUS dados do firebaseConfig (lá do console)
firebase.initializeApp({
  apiKey: "AIzaSyAu4CdKcPyB3Cp-EOgH_IXC_Iunip9L3wo",
  authDomain: "cigarats-cjaia1urm.firebaseapp.com",
  projectId: "cigarats-cjaia1urm",
  storageBucket: "cigarats-cjaia1urm.appspot.com",
  messagingSenderId: "15257458742",
  appId: "1:15257458742:web:cb7e0b55f5a705fdcde097"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em 2o plano: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png', // Seu ícone
    badge: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});