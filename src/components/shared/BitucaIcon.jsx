import React from 'react';

/**
 * Ícone customizado de "Bituca" (moeda do app)
 * Representa um cigarro apagado com brasa
 */
const BitucaIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Corpo do cigarro */}
    <path 
      d="M17,2H7C5.9,2,5,2.9,5,4v16c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V4C19,2.9,18.1,2,17,2z M7,16h10v4H7V16z M7,14V4h10v10H7z" 
      fillOpacity="0.3" 
    />
    
    {/* Filtro */}
    <path d="M16 5H8v2h8V5zM16 9H8v2h8V9z" />
    
    {/* Brasa (pontos laranja) */}
    <circle cx="9" cy="18" r="1" className="text-orange-500" fill="currentColor" />
    <circle cx="12" cy="19" r="1" className="text-orange-500" fill="currentColor" />
    
    {/* Fumaça decorativa */}
    <path 
      d="M18 20l2 2m-2-2l2-2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      className="text-gray-400 opacity-50" 
    />
  </svg>
);

export default BitucaIcon;