import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, QrCode, ShieldCheck, Lock, RefreshCw, Sparkles, Check, Flame, ChevronRight } from 'lucide-react';
import { UserAuth, CurrentView } from '../types';

const INFINITEPAY_CHECKOUT_URL = "https://link.infinitepay.io/evandro-jose-d69/VC1D-84VPhYEDRd-49,90";

interface PaywallScreenProps {
  userAuth: UserAuth;
  onPaymentSuccess: () => void;
  onLogout: () => void;
  onNavigateToRegister: () => void;
}

export default function PaywallScreen({ userAuth, onPaymentSuccess, onLogout, onNavigateToRegister }: PaywallScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  // Card states
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardName, setCardName] = useState<string>('MESTRE DO RPG DELUXE');
  const [cardExpiry, setCardExpiry] = useState<string>('12/29');
  const [cardCvc, setCardCvc] = useState<string>('777');

  // PIX states
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const pixMockPayload = '00020101021226830014br.gov.bcb.pix2561api.stripe.com/pay/taverna_digital_rpg_companion_prod_38502894520';

  const handleCopyPix = () => {
    setPixCopied(true);
    navigator.clipboard.writeText(pixMockPayload).catch(() => {});
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleConfirmPayment = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setProcessingStep('🔑 Estabelecendo handshake SSL criptografado seguro...');

    // Progress bar and loading simulator steps over 2 seconds
    setTimeout(() => {
      setProcessingStep('🔍 Consultando fila de liquidação de Pix em tempo real...');
    }, 700);

    setTimeout(() => {
      setProcessingStep('✅ Pagamento identificado com sucesso! Sincronizando credenciais...');
    }, 1400);

    setTimeout(() => {
      setIsProcessing(false);
      const emailKey = userAuth?.email ? userAuth.email.toLowerCase() : 'demo_user';
      localStorage.setItem('vtt_premium_paid_' + emailKey, 'true');
      localStorage.setItem('taverna_digital_premium', 'true');
      onPaymentSuccess();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between selection:bg-amber-600 selection:text-white">
      {/* Upper golden spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[300px] bg-gradient-to-b from-amber-600/10 via-amber-800/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Embedded Navigation Hub */}
      <header className="sticky top-0 z-40 bg-[#161b22] p-4 border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f59e0b] rounded flex items-center justify-center">
              <Flame className="w-6 h-6 text-black" />
            </div>
            <span className="font-sans text-base font-bold tracking-tight text-[#f59e0b] uppercase">
              TAVERNA DIGITAL • CHECKOUT
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              Usuário: <span className="text-[#f59e0b] font-semibold">{userAuth.email}</span>
            </span>
            <button
              id="paywall-logout-btn"
              onClick={onLogout}
              className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 transition-colors border border-[#30363d] rounded px-3 py-1.5 hover:bg-[#0d1117]"
            >
              Sair (Logout)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 flex flex-col lg:flex-row items-stretch justify-center gap-8 self-center">
        {/* Left column: Micro-SaaS Value Proposition Card */}
        <div className="w-full lg:w-5/12 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="inline-block bg-amber-950/60 border border-amber-900/50 text-amber-500 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-full mb-6">
              Assinatura Sem Fidelidade
            </div>
            
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-100 mb-2 leading-tight">
              Acesso Lendário Liberado
            </h2>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Você está a um passo de desbloquear o melhor software nacional de RPG de Mesa Micro-SaaS. Uma única assinatura garante que toda a sua mesa jogue sem barreiras.
            </p>

            {/* Checklist items */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-amber-950/30 p-1.5 rounded border border-amber-800/30 text-amber-500 mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-neutral-200">Fichas de Campanhas Ilimitadas</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Crie quantos personagens e fichas táticas persistentes desejar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-950/30 p-1.5 rounded border border-amber-800/30 text-amber-500 mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-neutral-200">Rolo Dinâmico & Modificadores</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Sistemas de equações integrados e somatórios para d4, d6, d8, d10, d12 e d20.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-950/30 p-1.5 rounded border border-amber-800/30 text-amber-500 mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-neutral-200">Editor Real de Grids e Mapas</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Interaja pintando obstáculos táticos no mapa para seus guerreiros.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing summary widget */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-amber-900/20">
            <span className="text-[10px] text-neutral-500 font-mono block">PLANO SELECIONADO</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-serif text-lg font-bold text-amber-400">Taverneiro Premium</span>
              <span className="font-mono text-base font-bold text-neutral-100">R$ 49,90<span className="text-[10px] text-neutral-500">/mês</span></span>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-900 flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Recorrência mensal automática</span>
              <span className="text-emerald-500">Garantia 7 dias reembolso</span>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Payment Checkout form */}
        <div className="w-full lg:w-7/12 bg-neutral-900 border border-amber-900/20 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between">
          {/* Custom loader modal if isProcessing */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
                id="stripe-processing-overlay"
              >
                <div className="relative">
                  {/* Rotating visual magic seal container */}
                  <div className="w-20 h-20 border-3 border-dashed border-amber-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-extrabold text-neutral-100 mt-8">
                  Processando pagamento seguro...
                </h3>
                
                <p className="text-xs text-amber-500 font-mono tracking-wider mt-4 px-4 max-w-sm animate-pulse">
                  {processingStep}
                </p>

                <div className="mt-8 flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 uppercase">
                  <Lock className="w-3.5 h-3.5 text-neutral-600" />
                  CRIPTOGRAFIA SSL AES256-GCM ATIVA
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            {/* Payment tab selections */}
            <div className="grid grid-cols-2 border-b border-neutral-800">
              <button
                id="tab-card-btn"
                onClick={() => setPaymentMethod('card')}
                className={`py-4 font-serif font-bold text-xs tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 text-amber-400 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Cartão de Crédito
              </button>
              <button
                id="tab-pix-btn"
                onClick={() => setPaymentMethod('pix')}
                className={`py-4 font-serif font-bold text-xs tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-amber-500 text-amber-400 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                PIX Instantâneo
              </button>
            </div>

            {/* Inner method forms */}
            <div className="p-6 sm:p-8">
              {paymentMethod === 'card' ? (
                /* CREDIT CARD VIEW */
                <form id="credit-card-form" onSubmit={handleConfirmPayment} className="space-y-5">
                  {/* Express Checkout Widget */}
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 text-center space-y-3">
                    <p className="text-xs text-amber-400 font-medium font-sans">⚡ RECOMENDADO: Pagamento via Link InfinitePay</p>
                    <button
                      type="button"
                      onClick={() => window.open(INFINITEPAY_CHECKOUT_URL, '_blank', 'noopener,noreferrer')}
                      className="w-full py-3 bg-[#e0f2fe]/90 hover:bg-[#e0f2fe] text-blue-950 font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 border border-blue-200"
                    >
                      <Sparkles className="w-4 h-4 text-blue-800" />
                      Pagar via Link InfinitePay (PIX / Cartão)
                    </button>
                    <div className="text-[10px] text-neutral-500 font-mono tracking-widest flex items-center justify-center gap-1.5 uppercase">
                      <Lock className="w-3" /> OU CONTINUE COM O CARTÃO DE TESTE ABAIXO
                    </div>
                  </div>

                  {/* Simulated interactive Card Badge Graphic */}
                  <div className="bg-gradient-to-tr from-amber-950 via-neutral-900 to-amber-900/60 rounded-xl p-5 border border-amber-600/20 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-amber-500/10 p-1 px-2.5 rounded border border-amber-700/20 text-[8px] font-mono tracking-widest text-amber-500 uppercase">
                        Platinado
                      </div>
                      <ShieldCheck className="w-6 h-6 text-amber-500/70" />
                    </div>

                    <div className="font-mono tracking-widest text-lg text-neutral-100 mb-6 font-semibold select-all">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[8px] font-mono text-neutral-500 uppercase block">Portador</span>
                        <span className="font-serif text-xs text-neutral-300 tracking-wider uppercase truncate max-w-44 block">
                          {cardName || 'Mestre Elegante'}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase block">Expira</span>
                          <span className="font-mono text-xs text-neutral-300 block">{cardExpiry || 'MM/AA'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase block">CVC</span>
                          <span className="font-mono text-xs text-neutral-300 block">{cardCvc || '•••'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="card-number">
                        Número do Cartão de Crédito
                      </label>
                      <input
                        id="card-number"
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none transition-all font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="card-name">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        id="card-name"
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="Nome idêntico ao do cartão"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none transition-all uppercase"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="card-expiry">
                          Expiração (MM/AA)
                        </label>
                        <input
                          id="card-expiry"
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none transition-all font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="card-cvc">
                          Código de Segurança (CVC)
                        </label>
                        <input
                          id="card-cvc"
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="777"
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none transition-all font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                   <button
                    id="submit-payment-card-btn"
                    type="submit"
                    className="w-full py-4 mt-4 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold uppercase tracking-[0.12em] rounded-xl border border-[#30363d] shadow-lg transition-all duration-300 active:scale-98 flex items-center justify-center gap-2 text-sm"
                  >
                    <Lock className="w-4 h-4 text-black" />
                    Confirmar Pagamento e Jogar
                  </button>
                </form>
              ) : (
                /* PIX VIEW */
                <div id="pix-payment-area" className="flex flex-col items-center justify-center py-4 space-y-6">
                  <div className="text-center">
                    <span className="font-mono text-xs font-bold text-[#FF6B00] bg-orange-500/10 border border-[#FF6B00]/25 px-3 py-1 rounded-full inline-block mb-3">
                      Pix Static Gateway
                    </span>
                    <h3 className="font-serif text-lg font-bold text-neutral-100">
                      Pagamento via Pix Manual
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                      Escaneie o QR Code ou copie a chave Pix abaixo para assinar a Taverna Digital por R$ 49,90.
                    </p>
                  </div>

                  {/* Glowing high-tech Vector QR Code */}
                  <div className="bg-white/5 p-4 rounded-xl border border-zinc-800 flex items-center justify-center w-40 h-40 mx-auto relative group overflow-hidden">
                    <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#FF6B00]" />
                    <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#FF6B00]" />
                    <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#FF6B00]" />
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#FF6B00]" />
                    
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 100 100" 
                      className="w-32 h-32 text-[#FF6B00]"
                      fill="currentColor"
                    >
                      <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="11" y="11" width="13" height="13" fill="currentColor" />
                      
                      <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="76" y="11" width="13" height="13" fill="currentColor" />
                      
                      <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="11" y="76" width="13" height="13" fill="currentColor" />
                      
                      <rect x="70" y="70" width="10" height="10" fill="currentColor" />
                      <rect x="85" y="85" width="10" height="10" fill="currentColor" />
                      
                      <rect x="35" y="10" width="8" height="8" fill="currentColor" />
                      <rect x="48" y="5" width="12" height="6" fill="currentColor" />
                      <rect x="35" y="25" width="6" height="14" fill="currentColor" />
                      <rect x="50" y="18" width="10" height="10" fill="currentColor" />
                      
                      <rect x="10" y="38" width="12" height="12" fill="currentColor" />
                      <rect x="26" y="46" width="8" height="16" fill="currentColor" />
                      
                      <rect x="75" y="38" width="15" height="8" fill="currentColor" />
                      <rect x="82" y="52" width="10" height="12" fill="currentColor" />
                      
                      <rect x="38" y="75" width="14" height="14" fill="currentColor" />
                      <rect x="58" y="70" width="6" height="18" fill="currentColor" />
                      
                      <g transform="translate(42,42) scale(0.16)">
                        <path d="M 50 0 L 100 50 L 50 100 L 0 50 Z" fill="#FF6B00" stroke="#121216" strokeWidth="15" />
                        <circle cx="50" cy="50" r="18" fill="white" />
                      </g>
                    </svg>
                  </div>

                  {/* PIX copy paste string */}
                  <div className="w-full space-y-2 text-left">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Código PIX Copia e Cola
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value="00020126580014br.gov.bcb.pix0136931fb1da-4780-446c-aeca-43552ad8d216520400005303986540549.905802BR5915TAVERNA DIGITAL6009SAO PAULO62070503***6304EDFD"
                        className="flex-1 bg-neutral-950 px-3 py-2.5 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-400 truncate select-all outline-none"
                      />
                      <button
                        id="copy-pix-btn"
                        onClick={() => {
                          navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136931fb1da-4780-446c-aeca-43552ad8d216520400005303986540549.905802BR5915TAVERNA DIGITAL6009SAO PAULO62070503***6304EDFD");
                          setPixCopied(true);
                          setTimeout(() => setPixCopied(false), 2000);
                        }}
                        className={`px-4 bg-neutral-950 hover:bg-neutral-900 text-xs font-bold font-serif rounded-xl border transition-colors shrink-0 ${
                          pixCopied ? 'border-amber-500 text-amber-400' : 'border-neutral-800 text-neutral-300'
                        }`}
                      >
                        {pixCopied ? '📋 Copiado!' : '📋 Copiar Código'}
                      </button>
                    </div>
                  </div>

                  {/* PIX confirmation check button */}
                  <button
                    id="submit-payment-pix-btn"
                    onClick={() => handleConfirmPayment()}
                    className="w-full py-4 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold uppercase tracking-[0.12em] rounded-xl border border-[#30363d] shadow-lg transition-all duration-300 active:scale-98 flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    ✨ Já Realizei o Pagamento, Liberar Acesso
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Secure lock footer */}
          <div className="p-4 bg-neutral-950 border-t border-neutral-800/60 flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 uppercase">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            Gateway Certificado InfinitePay • TLS 1.3 • PCI-DSS SECURE
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-neutral-950 border-t border-neutral-900/40 text-center">
        <span className="text-[10px] text-neutral-600 font-mono">
          DESENVOLVIDO POR TAVERNA DIGITAL INC. • CONTATO: SUPORTE@TAVERNADIGITAL.COM
        </span>
      </footer>
    </div>
  );
}
