import React from 'react';
import { X, Bell, CheckCircle } from 'lucide-react';
import { NOTIFICATION_GUIDES, detectBrowser } from '../utils/notificationUtils';

/**
 * Modal com guia de ativação de notificações
 */
const NotificationGuideModal = ({ isOpen, onClose, currentPermission }) => {
  if (!isOpen) return null;
  
  const browserKey = detectBrowser();
  const guide = NOTIFICATION_GUIDES[browserKey];
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Notificações</h2>
              <p className="text-orange-100 text-sm">Nunca perca um cigarro</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {currentPermission === 'granted' ? (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-bold text-sm">Notificações Ativas!</p>
                <p className="text-green-300 text-xs">Você receberá alertas importantes.</p>
              </div>
            </div>
          ) : currentPermission === 'denied' ? (
            <>
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-400 font-bold text-sm mb-2">⚠️ Notificações Bloqueadas</p>
                <p className="text-red-300 text-xs">Você bloqueou as notificações. Siga o guia abaixo para ativar:</p>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{guide.icon}</span>
                  <p className="font-bold text-white text-sm">{guide.name}</p>
                </div>
                
                <ol className="space-y-2 list-decimal list-inside">
                  {guide.steps.map((step, index) => (
                    <li key={index} className="text-xs text-slate-300 leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-300 text-sm mb-3">
                Ative as notificações para receber:
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>🔥 Alertas de streak em risco</li>
                <li>💬 Novos comentários e curtidas</li>
                <li>⏰ Boosts expirando</li>
                <li>🏆 Conquistas desbloqueadas</li>
              </ul>
            </div>
          )}
          
          {/* Footer */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[10px] text-slate-600 text-center">
              💡 As notificações só funcionam quando o navegador está aberto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationGuideModal;