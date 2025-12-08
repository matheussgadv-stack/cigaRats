// --- CATÁLOGO DA TABACARIA ---
export const SHOP_ITEMS = [
  // FRAMES (Molduras de Avatar)
  { 
    id: 'frame_neon', 
    type: 'frame', 
    name: 'Vibe Radioativa', 
    price: 50, 
    cssClass: 'ring-4 ring-green-400 shadow-[0_0_10px_#4ade80]', 
    desc: 'Brilha no escuro (mentira).' 
  },
  { 
    id: 'frame_fire', 
    type: 'frame', 
    name: 'Em Chamas', 
    price: 100, 
    cssClass: 'ring-4 ring-orange-600 shadow-[0_0_15px_#ea580c]', 
    desc: 'Literalmente pegando fogo.' 
  },
  { 
    id: 'frame_gold', 
    type: 'frame', 
    name: 'Rei do Camelo', 
    price: 300, 
    cssClass: 'ring-4 ring-yellow-400 border-yellow-200 shadow-xl', 
    desc: 'Ostentação pura.' 
  },
  
  // FRAMES PREMIUM (Skins Complexas)
  { 
    id: 'frame_rainbow', 
    type: 'frame', 
    name: 'Vibe Psicodélica', 
    price: 500, 
    cssClass: 'ring-4 ring-offset-2 ring-purple-500 animate-pulse shadow-[0_0_20px_#a855f7]', 
    desc: 'Fumou algo diferente hoje?',
    rarity: 'epic'
  },
  { 
    id: 'frame_skull', 
    type: 'frame', 
    name: 'Caveira Mortífera', 
    price: 750, 
    cssClass: 'ring-4 ring-red-600 border-red-900 shadow-[0_0_25px_#dc2626]', 
    desc: 'Para os que aceitaram o destino.',
    rarity: 'legendary'
  },
  { 
    id: 'frame_diamond', 
    type: 'frame', 
    name: 'Diamante Cintilante', 
    price: 1000, 
    cssClass: 'ring-4 ring-cyan-400 border-cyan-200 shadow-[0_0_30px_#22d3ee] animate-pulse', 
    desc: 'O ápice da ostentação tabagista.',
    rarity: 'legendary'
  },
  
  // FILTROS (Efeitos de Imagem)
  { 
    id: 'filter_noir', 
    type: 'filter', 
    name: 'Noir Depressivo', 
    price: 75, 
    cssClass: 'grayscale contrast-125', 
    desc: 'Para momentos reflexivos.' 
  },
  { 
    id: 'filter_toxic', 
    type: 'filter', 
    name: 'Névoa Tóxica', 
    price: 75, 
    cssClass: 'sepia hue-rotate-90 saturate-200', 
    desc: 'Parece que você fuma urânio.' 
  },
  
  // FILTROS PREMIUM
  { 
    id: 'filter_cyberpunk', 
    type: 'filter', 
    name: 'Cyber Smoke', 
    price: 200, 
    cssClass: 'saturate-150 hue-rotate-180 contrast-110 brightness-110', 
    desc: 'Fumaça do futuro distópico.',
    rarity: 'epic'
  },
  { 
    id: 'filter_vintage', 
    type: 'filter', 
    name: 'Fumante Vintage', 
    price: 150, 
    cssClass: 'sepia brightness-90 contrast-125', 
    desc: 'Nostálgico como os pulmões do seu avô.',
    rarity: 'rare'
  },
  
  // TÍTULOS (Badges Especiais)
  { 
    id: 'title_sus', 
    type: 'title', 
    name: 'Futuro Cliente do SUS', 
    price: 150, 
    desc: 'Título honesto.' 
  },
  { 
    id: 'title_oms', 
    type: 'title', 
    name: 'Terror da OMS', 
    price: 200, 
    desc: 'Ameaça à saúde pública.' 
  },
  { 
    id: 'title_investor', 
    type: 'title', 
    name: 'Sócio da Souza Cruz', 
    price: 500, 
    desc: 'Você pagou o iate do dono.' 
  },
  
  // TÍTULOS PREMIUM
  { 
    id: 'title_legend', 
    type: 'title', 
    name: 'Lenda da Nicotina', 
    price: 800, 
    desc: 'Todos te conhecem pela tosse.',
    rarity: 'legendary'
  },
  { 
    id: 'title_dragon', 
    type: 'title', 
    name: 'Dragão de Alcatrão', 
    price: 600, 
    desc: 'Cospe fumaça como ninguém.',
    rarity: 'epic'
  },
];

// Função auxiliar para buscar item por ID
export const getShopItemById = (itemId) => {
  return SHOP_ITEMS.find(item => item.id === itemId);
};

// Função para buscar items por tipo
export const getShopItemsByType = (type) => {
  return SHOP_ITEMS.filter(item => item.type === type);
};