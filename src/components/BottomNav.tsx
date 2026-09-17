import React from 'react';
import { Home, Search, Navigation2, Map } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  nearbyCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  nearbyCount,
}) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'search' as ActiveTab, label: 'Search', icon: Search },
    { id: 'nearby' as ActiveTab, label: 'Nearby', icon: Navigation2, badge: nearbyCount },
    { id: 'map' as ActiveTab, label: 'Map', icon: Map },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 sm:hidden pb-[env(safe-area-inset-bottom,4px)] shadow-lg"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`nav-tab-${t.id}`}
              type="button"
              onClick={() => onChangeTab(t.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-sky-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-sky-600 text-[10px] font-bold text-white flex items-center justify-center leading-none">
                    {t.badge > 99 ? '99+' : t.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">{t.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-1 rounded-full bg-sky-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
