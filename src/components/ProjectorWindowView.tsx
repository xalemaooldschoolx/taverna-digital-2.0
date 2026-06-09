import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Tv, Maximize2, Shield, Flame, Heart, Sparkles, Swords, MessageSquare, Award, Clock } from 'lucide-react';
import { ScenarioScene, Character, LogEntry, Quest, QuestArtifact } from '../types';
import { INITIAL_SCENARIOS, INITIAL_CHARACTERS, INITIAL_LOGS, INITIAL_ARTIFACTS, INITIAL_QUESTS } from '../data/mockDatabase';
import { db, ref, onValue } from '../lib/firebaseHelper';
import ConfettiEffect from './ConfettiEffect';
import { 
  ResinBase, 
  Figurine, 
  EnemyFigurine, 
  BossFigurine, 
  WallPillar, 
  getVectorBackgroundStyle, 
  BossTokenAvatar 
} from './MiniatureSvg';

const resolveEffectCoordinates = (effect: any, currentScenarios: any[], currentSelectedId: string) => {
  if (!effect) return null;
  if (effect.row !== -1 && effect.row !== undefined && effect.row !== null) {
    return effect;
  }
  const activeSc = currentScenarios.find(s => s.id === currentSelectedId) || currentScenarios[0];
  if (!activeSc) return effect;

  const targetNameLower = effect.targetName?.toLowerCase() || '';
  if (!targetNameLower) return effect;

  const rows = activeSc.gridRows || 12;
  const cols = activeSc.gridCols || 12;

  // 1. Match custom statuses names
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      const status = activeSc.tokenStatuses?.[key];
      if (status && status.name?.toLowerCase() === targetNameLower) {
        return { ...effect, row: r, col: c };
      }
    }
  }

  // 2. Match general class keywords
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = activeSc.gridData?.[r]?.[c];
      if (tile && tile !== 'empty' && tile !== 'wall') {
        const tileClean = tile.replace('player:', '').toLowerCase();
        if (targetNameLower.includes(tileClean) || tileClean.includes(targetNameLower)) {
          return { ...effect, row: r, col: c };
        }
      }
    }
  }

  return effect;
};

const ensureScenarioGrid12x12 = (scenario: ScenarioScene): ScenarioScene => {
  if (!scenario) return scenario;
  const targetCols = 12;
  const targetRows = 12;

  const currentRows = scenario.gridRows || scenario.gridData?.length || 10;
  const currentCols = scenario.gridCols || (scenario.gridData && scenario.gridData[0] ? scenario.gridData[0].length : 10);

  if (currentRows !== targetRows || currentCols !== targetCols || !scenario.gridData || scenario.gridData.length !== targetRows) {
    const newGridData: string[][] = [];
    for (let r = 0; r < targetRows; r++) {
      const newRow: string[] = [];
      for (let c = 0; c < targetCols; c++) {
        if (scenario.gridData && r < currentRows && c < currentCols) {
          newRow.push(scenario.gridData[r]?.[c] || 'empty');
        } else {
          if (r === 0 || r === targetRows - 1 || c === 0 || c === targetCols - 1) {
            newRow.push('wall');
          } else {
            newRow.push('empty');
          }
        }
      }
      newGridData.push(newRow);
    }

    let newFogOfWar: boolean[][] | undefined = undefined;
    if (scenario.fogOfWar) {
      newFogOfWar = [];
      for (let r = 0; r < targetRows; r++) {
        const newFogRow: boolean[] = [];
        for (let c = 0; c < targetCols; c++) {
          if (r < currentRows && c < currentCols) {
            newFogRow.push(!!scenario.fogOfWar[r]?.[c]);
          } else {
            newFogRow.push(false);
          }
        }
        newFogOfWar.push(newFogRow);
      }
    }

    return {
      ...scenario,
      gridCols: targetCols,
      gridRows: targetRows,
      gridData: newGridData,
      fogOfWar: newFogOfWar
    } as ScenarioScene;
  }
  return scenario;
};

