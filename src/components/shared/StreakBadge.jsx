import React from 'react';
import { Flame } from 'lucide-react';
import { getStreakMessage } from '../../utils/streakUtils';

/**
 * Badge visual da ofensiva (streak)
 * @param {number} streakDays - Dias consecutivos
 * @param {boolean} compact - Versão compacta (apenas ícone)
 * @param {function} onClick - Callback ao clicar
 */
const StreakBadge = ({ streakDays = 0, compact = false, onClick }) => {
  const { message, icon, color } = getStreakMessage(streakDays);
  
  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 border border-slate-700 cursor-pointer hover:scale-105 transition-transform ${streakDays === 0 ? 'opacity-50' : ''}`}
      >
        <Flame className={`w-4 h-4 ${color} ${streakDays > 0 ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-bold ${color}`}>{streakDays}</span>
      </div>
    );
  }
  
  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all ${streakDays === 0 ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className={`w-5 h-5 ${color} ${streakDays > 0 ? 'animate-pulse' : ''}`} />
          <span className="font-bold text-white text-sm">OFENSIVA</span>
        </div>
        <span className={`text-2xl font-black ${color}`}>{streakDays}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs text-slate-400 italic leading-tight">{message}</p>
      </div>
      
      {streakDays === 0 && (
        <div className="mt-2 text-[10px] text-slate-600 bg-slate-950 p-2 rounded">
          💡 Fume por dias consecutivos para construir sua ofensiva!
        </div>
      )}
    </div>
  );
};

export default StreakBadge;