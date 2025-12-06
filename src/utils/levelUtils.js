// --- SISTEMA DE NÍVEIS E XP ---

export const LEVEL_TIERS = [
  { maxXP: 50, title: "Fumante de Fim de Semana", color: "text-gray-400" },
  { maxXP: 150, title: "Pulmão de Aço", color: "text-green-400" },
  { maxXP: 300, title: "Chaminé Humana", color: "text-yellow-400" },
  { maxXP: 600, title: "Dragão Urbano", color: "text-orange-500" },
  { maxXP: Infinity, title: "Lorde da Nicotina", color: "text-red-600 font-bold" }
];

/**
 * Calcula o nível e título do usuário baseado no XP
 * @param {number} xp - Total de XP do usuário
 * @returns {Object} { title: string, color: string }
 */
export const getLevel = (xp) => {
  const tier = LEVEL_TIERS.find(tier => xp < tier.maxXP);
  return tier || LEVEL_TIERS[LEVEL_TIERS.length - 1];
};

/**
 * Calcula progresso até próximo nível
 * @param {number} xp - XP atual
 * @returns {Object} { current: number, next: number, percentage: number }
 */
export const getLevelProgress = (xp) => {
  const currentTierIndex = LEVEL_TIERS.findIndex(tier => xp < tier.maxXP);
  if (currentTierIndex === -1 || currentTierIndex === 0) {
    return { current: xp, next: LEVEL_TIERS[0].maxXP, percentage: 0 };
  }
  
  const prevTier = LEVEL_TIERS[currentTierIndex - 1];
  const currentTier = LEVEL_TIERS[currentTierIndex];
  const progress = xp - prevTier.maxXP;
  const total = currentTier.maxXP - prevTier.maxXP;
  const percentage = Math.round((progress / total) * 100);
  
  return { 
    current: progress, 
    next: total, 
    percentage: Math.min(percentage, 100) 
  };
};