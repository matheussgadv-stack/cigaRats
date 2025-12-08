// --- SISTEMA DE OFENSIVA (STREAK) ---

/**
 * Frases de humor negro baseadas no streak
 */
export const STREAK_MESSAGES = [
  { minDays: 1, message: "Começou mal, mas começou.", icon: "🔥" },
  { minDays: 3, message: "3 dias. Seus pulmões notaram.", icon: "🔥" },
  { minDays: 7, message: "1 semana. Compromisso com o câncer.", icon: "🔥🔥" },
  { minDays: 14, message: "2 semanas. Você é dedicado(a) ao vício.", icon: "🔥🔥" },
  { minDays: 30, message: "1 mês. Parabéns, você é oficialmente dependente.", icon: "🔥🔥🔥" },
  { minDays: 60, message: "2 meses. O SUS agradece a futura clientela.", icon: "🔥🔥🔥" },
  { minDays: 90, message: "3 meses. Seus pulmões são cinzeiros agora.", icon: "🔥🔥🔥🔥" },
  { minDays: 180, message: "6 meses. Metade do ano na fumaça. Literalmente.", icon: "🔥🔥🔥🔥" },
  { minDays: 365, message: "1 ANO! Você fumou todos os dias. Isso é preocupante.", icon: "🔥🔥🔥🔥🔥" },
  { minDays: 500, message: "500 dias. Você vai precisar de um pulmão novo.", icon: "💀🔥" },
  { minDays: 730, message: "2 ANOS! A indústria do tabaco te ama.", icon: "💀🔥🔥" },
  { minDays: 1000, message: "1000 DIAS! Lenda imortal (por enquanto).", icon: "👑🔥🔥🔥" },
];

/**
 * Calcula se o streak está ativo baseado na última postagem
 * @param {Date|number} lastPostDate - Data do último post
 * @returns {boolean}
 */
export const isStreakActive = (lastPostDate) => {
  if (!lastPostDate) return false;
  
  const now = new Date();
  const lastPost = new Date(lastPostDate);
  const diffHours = (now - lastPost) / (1000 * 60 * 60);
  
  // Streak quebra se passou mais de 48 horas (dá uma margem)
  return diffHours <= 48;
};

/**
 * Retorna mensagem e ícone baseado no streak atual
 * @param {number} streakDays - Dias consecutivos
 * @returns {Object} { message: string, icon: string, color: string }
 */
export const getStreakMessage = (streakDays) => {
  if (streakDays === 0) {
    return { 
      message: "Nenhuma ofensiva. Comece a fumar!", 
      icon: "💨", 
      color: "text-slate-500" 
    };
  }
  
  // Encontra a mensagem adequada (maior threshold que o usuário atingiu)
  const milestone = [...STREAK_MESSAGES]
    .reverse()
    .find(m => streakDays >= m.minDays);
  
  return {
    message: milestone?.message || STREAK_MESSAGES[0].message,
    icon: milestone?.icon || "🔥",
    color: streakDays >= 365 ? "text-red-500" : 
           streakDays >= 90 ? "text-orange-500" : 
           streakDays >= 30 ? "text-yellow-500" : "text-green-500"
  };
};

/**
 * Atualiza o streak do usuário
 * @param {Object} userData - Dados do usuário
 * @param {boolean} postedToday - Se postou hoje
 * @returns {Object} { currentStreak: number, lastPostDate: Date }
 */
export const updateStreak = (userData, postedToday = true) => {
  const now = new Date();
  const lastPost = userData.lastPostDate ? new Date(userData.lastPostDate) : null;
  const currentStreak = userData.currentStreak || 0;
  
  if (!lastPost) {
    // Primeira postagem
    return {
      currentStreak: 1,
      lastPostDate: now,
      longestStreak: 1
    };
  }
  
  const lastPostDateOnly = new Date(lastPost).setHours(0, 0, 0, 0);
  const todayDateOnly = new Date(now).setHours(0, 0, 0, 0);
  const diffDays = Math.floor((todayDateOnly - lastPostDateOnly) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Já postou hoje, não incrementa
    return {
      currentStreak,
      lastPostDate: now,
      longestStreak: Math.max(userData.longestStreak || 0, currentStreak)
    };
  } else if (diffDays === 1) {
    // Postou ontem, incrementa streak
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      lastPostDate: now,
      longestStreak: Math.max(userData.longestStreak || 0, newStreak)
    };
  } else {
    // Quebrou o streak (passou mais de 1 dia)
    return {
      currentStreak: 1,
      lastPostDate: now,
      longestStreak: userData.longestStreak || currentStreak
    };
  }
};