// --- CONSTANTES E DADOS DO JOGO ---

export const LEVELS = [
    { min: 0, title: 'Pulmão Virgem', color: 'text-slate-400' },
    { min: 100, title: 'Tossidor Iniciante', color: 'text-green-400' },
    { min: 500, title: 'Chaminé Humana', color: 'text-yellow-400' },
    { min: 1000, title: 'Rei do Alcatrão', color: 'text-orange-500' },
    { min: 2000, title: 'Entidade de Fumaça', color: 'text-red-600' },
    { min: 5000, title: 'Vulto da Neblina', color: 'text-purple-500' }
  ];
  
export const MEDALS = [
    { id: 'first_pack', name: 'Primeiro Maço', desc: 'Fumou 20 cigarros.', threshold: 20, icon: '📦' },
    { id: 'cancer_bronze', name: 'Tosse Seca', desc: 'Fumou 100 cigarros.', threshold: 100, icon: '🥉' },
    { id: 'cancer_silver', name: 'Pulmão Preto', desc: 'Fumou 500 cigarros.', threshold: 500, icon: '🥈' },
    { id: 'cancer_gold', name: 'Chaminé', desc: 'Fumou 1.000 cigarros.', threshold: 1000, icon: '🥇' },
    { id: 'legend', name: 'Lenda do Câncer', desc: 'Fumou 5.000 cigarros.', threshold: 5000, icon: '👑' }
];

export const SHOP_ITEMS = [
    { id: 'frame_neon', type: 'frame', name: 'Moldura Neon', desc: 'Brilha no escuro.', price: 50, cssClass: 'border-2 border-green-400 shadow-[0_0_10px_green]' },
    { id: 'frame_fire', type: 'frame', name: 'Moldura de Fogo', desc: 'Pegando fogo.', price: 150, cssClass: 'border-2 border-red-500 shadow-[0_0_10px_red]' },
    { id: 'title_boss', type: 'title', name: 'O Chefão', desc: 'Título exclusivo abaixo do nome.', price: 300, cssClass: '' },
    { id: 'filter_bw', type: 'filter', name: 'Noir', desc: 'Filtro Preto e Branco para fotos.', price: 100, cssClass: 'grayscale' },
    { id: 'filter_sepia', type: 'filter', name: 'Velho Oeste', desc: 'Filtro Sépia para fotos.', price: 100, cssClass: 'sepia' },
    { id: 'skin_cyber', type: 'frame', name: 'Cyberpunk', desc: 'Futurista e caro.', price: 1000, cssClass: 'border-4 border-cyan-400 shadow-[0_0_15px_cyan]' },
    { id: 'skin_gold', type: 'frame', name: 'Ouro Puro', desc: 'Ostentação máxima.', price: 5000, cssClass: 'border-4 border-yellow-400 shadow-[0_0_15px_gold]' },
    { id: 'filter_glitch', type: 'filter', name: 'Glitch', desc: 'Visual bugado.', price: 800, cssClass: 'grayscale contrast-125 brightness-90 hue-rotate-15' }
];

export const CONSUMABLES = [
    { id: 'boost_coffee', type: 'consumable', name: 'Café Preto', desc: 'Aumenta ganho de XP em 1.5x por 30 min.', price: 50, duration: 1800, multiplier: 1.5, icon: '☕' },
    { id: 'boost_energy', type: 'consumable', name: 'Energético Duvidoso', desc: 'Aumenta ganho de XP em 2x por 1 hora.', price: 120, duration: 3600, multiplier: 2.0, icon: '⚡' },
    { id: 'boost_vape', type: 'consumable', name: 'Vape de Guaraná', desc: 'Aumenta XP em 3x por 2h (Cuidado!).', price: 300, duration: 7200, multiplier: 3.0, icon: '💨' }
];

export const getLevel = (xp) => LEVELS.reverse().find(l => xp >= l.min) || LEVELS[LEVELS.length - 1];