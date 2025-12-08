// --- CONSUMÍVEIS DA TABACARIA (Boosts e Power-ups) ---

export const CONSUMABLES = [
  {
    id: 'boost_mini',
    type: 'boost',
    name: 'Cigarro Premiado',
    price: 30,
    effect: { xpMultiplier: 1.5, duration: 3600000 }, // 1 hora em ms
    desc: '+50% XP por 1 hora. Para os momentos especiais.',
    icon: '🚬',
    rarity: 'common'
  },
  {
    id: 'boost_mega',
    type: 'boost',
    name: 'Maço da Sorte',
    price: 100,
    effect: { xpMultiplier: 2, duration: 10800000 }, // 3 horas
    desc: '+100% XP por 3 horas. Maratona de fumaça.',
    icon: '📦',
    rarity: 'rare'
  },
  {
    id: 'boost_ultra',
    type: 'boost',
    name: 'Charuto Premium',
    price: 250,
    effect: { xpMultiplier: 3, duration: 21600000 }, // 6 horas
    desc: '+200% XP por 6 horas. Luxo e nicotina.',
    icon: '🎩',
    rarity: 'epic'
  },
  {
    id: 'double_bituca',
    type: 'boost',
    name: 'Bituca Dourada',
    price: 150,
    effect: { bitucaMultiplier: 2, duration: 7200000 }, // 2 horas
    desc: 'Dobra ganho de Bitucas por 2 horas.',
    icon: '💰',
    rarity: 'rare'
  },
  {
    id: 'streak_freeze',
    type: 'protection',
    name: 'Escudo Anti-Recaída',
    price: 200,
    effect: { protectStreak: 1 }, // Protege 1 dia
    desc: 'Protege sua ofensiva por 1 dia caso esqueça de fumar.',
    icon: '🛡️',
    rarity: 'epic'
  },
];

/**
 * Verifica se um boost está ativo
 * @param {Object} boost - Dados do boost { id, activatedAt, effect }
 * @returns {boolean}
 */
export const isBoostActive = (boost) => {
  if (!boost || !boost.activatedAt) return false;
  
  const now = Date.now();
  const elapsed = now - boost.activatedAt;
  
  return elapsed < boost.effect.duration;
};

/**
 * Calcula tempo restante de um boost
 * @param {Object} boost
 * @returns {string} Tempo formatado (ex: "45min")
 */
export const getBoostTimeRemaining = (boost) => {
  if (!isBoostActive(boost)) return "Expirado";
  
  const now = Date.now();
  const remaining = boost.effect.duration - (now - boost.activatedAt);
  const minutes = Math.ceil(remaining / 60000);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  
  return `${minutes}min`;
};

/**
 * Aplica multiplicadores de boosts ativos
 * @param {Array} activeBoosts - Lista de boosts ativos
 * @param {number} baseXP - XP base a ser multiplicado
 * @param {number} baseBitucas - Bitucas base
 * @returns {Object} { xp: number, bitucas: number }
 */
export const applyBoosts = (activeBoosts = [], baseXP = 10, baseBitucas = 10) => {
  let xpMultiplier = 1;
  let bitucaMultiplier = 1;
  
  activeBoosts.forEach(boost => {
    if (isBoostActive(boost)) {
      if (boost.effect.xpMultiplier) {
        xpMultiplier *= boost.effect.xpMultiplier;
      }
      if (boost.effect.bitucaMultiplier) {
        bitucaMultiplier *= boost.effect.bitucaMultiplier;
      }
    }
  });
  
  return {
    xp: Math.floor(baseXP * xpMultiplier),
    bitucas: Math.floor(baseBitucas * bitucaMultiplier),
    multipliers: { xp: xpMultiplier, bitucas: bitucaMultiplier }
  };
};