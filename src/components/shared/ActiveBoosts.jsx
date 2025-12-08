import React from 'react';
import { Zap, Clock } from 'lucide-react';
import { isBoostActive, getBoostTimeRemaining } from '../../data/consumables';

/**
 * Exibe boosts ativos do usuário
 * @param {Array} activeBoosts - Lista de boosts ativos
 * @param {boolean} compact - Versão compacta
 */
const ActiveBoosts = ({ activeBoosts = [], compact = false }) => {
  const validBoosts = activeBoosts.filter(boost => isBoostActive(boost));
  
  if (validBoosts.length === 0) return null;
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {validBoosts.map((boost, index) => (
          <div 
            key={index}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700"
          >
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-400">
              {boost.effect.xpMultiplier ? `${boost.effect.xpMultiplier}x XP` : 
               boost.effect.bitucaMultiplier ? `${boost.effect.bitucaMultiplier}x 💰` : 
               'ATIVO'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {validBoosts.map((boost, index) => (
        <div 
          key={index}
          className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-800/50 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-200">
                {boost.effect.xpMultiplier && `+${((boost.effect.xpMultiplier - 1) * 100).toFixed(0)}% XP`}
                {boost.effect.bitucaMultiplier && `+${((boost.effect.bitucaMultiplier - 1) * 100).toFixed(0)}% Bitucas`}
                {boost.effect.protectStreak && `Proteção de Streak`}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-purple-400">
                <Clock className="w-3 h-3" />
                <span>{getBoostTimeRemaining(boost)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-2xl">{boost.icon || '⚡'}</div>
        </div>
      ))}
    </div>
  );
};

export default ActiveBoosts;