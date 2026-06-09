import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAuth, CurrentView } from './types';
import LandingPage from './components/LandingPage';
import AuthScreens from './components/AuthScreens';
import PaywallScreen from './components/PaywallScreen';
import RpgAppView from './components/RpgAppView';
import ProjectorWindowView from './components/ProjectorWindowView';
import TavernaForgeCore from './components/TavernaForgeCore';

export default function App() {
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [showPaymentConfirmedModal, setShowPaymentConfirmedModal] = useState<boolean>(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasSuccessSearch = searchParams.get('payment') === 'confirmed' || 
                              searchParams.get('status') === 'paid' || 
                              searchParams.get('payment_success') === 'true';
    const hasSuccessHash = window.location.hash.includes('payment=confirmed') || 
                           window.location.hash.includes('status=paid');
                           
    if (hasSuccessSearch || hasSuccessHash) {
      setShowPaymentConfirmedModal(true);
    }
  }, []);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash.startsWith('#projector') || window.location.search.includes('projector=true')) {
        setIsProjectorMode(true);
      } else {
        setIsProjectorMode(false);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // SaaS Auth state
  const [userAuth, setUserAuth] = useState<UserAuth>({
    loggedIn: false,
    email: '',
    subscriptionStatus: 'inactive'
  });

  // Routing
  const [currentView, setCurrentView] = useState<CurrentView>('landing');

  // Sistema inteligente de convite por link: se detectar a sala, força a view direta sem passar por paywall
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room') && params.get('role') === 'jogador') {
      setCurrentView('forge');
    }
  }, []);

  // Defensivas e Guarda de Redirecionamento 
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room') && params.get('role') === 'jogador') return; // Bloqueia a expulsão automática se for jogador convidado

    const emailKey = userAuth.email ? userAuth.email.toLowerCase() : '';
    const isPremium = emailKey === 'xalemaoxoldschool@gmail.com' || 
                      emailKey === 'mestre.premium@taverna.com' ||
                      localStorage.getItem('vtt_premium_paid_' + emailKey) === 'true' ||
                      localStorage.getItem('taverna_digital_premium') === 'true';

    if (!userAuth.loggedIn && (currentView === 'app' || currentView === 'forge' || currentView === 'paywall')) {
      setCurrentView('landing');
    }
    
    if (userAuth.loggedIn && userAuth.subscriptionStatus === 'inactive' && !isPremium && (currentView === 'app' || currentView === 'forge')) {
      setCurrentView('paywall');
    }

    if (userAuth.loggedIn && (userAuth.subscriptionStatus === 'active' || userAuth.subscriptionStatus === 'trial' || isPremium) && 
       (currentView === 'login' || currentView === 'register' || currentView === 'landing' || currentView === 'paywall')) {
      setCurrentView('app');
    }
  }, [userAuth.loggedIn, userAuth.subscriptionStatus, currentView, userAuth.email]);

  const handleLoginSuccess = (email: string, subscriptionStatus: 'active' | 'inactive' | 'trial') => {
    setUserAuth({ loggedIn: true, email, subscriptionStatus });
    if (subscriptionStatus === 'active') {
      setCurrentView('app');
    } else {
      setCurrentView('paywall');
    }
  };

  const handleRegisterAndPay = (email: string) => {
    setUserAuth({ loggedIn: true, email, subscriptionStatus: 'inactive' });
    setCurrentView('paywall');
  };

  const handlePaymentSuccess = () => {
    setUserAuth(prev => ({ ...prev, subscriptionStatus: 'active' }));
    setCurrentView('app');
  };

  const handleLogout = () => {
    setUserAuth({ loggedIn: false, email: '', subscriptionStatus: 'inactive' });
    setCurrentView('landing');
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'trial') {
      setUserAuth({ loggedIn: true, email: 'aventureiro.trial@taverna.com', subscriptionStatus: 'trial' });
      setCurrentView('app');
    } else {
      setCurrentView('register');
    }
  };

  const handleFastRegister = () => {
    setCurrentView('register');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentView} onSelectPlan={handleSelectPlan} onFastRegister={handleFastRegister} />;
      case 'login':
        return <AuthScreens initialView="login" onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} onRegisterAndPay={handleRegisterAndPay} />;
      case 'register':
        return <AuthScreens initialView="register" onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} onRegisterAndPay={handleRegisterAndPay} />;
      case 'paywall':
        return <PaywallScreen userAuth={userAuth} onPaymentSuccess={handlePaymentSuccess} onLogout={handleLogout} onNavigateToRegister={() => setCurrentView('register')} />;
      case 'app':
        if (userAuth.subscriptionStatus === 'inactive') {
          return <PaywallScreen userAuth={userAuth} onPaymentSuccess={handlePaymentSuccess} onLogout={handleLogout} onNavigateToRegister={() => setCurrentView('register')} />;
        }
        return <RpgAppView userAuth={userAuth} onLogout={handleLogout} onNavigateToForge={() => setCurrentView('forge')} />;
      case 'forge':
        return <TavernaForgeCore userAuth={userAuth} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={setCurrentView} onSelectPlan={handleSelectPlan} onFastRegister={handleFastRegister} />;
    }
  };

  if (isProjectorMode) {
    return <ProjectorWindowView />;
  }

  return (
    <div className="bg-neutral-950 min-h-screen text-neutral-100 selection:bg-amber-600 select-none relative">
      {renderCurrentView()}

      <AnimatePresence>
        {showPaymentConfirmedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentConfirmedModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] rounded-2xl w-full max-w-lg p-6 relative z-10 text-neutral-100 flex flex-col gap-5 text-center"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 rounded-t-2xl" />
              
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-emerald-950/50 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl shadow-inner animate-bounce text-emerald-400">
                  🎉
                </div>
                <h2 className="font-serif text-2xl font-extrabold text-amber-400 tracking-wide uppercase">
                  Acesso Liberado!
                </h2>
              </div>
              
              <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-neutral-950/80 border border-neutral-850 p-4.5 rounded-xl text-left font-sans shadow-inner">
                🎉 O seu pagamento foi identificado! Você já pode desfrutar de todas as ferramentas táticas de forma ilimitada. Seja bem-vindo à Taverna Digital.
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  onClick={() => {
                    handleLoginSuccess('mestre.premium@taverna.com', 'active');
                    setShowPaymentConfirmedModal(false);
                  }}
                  className="flex-1 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold uppercase tracking-wide text-xs rounded-xl transition-all"
                >
                  Acessar Painel Premium
                </button>
                <button
                  onClick={() => setShowPaymentConfirmedModal(false)}
                  className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold uppercase tracking-wide text-xs rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
