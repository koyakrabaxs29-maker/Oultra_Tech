import React, { useState } from 'react';
import { CafeProvider, useCafe } from './context/CafeContext';
import { Navbar } from './components/Navbar';
import { WaitressView } from './components/WaitressView';
import { KitchenDisplayView } from './components/KitchenDisplayView';
import { CashierView } from './components/CashierView';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { CheckCircle2 } from 'lucide-react';
import { LoginView } from './components/LoginView';

const MainAppContent: React.FC = () => {
  const { activeRole, currentUser, toastMessage } = useCafe();
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBF8F5] text-[#2C1D11]">
        <LoginView />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="bg-[#24150A] text-[#F3D7B5] px-4 py-3 rounded-2xl shadow-2xl border border-[#6E4724] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F5] text-[#2C1D11]">
      {/* Top Navbar with Role Switcher & Brand */}
      <Navbar 
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {activeRole === 'waitress' && <WaitressView />}
        {activeRole === 'chef' && <KitchenDisplayView />}
        {activeRole === 'cashier' && <CashierView />}
        {activeRole === 'owner' && <OwnerDashboardView />}
      </main>

      {/* Floating System Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-[#24150A] text-[#F3D7B5] px-4 py-3 rounded-2xl shadow-2xl border border-[#6E4724] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Notification Center & Kitchen Alert Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CafeProvider>
      <MainAppContent />
    </CafeProvider>
  );
}
