// --- SISTEMA DE MEDALHAS AUTOMÁTICAS ---
export const MEDALS = [
  { 
    id: 'bronze', 
    name: 'Pulmão de Bronze', 
    threshold: 50, 
    icon: '🥉', 
    desc: '50 cigarros fumados.' 
  },
  { 
    id: 'silver', 
    name: 'Pulmão de Prata', 
    threshold: 200, 
    icon: '🥈', 
    desc: '200 cigarros. Haja fôlego.' 
  },
  { 
    id: 'gold', 
    name: 'Pulmão de Ouro', 
    threshold: 500, 
    icon: '🥇', 
    desc: '500 cigarros. Lenda urbana.' 
  },
  { 
    id: 'diamond', 
    name: 'Chaminé Industrial', 
    threshold: 1000, 
    icon: '💎', 
    desc: '1000 cigarros. Como você tá vivo?' 
  },
];

// Função para obter medalhas conquistadas
export const getEarnedMedals = (cigarettesCount) => {
  return MEDALS.filter(medal => cigarettesCount >= medal.threshold);
};

// Função para próxima medalha
export const getNextMedal = (cigarettesCount) => {
  return MEDALS.find(medal => cigarettesCount < medal.threshold);
};