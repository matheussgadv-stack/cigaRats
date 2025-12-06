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
];

// Função auxiliar para buscar item por ID
export const getShopItemById = (itemId) => {
  return SHOP_ITEMS.find(item => item.id === itemId);
};

// Função para buscar items por tipo
export const getShopItemsByType = (type) => {
  return SHOP_ITEMS.filter(item => item.type === type);
};