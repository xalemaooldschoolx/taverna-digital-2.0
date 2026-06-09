import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Dice5, Scroll, Map, ArrowRight, Check, Coins, HelpCircle, Flame, BookOpen, X, LayoutGrid, MessageSquare, Dices, Crown, Swords, Backpack, Zap, TrendingUp } from 'lucide-react';
import { SAAS_FEATURES, FAQS, PLATFORM_PLANS } from '../data/mockDatabase';
import { CurrentView } from '../types';
import { ResinBase, Figurine, EnemyFigurine, BossFigurine, WallPillar, getVectorBackgroundStyle } from './MiniatureSvg';

const INFINITEPAY_CHECKOUT_URL = "https://link.infinitepay.io/evandro-jose-d69/VC1D-84VPhYEDRd-49,90";

interface LandingPageProps {
  onNavigate: (view: CurrentView) => void;
  onSelectPlan: (planId: string) => void;
  onFastRegister: () => void;
}

export default function LandingPage({ onNavigate, onSelectPlan, onFastRegister }: LandingPageProps) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<string>('mestre');
  // Map string icon names to Lucide icon components
  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className={className} />;
      case 'Dice5':
        return <Dice5 className={className} />;
      case 'Scroll':
        return <Scroll className={className} />;
      case 'Map':
        return <Map className={className} />;
      default:
        return <Flame className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-600 selection:text-white">
      {/* Upper Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#161b22] border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f59e0b] rounded flex items-center justify-center">
              <Flame className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="font-sans text-xl font-bold tracking-tight text-[#f59e0b] uppercase">
                TAVERNA DIGITAL
              </span>
              <span className="hidden sm:inline block text-[10px] font-mono tracking-widest text-[#f59e0b] uppercase ml-2 px-1.5 py-0.5 bg-[#0d1117] rounded border border-[#30363d]">
                Micro-SaaS RPG V2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-xs font-bold text-neutral-400 hover:text-white transition-colors font-mono cursor-pointer">
              Acessar Conta
            </button>
            <button onClick={onFastRegister} className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-amber-400 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Forjar Registro
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-950/50 border border-amber-900/60 rounded-full text-amber-400 text-xs font-semibold tracking-wide mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>✨ NOVIDADE EXTRAORDINÁRIA: Gênero dos Avatares (♂/♀) & Coleção 3D Expandida com 20+ Miniaturas!</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-100 mb-6 drop-shadow-xl"
          >
            Sua Masmorra Digital Inteligente <br />
            por apenas <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500">R$ 49,90/mês</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-4xl mx-auto text-neutral-400 text-sm sm:text-base md:text-lg leading-relaxed mb-10 font-sans"
          >
            <span className="text-amber-400 font-serif font-extrabold block text-lg sm:text-xl md:text-2xl tracking-wide mb-3 leading-snug">
              A única plataforma com Miniaturas Digitais 3D/2D interativas de alta fidelidade, Controle de Gênero Dinâmico (♂/♀) e Mapas Imersivos.
            </span>
            Esqueça PDFs estáticos e navegadores lentos. Gerencie suas fichas, alterne gêneros das miniaturas em tempo real mudando vestes e armas de forma interativa, role dados avançados de RPG com somatória instantânea, acompanhe combates e invoque monstros clássicos da nova coleção com um único clique.
          </motion.p>

          {/* Primary Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              id="cta-hero-register-btn"
              onClick={onFastRegister}
              className="w-full sm:w-auto px-8 py-4 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold uppercase tracking-[0.12em] rounded-xl shadow-lg transition-all duration-300 active:scale-98 flex items-center justify-center gap-2 border border-[#30363d] text-base"
            >
              Começar Campanhas Agora
              <ArrowRight className="w-5 h-5 transition-transform" />
            </button>
            <button
              id="cta-hero-login-btn"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 bg-[#161b22] hover:bg-[#0d1117] text-[#e2e8f0] font-extrabold uppercase tracking-[0.12em] rounded-xl border border-[#30363d] transition-all duration-300 text-base flex items-center justify-center gap-2"
            >
              Entrar na Taverna
            </button>
            <button
              id="cta-hero-guide-btn"
              onClick={() => setShowGuideModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 font-extrabold uppercase tracking-[0.12em] rounded-xl border border-amber-900/50 hover:border-amber-500 transition-all duration-300 text-base flex items-center justify-center gap-2"
            >
              📖 Como Jogar
            </button>
          </motion.div>

          {/* Premium Physical Laptop Sneak Peek Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* The physical laptop screen lid bezel */}
            <div className="bg-[#18181b] rounded-t-2xl p-2.5 pb-0 border-x-[5px] border-t-[8px] border-[#3f3f46] shadow-2xl relative">
              {/* Webcam node and indicator */}
              <div className="absolute top-1.5 inset-x-0 flex justify-center items-center gap-1.5 z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 border border-neutral-700 block" />
                <span className="w-1 h-1 rounded-full bg-blue-500/80 block animate-pulse" />
              </div>

              {/* The Inner Matte Screen Area */}
              <div className="bg-[#0c0a09] aspect-[16/10] rounded-t-lg overflow-hidden relative flex flex-col justify-between border border-neutral-900">
                
                {/* 1. TOP BOSS HEALTH BAR HEADER */}
                <div className="absolute top-3 inset-x-0 z-30 px-4 pointer-events-none flex flex-col items-center">
                  <div className="bg-neutral-950/90 border border-red-500/50 rounded-lg p-2 max-w-md w-full shadow-[0_4px_15px_rgba(239,68,68,0.3)] backdrop-blur-md">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs font-serif font-extrabold tracking-wide text-red-400 mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        EVENTO: CHEFE ATIVO (FASE 2)
                      </span>
                      <span className="font-mono text-amber-400">425 / 500 HP</span>
                    </div>

                    <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-red-950">
                      <div className="h-full w-[85%] bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 shadow-[0_0_10px_#ef4444]" />
                    </div>

                    <div className="flex justify-between text-[8px] font-mono text-neutral-500 mt-1 uppercase tracking-widest">
                      <span>DRAGÃO ANCIÃO RADIANTE</span>
                      <span className="text-red-400">AURA LENDÁRIA DRACÔNICA</span>
                    </div>
                  </div>
                </div>

                {/* 2. THE TACTICAL GRIDS AREA */}
                <div 
                  className="w-full h-full relative"
                  style={getVectorBackgroundStyle('volcano')}
                >
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1.2px,transparent_1.2px)] [background-size:45px_45px] hover:bg-neutral-950/10 transition-colors" />

                  {/* Positioning miniatures directly on battle map coord space */}
                  
                  {/* 3D Wall Pillars */}
                  <div className="absolute top-[10%] left-[5%] w-14 h-14 rotate-6">
                    <WallPillar />
                  </div>
                  <div className="absolute top-[10%] left-[83%] w-14 h-14 -rotate-6">
                    <WallPillar />
                  </div>
                  <div className="absolute bottom-[35%] left-[5%] w-14 h-14">
                    <WallPillar />
                  </div>

                  {/* Colossal Red Fire Dragon Boss Miniature (2x2 Scale, Centered left) */}
                  <div className="absolute top-[28%] left-[26%] w-44 h-44 z-20 group">
                    <ResinBase type="boss" />
                    <div className="absolute inset-1.5 z-20 flex items-center justify-center">
                      <BossFigurine id="ancient_dragon" />
                    </div>
                  </div>

                  {/* Hero Miniature 1: Guerreiro (Warrior) */}
                  <div className="absolute bottom-[18%] left-[58%] w-16 h-16 z-20">
                    <ResinBase type="hero" subclass="guerreiro" />
                    <Figurine id="guerreiro" />
                  </div>

                  {/* Hero Miniature 2: Mago (Wizard) */}
                  <div className="absolute bottom-[42%] left-[72%] w-16 h-16 z-20">
                    <ResinBase type="hero" subclass="mago" />
                    <Figurine id="mago" />
                  </div>

                  {/* Enemy Miniature 1: Skeleton */}
                  <div className="absolute top-[30%] left-[64%] w-15 h-15 z-20">
                    <ResinBase type="enemy" />
                    <EnemyFigurine id="skeleton" />
                  </div>

                  {/* 3. SIMULATED TABLETOP CONTROL HUD ON SCREEN SIDES */}
                  {/* Left stats card */}
                  <div className="absolute bottom-4 left-4 z-30 w-36 sm:w-44 bg-neutral-950/90 border border-neutral-800 rounded-lg p-2 text-left shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-1.5 mb-1.5 border-b border-neutral-900 pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[9px] font-extrabold text-neutral-300 font-mono tracking-wider">COMITIVA ATIVA</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-sans">
                        <span className="text-amber-400 font-bold">Karnak (Guerreiro)</span>
                        <span className="text-emerald-400">58/58 HP</span>
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-sans">
                        <span className="text-purple-400 font-bold">Eldrin (Mago)</span>
                        <span className="text-emerald-400">28/32 HP</span>
                      </div>
                    </div>
                  </div>

                  {/* Right chat feed log helper */}
                  <div className="absolute bottom-4 right-4 z-30 w-44 sm:w-52 bg-neutral-950/90 border border-neutral-800 rounded-lg p-2 text-left shadow-lg backdrop-blur-md hidden sm:block">
                    <div className="flex items-center gap-1.5 mb-1.5 border-b border-neutral-900 pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-extrabold text-neutral-300 font-mono tracking-wider">DIÁRIO DE BATALHA</span>
                    </div>
                    <div className="space-y-1 font-mono text-[7.5px] leading-relaxed text-neutral-400">
                      <p><span className="text-purple-400">[Mago]</span> Eldrin disparou Bola de Fogo!</p>
                      <p><span className="text-red-400">[Chefe]</span> Dragão Ancião sofreu 32 de Dano!</p>
                      <p><span className="text-amber-400">[Guerreiro]</span> Karnak avança com Escudo.</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* The physical laptop bottom keyboard base / deck assembly */}
            <div className="w-[104%] -ml-[2%] h-4.5 bg-gradient-to-b from-[#52525b] to-[#3f3f46] rounded-b-xl border-t border-[#71717a] shadow-[0_12px_24px_rgba(0,0,0,0.8)] relative flex justify-center items-center">
              {/* Touchpad shape outline */}
              <div className="w-20 h-2 bg-gradient-to-b from-[#3f3f46] to-[#27272a] rounded-b border-x border-b border-[#52525b]/40 shadow-inner" />
              {/* Base rubber feet shadow gap */}
              <div className="absolute -bottom-1 w-[90%] h-1 bg-black/40 blur-[2px] rounded-full" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 bg-neutral-900/40 border-y border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-100 mb-4 tracking-tight">
              Recursos de Elite para Grupos Lendários
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Desenvolvemos cada ferramenta pensando nas dores de mestres e jogadores durante combates táticos e narrativas imersivas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SAAS_FEATURES.map((feat, index) => (
              <div
                key={index}
                className="bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-600/30 p-6 rounded-xl transition-all duration-300 shadow-md group hover:-translate-y-1"
              >
                <div className="bg-amber-950/40 border border-amber-900/30 p-3 rounded-lg w-12 h-12 flex items-center justify-center text-amber-500 mb-5 group-hover:text-amber-400 group-hover:bg-amber-950/60 transition-colors">
                  {renderIcon(feat.icon, 'w-6 h-6')}
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-100 mb-2 truncate">
                  {feat.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOVO: Showcase de miniaturas e personalização de gênero */}
      <section className="py-20 border-t border-neutral-900 bg-gradient-to-b from-neutral-950 to-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Texto explicativo */}
            <div className="lg:col-span-5 space-y-6">
              <span className="font-mono text-xs uppercase tracking-widest text-amber-500 bg-amber-950/50 border border-amber-900/40 px-3.5 py-1 rounded-full">
                SISTEMA REVOLUCIONÁRIO DE TOKENS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#f59e0b] tracking-tight leading-snug">
                Customização Dinâmica de Gênero & 20+ Novos Modelos
              </h2>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Nossos artistas arcanos atualizaram os sistemas de projeção da Taverna! Agora, cada jogador possui o poder de alternar instantaneamente o gênero (<strong className="text-pink-400">Feminino ♀</strong> ou <strong className="text-blue-400">Masculino ♂</strong>) de sua miniatura tática de resina.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-xs shrink-0 mt-1">♀</div>
                  <p className="text-xs text-neutral-400"><strong className="text-neutral-205">Visuais Femininos Exclusivos:</strong> Penteados trançados, armas especiais (como a alabarda dourada para o Guerreiro e magias de tons rosados) e adornos mágicos.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-1">♂</div>
                  <p className="text-xs text-neutral-400"><strong className="text-neutral-205">Postura Masculina Clássica:</strong> Armaduras de placas pesadas, elmos com penacho rubro, machados brutos de batalha e barbas volumosas.</p>
                </div>
              </div>
              <p className="text-sm text-amber-400 font-serif italic">
                *Tudo integrado e sintonizado em tempo real com o grid de batalha e a tela de projeção do projetor tático.
              </p>
            </div>

            {/* Showcase Visual de Miniaturas */}
            <div className="lg:col-span-7 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800/60 pb-3 mb-6 flex justify-between items-center">
                <span>Galeria 3D de Miniaturas de Resina</span>
                <span className="text-amber-500 text-[10px]">Passe o mouse ou toque para conferir</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. Guerreiro Masculino */}
                <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl flex flex-col items-center text-center hover:border-amber-500/40 transition-all">
                  <div className="w-16 h-16 relative overflow-visible mb-2 shrink-0 bg-neutral-950/30 rounded-lg">
                    <ResinBase type="hero" subclass="guerreiro" />
                    <Figurine id="guerreiro" gender="m" />
                  </div>
                  <span className="text-xs font-bold text-neutral-200">Guerreiro</span>
                  <span className="text-[10px] text-blue-400">Masculino ♂</span>
                </div>

                {/* 2. Guerreira Feminina */}
                <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl flex flex-col items-center text-center hover:border-pink-500/40 transition-all">
                  <div className="w-16 h-16 relative overflow-visible mb-2 shrink-0 bg-neutral-950/30 rounded-lg">
                    <ResinBase type="hero" subclass="guerreiro" />
                    <Figurine id="guerreiro" gender="f" />
                  </div>
                  <span className="text-xs font-bold text-neutral-200">Guerreira</span>
                  <span className="text-[10px] text-pink-400">Feminino ♀</span>
                </div>

                {/* 3. Mago Masculino */}
                <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl flex flex-col items-center text-center hover:border-amber-500/40 transition-all">
                  <div className="w-16 h-16 relative overflow-visible mb-2 shrink-0 bg-neutral-950/30 rounded-lg">
                    <ResinBase type="hero" subclass="mago" />
                    <Figurine id="mago" gender="m" />
                  </div>
                  <span className="text-xs font-bold text-neutral-200">Mago</span>
                  <span className="text-[10px] text-blue-400">Masculino ♂</span>
                </div>

                {/* 4. Maga Feminina */}
                <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl flex flex-col items-center text-center hover:border-pink-500/40 transition-all">
                  <div className="w-16 h-16 relative overflow-visible mb-2 shrink-0 bg-neutral-950/30 rounded-lg">
                    <ResinBase type="hero" subclass="mago" />
                    <Figurine id="mago" gender="f" />
                  </div>
                  <span className="text-xs font-bold text-neutral-200">Maga</span>
                  <span className="text-[10px] text-pink-400">Feminino ♀</span>
                </div>
              </div>

              {/* Novos Monstros Coleção */}
              <div className="mt-6 pt-5 border-t border-neutral-800/60">
                <span className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-4 text-center sm:text-left">
                  👹 NOVAS AMEAÇAS DISPONÍVEIS NA COLEÇÃO:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { id: 'beholder', label: 'Beholder' },
                    { id: 'mimic', label: 'Mimic' },
                    { id: 'owlbear', label: 'Urso-Coruja' },
                    { id: 'gelatinous_cube', label: 'Cubo' },
                    { id: 'vampiro', label: 'Vampiro' },
                    { id: 'succubus', label: 'Súcubo' }
                  ].map((monster) => (
                    <div key={monster.id} className="bg-neutral-900/40 border border-[#30363d] p-2 rounded-lg flex flex-col items-center hover:border-red-500/30 transition-all">
                      <div className="w-12 h-12 relative overflow-visible shrink-0 bg-neutral-950/20 rounded mb-1">
                        <ResinBase type="enemy" />
                        <EnemyFigurine id={monster.id} />
                      </div>
                      <span className="text-[9px] font-semibold text-neutral-300 truncate w-full text-center">{monster.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* NOVO: Showcase de Missões Cooperativas e Artefatos 3D */}
      <section className="py-24 border-t border-neutral-900 bg-neutral-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#10b981] bg-emerald-950/40 border border-emerald-900/40 px-3.5 py-1.5 rounded-full mb-3 inline-block font-bold">
              ⚔️ EXPANSÃO SÉRIE DIÁRIO & TÁTICA
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#10b981] mb-2 tracking-tight">
              Gerencionador Dinâmico de Missões & Tesouros Mágicos
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Motive seus heróis conectando narrativas dramáticas a recompensas tangíveis. Crie desafios, marque os heróis convocados e assista ao projector tático ovacionar os jogadores com relíquias 3D ao concluir a jornada!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Side: Dynamic How-To Steps */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-emerald-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/55 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold font-serif shadow-md">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-neutral-100 flex items-center gap-2">
                      <span>Desenvolva a Quest no Painel do Mestre</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold tracking-tight">PASSO SIMPLES</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Acesse a nova aba <strong>📜 Missões e Diário</strong> no menu superior do Mestre. Insira detalhes épicos ou use nossos modelos pré-programados rápidos (como <em>Roubo do Cetro Arcano</em>). Escolha qual herói participará da missão na lista de heróis em tempo real.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-purple-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-955/55 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-bold font-serif shadow-md">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-neutral-100 flex items-center gap-2">
                      <span>Determine Valores de Recompensa & Artefatos</span>
                      <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded font-mono font-bold tracking-tight">DISTRIBUIÇÃO</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Sinalize a quantia de moedas de Ouro (PO) e pontos de Experiência (XP). O grande diferencial é a **Sintonização de Artefatos**: selecione itens sagrados como a <em>Coroa dos Elementos</em> ou o <em>Cálice Solar</em> e veja a representação pulsar sob o controle do mestre.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-955/55 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold font-serif shadow-md">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-neutral-100 flex items-center gap-2">
                      <span>Complete a Missão e Dispare o Alerta de Confetes 3D</span>
                      <span className="text-[10px] bg-amber-950/50 text-amber-400 px-2 py-0.5 rounded font-mono font-bold tracking-tight">TRANSMISSÃO REAL-TIME</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Quando os heróis superarem o perigo de RPG, clique em <strong>🏆 Completa</strong>. Uma transmissão imediata é encaminhada via canais ativos de rede para a tela conectada dos Jogadores: a sala explode em confetes e uma plataforma dimensional flutuante exibe a relíquia girando em 3D de alta performance!
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: CSS 3D Spinning Artifact Mockup */}
            <div className="lg:col-span-5 bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
              <div className="absolute inset-0 bg-[#000000]/65 pointer-events-none" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Spinning artifact keyframe style */}
              <style>{`
                @keyframes landingSpinRelic {
                  0% { transform: perspective(1000px) rotateY(0deg) translateY(0px); }
                  50% { transform: perspective(1000px) rotateY(180deg) translateY(-10px); }
                  100% { transform: perspective(1000px) rotateY(360deg) translateY(0px); }
                }
                .animate-landing-relic {
                  animation: landingSpinRelic 6s ease-in-out infinite;
                  transform-style: preserve-3d;
                }
              `}</style>

              <div className="relative z-10 w-full flex flex-col items-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#10b981] font-bold border border-emerald-950/20 bg-emerald-950/20 px-2.5 py-1 rounded">
                  PROJEÇÃO DE RECOMPENSAS 3D
                </span>

                {/* Relic Base Rendering Platform */}
                <div className="w-48 h-48 my-6 flex items-center justify-center relative">
                  {/* Neon Glow particles underlying */}
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
                  
                  {/* Floating visual relic */}
                  <div className="text-7xl animate-landing-relic select-none drop-shadow-[0_0_25px_#10b981]">
                    👑
                  </div>

                  {/* Dimension Platform Ring */}
                  <div className="absolute bottom-6 w-36 h-4 bg-transparent border-t border-emerald-500/40 rounded-full opacity-65 transform rotateX-30 flex items-center justify-center">
                    <div className="w-28 h-2 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent blur-sm" />
                  </div>
                </div>

                <div className="space-y-1.5 w-full">
                  <span className="text-[9.5px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase">ARTEFATO LENDÁRIO DISPONÍVEL</span>
                  <h4 className="font-serif text-lg font-black text-white">Coroa Elementar de Sulfuron</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed italic px-4 font-sans">
                    "Sintonizada aos planos elementais, concede imunidade parcial ao calor e permite conjurar labaredas guiadas no grid tático."
                  </p>
                </div>

                {/* Mockup parameters of loot */}
                <div className="grid grid-cols-2 gap-3 w-full mt-6 pt-4 border-t border-neutral-850 text-left font-mono">
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-850">
                    <span className="block text-[8px] text-neutral-500 uppercase">RECOMPENSA FINANÇAS</span>
                    <span className="text-xs font-bold text-yellow-500">+1.500 PO (Ouro)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-850">
                    <span className="block text-[8px] text-neutral-500 uppercase">RECOMPENSA DE BANDA</span>
                    <span className="text-xs font-bold text-purple-400">+2.500 XP (Grupo)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NOVO: Showcase de Conectividade Multiplayer Forge Core */}
      <section className="py-24 border-t border-neutral-900 bg-neutral-950/60 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#3b82f6] bg-blue-955/40 border border-blue-900/40 px-3.5 py-1.5 rounded-full mb-3 inline-block font-bold">
              ⚡ CONECTIVIDADE MULTIPLAYER CLOUD v2
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#3b82f6] mb-2 tracking-tight">
              Modo Multiplayer On-line da Forge Core
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Ligue-se em tempo real com sua mesa de RPG sem barreiras. Reúna jogadores em salas dinâmicas de alta performance, sincronize mapas táticos, envie dados e mude cenários com propagação na nuvem em menos de 80ms!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Side: Dynamic How-To Steps */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-blue-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/55 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-bold font-serif shadow-md">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-neutral-100 flex items-center gap-2">
                      <span>Invada com Links Instantâneos</span>
                      <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-mono font-bold tracking-tight">CONVITE RÁPIDO</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Copie o link de convite em um clique no Painel Forge Core. Seus aventureiros convidados entram em segundos, pulando as barreiras de login e preenchendo apenas um apelido para herdar <strong>até 20 personagens selecionados do Mestre</strong> para comandar em combate!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-955/55 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 font-bold font-serif shadow-md">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-neutral-100 flex items-center gap-2">
                      <span>Mapeamento de Grid Multi-Usuário</span>
                      <span className="text-[10px] bg-amber-950 text-amber-500 px-2 py-0.5 rounded font-mono font-bold tracking-tight">SINCRO DE POSIÇÃO</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Posicione e mova suas figuras no tabuleiro cooperativo em tempo real. Mestre e Jogadores herdam as atualizações de posicionamento dos tokens simultaneamente, permitindo manobras flanqueadoras épicas sem discrepâncias.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all font-sans">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/55 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold font-serif shadow-md">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-neutral-100 flex items-center gap-2">
                      <span>Controle Dinâmico de Ações de Chat</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold tracking-tight">ATUALIZAÇÃO DE STATUS</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Dê rolagens de dados de d4 a d100 de forma audível e mude HP/MP instantaneamente de qualquer tela via ações dinâmicas integradas diretamente ao bate-papo, com propagação automática no painel do mestre, telas de jogadores e projetores!
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Virtual Tablet Grid & 3D Spinning Matrix Hub Representation */}
            <div className="lg:col-span-5 bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center shadow-2xl font-sans">
              <div className="absolute inset-0 bg-[#000000]/65 pointer-events-none" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <style>{`
                @keyframes landingSpinPortal {
                  0% { transform: perspective(1000px) rotateY(0deg) rotateZ(0deg) translateY(0px); }
                  50% { transform: perspective(1000px) rotateY(180deg) rotateZ(180deg) translateY(-8px); }
                  100% { transform: perspective(1000px) rotateY(360deg) rotateZ(360deg) translateY(0px); }
                }
                .animate-landing-portal {
                  animation: landingSpinPortal 8s linear infinite;
                  transform-style: preserve-3d;
                }
                @keyframes landingRadar {
                  0% { transform: scale(0.9); opacity: 0.8; }
                  100% { transform: scale(1.4); opacity: 0; }
                }
                .reverb-radar {
                  animation: landingRadar 2.5s infinite ease-out;
                }
              `}</style>

              <div className="relative z-10 w-full flex flex-col items-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#3b82f6] font-bold border border-blue-950/20 bg-blue-955/20 px-2.5 py-1 rounded">
                  PORTAL MULTIPLAYER ATIVO • NUVEM v2
                </span>

                {/* Simulated 3D Spinning Portal Grid Visual */}
                <div className="w-44 h-44 my-4 flex items-center justify-center relative">
                  <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
                  
                  {/* Rotating Holographic Node */}
                  <div className="text-6xl animate-landing-portal select-none drop-shadow-[0_0_20px_#3b82f6]">
                    🌀
                  </div>

                  {/* Horizontal Matrix ring */}
                  <div className="absolute bottom-4 w-32 h-3 bg-transparent border-t border-blue-500/30 rounded-full opacity-60">
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm mx-auto" />
                  </div>
                </div>

                {/* Simulated Online Players Room list */}
                <div className="w-full bg-neutral-950/90 rounded-xl border border-neutral-850 p-4 font-mono text-left text-xs space-y-3 shadow-inner">
                  <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">AVENTUREIROS ONLINE EM TEMPO REAL</span>
                  
                  {/* Player 1 */}
                  <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-900/40 border border-[#30363d]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🛡️</span>
                      <div>
                        <span className="text-[11px] font-bold text-white block">Karnak Quebra-escudos</span>
                        <span className="text-[9px] text-[#3b82f6]">Mesa do Mestre</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold block">120/120 HP</span>
                      <span className="text-[8px] text-neutral-500">PING: 32ms</span>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-900/40 border border-[#30363d] relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🧙‍♂️</span>
                      <div>
                        <span className="text-[11px] font-bold text-white block">Mago Celestial</span>
                        <span className="text-[9px] text-purple-400 font-sans">Jogador Elfo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-red-400 font-bold block">56/70 HP</span>
                      <span className="text-[8px] text-neutral-500">CONECTADO VIA CHAT</span>
                    </div>
                    <div className="absolute right-2 top-1.5 w-2 h-2 rounded-full bg-red-500/20 reverb-radar" />
                  </div>

                  {/* Lobby chat preview mock */}
                  <div className="bg-black/50 p-2.5 rounded-lg border border-neutral-900 space-y-1 text-[10px] font-sans">
                    <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-tight">LOG DE COMBATE MULTIPLAYER</span>
                    <p className="text-zinc-400"><strong className="text-amber-500">👑 Mestre:</strong> Mago, seu turno! O Orc foca você.</p>
                    <p className="text-zinc-400"><strong className="text-purple-400">🧙‍♂️ Mago:</strong> <span className="bg-purple-950/40 text-purple-300 border border-purple-900/30 px-1 rounded text-[9px]">Dreno de Alma</span> conjurado! (-15 MP)</p>
                    <p className="text-zinc-350"><span className="text-emerald-400 font-bold">💥 Dano Aplicado:</span> Orc Negro sofre 25 de Dano direto.</p>
                  </div>
                </div>

                <div className="space-y-1.5 w-full mt-4">
                  <span className="text-[9.5px] font-mono tracking-widest text-[#3b82f6] font-extrabold uppercase">IMERSÃO E SINCRONIA MÁXIMA</span>
                  <h4 className="font-serif text-base font-black text-white">Salas Virtuais Forjadas do Zero</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed italic px-4 font-sans">
                    "Sem complicação, sem travamento de navegadores, com suportes nativos à sincronização de múltiplos dispositivos."
                  </p>
                </div>

                {/* Mockup parameters of multiplayer setup - matching the relic view perfectly */}
                <div className="grid grid-cols-2 gap-3 w-full mt-5 pt-4 border-t border-neutral-850 text-left font-mono">
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-850">
                    <span className="block text-[8px] text-neutral-500 uppercase">CAPACIDADE DO MESTRE</span>
                    <span className="text-xs font-bold text-blue-400">Até 20 Heróis / Deck</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-850">
                    <span className="block text-[8px] text-neutral-500 uppercase">LATÊNCIA GLOBAL</span>
                    <span className="text-xs font-bold text-emerald-400">&lt; 80ms (Ultra Rápido)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ATUALIZAÇÃO DE SISTEMA: VERSÃO 2.0 */}
      <section className="max-w-6xl w-full mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-b from-neutral-900/60 via-neutral-900/20 to-transparent border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl -z-10" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800/80 pb-6 mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] bg-red-600/10 border border-red-500/30 text-red-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">PATCH NOTES</span>
                <h3 className="text-xl sm:text-2xl font-black font-serif text-neutral-100 tracking-wide mt-0.5">ATUALIZAÇÃO DE SISTEMA: VERSÃO 2.0</h3>
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-500 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-900">STATUS: COMPILADO & OPERACIONAL</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-neutral-800">
              <div className="space-y-2">
                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400"><Backpack className="w-5 h-5" /></div>
                <h4 className="text-sm font-bold text-neutral-200 uppercase tracking-wide">Mochila & Compêndio de 50 Itens</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">Almanaque expandido com exatamente 50 equipamentos táticos nativos. Agregue modificadores matemáticos na ficha para alterar bônus de HP, MP, Força e Velocidade.</p>
              </div>
              <span className="text-[9px] font-mono text-amber-500/80 mt-4 block">✓ COMPATÍVEL EM AMBOS OS PLANOS</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-neutral-800">
              <div className="space-y-2">
                <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400"><Zap className="w-5 h-5" /></div>
                <h4 className="text-sm font-bold text-neutral-200 uppercase tracking-wide">Golpes de Classe & Regra dos 35%</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">Cada classe e monstros possuem habilidades pré-definidas de fábrica. O golpe Especial fica destacado e consome dinamicamente 35% da Mana Máxima do token.</p>
              </div>
              <span className="text-[9px] font-mono text-blue-400 mt-4 block">✓ AUTOMATIZAÇÃO SINCRO ACTIVE</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-neutral-850">
              <div className="space-y-2">
                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
                <h4 className="text-sm font-bold text-neutral-200 uppercase tracking-wide">Progressão de EXP & Escalabilidade</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">O mestre agora pode conceder EXP em tempo de execução. Ao atingir a meta, a ficha roda o gatilho de Level Up, escalando automaticamente atributos bases de dano e cura.</p>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 mt-4 block">✓ MOTOR EVOLUCIONÁRIO EMBUTIDO</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing / Micro-SaaS Offer Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Ambient Light */}
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-500 bg-amber-950/50 border border-amber-900/40 px-3 py-1 rounded-full mb-3 inline-block">Planos de Acesso</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-100 mb-4 tracking-tight">
              Apenas R$ 49,90 por Mestre ativo
            </h2>
            <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed mb-4">
              Acesso irrestrito a todas as ferramentas táticas de ficha, dados e grades. <strong className="text-amber-400 font-bold">Apenas o Mestre precisa assinar!</strong> Ele cria as campanhas e convida quantos jogadores quiser, sem taxas ou limites adicionais por herói.
            </p>
            <p className="text-xs text-neutral-400 bg-[#0d1117] border border-[#30363d] p-3.5 rounded-xl max-w-xl mx-auto leading-relaxed italic shadow-inner">
              💡 <span className="font-bold text-[#f59e0b]">Rache os custos do grupo:</span> Uma dica de ouro para as mesas de RPG é dividir a assinatura mensal de R$ 49,90/mês entre todos os integrantes! Vocês escolhem o mestre que cadastrará e tomará conta das campanhas, e o custo fica quase imperceptível para todos cooperarem e jogarem sem qualquer amarra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PLATFORM_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-neutral-950/80 border ${plan.id === 'premium' ? 'border-amber-500/50 shadow-amber-950/40 shadow-xl' : 'border-neutral-800'} rounded-2xl p-8 flex flex-col justify-between transition-all duration-300`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-sans font-bold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-amber-400/20 shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="font-serif text-xl font-bold text-neutral-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2 mb-6 border-b border-neutral-900 pb-6">
                    <span className="font-serif text-3xl sm:text-4xl font-extrabold text-amber-400">
                      {plan.price}
                    </span>
                    <span className="text-xs text-neutral-500 font-sans font-medium">
                      / {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2.5 text-sm text-neutral-300">
                        <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  id={`select-plan-${plan.id}-btn`}
                  onClick={() => {
                    if (plan.id === 'premium') {
                      window.open(INFINITEPAY_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
                    } else if (plan.id === 'forge') {
                      window.open('https://link.infinitepay.io/evandro-jose-d69/VC1D-4kI4yf8zxM-99,90', '_blank', 'noopener,noreferrer');
                    } else {
                      onSelectPlan(plan.id);
                    }
                  }}
                  className={`w-full py-3.5 rounded-xl font-sans font-extrabold text-sm uppercase tracking-[0.1em] transition-all duration-300 hover:scale-101 flex items-center justify-center gap-2 border border-[#30363d] cursor-pointer ${
                    plan.id === 'premium' || plan.id === 'forge'
                      ? 'bg-[#f59e0b] hover:bg-[#d97706] text-black shadow-lg shadow-amber-500/10'
                      : 'bg-[#161b22] hover:bg-[#0d1117] text-[#e2e8f0]'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-neutral-950 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-extrabold text-neutral-100 mb-4 tracking-tight flex items-center justify-center gap-3">
              <HelpCircle className="w-7 h-7 text-amber-500" />
              Perguntas Frequentes
            </h2>
            <p className="text-neutral-400 text-sm">
              Tire suas dúvidas sobre a assinatura do RPG Micro-SaaS.
            </p>
          </div>

          <div className="space-y-6">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="bg-neutral-900/40 border border-neutral-800/60 p-6 rounded-xl hover:border-amber-900/30 transition-colors"
                id={`faq-item-${index}`}
              >
                <h3 className="font-serif text-base sm:text-lg font-bold text-amber-400 mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-serif text-lg font-bold text-amber-400">Taverna Digital</span>
            <p className="text-xs text-neutral-500 mt-1">
              © 2026 Taverna Digital S/A. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex gap-6 text-xs text-neutral-400">
            <a href="#" className="hover:text-amber-500 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> API Gateway: Ativo
            </a>
          </div>
        </div>
      </footer>

      {/* Elegant Interactive Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuideModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-neutral-950 border border-neutral-800/80 shadow-[0_0_60px_rgba(245,158,11,0.2)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 font-sans text-neutral-200"
            >
              {/* Fiery top accent line */}
              <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400" />

              {/* Header */}
              <div className="p-5 px-6 border-b border-neutral-850 flex items-center justify-between bg-neutral-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <BookOpen className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-extrabold text-[#f59e0b] tracking-wide uppercase">
                      📖 Guia do Sistema & Como Jogar
                    </h2>
                    <p className="text-[10px] sm:text-xs text-neutral-400 font-medium">
                      Domine as regras, mídias e ferramentas de projeção de combate da Taverna Digital.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-500 hover:border-amber-900/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-neutral-850 bg-neutral-900/40 p-2 gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-amber-500/30 scrollbar-track-transparent">
                {[
                  { id: 'mestre', label: '👑 Painel do Mestre', colorClass: 'border-amber-500 text-amber-400 bg-amber-950/15' },
                  { id: 'grid', label: '🎴 Grid Tático & Cenários', colorClass: 'border-blue-500 text-blue-400 bg-blue-950/15' },
                  { id: 'dados', label: '🎲 Dados, Moedas & Chat', colorClass: 'border-purple-500 text-purple-400 bg-purple-950/15' },
                  { id: 'tokens', label: '👤 Gêneros & Coleção 3D', colorClass: 'border-pink-500 text-pink-400 bg-pink-950/15' },
                  { id: 'forge', label: '⚡ Forge Core Multiplayer', colorClass: 'border-emerald-500 text-emerald-400 bg-emerald-950/15' }
                ].map(tab => {
                  const isSelected = activeGuideTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveGuideTab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${
                        isSelected 
                          ? `${tab.colorClass} border-current shadow-md scale-102` 
                          : 'bg-neutral-950/40 border-neutral-850 hover:border-neutral-755 text-neutral-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Display Area */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 max-h-[55vh]">
                
                {activeGuideTab === 'mestre' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-amber-950/10 border border-amber-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Poder Absoluto: Modo Mestre do Jogo (DM)</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          A Taverna Digital concede autonomia híbrida para o Mestre. Da mesma forma que as miniaturas físicas são dispostas no tabuleiro da sala, aqui você controla as fichas, os parâmetros do cenário tático e dita as ameaças. No canto esquerdo superior, o seletor permite alternar entre <strong className="text-amber-400">Modo Mestre</strong> e <strong className="text-amber-400">Modo Jogador</strong> instantaneamente.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#facc15] font-serif text-base font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-amber-955 text-amber-100 text-[10px] items-center justify-center rounded-full border border-amber-500">1</span>
                          Criando Fichas / Heróis
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Abra a aba <strong>🛡️ Criar Personagem</strong> no painel esquerdo. Insira estatísticas básicas como HP, CA (Classe de Armadura), Iniciativa, atributos clássicos (Força, Destreza, Constituição, etc.), magias e classes. O sistema gera automaticamente uma miniatura de resina 2D com a cor escolhida para representação no mapa.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#fb923c] font-serif text-base font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-amber-955 text-amber-100 text-[10px] items-center justify-center rounded-full border border-amber-500">2</span>
                          Invocando Chefes Colossais
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Deseja assustar os jogadores? Na aba de Cenários, role até a seção de Chefes do Sistema. Selecione uma ameaça formidável como o <strong className="text-neutral-100">Senhor dos Elementos</strong>, <strong className="text-neutral-100">Devorador de Mentes</strong> ou <strong className="text-neutral-100">Dragão Ancião</strong> e ative seu pincel de chefe.
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest mb-2">⚡ Barra de Vida Cinemática do Chefe</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                        Ao spawnar um Chefe de Fase, uma imensa Barra de HP similar a jogos como Dark Souls surgirá no topo da tela do Mestre e dos Jogadores simultaneamente.
                      </p>
                      <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5">
                        <li>Como mestre, você possui os botões de ajuste rápido (<strong className="text-red-500">-50</strong>, <strong className="text-red-500">-10</strong>, <strong className="text-emerald-500">+10</strong>, <strong className="text-emerald-500">+50</strong>) no lado direito da barra para subtrair/curar vida instantaneamente de forma visual.</li>
                        <li>Os boss tokens agora usam renders vetoriais exclusivos e de alta fidelidade desenhados por nossa engenharia gráfica (exemplo: o Senhor dos Elementos possui uma gema pulsante de magma central).</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'grid' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-blue-950/10 border border-blue-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <LayoutGrid className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">Grid de Combate & Editor de Cenários Dinâmico</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          O coração tático da Taverna Digital é o grid de batalha interativo. Ele simula perfeitamente uma mesa presencial com as vantagens milimétricas do virtual. Mantenha os heróis posicionados de acordo com a velocidade de deslocamento de cada classe!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-2">
                        <span className="text-[#60a5fa] font-semibold text-xs uppercase tracking-wide block">🖌️ Pincéis de Textura & Paredes</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Selecione um dos pincéis de terreno no painel de ferramentas à direita do mapa:
                        </p>
                        <ul className="text-xs text-neutral-400 space-y-1 mt-1 pl-4 list-disc">
                          <li><strong className="text-amber-500">Paredes / Obstáculos:</strong> Bloqueia passagens, gera pilares de pedra realistas.</li>
                          <li><strong className="text-blue-400">Água Profunda:</strong> Cria córregos com efeito ondulante.</li>
                          <li><strong className="text-amber-700">Terra Seca / Lamaçal:</strong> Terreno difícil para penalidades de velocidade.</li>
                          <li><strong className="text-stone-300">Piso de Taberna:</strong> Piso clássico de madeira polida.</li>
                        </ul>
                        <p className="text-[10px] text-neutral-500 italic mt-2">
                          *Clique nas células do mapa para aplicar a textura correspondente instantaneamente.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-2">
                        <span className="text-[#34d399] font-semibold text-xs uppercase tracking-wide block">♟️ Arrastar e Posicionar Miniaturas</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Todas as fichas criadas pelo Mestre ou Jogadores se convertem em resinas interativas na parte inferior do grid:
                        </p>
                        <ul className="text-xs text-neutral-400 space-y-1 mt-1 pl-4 list-disc">
                          <li>Basta <strong>arrastar e soltar (drag and drop)</strong> a miniatura tática do painel inferior para qualquer ponto de combate no mapa.</li>
                          <li>As miniaturas possuem bordas iluminadas indicadoras de acordo com a facção: o Mestre possui miniaturas de ameaças vermelhas, enquanto heróis possuem bases douradas ou azuis ricas em contraste.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest">🌍 Biomas e Atmosferas do Mapa</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Mude o clima geral da batalha e sinta a transição imersiva instantaneamente ao escolher biomas do sistema no painel de cenários:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-805 text-center text-[10px]">🌋 Vulcano Estilo Lava</div>
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-805 text-center text-[10px]">🌲 Floresta Corrompida</div>
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-805 text-center text-[10px]">💎 Caverna de Cristais</div>
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-805 text-center text-[10px]">🏚️ Taverna Clássica</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'dados' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-purple-950/10 border border-purple-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <Dices className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-purple-400 uppercase tracking-wider mb-1">Dados Consecutivos, Moedas & Jokenpô Rápido</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Resolva ataques, testes de perícia ou decisões randômicas com o motor matemático de dados integrado diretamente ao feed de chat cooperativo.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-1">
                        <span className="text-[#c084fc] font-bold text-xs uppercase tracking-wide block">🎲 Rolo de Dados Rápido</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          No feed de dados do painel central, você encontra botões para os dados clássicos: <strong>D4, D6, D8, D10, D12, D20</strong> e <strong>D100</strong>. Clique nelas para rolar dados consecutivamente. O sistema calcula a soma agregada automaticamente!
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-1">
                        <span className="text-[#e9d5ff] font-bold text-xs uppercase tracking-wide block">🪙 Cara ou Coroa</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Precisa resolver um dilema de 50/50? O botão de <strong>Coin Flip / Moeda</strong> gira uma belíssima moeda física digital que lança os resultados no log público do mestre e dos jogadores ao mesmo tempo.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-1">
                        <span className="text-[#d946ef] font-bold text-xs uppercase tracking-wide block">✂️ Jokenpô PvP Rápido</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Sorteie de maneira teatral uma jogada de Pedra, Papel ou Tesoura para resolver impasses de narrativa em frações de segundos, adicionando uma camada recreativa.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#180828] border border-purple-900/20 p-4 rounded-xl">
                      <h5 className="font-serif text-xs font-bold text-purple-300 uppercase tracking-widest mb-1.5">📝 Chat Sincronizado e Inteligência</h5>
                      <p className="text-xs text-purple-200/80 leading-relaxed">
                        Qualquer decisão, rolagem de atributo, ataque de ficha ou dano do Chefe é imediatamente anotado no Feed de Registro público do lado direito. Isso evita fraudes e organiza o andamento do combate em rodadas precisas.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'tokens' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-pink-950/10 border border-pink-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <Check className="w-5 h-5 text-pink-400 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-pink-400 uppercase tracking-wider mb-1">Criação Dinâmica, Controle de Gênero (♂/♀) e Biblioteca de Miniaturas</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Agora, a Taverna Digital conta com um sistema inteligente de customização de fichas de personagens e criaturas. Além de determinar atributos e estatísticas de combate tático, você pode dar vida e representação perfeitas ao seu avatar 3D!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#f472b6] font-serif text-sm font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-pink-955 text-pink-100 text-[10px] items-center justify-center rounded-full border border-pink-500">A</span>
                          Controle de Gênero (♂/♀)
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Ao criar uma ficha ou gerar uma criatura por Inteligência Artificial, defina o gênero de forma direta usando as opções <strong>♂ Masc</strong> e <strong>♀ Fem</strong>. Isso altera dinamicamente detalhes cruciais na ilustração e modelo da peça de resina: penteados longos, ornamentos arcanos, postura e até o tipo de armas (ex: foice vs alabarda).
                        </p>
                        <p className="text-xs text-amber-400 italic">
                          💡 Você também pode alternar o gênero de qualquer token já posicionado no grid clicando no botão de gênero ♂/♀ na ficha de controle!
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#ec4899] font-serif text-sm font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-pink-955 text-pink-100 text-[10px] items-center justify-center rounded-full border border-pink-500">B</span>
                          Aparência e Modelos de Resina
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Ao gerar um token por IA, você pode escolher <strong>Automático (baseado no prompt)</strong> ou forçar a representação visual para uma das dezenas de miniaturas pré-construídas em nossa biblioteca tática de alta resolução.
                        </p>
                        <ul className="text-xs text-neutral-400 space-y-1.5 pl-4 list-disc">
                          <li><strong className="text-neutral-202">Heróis 3D:</strong> Guerreiro, Mago, Arqueiro, Ladino, Elfo, Elfo Negro (Drow), Ancião, Titã, Feiticeiro e Aldeão Genérico.</li>
                          <li><strong className="text-neutral-202">Monstros & Vilões:</strong> Goblin, Orc, Esqueleto, Aranha Gigante, Dragão, Observador, Mímico, Urso-Coruja, Cubo Gelatinoso, Vampiro e Súcubo/Íncubo.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5">✨ Geração Inteligente e Vinculação Automática</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Ao descrever um personagem com palavras livres na caixa de IA (ex: "vampira sedutora de capa vermelha" ou "urso assustador"), nosso mapeador inteligente de tokens varre as palavras-chave do texto e escolhe o melhor modelo 3D correspondente de forma 100% automatizada caso a opção "Automático" esteja selecionada.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'forge' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <div className="p-1 px-2.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs animate-pulse">VTT MULTIPLAYER</div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">⚡ Forge Core: Salas de Jogo On-line em Tempo Real</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          A maior atualização da Taverna Digital. Jogue remotamente com seu grupo conectado à nuvem usando nosso sistema de sincronização cooperativa em tempo real com Firebase.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-emerald-400 font-serif text-base font-extrabold flex items-center gap-2">
                          👑 Para o Mestre (DM)
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Como assinante do plano <strong>Taverna Forge Core</strong>, você tem acesso ao painel de salas virtuais. Crie salas com código único, carregue e manipule o grid tático, configure o deck de miniaturas e envie o link de convite rápido aos seus heróis.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-emerald-400 font-serif text-base font-extrabold flex items-center gap-2">
                          🛡️ Para os Jogadores
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Seus jogadores entram gratuitamente através do seu link exclusivo. Eles escolhem seus apelidos, controlam e associam um personagem às suas miniaturas e movem seus tokens pelo mapa com sincronização milimétrica de grid, chat e vida.
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest">Sincronização Completa em Tempo Real</h5>
                      <p className="text-xs text-neutral-405 leading-relaxed">
                        Esqueça telas travadas! Com canais de baixa latência integrados à estrutura Firebase, nossa tecnologia sincroniza instantaneamente:
                      </p>
                      <ul className="text-xs text-neutral-400 space-y-1.5 pl-4 list-disc">
                        <li><strong>Grid Tático 8x8</strong>: Ao arrastar uma peça, ela move na tela de todos simultaneamente.</li>
                        <li><strong>Mensagens no Chat & Fotos</strong>: Envie rolagens cooperativas de dados ou envie fotos e mockups de itens no feed compartilhável.</li>
                        <li><strong>Controle de Status</strong>: Subtraia ou cure HP de personagens locais ou de monstros em tempo real.</li>
                      </ul>
                    </div>

                    <div className="bg-[#052e16]/20 border border-emerald-900/20 p-4 rounded-xl text-center">
                      <p className="text-xs text-emerald-300">
                        💡 <strong>Inicie agora:</strong> Vá na barra superior e clique no botão <strong>⚡ Forge Core</strong> para iniciar a sua jornada multiplayer em nuvem conectada!
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom Buttons */}
              <div className="p-4 px-6 border-t border-neutral-850 bg-neutral-900/30 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Plataforma: Taverna Digital v2.4 (Active Server)
                </span>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition-all"
                >
                  Fechar Guia do Sistema
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
