import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft, Flame, Sparkles } from 'lucide-react';
import { CurrentView, UserAuth } from '../types';

interface AuthScreensProps {
  initialView: 'login' | 'register';
  onNavigate: (view: CurrentView) => void;
  onLoginSuccess: (email: string, subscriptionStatus: 'active' | 'inactive' | 'trial') => void;
  onRegisterAndPay: (email: string) => void;
}

export default function AuthScreens({ initialView, onNavigate, onLoginSuccess, onRegisterAndPay }: AuthScreensProps) {
  const [isLogin, setIsLogin] = useState<boolean>(initialView === 'login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Validate fields
  const validateForm = (): boolean => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('O e-mail é obrigatório.');
      return false;
    }
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return false;
    }

    if (!password) {
      setErrorMsg('A senha é obrigatória.');
      return false;
    }

    if (password.length <= 6) {
      setErrorMsg('A senha deve conter mais de 6 caracteres.');
      return false;
    }

    return true;
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Secret Premium Developer bypass check
    if (email.toLowerCase() === 'xalemaoxoldschool@gmail.com') {
      if (password === '@Rambo1313') {
        setSuccessMsg('Portal Premium Desbloqueado! Bem-vindo...');
        localStorage.setItem('vtt_premium_paid_xalemaoxoldschool@gmail.com', 'true');
        setTimeout(() => {
          onLoginSuccess(email, 'active');
        }, 1000);
        return;
      } else {
        setErrorMsg('Senha incorreta para a conta premium.');
        return;
      }
    }

    // Simulate login
    setSuccessMsg('Autenticação realizada com sucesso!');
    setTimeout(() => {
      // By default all accounts are restricted to trial (DEMO) mode unless paid in localStorage
      const hasPaid = localStorage.getItem('vtt_premium_paid_' + email.toLowerCase()) === 'true';
      onLoginSuccess(email, hasPaid ? 'active' : 'trial');
    }, 1000);
  };

  const handleRegisterAndSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Register puts user directly into the 10-minutes free Demo/Trial mode
    setSuccessMsg('Criando conta divina no plano demo...');
    setTimeout(() => {
      onLoginSuccess(email, 'trial');
    }, 1000);
  };

  const handleDemologin = (emailPreset: string, isTrial: boolean) => {
    setEmail(emailPreset);
    setPassword('senha_secreta_123');
    setErrorMsg('');
    setSuccessMsg('Preenchendo credenciais demo...');
    setTimeout(() => {
      onLoginSuccess(emailPreset, isTrial ? 'trial' : 'active');
    }, 850);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between relative select-none">
      {/* Background radial gradient */}
      <div className="absolute inset-x-0 top-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Header link back to landing */}
      <header className="sticky top-0 z-40 p-4 border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            id="back-to-landing-btn"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f59e0b] hover:text-[#d97706] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Taverna
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-[#f59e0b] rounded flex items-center justify-center">
              <Flame className="w-5 h-5 text-black" />
            </div>
            <span className="font-sans text-sm font-bold tracking-tight text-[#f59e0b] uppercase">
              TAVERNA DIGITAL
            </span>
          </div>
        </div>
      </header>

      {/* Auth Main Box */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          key={isLogin ? 'login-card' : 'register-card'}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-neutral-900/90 border border-amber-900/30 rounded-2xl p-8 shadow-2xl shadow-neutral-950 relative"
        >
          {/* Subtle Golden Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 rounded-t-2xl" />

          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-neutral-100 flex items-center justify-center gap-2">
              {isLogin ? <LogIn className="w-6 h-6 text-amber-500" /> : <UserPlus className="w-6 h-6 text-amber-500" />}
              {isLogin ? 'Entrar no Portal' : 'Forjar Nova Conta'}
            </h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              {isLogin
                ? 'Insira suas credenciais mágicas para reabrir suas campanhas.'
                : 'Inscreva-se hoje para gerenciar suas jogadas como mestre de elite.'}
            </p>
          </div>

          {/* Form Alert states */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 p-3.5 bg-red-950/60 border border-red-800/40 rounded-xl text-red-300 text-xs flex items-start gap-2.5 leading-relaxed"
                id="auth-error-alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 p-3.5 bg-amber-950/60 border border-amber-600/40 rounded-xl text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed"
                id="auth-success-alert"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterAndSubscribe} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5" htmlFor="user-email-input">
                Endereço de E-mail
              </label>
              <div className="relative">
                <input
                  id="user-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-login@exemplo.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-10 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5" htmlFor="auth-password">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 7 dígitos"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-10 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-all"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
              </div>
              {isLogin && (
                <div className="text-right mt-1.5">
                  <a href="#" className="text-[10px] text-amber-500/70 hover:text-amber-400 transition-colors">
                    Esqueceu os pergaminhos de acesso? (Recuperar Senha)
                  </a>
                </div>
              )}
            </div>

            {/* Submit buttons */}
            {isLogin ? (
              <button
                id="login-btn"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-neutral-950 font-serif font-bold tracking-wide rounded-xl shadow-md shadow-amber-950/40 active:scale-98 transition-all flex items-center justify-center gap-2 border-t border-amber-300/20"
              >
                <LogIn className="w-4 h-4" />
                Conectar ao Salão
              </button>
            ) : (
              <button
                id="register-submit-btn"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-neutral-950 font-serif font-bold tracking-wide rounded-xl shadow-md shadow-amber-950/40 active:scale-98 transition-all flex items-center justify-center gap-2 border-t border-amber-300/20"
              >
                <UserPlus className="w-4 h-4" />
                Criar Conta de Mestre (Plano Demo)
              </button>
            )}
          </form>

          {/* Google Accounts integration fast-sign-in option */}
          <div className="mt-4">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <span className="relative px-3 text-[9bp] font-mono text-neutral-500 uppercase bg-neutral-900 text-[10px]">
                Ou crie rápido via
              </span>
            </div>

            <button
              id="google-fast-signin-btn"
              type="button"
              onClick={() => {
                const gmailPrompt = prompt("Insira seu e-mail do Gmail para criação rápida de conta:", "mestre.heroi@gmail.com");
                if (gmailPrompt === 'xalemaoxoldschool@gmail.com') {
                  const passPrompt = prompt("Digite a senha do mestre premium:");
                  if (passPrompt === '@Rambo1313') {
                    setSuccessMsg('Conta Premium Secreta sincronizada com sucesso!');
                    localStorage.setItem('vtt_premium_paid_xalemaoxoldschool@gmail.com', 'true');
                    setTimeout(() => {
                      onLoginSuccess('xalemaoxoldschool@gmail.com', 'active');
                    }, 1000);
                  } else {
                    alert("Senha incorreta");
                  }
                  return;
                }

                if (gmailPrompt && gmailPrompt.includes("@")) {
                  setSuccessMsg(`Google Account sincronizada (${gmailPrompt}). Bem-vindo!`);
                  setTimeout(() => {
                    const hasPaid = localStorage.getItem('vtt_premium_paid_' + gmailPrompt.toLowerCase()) === 'true';
                    onLoginSuccess(gmailPrompt, hasPaid ? 'active' : 'trial');
                  }, 1100);
                } else if (gmailPrompt) {
                  alert("Por favor, informe um endereço de Gmail válido.");
                }
              }}
              className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-sans text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Entrar com Gmail (Google Account)</span>
            </button>
          </div>

          {/* Quick Demo Pre-fill Shortcut for quick testing */}
          <div className="mt-6 pt-5 border-t border-neutral-800/60">
            <p className="text-[10px] font-mono tracking-wider text-center text-neutral-500 uppercase mb-3.5">
              Acesso Rápido Demo (Mestre de Testes)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="demo-active-btn"
                onClick={() => handleDemologin('mestre.Premium@taverna.com', false)}
                className="p-2 bg-neutral-950 hover:bg-neutral-900 border border-amber-900/20 rounded-lg text-[10px] text-amber-500 text-left hover:border-amber-500/50 transition-colors"
              >
                <div className="font-semibold block truncate">Assinatura Ativa</div>
                <div className="text-[9px] text-neutral-500 block truncate">mestre.Premium@taverna.com</div>
              </button>
              <button
                id="demo-inactive-btn"
                onClick={() => handleDemologin('jogador.Inativo@taverna.com', true)}
                className="p-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] text-neutral-400 text-left hover:border-neutral-500/50 transition-colors"
              >
                <div className="font-semibold block truncate text-neutral-400">Inativo / Expirado</div>
                <div className="text-[9px] text-neutral-500 block truncate">jogador.Inativo@taverna.com</div>
              </button>
            </div>
          </div>

          {/* Router Nav Switch */}
          <div className="mt-6 text-center text-xs">
            {isLogin ? (
              <p className="text-neutral-400">
                Ainda não tem convite?{' '}
                <button
                  id="switch-to-register"
                  onClick={() => {
                    setIsLogin(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-amber-500 hover:text-amber-400 font-bold underline cursor-pointer"
                >
                  Forjar Nova Conta agora
                </button>
              </p>
            ) : (
              <p className="text-neutral-400">
                Já possui pergaminho de acesso?{' '}
                <button
                  id="switch-to-login"
                  onClick={() => {
                    setIsLogin(true);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-amber-500 hover:text-amber-400 font-bold underline cursor-pointer"
                >
                  Fazer login na taverna
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-neutral-900/60 text-center bg-neutral-950">
        <span className="text-[10px] text-neutral-600 font-mono">
          CONEXÃO SEGURA SSL GATEWAY VIA STRIPE • TAVERNA DIGITAL MICRO-SAAS
        </span>
      </footer>
    </div>
  );
}
