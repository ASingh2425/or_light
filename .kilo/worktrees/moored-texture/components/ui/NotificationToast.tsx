'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Info, X } from 'lucide-react';
import { useGameStore } from '@/lib/store';

export const NotificationToast: React.FC = () => {
  const notification = useGameStore((state) => state.notification);
  const setNotification = useGameStore((state) => state.setNotification);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  if (!notification) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-auto font-mono">
      <div
        className={`px-5 py-3 rounded-xl border-2 text-white shadow-2xl backdrop-blur-xl flex items-center space-x-3 text-xs ${
          notification.type === 'warning'
            ? 'bg-red-950/95 border-red-500'
            : notification.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500'
            : 'bg-cyan-950/95 border-cyan-500'
        }`}
      >
        {notification.type === 'warning' ? (
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
        ) : notification.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        )}
        <span className="font-bold tracking-wide">{notification.message}</span>
        <button
          onClick={() => setNotification(null)}
          className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