export default function ProjectorWindowView() {
  const [scenarios, setScenarios] = useState<ScenarioScene[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gridAnimationClass, setGridAnimationClass] = useState<string>('');
  const [customTokens, setCustomTokens] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'mestre' | 'jogador'>('jogador');
  const [activeCombatEffects, setActiveCombatEffects] = useState<any[]>([]);
  const [activeCombatTarget, setActiveCombatTarget] = useState<{
    row: number;
    col: number;
    name: string;
    tileType: string;
  } | null>(null);

  const [activeCombatTargets, setActiveCombatTargets] = useState<Array<{
    row: number;
    col: number;
    name: string;
    tileType: string;
  }>>([]);

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem('vtt_quests');
      return saved ? JSON.parse(saved) : INITIAL_QUESTS;
    } catch {
      return INITIAL_QUESTS;
    }
  });

  const [showCompletedConfetti, setShowCompletedConfetti] = useState<boolean>(false);

  // Sync engine reading state from LocalStorage and subscribing to storage changes
  const loadState = () => {
    try {
      const savedScenarios = localStorage.getItem('vtt_scenarios');
      const savedId = localStorage.getItem('vtt_selectedScenarioId');
      const savedChars = localStorage.getItem('vtt_characters');
      const savedLogs = localStorage.getItem('vtt_logs');
      const savedCustomTokens = localStorage.getItem('vtt_custom_tokens');
      const savedActiveTarget = localStorage.getItem('vtt_active_combat_target');
      const savedActiveTargets = localStorage.getItem('vtt_active_combat_targets');
      const savedQuests = localStorage.getItem('vtt_quests');

      if (savedActiveTarget) {
        setActiveCombatTarget(JSON.parse(savedActiveTarget));
      } else {
        setActiveCombatTarget(null);
      }

      if (savedActiveTargets) {
        setActiveCombatTargets(JSON.parse(savedActiveTargets));
      } else {
        setActiveCombatTargets([]);
      }

      if (savedQuests) {
        setQuests(JSON.parse(savedQuests));
      } else {
        setQuests(INITIAL_QUESTS);
      }

      if (savedScenarios) {
        const loaded = JSON.parse(savedScenarios);
        setScenarios(loaded.map(ensureScenarioGrid12x12));
      } else {
        setScenarios(INITIAL_SCENARIOS.map(ensureScenarioGrid12x12));
      }

      if (savedId) {
        setSelectedScenarioId(savedId);
      } else {
        setSelectedScenarioId(INITIAL_SCENARIOS[0]?.id || '');
      }

      if (savedChars) {
        setCharacters(JSON.parse(savedChars));
      } else {
        setCharacters(INITIAL_CHARACTERS);
      }

      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs(INITIAL_LOGS);
      }

      if (savedCustomTokens) {
        setCustomTokens(JSON.parse(savedCustomTokens));
      } else {
        setCustomTokens([]);
      }
    } catch (e) {
      console.error('Failed to load storage in projector view:', e);
    }
  };

  useEffect(() => {
    // Initial fetch of absolute state
    loadState();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('taverna_vtt_channel');
        
        const handleMessage = (event: MessageEvent) => {
          const message = event.data;
          if (!message) return;
          
          const { type, data } = message;
          switch (type) {
            case 'scenarios':
              setScenarios(data.map(ensureScenarioGrid12x12));
              break;
            case 'selectedScenarioId':
              setSelectedScenarioId(data);
              break;
            case 'characters':
              setCharacters(data);
              break;
            case 'logs':
              setLogs(data);
              break;
            case 'custom_tokens':
              setCustomTokens(data);
              break;
            case 'active_combat_target':
              setActiveCombatTarget(data);
              break;
            case 'active_combat_targets':
              setActiveCombatTargets(data || []);
              break;
            case 'quests':
              setQuests(data || []);
              break;
            case 'grid_effect':
              if (data?.type === 'shake-and-glow') {
                setGridAnimationClass('animate-shake-and-glow');
                setTimeout(() => {
                  setGridAnimationClass('');
                }, 1500);
              }
              break;
            case 'sync_all':
              if (data.scenarios) setScenarios(data.scenarios.map(ensureScenarioGrid12x12));
              if (data.selectedScenarioId) setSelectedScenarioId(data.selectedScenarioId);
              if (data.characters) setCharacters(data.characters);
              if (data.logs) setLogs(data.logs);
              if (data.customTokens) setCustomTokens(data.customTokens);
              if (data.activeCombatTargets) setActiveCombatTargets(data.activeCombatTargets);
              if (data.quests) setQuests(data.quests);
              break;
            case 'combat_effect':
              if (data) {
                const resolved = resolveEffectCoordinates(data, scenarios, selectedScenarioId);
                if (resolved) {
                  setActiveCombatEffects(prev => {
                    if (prev.some(x => x.id === resolved.id)) return prev;
                    return [...prev, resolved];
                  });
                  setTimeout(() => {
                    setActiveCombatEffects(prev => prev.filter(e => e.id !== resolved.id));
                  }, 2000);
                }
              }
              break;
          }
        };

        channel.addEventListener('message', handleMessage);
      } catch (err) {
        console.error('BroadcastChannel initialization error:', err);
      }
    }

    // Storage event as solid cross-origin/safe backup callback
    const handleStorageChange = (e: StorageEvent) => {
      loadState();
      if (e.key === 'vtt_combat_effect_trigger' && e.newValue) {
        try {
          const effect = JSON.parse(e.newValue);
          const resolved = resolveEffectCoordinates(effect, scenarios, selectedScenarioId);
          if (resolved) {
            setActiveCombatEffects(prev => {
              if (prev.some(x => x.id === resolved.id)) return prev;
              return [...prev, resolved];
            });
            setTimeout(() => {
              setActiveCombatEffects(prev => prev.filter(e => e.id !== resolved.id));
            }, 2000);
          }
        } catch (err) {
          console.error(err);
        }
      }
      if (e.key === 'vtt_active_combat_target') {
        if (e.newValue) {
          setActiveCombatTarget(JSON.parse(e.newValue));
        } else {
          setActiveCombatTarget(null);
        }
      }
      if (e.key === 'vtt_active_combat_targets') {
        if (e.newValue) {
          setActiveCombatTargets(JSON.parse(e.newValue));
        } else {
          setActiveCombatTargets([]);
        }
      }
      if (e.key === 'vtt_quests') {
        if (e.newValue) {
          setQuests(JSON.parse(e.newValue));
        } else {
          setQuests([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Firebase Realtime Database live mirroring
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(hashQuery || window.location.search);
    const syncRoomId = params.get('room') || localStorage.getItem('vtt_sync_room_id') || 'FORGE-777';
    const roomRef = ref(db, 'rooms/' + syncRoomId);
    const unsubscribeFirebase = onValue(roomRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          if (data.scenarios) {
            const parsed = Array.isArray(data.scenarios) ? data.scenarios : Object.values(data.scenarios);
            setScenarios(parsed.map(ensureScenarioGrid12x12));
          }
          if (data.selectedScenarioId) setSelectedScenarioId(data.selectedScenarioId);
          if (data.characters) setCharacters(data.characters);
          if (data.logs) setLogs(data.logs);
          if (data.activeCombatTargets) setActiveCombatTargets(data.activeCombatTargets || []);
          if (data.activeCombatTarget) setActiveCombatTarget(data.activeCombatTarget);
          if (data.quests) setQuests(data.quests || []);
          if (data.customTokens) {
            const parsedCustom = Array.isArray(data.customTokens) ? data.customTokens : Object.values(data.customTokens);
            setCustomTokens(parsedCustom);
          }
        }
      } catch (err) {
        console.error("Projector Firebase Error:", err);
      }
    }, (err) => {
      console.warn("Projector RTDB access restricted during sync:", err);
    });

    const effectRef = ref(db, `rooms/${syncRoomId}/combat_effect_trigger`);
    const unsubscribeEffects = onValue(effectRef, (snapshot) => {
      try {
        const effect = snapshot.val();
        if (effect && effect.timestamp > Date.now() - 4000) {
          const resolved = resolveEffectCoordinates(effect, scenarios, selectedScenarioId);
          if (resolved) {
            setActiveCombatEffects(prev => {
              if (prev.some(x => x.id === resolved.id)) return prev;
              return [...prev, resolved];
            });
            setTimeout(() => {
              setActiveCombatEffects(prev => prev.filter(e => e.id !== resolved.id));
            }, 2000);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, (err) => {
      console.warn("Combat effect reader restricted:", err);
    });

    const confettiRef = ref(db, `rooms/${syncRoomId}/trigger_confetti`);
    const unsubscribeConfetti = onValue(confettiRef, (snapshot) => {
      try {
        const ts = snapshot.val();
        if (ts && ts > Date.now() - 5000) {
          setShowCompletedConfetti(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, (err) => {
      console.warn("Confetti reader restricted:", err);
    });

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageChange);
      unsubscribeFirebase();
      unsubscribeEffects();
      unsubscribeConfetti();
    };
  }, []);

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  if (!activeScenario) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-400 font-sans">
        <Tv className="w-12 h-12 text-amber-500 animate-pulse mb-3" />
        <span className="font-serif text-lg font-bold">Iniciando Tela de Transmissão...</span>
        <span className="text-xs text-neutral-500 mt-1">Certifique-se de que a mesa principal está aberta no seu navegador para alimentar o espelhamento.</span>
      </div>
    );
  }

  // Find boss in grid data
  const activeBossCell = (() => {
    if (!activeScenario.gridData) return null;
    for (let r = 0; r < activeScenario.gridData.length; r++) {
      for (let c = 0; c < activeScenario.gridData[r].length; c++) {
        const tile = activeScenario.gridData[r][c];
        if (tile && tile.startsWith('boss:')) {
          return { r, c, type: tile.split(':')[1] };
        }
      }
    }
    return null;
  })();

  const hasActiveBoss = !!activeBossCell;
  const activeBossType = activeBossCell?.type || 'ancient_dragon';
  const bossName = activeScenario.bossName || (activeBossType === 'supreme_lich' ? 'Lich Supremo' : activeBossType === 'beholder' ? 'Observador Ancião' : 'Dragão Ancião');
  const bossHp = activeScenario.bossHp !== undefined ? activeScenario.bossHp : 500;
  const bossMaxHp = activeScenario.bossMaxHp !== undefined ? activeScenario.bossMaxHp : 500;

  // Render tile elements
  const renderTileIcon = (tileType: string, rIdx?: number, cIdx?: number) => {
    if (!tileType || tileType === 'empty') {
      return <div className="w-full h-full bg-transparent border border-white/[0.03] rounded" />;
    }

    // Safety checks for dead characters/monsters to hide them immediately
    if (rIdx !== undefined && cIdx !== undefined && activeScenario) {
      const statusKey = `${rIdx}-${cIdx}`;
      const tokenStatus = activeScenario.tokenStatuses?.[statusKey];
      if (tokenStatus && tokenStatus.hp <= 0) {
        return <div className="w-full h-full bg-transparent border border-white/[0.03] rounded" />;
      }
    }

    if (tileType.startsWith('boss')) {
      const bHp = activeScenario?.bossHp !== undefined ? activeScenario.bossHp : 500;
      if (bHp <= 0) {
        return <div className="w-full h-full bg-transparent border border-white/[0.03] rounded" />;
      }
    }

    if (tileType.startsWith('player')) {
      let subclass = 'guerreiro';
      if (tileType.includes(':')) {
        subclass = tileType.split(':')[1];
      }
      
      const matchedChar = characters.find(c => c.id === subclass) || characters.find(c => {
        const cls = c.class.toLowerCase();
        if (subclass === 'mago') {
          return cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo');
        } else if (subclass === 'arqueiro') {
          return cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra');
        } else {
          return !cls.includes('mago') && !cls.includes('magic') && !cls.includes('feiticeiro') && !cls.includes('druida') && !cls.includes('clérigo') && !cls.includes('clerigo') &&
                 !cls.includes('ladina') && !cls.includes('arqueiro') && !cls.includes('arqueira') && !cls.includes('elfo') && !cls.includes('ranger') && !cls.includes('assassin') && !cls.includes('veloz') && !cls.includes('ladra');
        }
      });

      if (matchedChar && matchedChar.hp <= 0) {
        return <div className="w-full h-full bg-transparent border border-white/[0.03] rounded" />;
      }
    }

    if (tileType === 'wall') {
      return (
        <div className="w-full h-full relative flex items-center justify-center p-0.5">
          <WallPillar />
        </div>
      );
    }

    if (tileType === 'water') {
      return (
        <div className="w-full h-full bg-gradient-to-b from-cyan-950 via-blue-900 to-blue-950/80 border border-blue-500/10 rounded flex items-center justify-center relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-cyan-500/10" />
          <div className="w-full h-full absolute inset-0 opacity-70 flex flex-col justify-around py-1">
            <svg className="w-full h-3 text-cyan-400/50 animate-pulse" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0 5 Q 6 1, 12 5 T 24 5" strokeLinecap="round" />
            </svg>
            <svg className="w-full h-3 text-cyan-300/40 animate-pulse" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0 5 Q 6 9, 12 5 T 24 5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      );
    }

    if (tileType === 'chest') {
      return (
        <div className="w-full h-full flex items-center justify-center scale-95 p-0.5">
          <div className="w-full h-full bg-gradient-to-br from-amber-950 to-neutral-900 border border-amber-500/35 rounded flex flex-col items-center justify-center p-1 shadow-[0_4px_8px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="w-full h-3/5 bg-gradient-to-r from-amber-750 to-amber-900 border-b-2 border-stone-950 flex items-center justify-center relative">
              <div className="absolute left-1/4 inset-y-0 w-1.5 bg-yellow-600/30" />
              <div className="absolute right-1/4 inset-y-0 w-1.5 bg-yellow-600/30" />
              <div className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center shadow-[0_0_15px_#a855f7] animate-pulse z-10">
                <div className="w-1 h-1 bg-yellow-400 rounded-full" />
              </div>
            </div>
            <div className="w-full h-2/5 bg-gradient-to-r from-amber-900 to-amber-950 flex justify-between px-2" />
          </div>
        </div>
      );
    }

    if (tileType.startsWith('player')) {
      let subclass = 'guerreiro';
      if (tileType.includes(':')) {
        subclass = tileType.split(':')[1];
      }

      const matchedChar = characters.find(c => c.id === subclass) || characters.find(c => c.class.toLowerCase() === subclass.toLowerCase());
      const charColor = matchedChar?.clothingColor;
      let figurineId = subclass;
      if (matchedChar) {
        const cls = matchedChar.class.toLowerCase();
        if (cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo')) {
          figurineId = 'mago';
        } else if (cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra')) {
          figurineId = 'arqueiro';
        } else {
          figurineId = 'guerreiro';
        }
      }

      return (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="w-full h-full p-0.5 relative z-10 flex items-center justify-center placeholder-token"
        >
          <div className="w-full h-full relative">
            <ResinBase type="hero" subclass={figurineId} clothingColor={charColor} />
            <Figurine id={figurineId} clothingColor={charColor} />
          </div>
        </motion.div>
      );
    }

    if (tileType.startsWith('enemy')) {
      let enemyId = 'goblin';
      if (tileType.includes(':')) {
        enemyId = tileType.split(':')[1];
      }
      return (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="w-full h-full p-0.5 flex items-center justify-center relative"
        >
          <div className="w-full h-full relative">
            <ResinBase type="enemy" />
            <EnemyFigurine id={enemyId} />
          </div>
        </motion.div>
      );
    }

    if (tileType.startsWith('boss')) {
      const bossId = tileType.split(':')[1] || 'ancient_dragon';
      return (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="absolute top-0 left-0 w-[196%] h-[196%] z-20 flex items-center justify-center"
        >
          <div className="w-full h-full relative scale-95">
            <ResinBase type="boss" />
            <div className="absolute inset-0 z-20 flex items-center justify-center p-2">
              <BossFigurine id={bossId} />
            </div>
          </div>
        </motion.div>
      );
    }

    if (tileType.startsWith('custom:')) {
      const parts = tileType.split(':');
      const type = parts[1] as 'hero' | 'enemy';
      const tokenId = parts[2];
      
      const token = customTokens.find(t => t.id === tokenId);
      const imageUrl = token?.imageUrl || 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?auto=format&fit=crop&w=150&h=150&q=80';
      const name = token?.name || 'Token Materializado';
      const isEnemy = type === 'enemy';
      const renderStyle = token?.renderStyle || 'standee';

      return (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="w-full h-full p-0.5 relative z-10 flex items-center justify-center pointer-events-auto animate-fade-in" 
          title={name}
        >
          {renderStyle === 'figurine' ? (
            <div className="w-full h-full relative cursor-pointer select-none">
              <ResinBase type={token?.modelType || (isEnemy ? 'enemy' : 'hero')} subclass={token?.figurineId} />
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                {token?.modelType === 'boss' ? (
                  <div className="absolute inset-x-0 bottom-[18%] h-[125%] w-[110%] -left-[5%] mx-auto z-20 flex flex-col items-center justify-end">
                    <BossFigurine id={token?.figurineId || 'supreme_lich'} />
                  </div>
                ) : token?.modelType === 'enemy' ? (
                  <EnemyFigurine id={token?.figurineId || 'orc'} gender={token?.gender} />
                ) : (
                  <Figurine id={token?.figurineId || 'guerreiro'} gender={token?.gender} />
                )}
              </div>
            </div>
          ) : renderStyle === 'standee' ? (
            <div className="w-full h-[155%] absolute bottom-0 inset-x-0 cursor-pointer select-none">
              <ResinBase type={isEnemy ? 'enemy' : 'hero'} />
              <div className="absolute inset-x-0 bottom-[18%] h-[125%] w-[110%] -left-[5%] mx-auto z-20 flex flex-col items-center justify-end">
                <div 
                  style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.7))" }}
                  className={`relative w-[85%] aspect-[4/5] rounded-t-[2.2rem] rounded-b-[0.5rem] border-[3px] ${isEnemy ? 'border-red-500 bg-gradient-to-t from-red-950/80 to-neutral-900/10' : 'border-amber-400 bg-gradient-to-t from-amber-950/80 to-neutral-900/10'} overflow-hidden shadow-[inset_0_4px_12px_rgba(255,255,255,0.15)] flex items-center justify-center`}
                >
                  <img src={imageUrl} className="w-full h-full object-cover select-none scale-[1.05]" alt="" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10 pointer-events-none" />
                  <div className="absolute inset-x-[2px] top-[2px] h-[35%] bg-gradient-to-b from-white/15 to-transparent rounded-t-[2rem] pointer-events-none" />
                  <div className="absolute inset-0 border border-black/30 rounded-t-[2rem] rounded-b-[0.3rem] pointer-events-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative cursor-pointer select-none">
              <ResinBase type={isEnemy ? 'enemy' : 'hero'} />
              <div className="absolute inset-x-0 bottom-[12%] h-[82%] w-[82%] mx-auto z-20 flex items-center justify-center">
                <div className={`w-14 h-14 rounded-full border-2 ${isEnemy ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'} overflow-hidden relative bg-neutral-900 flex items-center justify-center`}>
                  <img src={imageUrl} className="w-full h-full object-cover rounded-full select-none" alt="" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/25 pointer-events-none rounded-full" />
                  <div className="absolute top-0.5 left-0.5 right-0.5 h-1/2 bg-white/10 rounded-t-full pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    return null;
  };

  const hpPercentage = Math.round((bossHp / bossMaxHp) * 100);

  const triggerFullscreen = () => {
    const el = document.getElementById('projector-viewport-root');
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen().catch(err => console.error(err));
      }
    }
  };

  // Keep latest 8 logs to avoid overflowing and looking super elegant
  const activeRecentLogs = logs.slice(0, 8);

  const getClassIcon = (cls: string) => {
    const name = cls.toLowerCase();
    if (name.includes('guerreiro') || name.includes('barbaro') || name.includes('paladino')) return <Swords className="w-3.5 h-3.5 text-red-400" />;
    if (name.includes('mago') || name.includes('bruxo') || name.includes('feiticeiro')) return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    if (name.includes('clérigo') || name.includes('sacerdote') || name.includes('bardo')) return <Award className="w-3.5 h-3.5 text-amber-400" />;
    return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const activeTargetDetailsList = (() => {
    if (!activeCombatTargets || !activeScenario) return [];
    return activeCombatTargets.map(tgt => {
      const { row, col, name, tileType } = tgt;
      const currentTile = activeScenario.gridData?.[row]?.[col];
      if (!currentTile || currentTile === 'empty' || currentTile === 'wall') {
        return null;
      }
      
      const statusKey = `${row}-${col}`;
      const isBoss = tileType.startsWith('boss:');
      const defaultHp = isBoss ? 500 : 40;
      const defaultMp = isBoss ? 100 : 20;

      const tokenStatus = activeScenario.tokenStatuses?.[statusKey] || {
        hp: defaultHp,
        maxHp: defaultHp,
        mp: defaultMp,
        maxMp: defaultMp,
        name: name
      };

      return {
        row,
        col,
        name: tokenStatus.name || name,
        hp: tokenStatus.hp,
        maxHp: tokenStatus.maxHp,
        mp: tokenStatus.mp !== undefined ? tokenStatus.mp : defaultMp,
        maxMp: tokenStatus.maxMp !== undefined ? tokenStatus.maxMp : defaultMp,
        tileType
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  })();

  const activeTargetDetails = activeTargetDetailsList[0] || null;

  return (
    <div 
      id="projector-viewport-root"
      className="min-h-screen bg-[#05070a] text-neutral-100 flex flex-col justify-between p-4 overflow-hidden select-none relative font-sans"
    >
      {/* 3D Confetti particle burst on completed quests or level up */}
      <ConfettiEffect active={showCompletedConfetti} onComplete={() => setShowCompletedConfetti(false)} />

      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#000]/70 to-[#000]/95 pointer-events-none" />
      <div className="absolute top-[-25%] left-1/3 w-[70%] h-[50%] bg-[#b45309]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-10 w-[40%] h-[40%] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-neutral-900 bg-neutral-950/70 backdrop-blur-md p-3 px-5 rounded-2xl shadow-xl mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-widest text-amber-500 block font-black">SAÍDA DE MULTITELA SINCRONIZADA</span>
            <h1 className="font-serif text-sm font-black text-neutral-100 tracking-wide uppercase flex items-center gap-2">
              <span>{activeScenario.name}</span>
              <span className="text-[9px] font-mono normal-case tracking-normal px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold">
                Espelhamento Ativo
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <span className="hidden xl:inline text-[10px] text-neutral-400 font-mono italic bg-neutral-900/90 px-3 py-1.5 rounded-lg border border-neutral-800">
            💡 DICA DO MESTRE: Exiba esta guia na TV da mesa e pressione F11 para imersão total dos jogadores.
          </span>
          <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-805 flex gap-1 shadow-inner">
            <button
              onClick={() => setViewMode('jogador')}
              className={`flex items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'jogador'
                  ? 'bg-amber-500 text-neutral-950 font-black shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Visão dos Jogadores: Névoa escura ativa"
            >
              <span>👥 Jogador</span>
            </button>
            <button
              onClick={() => setViewMode('mestre')}
              className={`flex items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'mestre'
                  ? 'bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-extrabold shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Visão do Mestre: Névoa translúcida revelada"
            >
              <span>👑 Mestre</span>
            </button>
          </div>
          <button
            onClick={triggerFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold text-neutral-300 transition-all active:scale-95 shadow-md shrink-0"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Ver Tela Cheia</span>
          </button>
        </div>
      </header>

      {/* Main Container - Split View */}
      <div className="flex-1 flex gap-4 min-h-0 relative z-10">
        
        {/* Left Side Column: Player references (HP tracker & combat feed log) */}
        <aside className="w-72 bg-[#080c14]/80 backdrop-blur-md border border-neutral-900 rounded-2xl flex flex-col overflow-hidden max-h-[81vh] shrink-0 p-3 shadow-2xl">
          
          {/* Header of players list */}
          <div className="border-b border-neutral-900 pb-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-500 font-mono tracking-widest font-black uppercase">📋 STATUS DOS HERÓIS</span>
              <span className="text-[9px] text-neutral-500 font-mono">Sessão Ativa</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-0.5">Fichas de atributos sincronizadas da mesa.</p>
          </div>

          {/* Slices of characters */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 scrollbar-thin scrollbar-thumb-neutral-800">
            {characters.filter(c => c.hp > 0).length === 0 ? (
              <div className="text-center py-6 text-neutral-600 text-[11px] font-mono">
                Nenhum aventureiro de pé nesta cena
              </div>
            ) : (
              characters.filter(c => c.hp > 0).map(char => {
                const innerHpPct = Math.min(100, Math.max(0, Math.round((char.hp / char.maxHp) * 100)));
                const innerMpPct = Math.min(100, Math.max(0, Math.round((char.mp / char.maxMp) * 100)));
                const isDead = char.hp <= 0;

                return (
                  <div 
                    key={char.id} 
                    className={`p-2 rounded-xl border transition-all ${
                      isDead 
                        ? 'bg-red-950/10 border-red-950/40 opacity-50' 
                        : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-850 hover:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="w-5 h-5 rounded-md bg-neutral-950 flex items-center justify-center shrink-0 border border-neutral-800">
                          {getClassIcon(char.class)}
                        </div>
                        <span className="font-serif font-black text-xs text-neutral-100 truncate">{char.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400 shrink-0 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850">
                        Nív {char.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px] text-neutral-400 mb-1.5 px-0.5">
                      <span>Raça: <strong className="text-neutral-200">{char.race}</strong></span>
                      <span className="text-right truncate">Atributo: <strong className="text-amber-500 font-mono">{char.class}</strong></span>
                    </div>

                    <div className="space-y-1">
                      {/* HP Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                          <span className="flex items-center gap-0.5 text-rose-400 font-bold">
                            <Heart className="w-2.5 h-2.5 fill-rose-500/30 shrink-0" />
                            HP
                          </span>
                          <span className={char.hp < char.maxHp / 3 ? 'text-red-400 font-bold animate-pulse' : 'text-neutral-300'}>
                            {char.hp}/{char.maxHp}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-neutral-950 border border-neutral-850 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isDead
                                ? 'bg-neutral-800'
                                : char.hp < char.maxHp / 3 
                                  ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                                  : 'bg-gradient-to-r from-emerald-600 to-green-400'
                            }`}
                            style={{ width: `${innerHpPct}%` }}
                          />
                        </div>
                      </div>

                      {/* MP Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                          <span className="flex items-center gap-0.5 text-sky-400 font-bold">
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            MP
                          </span>
                          <span className="text-neutral-300">
                            {char.mp}/{char.maxMp}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-950 border border-neutral-850 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
                            style={{ width: `${innerMpPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Chat and Rolls log feed */}
          <div className="border-t border-neutral-900 pt-2.5 mt-2 flex flex-col h-48 select-none min-h-0">
            <span className="text-[9px] text-amber-500 font-mono tracking-wider font-extrabold mb-1.5 block uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              SISTEMA & ROLAGENS LIVE
            </span>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 text-[10px] scrollbar-thin scrollbar-thumb-neutral-800 font-mono">
              {activeRecentLogs.length === 0 ? (
                <div className="text-neutral-600 text-center py-6">Iniciando feed de combate...</div>
              ) : (
                activeRecentLogs.map((log) => {
                  let badgeColor = 'text-sky-400 bg-sky-950/20 border-sky-900/35';
                  if (log.type === 'combat') badgeColor = 'text-rose-400 bg-rose-950/20 border-rose-900/35';
                  if (log.type === 'roll') badgeColor = 'text-amber-400 bg-amber-950/20 border-amber-900/35';
                  if (log.type === 'system') badgeColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-900/35';

                  return (
                    <div 
                      key={log.id} 
                      className="p-1.5 rounded bg-neutral-900/40 border border-neutral-850 flex flex-col gap-0.5 text-[9px] hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-neutral-500 font-mono">{log.timestamp}</span>
                        <span className={`px-1 rounded-sm text-[7px] border font-black uppercase tracking-wider ${badgeColor}`}>
                          {log.type === 'roll' ? 'Dado' : log.type === 'combat' ? 'Combate' : log.type === 'system' ? 'Sistema' : 'Falar'}
                        </span>
                      </div>
                      <div className="text-neutral-300 whitespace-pre-wrap break-all leading-tight">
                        <strong className="text-yellow-500 mr-1">{log.sender}:</strong>
                        <span>{log.content}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Right Side Column: Strategic Tactician Grid Map (Vertical Maximized) */}
        <main className="flex-1 flex flex-col items-center justify-center relative min-h-0 p-1">
          
          {/* Boss Integrated Bar - centered immediately above the grid */}
          <AnimatePresence>
            {hasActiveBoss && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-xl bg-neutral-950/50 border border-neutral-900/80 backdrop-blur-md rounded-2xl p-2.5 px-4 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative overflow-hidden mb-3.5 shrink-0"
              >
                {/* Gold/Red glow lines */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-950/15 via-transparent to-red-950/15 pointer-events-none" />
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full border border-red-500/40 overflow-hidden shrink-0 shadow bg-black flex items-center justify-center">
                      <BossTokenAvatar id={activeBossType} />
                    </div>
                    <div>
                      <span className="text-[8px] text-red-400 font-mono tracking-widest block font-black uppercase animate-pulse">🔴 AMEAÇA RIVAL ATIVA</span>
                      <h2 className="font-serif text-[#ef4444] font-black text-xs uppercase tracking-widest leading-none mt-0.5">{bossName}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-neutral-500 font-mono block">MÉTRICA DE VIDA</span>
                    <span className="text-xs font-mono font-black text-red-400">
                      {bossHp} / {bossMaxHp} <span className="text-stone-500">({hpPercentage}%)</span>
                    </span>
                  </div>
                </div>

                {/* HP Tracker strip */}
                <div className="h-2.5 w-full bg-neutral-950 border border-neutral-850 rounded-full overflow-hidden shadow-inner relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hpPercentage}%` }}
                    transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                    className="h-full bg-gradient-to-r from-red-800 via-rose-500 to-amber-500 relative"
                  >
                    <div className="absolute top-0 right-0 h-full w-2 bg-white/50 shadow-[0_0_8px_#fff] animate-pulse" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Combat Targets Integrated Bars - Render all focused combatants simultaneously */}
          <div className="w-full flex flex-wrap justify-center gap-3 mb-3 shrink-0 z-20">
            <AnimatePresence mode="popLayout">
              {activeTargetDetailsList.map((target, idx) => {
                const targetHpPct = Math.round((target.hp / target.maxHp) * 100);
                const targetMpPct = Math.round((target.mp / target.maxMp) * 100);
                const isTargetBoss = target.tileType.startsWith('boss:');

                return (
                  <motion.div
                    key={`${target.row}-${target.col}`}
                    initial={{ opacity: 0, y: -15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15 }}
                    layout
                    className={`w-full max-w-xs bg-neutral-950/85 border ${isTargetBoss ? 'border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-neutral-800'} rounded-2xl p-2.5 px-3 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative overflow-hidden`}
                  >
                    {/* Volcanic/Gold glow lines */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[60%]">
                        <div className={`w-6 h-6 rounded-full border ${isTargetBoss ? 'border-red-500/40' : 'border-amber-500/40'} overflow-hidden shrink-0 shadow bg-black flex items-center justify-center font-bold text-[10px] text-amber-500 animate-pulse`}>
                          {isTargetBoss ? '👹' : '⚔️'}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[7px] font-mono tracking-widest block font-black uppercase leading-none ${isTargetBoss ? 'text-red-500' : 'text-amber-400'}`}>
                            {isTargetBoss ? '🔴 CHEFE ATIVO' : `⚔️ EM COMBATE #${idx + 1}`}
                          </span>
                          <h2 className={`font-serif ${isTargetBoss ? 'text-red-400 font-extrabold' : 'text-[#f59e0b]'} text-[10px] uppercase truncate tracking-widest leading-none mt-0.5`}>
                            {target.name}
                          </h2>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold text-neutral-300">
                          HP <span className="text-red-400">{target.hp}/{target.maxHp}</span> <span className="text-stone-500">|</span> MP <span className="text-blue-400">{target.mp}/{target.maxMp}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* HP Tracker strip */}
                      <div className="h-2 w-full bg-neutral-950 border border-neutral-850 rounded-full overflow-hidden shadow-inner relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${targetHpPct}%` }}
                          transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                          className={`h-full bg-gradient-to-r ${isTargetBoss ? 'from-red-700 to-rose-500' : 'from-red-650 via-orange-500 to-yellow-500'} relative`}
                        >
                          <div className="absolute top-0 right-0 h-full w-2 bg-white/50 shadow-[0_0_8px_#fff] animate-pulse" />
                        </motion.div>
                      </div>

                      {/* MP Tracker strip */}
                      <div className="h-1.5 w-full bg-neutral-950 border border-neutral-850 rounded-full overflow-hidden shadow-inner relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${targetMpPct}%` }}
                          transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                          className="h-full bg-gradient-to-r from-blue-650 to-cyan-500 relative"
                        >
                          <div className="absolute top-0 right-0 h-full w-2 bg-white/50 shadow-[0_0_8px_#fff] animate-pulse" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Tactical Grid Area maximized to full height! */}
          <div className="flex-1 w-full flex items-center justify-center min-h-0">
            <div className={`h-[78vh] w-[78vh] max-h-[82vh] max-w-[82vw] aspect-square bg-[#03060a] p-3 rounded-3xl border border-neutral-900 shadow-2xl relative flex items-center justify-center transition-all duration-300 ${gridAnimationClass}`}>
              <div 
                className={`grid gap-0 select-none w-full h-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] relative transition-all duration-300 ${gridAnimationClass}`}
                style={{
                  ...getVectorBackgroundStyle(activeScenario.backgroundTexture || 'flagstone'),
                  gridTemplateColumns: `repeat(${activeScenario.gridCols || 12}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${activeScenario.gridRows || 12}, minmax(0, 1fr))`
                }}
              >
                {activeScenario.gridData.map((row, rIdx) => 
                  row.map((tileType, cIdx) => {
                    const hasFog = activeScenario.fogOfWar && activeScenario.fogOfWar[rIdx] && activeScenario.fogOfWar[rIdx][cIdx];
                    const cellEffect = activeCombatEffects.find(fx => fx.row === rIdx && fx.col === cIdx);
                    const isDamageEffect = cellEffect && cellEffect.type === 'damage';
                    const isHealEffect = cellEffect && cellEffect.type === 'heal';

                    // Resolve hover tooltip name for tokens in projector
                    let hoverTitle: string | undefined;
                    if (tileType && tileType !== 'empty') {
                      if (tileType.startsWith('player')) {
                        const heroId = tileType.split(':')[1] || 'guerreiro';
                        const matchingChar = characters.find(c => c.id === heroId || (c.class && c.class.toLowerCase() === heroId.toLowerCase()));
                        hoverTitle = matchingChar?.name || `Jogador (${heroId})`;
                      } else if (tileType.startsWith('enemy')) {
                        const enemyId = tileType.split(':')[1] || 'goblin';
                        hoverTitle = enemyId.charAt(0).toUpperCase() + enemyId.slice(1);
                      } else if (tileType.startsWith('boss:')) {
                        const bossId = tileType.split(':')[1] || 'ancient_dragon';
                        hoverTitle = bossId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      } else if (tileType.startsWith('custom:')) {
                        const parts = tileType.split(':');
                        const tokenId = parts[2];
                        const token = customTokens.find(t => t.id === tokenId);
                        hoverTitle = token?.name || 'IA Token';
                      }
                    }

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        title={hoverTitle}
                        className={`aspect-square relative flex items-center justify-center p-0 border-r border-b border-white/[0.04] transition-all ${
                          isDamageEffect ? 'animate-cell-damage ring-1 ring-red-500/50 bg-red-950/10' : ''
                        } ${
                          isHealEffect ? 'animate-cell-heal ring-1 ring-emerald-500/50 bg-emerald-950/10' : ''
                        }`}
                      >
                        {hasFog && viewMode === 'jogador' ? (
                          <div className="w-full h-full bg-[#030406] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#010203]/70 to-[#030406] pointer-events-none" />
                            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black pointer-events-none animate-pulse" />
                            <svg className="w-5 h-5 text-neutral-850 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                              <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : (
                          <>
                            {(() => {
                              let animateProps = {};
                              let transitionProps = {};
                              let effectOverlay = null;

                              if (cellEffect) {
                                if (cellEffect.type === 'damage') {
                                  animateProps = {
                                    x: [0, -4, 4, -4, 4, -2, 2, 0],
                                    y: [0, 1, -1, 1, -1, 1, -1, 0],
                                    rotate: [0, -2, 2, -2, 2, 0],
                                    scale: [1, 0.9, 1.05, 1],
                                  };
                                  transitionProps = { duration: 0.5 };
                                  effectOverlay = (
                                    <div className="absolute inset-0 bg-red-600/30 rounded-xl pointer-events-none z-20 mix-blend-color-dodge animate-pulse" />
                                  );
                                } else if (cellEffect.type === 'heal') {
                                  animateProps = {
                                    scale: [1, 1.25, 1],
                                    y: [0, -6, 0],
                                  };
                                  transitionProps = { duration: 0.6, ease: "easeOut" };
                                  effectOverlay = (
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-xl pointer-events-none z-20 mix-blend-color-dodge animate-pulse" />
                                  );
                                } else if (cellEffect.type === 'mana-use') {
                                  animateProps = {
                                    scale: [1, 1.15, 1],
                                    rotate: [0, -4, 4, 0],
                                  };
                                  transitionProps = { duration: 0.5 };
                                  effectOverlay = (
                                    <div className="absolute inset-0 bg-blue-600/20 rounded-xl pointer-events-none z-20 mix-blend-color-dodge" />
                                  );
                                } else if (cellEffect.type === 'mana-gain') {
                                  animateProps = {
                                    scale: [1, 1.2, 1],
                                    y: [0, -4, 0],
                                  };
                                  transitionProps = { duration: 0.5 };
                                  effectOverlay = (
                                    <div className="absolute inset-0 bg-cyan-400/25 rounded-xl pointer-events-none z-20 mix-blend-color-dodge animate-pulse" />
                                  );
                                }
                              }

                              return (
                                <motion.div
                                  animate={animateProps}
                                  transition={transitionProps}
                                  className="w-full h-full relative flex items-center justify-center p-0.5"
                                >
                                  {renderTileIcon(tileType, rIdx, cIdx)}
                                  {effectOverlay}
                                </motion.div>
                              );
                            })()}

                            {/* Real-time Combat floating effects */}
                            <AnimatePresence>
                              {activeCombatEffects
                                .filter(fx => fx.row === rIdx && fx.col === cIdx)
                                .map(fx => {
                                  const isDamage = fx.type === 'damage';
                                  const isHeal = fx.type === 'heal';
                                  const isManaUse = fx.type === 'mana-use';
                                  const isManaGain = fx.type === 'mana-gain';

                                  let textColor = 'text-red-500';
                                  let prefix = '';
                                  let label = '';
                                  let icon = '💥';

                                  if (isDamage) {
                                    textColor = 'text-red-500 font-extrabold drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]';
                                    prefix = '-';
                                    label = `${fx.hpChange ? Math.abs(fx.hpChange) : ''} HP`;
                                    icon = '💥';
                                  } else if (isHeal) {
                                    textColor = 'text-emerald-400 font-extrabold drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]';
                                    prefix = '+';
                                    label = `${fx.hpChange ? Math.abs(fx.hpChange) : ''} HP`;
                                    icon = '💚';
                                  } else if (isManaUse) {
                                    textColor = 'text-blue-400 font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]';
                                    prefix = '-';
                                    label = `${fx.mpChange ? Math.abs(fx.mpChange) : ''} MP`;
                                    icon = '💧';
                                  } else if (isManaGain) {
                                    textColor = 'text-cyan-300 font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]';
                                    prefix = '+';
                                    label = `${fx.mpChange ? Math.abs(fx.mpChange) : ''} MP`;
                                    icon = '✨';
                                  }

                                  return (
                                    <motion.div
                                      key={fx.id}
                                      initial={{ opacity: 0, scale: 0.6, y: 15 }}
                                      animate={{ 
                                        opacity: [0, 1, 1, 0],
                                        scale: [0.6, 1.3, 1, 0.8],
                                        y: [15, -30, -50, -65],
                                        rotate: [0, -5, 5, 0]
                                      }}
                                      transition={{ duration: 1.8, ease: 'easeOut' }}
                                      className="absolute z-50 pointer-events-none flex flex-col items-center justify-center font-bold"
                                    >
                                      <div className="px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 flex items-center gap-1 shadow-2xl">
                                        <span className="text-[10px] shrink-0">{icon}</span>
                                        <span className={`text-[9.5px] font-mono tracking-tight font-extrabold ${textColor}`}>
                                          {prefix}{label}
                                        </span>
                                      </div>
                                      <span className="text-[7.5px] text-neutral-300 font-sans mt-0.5 whitespace-nowrap bg-neutral-900/90 px-1 py-0.1 rounded border border-neutral-800 drop-shadow">
                                        {fx.targetName}
                                      </span>
                                    </motion.div>
                                  );
                                })
                              }
                            </AnimatePresence>

                            {hasFog && (
                              <div className="absolute inset-0 bg-indigo-950/40 border border-indigo-500/50 flex items-center justify-center pointer-events-none z-30" title="Névoa da Guerra Ativa">
                                <div className="w-5 h-5 rounded-full bg-indigo-950/90 border border-indigo-500/60 flex items-center justify-center shadow-lg">
                                  <svg className="w-2.5 h-2.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Side Column: Active Quests & 3D Artifacts Collection */}
        <aside className="w-72 bg-[#080c14]/80 backdrop-blur-md border border-neutral-900 rounded-2xl flex flex-col overflow-hidden max-h-[81vh] shrink-0 p-3 shadow-2xl">
          <style>{`
            @keyframes spinArtifact3D {
              0% { transform: perspective(800px) rotateY(0deg) rotateX(5deg) translateY(0px); }
              50% { transform: perspective(800px) rotateY(180deg) rotateX(-5deg) translateY(-8px); }
              100% { transform: perspective(800px) rotateY(360deg) rotateX(5deg) translateY(0px); }
            }
            .animate-artifact-3d {
              animation: spinArtifact3D 7s ease-in-out infinite;
              transform-style: preserve-3d;
            }
          `}</style>

          <div className="border-b border-neutral-900 pb-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-500 font-mono tracking-widest font-black uppercase">🏆 DIÁRIO DE MISSÕES</span>
              <span className="text-[9px] text-neutral-500 font-mono">Guilda Ativa</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-0.5">Metas e tesouros lendários do grupo.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 scrollbar-thin scrollbar-thumb-neutral-800">
            {quests.filter(q => q.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-[11px] font-mono flex flex-col items-center justify-center gap-2">
                <span className="text-2xl text-stone-600">📜</span>
                <span>Nenhuma missão ativa neste momento.</span>
                <span className="text-[9px] text-neutral-600">Aguardando designações arcanas do Mestre...</span>
              </div>
            ) : (
              quests.filter(q => q.status === 'active').map(quest => {
                const artifact = INITIAL_ARTIFACTS.find(art => art.id === quest.rewardArtifactId);
                const questHeroes = quest.participants.map(pId => {
                  const char = characters.find(c => c.id === pId);
                  return char ? char.name : 'Herói';
                });

                return (
                  <div key={quest.id} className="p-3 rounded-xl border border-amber-905/40 bg-gradient-to-b from-amber-955/5 to-neutral-500/5 flex flex-col gap-3 relative overflow-hidden">
                    {/* Glowing pulse accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

                    <div>
                      <span className="text-[7.5px] text-amber-500 font-mono font-black uppercase tracking-widest block mb-0.5">⚔️ MISSÃO EM CURSO</span>
                      <h4 className="font-serif text-sm font-black text-amber-400 leading-tight block">{quest.title}</h4>
                      <p className="text-[10.5px] text-neutral-350 font-sans leading-snug mt-1.5 bg-black/30 p-2 rounded-lg border border-neutral-900">{quest.description}</p>
                    </div>

                    {/* Participants */}
                    <div>
                      <span className="text-[8px] text-neutral-500 font-mono tracking-wider block mb-1 uppercase">👥 INTEGRANTES DA MESA</span>
                      <div className="flex flex-wrap gap-1">
                        {questHeroes.map((heroName, hIdx) => (
                          <span key={hIdx} className="px-1.5 py-0.5 bg-neutral-900 text-neutral-300 font-sans tracking-wide text-[9px] rounded-md border border-neutral-800 font-medium">
                            🛡️ {heroName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rewards line */}
                    <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-900/60 font-mono text-[9.5px]">
                      <div>
                        <span className="text-stone-500 text-[8px] block uppercase">XP REVOLVIDO</span>
                        <span className="text-purple-400 font-extrabold">+{quest.rewardXp} XP</span>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[8px] block uppercase">OURO DE PILHAGEM</span>
                        <span className="text-yellow-500 font-extrabold">+{quest.rewardGold} PO</span>
                      </div>
                    </div>

                    {/* 3D Spinning Artifact container */}
                    {artifact && (
                      <div className="mt-1 flex flex-col items-center p-2 rounded-xl bg-neutral-950 border border-neutral-900 overflow-hidden">
                        <span className="text-[7.5px] text-neutral-500 font-mono uppercase tracking-widest block mb-2 font-black">PROJEÇÃO 3D DO RECONHECIMENTO</span>
                        
                        <div className="w-24 h-24 flex items-center justify-center relative cursor-pointer group">
                          {/* 3D Floating Relic */}
                          <div 
                            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-neutral-900 to-neutral-950 border border-neutral-800 shadow-[2px_10px_30px_rgba(0,0,0,0.8)] animate-artifact-3d flex items-center justify-center relative"
                            style={{
                              boxShadow: `0 10px 25px -5px ${artifact.glowColor || 'rgba(217,119,6,0.3)'}`,
                              borderColor: artifact.glowColor
                            }}
                          >
                            <span className="text-3xl filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)] block transform translate-z-10">{artifact.icon}</span>
                            
                            {/* Orbital glowing ring */}
                            <div className="absolute inset-x-[-15%] inset-y-[-15%] border border-dashed border-amber-500/20 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '15s' }} />
                          </div>
                        </div>

                        <div className="text-center mt-2">
                          <span className="text-[7.5px] font-mono uppercase tracking-widest font-black text-rose-500 bg-rose-950/20 border border-rose-900/40 px-1.5 py-0.5 rounded">
                            ✨ {artifact.rarity}
                          </span>
                          <span className="text-[10px] font-serif font-black text-neutral-200 block mt-1 hover:text-[#f59e0b] transition-colors">{artifact.name}</span>
                          <p className="text-[8.5px] text-neutral-450 font-sans leading-tight mt-1 max-w-[200px] mx-auto italic">
                            {artifact.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Collected artifacts collection: Mesa de Relíquias dadas */}
            <div className="pt-2.5 border-t border-neutral-800">
              <span className="text-[9px] text-amber-500 font-mono tracking-wider font-extrabold mb-1.5 block uppercase">
                📜 MESA DE RELÍQUIAS ({quests.filter(q => q.status === 'completed').length} Unid)
              </span>

              {quests.filter(q => q.status === 'completed').length === 0 ? (
                <div className="p-3 text-center text-neutral-600 text-[9px] font-mono italic bg-neutral-950/40 border border-neutral-900 rounded-xl leading-snug">
                  Nenhuma relíquia conquistada ainda. Complete missões com o Mestre para desbloquear itens lendários!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {quests.filter(q => q.status === 'completed').map(compQuest => {
                    const art = INITIAL_ARTIFACTS.find(a => a.id === compQuest.rewardArtifactId);
                    if (!art) return null;
                    return (
                      <div 
                        key={compQuest.id} 
                        className="p-1 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-1 group relative cursor-help"
                        title={`${art.name} (${art.rarity}): ${art.description}`}
                      >
                        <span className="text-xl filter drop-shadow-[0_2px_5px_rgba(255,255,255,0.25)] block group-hover:scale-110 transition-transform duration-300">{art.icon}</span>
                        <span className="text-[7px] text-neutral-400 text-center uppercase tracking-tighter truncate w-full">{art.name}</span>
                        <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Footer Info Bar */}
      <footer className="relative z-10 flex items-center justify-between p-2 px-5 bg-neutral-950/40 border border-neutral-900 rounded-2xl text-[9px] text-neutral-500 font-mono mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
          <span>SERVIÇO DE TRANSMISSÃO INSTANTÂNEA: ATIVO E ULTRA-SINCRONIZADO</span>
        </div>
        <div className="flex gap-4">
          <span>MULTIPROJEÇÃO ESPELHO COMPLETO</span>
          <span>SINC-HASH: TAVERNA-V2.5</span>
        </div>
      </footer>
    </div>
  );
}
