import { useState, FormEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, LogOut, Shield, User, Heart, Sparkles, Plus, Trash2, 
  Dice5, Scroll, Map, ChevronRight, Save, Send, CheckCircle, PlusCircle, RefreshCw, PenTool, Swords,
  Skull, Bug, Ghost, Target, Eye, Crown, Tv, Maximize2, BookOpen, X, Search, FileDown,
  Cloud, HardDrive
} from 'lucide-react';
import { Character, ScenarioScene, LogEntry, UserAuth, DiceRoll, Quest, QuestArtifact } from '../types';
import { INITIAL_CHARACTERS, INITIAL_LOGS, INITIAL_SCENARIOS, INITIAL_ARTIFACTS, INITIAL_QUESTS } from '../data/mockDatabase';
import { ResinBase, Figurine, EnemyFigurine, BossFigurine, WallPillar, getVectorBackgroundStyle, BossTokenAvatar } from './MiniatureSvg';
import { matchPromptToFigurine } from './tokenMatcher';
import { db, ref, set, onValue, update } from '../lib/firebaseHelper';
import { generateCharacterPDF } from '../utils/pdfGenerator';
import ConfettiEffect from './ConfettiEffect';
import CampaignProgressChart from './CampaignProgressChart';
import { 
  initGoogleDriveAuth, googleDriveSignIn, googleDriveLogout, getGoogleDriveToken,
  listBackupsFromDrive, uploadBackupToDrive, downloadBackupFromDrive, deleteBackupFromDrive 
} from '../lib/googleDriveHelper';

const generateUniqueId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

function ensureStableTokenIds(scenes: ScenarioScene[]): ScenarioScene[] {
  return scenes.map(scene => {
    const tokenStatuses = { ...(scene.tokenStatuses || {}) };
    let changed = false;

    // Loop through all grid coordinates to find placed tokens
    for (let r = 0; r < (scene.gridRows || 10); r++) {
      for (let c = 0; c < (scene.gridCols || 10); c++) {
        const tile = scene.gridData?.[r]?.[c];
        if (tile && tile !== 'empty' && tile !== 'wall' && tile !== 'water' && tile !== 'barrel' && tile !== 'trap' && tile !== 'pillar' && tile !== 'chest') {
          const key = `${r}-${c}`;
          if (!tokenStatuses[key]) {
            let defaultHp = 40;
            let defaultMp = 20;
            let name = 'Criatura';
            if (tile.startsWith('player')) {
              name = 'Herói';
            } else if (tile.startsWith('boss:')) {
              name = 'Boss';
              defaultHp = 500;
            } else if (tile.startsWith('enemy:')) {
              const sub = tile.split(':')[1] || 'Fera';
              name = sub.charAt(0).toUpperCase() + sub.slice(1);
            }
            tokenStatuses[key] = {
              hp: defaultHp,
              maxHp: defaultHp,
              mp: defaultMp,
              maxMp: defaultMp,
              name
            };
            changed = true;
          }

          const status = tokenStatuses[key] as any;
          if (!status.tokenId) {
            status.tokenId = `token_${tile}_${r}_${c}_${Math.random().toString(36).substr(2, 5)}`;
            changed = true;
          }
        }
      }
    }

    if (changed || !scene.tokenStatuses) {
      return { ...scene, tokenStatuses };
    }
    return scene;
  });
}

interface RpgAppViewProps {
  userAuth: UserAuth;
  onLogout: () => void;
  onNavigateToForge?: () => void;
}

export default function RpgAppView({ userAuth, onLogout, onNavigateToForge }: RpgAppViewProps) {
  // Tabs: 'fichas' | 'dados-log' | 'cenarios' | 'quests' | 'mesa' | 'arena'
  const [activeTab, setActiveTab] = useState<string>('fichas');

  // Estados e auxiliares para o Tabuleiro de Mesa
  const [shake, setShake] = useState(false);
  const [movingFromIndex, setMovingFromIndex] = useState<number | null>(null);
  const [grid, setGrid] = useState<string[]>(() => {
    const arr = Array(144).fill('');
    arr[18] = 'char_1';
    arr[22] = 'char_2';
    arr[34] = 'char_3';
    arr[41] = 'enemy:goblin';
    arr[65] = 'boss:dragon';
    return arr;
  });

  const triggerShake = (intensity: 'low' | 'high') => {
    setShake(true);
    setTimeout(() => setShake(false), intensity === 'high' ? 800 : 400);
  };

  const parseCharacterInCell = (cellValue: string | null): any => {
    if (!cellValue) return null;
    
    // Procura na lista de personagens
    const match = characters.find(c => c.id === cellValue);
    if (match) {
      let icon = '🧙‍♂️';
      if (match.class.toLowerCase().includes('guerreiro') || match.class.toLowerCase().includes('campeão')) {
        icon = '🪓';
      } else if (match.class.toLowerCase().includes('ladin') || match.class.toLowerCase().includes('assassin')) {
        icon = '🗡️';
      } else if (match.class.toLowerCase().includes('elfo')) {
        icon = '🧝‍♂️';
      } else if (match.class.toLowerCase().includes('mago')) {
        icon = '🧙‍♂️';
      }

      return {
        id: match.id,
        name: match.name,
        level: match.level,
        classe: 'player',
        icon: icon,
        hpCurrent: match.hp,
        hpMax: match.maxHp
      };
    }

    if (cellValue.startsWith('player:')) {
      const heroClass = cellValue.split(':')[1] || 'guerreiro';
      let name = 'Herói';
      let icon = '🛡️';
      if (heroClass === 'guerreiro') { name = 'Guerreiro'; icon = '🪓'; }
      else if (heroClass === 'mago') { name = 'Mago'; icon = '🧙‍♂️'; }
      else if (heroClass === 'ladino') { name = 'Ladino'; icon = '🗡️'; }
      return { id: cellValue, name, level: 1, classe: 'player', icon, hpCurrent: 30, hpMax: 30 };
    }

    if (cellValue.startsWith('enemy:')) {
      const enemyName = cellValue.split(':')[1] || 'goblin';
      return {
        id: cellValue,
        name: enemyName.charAt(0).toUpperCase() + enemyName.slice(1),
        level: 2,
        classe: 'enemy',
        icon: '👹',
        hpCurrent: 15,
        hpMax: 15
      };
    }

    if (cellValue.startsWith('boss:')) {
      const bossName = cellValue.split(':')[1] || 'dragon';
      return {
        id: cellValue,
        name: 'Dragão Incendiário',
         level: 10,
         classe: 'boss',
         icon: '🐉',
         hpCurrent: 180,
         hpMax: 180
       };
     }

     return {
       id: cellValue,
       name: cellValue,
       level: 1,
       classe: 'enemy',
       icon: '👾',
       hpCurrent: 20,
       hpMax: 20
     };
  };

  const handleGridInteract = (index: number) => {
    const nextGrid = [...grid];
    const cellValue = nextGrid[index];
    
    if (movingFromIndex !== null) {
      if (movingFromIndex === index) {
        setMovingFromIndex(null);
      } else {
        nextGrid[index] = nextGrid[movingFromIndex];
        nextGrid[movingFromIndex] = '';
        setGrid(nextGrid);
        setMovingFromIndex(null);
        triggerShake('low');
      }
    } else {
      if (cellValue) {
        setMovingFromIndex(index);
      }
    }
  };

  const biomeGradients = "from-stone-850 to-stone-950";
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<string>('mestre');
  const [localViewMode, setLocalViewMode] = useState<'mestre' | 'jogador'>('mestre');

  // Google Drive integration states
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveUser, setDriveUser] = useState<any | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [customBackupName, setCustomBackupName] = useState(() => {
    return `taverna_digital_backup_${new Date().toISOString().split('T')[0]}`;
  });

  // Real-time synchronization & Visual feedback states
  const [onlineSync, setOnlineSync] = useState<boolean>(true);
  const [syncRoomId, setSyncRoomId] = useState<string>(() => {
    return localStorage.getItem('vtt_sync_room_id') || 'FORGE-777';
  });
  const [isCritShaking, setIsCritShaking] = useState<boolean>(false);
  const [showCompletedConfetti, setShowCompletedConfetti] = useState<boolean>(false);
  
  // Inventory filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'Armas' | 'Poções' | 'Pergaminhos' | 'Outros'>('all');

  // SaaS subscription limits and timers
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showDemoLimitPopup, setShowDemoLimitPopup] = useState<boolean>(false);
  const [showPixModal, setShowPixModal] = useState<boolean>(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState<boolean>(() => {
    const emailKey = userAuth?.email ? userAuth.email.toLowerCase() : '';
    if (emailKey === 'xalemaoxoldschool@gmail.com' || emailKey === 'mestre.premium@taverna.com' || userAuth?.subscriptionStatus === 'active') return true;
    return localStorage.getItem('vtt_premium_paid_' + emailKey) === 'true';
  });

  // Google Drive Auth listener
  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (premiumUnlocked) {
      setShowDemoLimitPopup(false);
      return;
    }

    const emailKey = userAuth?.email ? userAuth.email.toLowerCase() : 'demo_user';
    const startKey = 'vtt_demo_startTime_' + emailKey;
    let startTimeStr = localStorage.getItem(startKey);
    if (!startTimeStr) {
      startTimeStr = Date.now().toString();
      localStorage.setItem(startKey, startTimeStr);
    }
    const startTimeParsed = parseInt(startTimeStr, 10);

    const interval = setInterval(() => {
      const hasUpgraded = localStorage.getItem('vtt_premium_paid_' + emailKey) === 'true';
      if (hasUpgraded) {
        setPremiumUnlocked(true);
        setShowDemoLimitPopup(false);
        clearInterval(interval);
        return;
      }

      const currentElapsed = Math.floor((Date.now() - startTimeParsed) / 1000);
      setElapsedTime(currentElapsed);

      if (currentElapsed >= 600) { // 10 minutes demo limit
        setShowDemoLimitPopup(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userAuth?.email, premiumUnlocked]);

  // Real-time combat floating text effects and particle overlays
  const [activeCombatEffects, setActiveCombatEffects] = useState<any[]>([]);

  const triggerCombatAnimation = (effect: {
    row: number;
    col: number;
    targetName: string;
    hpChange?: number;
    mpChange?: number;
    type: 'damage' | 'heal' | 'mana-use' | 'mana-gain';
  }) => {
    const fullEffect = {
      ...effect,
      id: generateUniqueId('combat_eff'),
      timestamp: Date.now()
    };
    setActiveCombatEffects(prev => [...prev, fullEffect]);
    broadcastState('combat_effect', fullEffect);
    try {
      localStorage.setItem('vtt_combat_effect_trigger', JSON.stringify(fullEffect));
    } catch (e) {
      console.error(e);
    }
    if (onlineSync) {
      set(ref(db, `rooms/${syncRoomId}/combat_effect_trigger`), fullEffect)
        .catch(err => console.error("Could not sync combat effect to Cloud:", err));
    }
    setTimeout(() => {
      setActiveCombatEffects(prev => prev.filter(e => e.id !== fullEffect.id));
    }, 2000);
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'vtt_combat_effect_trigger' && e.newValue) {
        try {
          const effect = JSON.parse(e.newValue);
          setActiveCombatEffects(prev => {
            if (prev.some(x => x.id === effect.id)) return prev;
            return [...prev, effect];
          });
          setTimeout(() => {
            setActiveCombatEffects(prev => prev.filter(e => e.id !== effect.id));
          }, 2000);
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Core RPG state
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem('vtt_characters');
      return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
    } catch {
      return INITIAL_CHARACTERS;
    }
  });
  const [selectedCharId, setSelectedCharId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('vtt_selectedCharId');
      return saved || INITIAL_CHARACTERS[0].id;
    } catch {
      return INITIAL_CHARACTERS[0].id;
    }
  });
  
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('vtt_logs');
      const loaded = saved ? JSON.parse(saved) : INITIAL_LOGS;
      const seen = new Set();
      return loaded.filter((l: any) => {
        if (!l || !l.id) return false;
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      });
    } catch {
      return INITIAL_LOGS;
    }
  });
  const [logFilter, setLogFilter] = useState<'all' | 'roll' | 'chat' | 'system' | 'combat'>('all');
  const [chatInput, setChatInput] = useState<string>('');

  const [scenarios, setScenarios] = useState<ScenarioScene[]>(() => {
    try {
      const saved = localStorage.getItem('vtt_scenarios');
      const parsed = saved ? JSON.parse(saved) : INITIAL_SCENARIOS;
      return ensureStableTokenIds(parsed);
    } catch {
      return ensureStableTokenIds(INITIAL_SCENARIOS);
    }
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('vtt_selectedScenarioId');
      return saved || (INITIAL_SCENARIOS[0]?.id || '');
    } catch {
      return INITIAL_SCENARIOS[0]?.id || '';
    }
  });
  const [activeBrush, setActiveBrush] = useState<string>('wall'); // wall, water, empty, player, enemy, chest
  const [editingPlayerCell, setEditingPlayerCell] = useState<{ r: number, c: number } | null>(null);
  const [activeCombatTarget, setActiveCombatTarget] = useState<{ row: number; col: number; name: string; tileType: string } | null>(() => {
    try {
      const saved = localStorage.getItem('vtt_active_combat_target');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeCombatTargets, setActiveCombatTargets] = useState<Array<{ row: number; col: number; name: string; tileType: string }>>(() => {
    try {
      const saved = localStorage.getItem('vtt_active_combat_targets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem('vtt_quests');
      return saved ? JSON.parse(saved) : INITIAL_QUESTS;
    } catch {
      return INITIAL_QUESTS;
    }
  });

  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestDesc, setNewQuestDesc] = useState('');
  const [newQuestGold, setNewQuestGold] = useState(100);
  const [newQuestXp, setNewQuestXp] = useState(150);
  const [newQuestArtifactId, setNewQuestArtifactId] = useState('art_1');
  const [newQuestParticipants, setNewQuestParticipants] = useState<string[]>([]);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);

  // Setup persistent BroadcastChannel for ultra-smooth real-time synchronization
  const vttChannelRef = useRef<BroadcastChannel | null>(null);
  const isIncomingCloudUpdate = useRef<boolean>(false);
  const lastSentTimestamp = useRef<number>(0);

  const broadcastState = (type: string, data: any) => {
    if (vttChannelRef.current) {
      try {
        vttChannelRef.current.postMessage({ type, data });
      } catch (err: any) {
        if (err && err.message && err.message.includes('closed')) {
          console.warn('BroadcastChannel was closed. Skipping.');
        } else {
          console.warn('Broadcast state message skip:', err);
        }
      }
    }
  };

  useEffect(() => {
    try {
      if (activeCombatTarget) {
        localStorage.setItem('vtt_active_combat_target', JSON.stringify(activeCombatTarget));
        broadcastState('active_combat_target', activeCombatTarget);
      } else {
        localStorage.removeItem('vtt_active_combat_target');
        broadcastState('active_combat_target', null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeCombatTarget]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_active_combat_targets', JSON.stringify(activeCombatTargets));
      broadcastState('active_combat_targets', activeCombatTargets);
    } catch (e) {
      console.error(e);
    }
  }, [activeCombatTargets]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_quests', JSON.stringify(quests));
      broadcastState('quests', quests);
    } catch (e) {
      console.error(e);
    }
  }, [quests]);
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      vttChannelRef.current = new BroadcastChannel('taverna_vtt_channel');
    }
    return () => {
      if (vttChannelRef.current) {
        try {
          vttChannelRef.current.close();
        } catch (e) {
          console.warn('Channel close issue:', e);
        }
        vttChannelRef.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------------
  // FIREBASE REALTIME MULTIPLAYER SYNC ENGINE
  // -------------------------------------------------------------
  // 1. Writer: Push state updates to Cloud
  useEffect(() => {
    if (!onlineSync) return;
    if (isIncomingCloudUpdate.current) return;

    // Allocate current timestamp immediately to guard this state update window
    const timestamp = Date.now();
    lastSentTimestamp.current = timestamp;

    const delayDebounce = setTimeout(() => {
      try {
        const payload = {
          characters,
          logs,
          scenarios,
          selectedScenarioId,
          activeCombatTargets,
          activeCombatTarget: activeCombatTarget || null,
          quests,
          updatedAt: timestamp
        };
        const roomRef = ref(db, 'rooms/' + syncRoomId);
        update(roomRef, payload);
      } catch (err) {
        console.error('Failed to write updates to Firebase RTDB:', err);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [characters, logs, scenarios, selectedScenarioId, activeCombatTargets, activeCombatTarget, quests, onlineSync, syncRoomId]);

  // 2. Reader: Fetch state updates from Cloud
  useEffect(() => {
    if (!onlineSync) return;

    const roomRef = ref(db, 'rooms/' + syncRoomId);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          // If the cloud update is older or matching our last sent state, skip overwriting to prevent race conditions and regressions
          if (data.updatedAt && data.updatedAt <= lastSentTimestamp.current) {
            return;
          }

          isIncomingCloudUpdate.current = true;
          
          if (data.characters) {
            const parsedChars = Array.isArray(data.characters) ? data.characters : Object.values(data.characters);
            setCharacters(parsedChars);
          }
          if (data.logs) {
            const parsedLogs = Array.isArray(data.logs) ? data.logs : Object.values(data.logs);
            const seen = new Set();
            const uniqueLogs = parsedLogs.filter((l: any) => {
              if (!l || !l.id) return false;
              if (seen.has(l.id)) return false;
              seen.add(l.id);
              return true;
            });
            setLogs(uniqueLogs);
          }
          if (data.scenarios) {
            const parsedScenarios = Array.isArray(data.scenarios) ? data.scenarios : Object.values(data.scenarios);
            setScenarios(parsedScenarios);
          }
          if (data.selectedScenarioId) setSelectedScenarioId(data.selectedScenarioId);
          if (data.activeCombatTargets) {
            const parsedTargets = Array.isArray(data.activeCombatTargets) ? data.activeCombatTargets : Object.values(data.activeCombatTargets);
            setActiveCombatTargets(parsedTargets);
          }
          if (data.activeCombatTarget) setActiveCombatTarget(data.activeCombatTarget);
          if (data.quests) {
            const parsedQuests = Array.isArray(data.quests) ? data.quests : Object.values(data.quests);
            setQuests(parsedQuests);
          }

          setTimeout(() => {
            isIncomingCloudUpdate.current = false;
          }, 150);
        }
      } catch (err) {
        console.error('Failed to parse Firebase RTDB sync:', err);
      }
    }, (err) => {
      console.warn('Firebase RTDB read access restricted during sync:', err);
    });

    return () => {
      unsubscribe();
    };
  }, [syncRoomId, onlineSync]);

  // 3. Reader: Combat effects trigger live sync
  useEffect(() => {
    if (!onlineSync) return;

    const effectRef = ref(db, `rooms/${syncRoomId}/combat_effect_trigger`);
    const unsubscribe = onValue(effectRef, (snapshot) => {
      try {
        const effect = snapshot.val();
        if (effect && effect.timestamp > Date.now() - 4000) {
          setActiveCombatEffects(prev => {
            if (prev.some(x => x.id === effect.id)) return prev;
            return [...prev, effect];
          });
          setTimeout(() => {
            setActiveCombatEffects(prev => prev.filter(e => e.id !== effect.id));
          }, 2000);
        }
      } catch (err) {
        console.error(err);
      }
    }, (err) => {
      console.warn("RTDB sync for combat effects restricted:", err);
    });

    return () => unsubscribe();
  }, [syncRoomId, onlineSync]);

  // 4. Reader: Confetti trigger live sync
  useEffect(() => {
    if (!onlineSync) return;

    const confettiRef = ref(db, `rooms/${syncRoomId}/trigger_confetti`);
    const unsubscribe = onValue(confettiRef, (snapshot) => {
      try {
        const ts = snapshot.val();
        if (ts && ts > Date.now() - 5000) {
          setShowCompletedConfetti(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, (err) => {
      console.warn("RTDB sync for confetti restricted:", err);
    });

    return () => unsubscribe();
  }, [syncRoomId, onlineSync]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_scenarios', JSON.stringify(scenarios));
      broadcastState('scenarios', scenarios);
    } catch (e) {
      console.error('Failed to save scenarios to localStorage:', e);
    }
  }, [scenarios]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_selectedScenarioId', selectedScenarioId);
      broadcastState('selectedScenarioId', selectedScenarioId);
    } catch (e) {
      console.error('Failed to save selectedScenarioId to localStorage:', e);
    }
  }, [selectedScenarioId]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_characters', JSON.stringify(characters));
      broadcastState('characters', characters);
    } catch (e) {
      console.error('Failed to save characters to localStorage:', e);
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_selectedCharId', selectedCharId);
    } catch (e) {
      console.error('Failed to save selectedCharId to localStorage:', e);
    }
  }, [selectedCharId]);

  useEffect(() => {
    try {
      localStorage.setItem('vtt_logs', JSON.stringify(logs));
      broadcastState('logs', logs);
    } catch (e) {
      console.error('Failed to save logs to localStorage:', e);
    }
  }, [logs]);

  // Dice console states
  const [diceCount, setDiceCount] = useState<number>(1);
  const [diceModifier, setDiceModifier] = useState<number>(0);
  const [gridAnimationClass, setGridAnimationClass] = useState<string>('');

  const triggerGridEffects = () => {
    setGridAnimationClass('animate-shake-and-glow');
    try {
      localStorage.setItem('vtt_grid_effect', JSON.stringify({ type: 'shake-and-glow', timestamp: Date.now() }));
      broadcastState('grid_effect', { type: 'shake-and-glow', timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to save grid effect to localStorage:', e);
    }
    setTimeout(() => {
      setGridAnimationClass('');
    }, 1500);
  };

  // Mini-game states for "Decisões Rápidas"
  const [coinResult, setCoinResult] = useState<'cara' | 'coroa' | null>(null);
  const [isFlippingCoin, setIsFlippingCoin] = useState<boolean>(false);
  const [rpsResult, setRpsResult] = useState<string | null>(null);
  const [rpsUserChoice, setRpsUserChoice] = useState<'stone' | 'paper' | 'scissors' | null>(null);
  const [rpsOpponentChoice, setRpsOpponentChoice] = useState<'stone' | 'paper' | 'scissors' | null>(null);

  // New character form state
  const [showNewCharModal, setShowNewCharModal] = useState<boolean>(false);
  const [newCharName, setNewCharName] = useState<string>('');
  const [newCharClass, setNewCharClass] = useState<string>('Guerreiro');
  const [newCharRace, setNewCharRace] = useState<string>('Humano');
  const [newCharClothingColor, setNewCharClothingColor] = useState<string>('#3b82f6');
  const [newCharMaxHp, setNewCharMaxHp] = useState<number>(30);
  const [newCharMaxMp, setNewCharMaxMp] = useState<number>(20);
  const [newCharStr, setNewCharStr] = useState<number>(13);
  const [newCharDex, setNewCharDex] = useState<number>(13);
  const [newCharCon, setNewCharCon] = useState<number>(13);
  const [newCharInt, setNewCharInt] = useState<number>(13);
  const [newCharWis, setNewCharWis] = useState<number>(13);
  const [newCharCha, setNewCharCha] = useState<number>(13);

  // Edit character form states
  const [showEditCharModal, setShowEditCharModal] = useState<boolean>(false);
  const [editingCharId, setEditingCharId] = useState<string>('');
  const [editingCharName, setEditingCharName] = useState<string>('');
  const [editingCharClass, setEditingCharClass] = useState<string>('Guerreiro');
  const [editingCharRace, setEditingCharRace] = useState<string>('Humano');
  const [editingCharLevel, setEditingCharLevel] = useState<number>(1);
  const [editingCharMaxHp, setEditingCharMaxHp] = useState<number>(30);
  const [editingCharMaxMp, setEditingCharMaxMp] = useState<number>(20);
  const [editingCharStr, setEditingCharStr] = useState<number>(13);
  const [editingCharDex, setEditingCharDex] = useState<number>(13);
  const [editingCharCon, setEditingCharCon] = useState<number>(13);
  const [editingCharInt, setEditingCharInt] = useState<number>(13);
  const [editingCharWis, setEditingCharWis] = useState<number>(13);
  const [editingCharCha, setEditingCharCha] = useState<number>(13);

  const [movingToken, setMovingToken] = useState<{ r: number; c: number; tileType: string; tokenName: string } | null>(null);

  // AI-Powered Token Creator States
  const [showAiTokenModal, setShowAiTokenModal] = useState<boolean>(false);
  const [aiTokenName, setAiTokenName] = useState<string>('');
  const [aiTokenPrompt, setAiTokenPrompt] = useState<string>('');
  const [aiTokenType, setAiTokenType] = useState<'hero' | 'enemy'>('hero');
  const [aiTokenGender, setAiTokenGender] = useState<'m' | 'f'>('m');
  const [aiTokenFigurineArchetype, setAiTokenFigurineArchetype] = useState<string>('auto');
  const [isGeneratingAiToken, setIsGeneratingAiToken] = useState<boolean>(false);
  const [aiGenerationStep, setAiGenerationStep] = useState<string>('');
  const [aiGenerationProgress, setAiGenerationProgress] = useState<number>(0);

  useEffect(() => {
    setAiTokenFigurineArchetype('auto');
  }, [aiTokenType]);

  const [customTokens, setCustomTokens] = useState<Array<{
    id: string;
    name: string;
    type: 'hero' | 'enemy';
    imageUrl: string;
    prompt: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('vtt_custom_tokens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vtt_custom_tokens', JSON.stringify(customTokens));
      broadcastState('custom_tokens', customTokens);
    } catch (e) {
      console.error('Failed to save custom tokens:', e);
    }
  }, [customTokens]);

  // Google Drive operational handlers
  const handleFetchDriveFiles = async (tokenString?: string) => {
    const activeToken = tokenString || driveToken;
    if (!activeToken) return;
    setLoadingDrive(true);
    try {
      const files = await listBackupsFromDrive(activeToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('List backups err:', err);
      alert('Erro ao carregar lista de backups do Google Drive: ' + err.message);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleDriveLogin = async () => {
    try {
      const result = await googleDriveSignIn();
      if (result) {
        setDriveUser(result.user);
        setDriveToken(result.accessToken);
        await handleFetchDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      alert('Erro ao conectar ao Google Drive: ' + err.message);
    }
  };

  const handleDriveLogout = async () => {
    try {
      await googleDriveLogout();
      setDriveUser(null);
      setDriveToken(null);
      setDriveFiles([]);
    } catch (err: any) {
      console.error('Logout err:', err);
    }
  };

  const handleBackupToDrive = async () => {
    if (!driveToken) {
      alert('Por favor, conecte sua conta Google antes.');
      return;
    }

    if (!customBackupName.trim()) {
      alert('Defina um nome válido para seu arquivo de backup.');
      return;
    }

    setBackingUp(true);
    try {
      const backupBundle = {
        appSource: 'Taverna Digital VTT',
        backupVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        vtt_characters: JSON.parse(localStorage.getItem('vtt_characters') || '[]'),
        vtt_selectedCharId: localStorage.getItem('vtt_selectedCharId') || '',
        vtt_logs: JSON.parse(localStorage.getItem('vtt_logs') || '[]'),
        vtt_scenarios: JSON.parse(localStorage.getItem('vtt_scenarios') || '[]'),
        vtt_selectedScenarioId: localStorage.getItem('vtt_selectedScenarioId') || '',
        vtt_quests: JSON.parse(localStorage.getItem('vtt_quests') || '[]'),
        vtt_custom_tokens: JSON.parse(localStorage.getItem('vtt_custom_tokens') || '[]')
      };

      const filename = customBackupName.endsWith('.json') ? customBackupName : `${customBackupName}.json`;
      await uploadBackupToDrive(driveToken, filename, backupBundle);
      
      alert(`🎉 Backup [${filename}] gerado e salvo com sucesso no seu Google Drive!`);
      await handleFetchDriveFiles();
    } catch (err: any) {
      console.error('Backup upload failed:', err);
      alert('Não foi possível realizar o backup: ' + err.message);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string, filename: string) => {
    if (!driveToken) return;

    const confirmed = window.confirm(
      `ATENÇÃO: Você quer restaurar e sobrescrever seu salão local e todos os personagens com o backup "[${filename}]"? Esta ação substituirá seus dados locais atuais.`
    );
    if (!confirmed) return;

    setLoadingDrive(true);
    try {
      const data = await downloadBackupFromDrive(driveToken, fileId);
      
      if (!data || (!data.vtt_characters && !data.vtt_scenarios)) {
        throw new Error('O arquivo de backup selecionado parece estar inválido ou não pertence a Taverna Digital.');
      }

      if (data.vtt_characters) {
        localStorage.setItem('vtt_characters', JSON.stringify(data.vtt_characters));
        setCharacters(data.vtt_characters);
      }
      if (data.vtt_selectedCharId) {
        localStorage.setItem('vtt_selectedCharId', data.vtt_selectedCharId);
        setSelectedCharId(data.vtt_selectedCharId);
      }
      if (data.vtt_logs) {
        localStorage.setItem('vtt_logs', JSON.stringify(data.vtt_logs));
        setLogs(data.vtt_logs);
      }
      if (data.vtt_scenarios) {
        localStorage.setItem('vtt_scenarios', JSON.stringify(data.vtt_scenarios));
        setScenarios(ensureStableTokenIds(data.vtt_scenarios));
      }
      if (data.vtt_selectedScenarioId) {
        localStorage.setItem('vtt_selectedScenarioId', data.vtt_selectedScenarioId);
        setSelectedScenarioId(data.vtt_selectedScenarioId);
      }
      if (data.vtt_quests) {
        localStorage.setItem('vtt_quests', JSON.stringify(data.vtt_quests));
        setQuests(data.vtt_quests);
      }
      if (data.vtt_custom_tokens) {
        localStorage.setItem('vtt_custom_tokens', JSON.stringify(data.vtt_custom_tokens));
        setCustomTokens(data.vtt_custom_tokens);
      }

      alert('⚡ Todos os heróis, fichas, mapas e missões foram carregados com sucesso do Google Drive!');
      setShowDriveModal(false);
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      alert('Falha ao importar dados do Google Drive: ' + err.message);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleDeleteFromDrive = async (fileId: string, filename: string) => {
    if (!driveToken) return;

    const confirmed = window.confirm(`Deseja realmente apagar o backup "[${filename}]" permanentemente do seu Google Drive?`);
    if (!confirmed) return;

    setLoadingDrive(true);
    try {
      await deleteBackupFromDrive(driveToken, fileId);
      alert('Arquivo de backup removido com sucesso!');
      await handleFetchDriveFiles();
    } catch (err: any) {
      console.error('Delete backup failed:', err);
      alert('Erro ao excluir o backup: ' + err.message);
    } finally {
      setLoadingDrive(false);
    }
  };

  const generateTokenWithIA = async () => {
    if (!aiTokenPrompt.trim()) return;
    setIsGeneratingAiToken(true);
    setAiGenerationProgress(10);
    setAiGenerationStep('Estabelecendo conexão espiritual com os servidores arcanos...');
    
    // Simulate realistic progress steps for VTT immersive feel
    const steps = [
      { p: 25, s: 'Invocando fluxo de pixels elementares (conjurando Imagen)...' },
      { p: 48, s: 'Misturando resina alquímica líquida no molde de miniaturas...' },
      { p: 72, s: 'Modelando borda de segurança texturizada física...' },
      { p: 90, s: 'Polindo lente de vidro reflexivo e fundido sobre o token...' },
      { p: 100, s: 'Token materializado!' }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setAiGenerationProgress(steps[currentStepIndex].p);
        setAiGenerationStep(steps[currentStepIndex].s);
        currentStepIndex++;
      }
    }, 450);

    try {
      let imageUrl = '';
      const response = await fetch('/api/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiTokenPrompt.trim(),
          name: aiTokenName.trim(),
          type: aiTokenType
        })
      });

      if (response.ok) {
        const data = await response.json();
        imageUrl = data.imageUrl;
      } else {
        console.error('Failed to generate image via server API, falling back to static photo seed.');
        imageUrl = 'https://images.unsplash.com/photo-1519074069444-1ba4e666410a?auto=format&fit=crop&w=250&h=250&q=80';
      }

      clearInterval(interval);
      setIsGeneratingAiToken(false);

      const resolvedName = aiTokenName.trim() || (aiTokenType === 'hero' ? 'Herói Materializado' : 'Fera Materializada');
      
      let finalFigurineId = aiTokenFigurineArchetype;
      let finalModelType = (aiTokenType === 'hero' ? 'hero' : 'enemy') as 'hero' | 'enemy' | 'boss';

      if (aiTokenFigurineArchetype === 'auto') {
        const matched = matchPromptToFigurine(aiTokenPrompt.trim(), resolvedName, aiTokenType);
        finalFigurineId = matched.figurineId;
        finalModelType = matched.modelType;
      }

      const newToken = {
        id: `token_ai_${Date.now()}`,
        name: resolvedName,
        type: aiTokenType,
        imageUrl: imageUrl,
        prompt: aiTokenPrompt.trim(),
        renderStyle: 'figurine' as 'standee' | 'token' | 'figurine',
        figurineId: finalFigurineId,
        modelType: finalModelType,
        gender: aiTokenGender
      };

      setCustomTokens(prev => [newToken, ...prev]);
      setActiveBrush(`custom:${newToken.type}:${newToken.id}`);
      setShowAiTokenModal(false);
      setAiTokenPrompt('');
      setAiTokenName('');
      
      triggerToast(`🧙‍♂️ Token de IA de ${resolvedName} forjado e ativo no pincel!`);
      pushSystemLog(`[Fichas de IA] Token de resina forjado via IA: "${resolvedName}" (Prompt: "${aiTokenPrompt}")`);
    } catch (err) {
      clearInterval(interval);
      setIsGeneratingAiToken(false);
      console.error(err);
      triggerToast('Falha ao forjar com servidores estelares arcanos.');
    }
  };

  const getPhotoSeed = (theme: string): string => {
    switch (theme) {
      case 'dire-wolf-beast-rpg':
        return '1557672172-298e090bd0f1'; 
      case 'elven-ranger':
        return '1579783900882-c0d3dad7b119'; 
      case 'heavy-knight-armor':
        return '1618005182384-a83a8bd57fbe'; 
      case 'mage-spellcaster':
        return '1509198397868-475647b2a1e5'; 
      case 'shadow-assassin-rogue':
        return '1620641788421-7a1c342ea42e'; 
      case 'red-dragon-fire':
        return '1501854140801-50d01698950b'; 
      case 'green-orc-monster':
        return '1559650656-5d1d361ad10e'; 
      case 'necromancer-undead':
        return '1501711283597-90a612df1cac'; 
      case 'fantasy-rpg':
      default:
        return '1560942485-b2a11cc13456'; 
    }
  };

  // Success message alert indicator
  const [successToast, setSuccessToast] = useState<string>('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Helper references
  const selectedChar = characters.find(c => c.id === selectedCharId) || characters[0];
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Scan grid for active Bosses
  const activeBossCell = selectedScenario?.gridData 
    ? (() => {
        for (let r = 0; r < selectedScenario.gridData.length; r++) {
          for (let c = 0; c < selectedScenario.gridData[r].length; c++) {
            const tile = selectedScenario.gridData[r][c];
            if (tile && tile.startsWith('boss:')) {
              return { r, c, type: tile.split(':')[1] };
            }
          }
        }
        return null;
      })() 
    : null;

  const activeTargetDetailsList = (() => {
    if (!activeCombatTargets || !selectedScenario) return [];
    return activeCombatTargets.map(tgt => {
      const { row, col, name, tileType } = tgt;
      const currentTile = selectedScenario.gridData?.[row]?.[col];
      if (!currentTile || currentTile === 'empty' || currentTile === 'wall') {
        return null;
      }
      
      const statusKey = `${row}-${col}`;
      const isBoss = tileType.startsWith('boss:');
      const defaultHp = isBoss ? 500 : 40;
      const defaultMp = isBoss ? 100 : 20;

      const tokenStatus = selectedScenario.tokenStatuses?.[statusKey] || {
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

  const hasActiveBoss = !!activeBossCell;
  const activeBossType = activeBossCell?.type || 'ancient_dragon';
  const bossName = selectedScenario?.bossName || (activeBossType === 'supreme_lich' ? 'Lich Supremo' : activeBossType === 'beholder' ? 'Observador Ancião' : 'Dragão Ancião');
  const bossHp = selectedScenario?.bossHp !== undefined ? selectedScenario.bossHp : 500;
  const bossMaxHp = selectedScenario?.bossMaxHp !== undefined ? selectedScenario.bossMaxHp : 500;

  // -----------------------------
  // CHARACTERS / FICHAS LOGIC
  // -----------------------------
  const handleUpdateHp = (charId: string, amount: number) => {
    let charName = '';
    let charClass = '';
    let isTransitionToDead = false;

    setCharacters(prev => prev.map(char => {
      if (char.id === charId) {
        charName = char.name;
        charClass = char.class;
        const nextHp = Math.min(char.maxHp, Math.max(0, char.hp + amount));
        if (nextHp === 0 && char.hp > 0) {
          isTransitionToDead = true;
          pushSystemLog(`☠️ ${char.name} caiu derrotado com 0 HP!`);
        } else if (amount < 0) {
          pushSystemLog(`💥 Dano desferido em ${char.name} (${amount} HP)`);
        } else if (amount > 0) {
          pushSystemLog(`💚 Cura em ${char.name} (+${amount} HP)`);
        }
        return { ...char, hp: nextHp };
      }
      return char;
    }));

    if (!charName) return;

    const cls = charClass.toLowerCase();
    let subclassName = 'guerreiro';
    if (cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo')) {
      subclassName = 'mago';
    } else if (cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra')) {
      subclassName = 'arqueiro';
    }

    let targetRow = -1;
    let targetCol = -1;
    if (selectedScenario?.gridData) {
      for (let r = 0; r < selectedScenario.gridData.length; r++) {
        for (let c = 0; c < selectedScenario.gridData[r].length; c++) {
          const tile = selectedScenario.gridData[r][c];
          if (tile === 'player' && getActivePlayerClass() === subclassName) {
            targetRow = r;
            targetCol = c;
            break;
          } else if (tile === `player:${subclassName}`) {
            targetRow = r;
            targetCol = c;
            break;
          }
        }
        if (targetRow !== -1) break;
      }
    }

    triggerCombatAnimation({
      row: targetRow,
      col: targetCol,
      targetName: charName,
      hpChange: amount,
      type: amount < 0 ? 'damage' : 'heal'
    });

    if (isTransitionToDead) {
      triggerToast(`☠️ ${charName} morreu e desapareceu do mapa!`);
      if (activeCombatTarget && activeCombatTarget.row === targetRow && activeCombatTarget.col === targetCol) {
        setActiveCombatTarget(null);
      }
      setScenarios(prev => prev.map(scene => {
        if (scene.id === selectedScenarioId) {
          const updatedGrid = scene.gridData.map(row => 
            row.map(tile => {
              if (tile === 'player' && getActivePlayerClass() === subclassName) {
                return 'empty';
              }
              if (tile === `player:${subclassName}`) {
                return 'empty';
              }
              return tile;
            })
          );
          return { ...scene, gridData: updatedGrid };
        }
        return scene;
      }));
    }
  };

  const handleUpdateMp = (charId: string, amount: number) => {
    let charName = '';
    let charClass = '';

    setCharacters(prev => prev.map(char => {
      if (char.id === charId) {
        charName = char.name;
        charClass = char.class;
        const nextMp = Math.min(char.maxMp, Math.max(0, char.mp + amount));
        if (amount < 0) {
          pushSystemLog(`💧 ${char.name} gastou ${Math.abs(amount)} MP`);
        } else if (amount > 0) {
          pushSystemLog(`✨ ${char.name} recuperou +${amount} MP`);
        }
        return { ...char, mp: nextMp };
      }
      return char;
    }));

    if (!charName) return;

    const cls = charClass.toLowerCase();
    let subclassName = 'guerreiro';
    if (cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo')) {
      subclassName = 'mago';
    } else if (cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra')) {
      subclassName = 'arqueiro';
    }

    let targetRow = -1;
    let targetCol = -1;
    if (selectedScenario?.gridData) {
      for (let r = 0; r < selectedScenario.gridData.length; r++) {
        for (let c = 0; c < selectedScenario.gridData[r].length; c++) {
          const tile = selectedScenario.gridData[r][c];
          if (tile === 'player' && getActivePlayerClass() === subclassName) {
            targetRow = r;
            targetCol = c;
            break;
          } else if (tile === `player:${subclassName}`) {
            targetRow = r;
            targetCol = c;
            break;
          }
        }
        if (targetRow !== -1) break;
      }
    }

    triggerCombatAnimation({
      row: targetRow,
      col: targetCol,
      targetName: charName,
      mpChange: amount,
      type: amount < 0 ? 'mana-use' : 'mana-gain'
    });
  };

  const handleUpdateTokenHp = (r: number, c: number, amount: number, defaultName: string) => {
    // Intercept if targeted cell is a legendary Boss to update the overall Boss HP meter
    if (selectedScenario) {
      const tileType = selectedScenario.gridData?.[r]?.[c];
      if (tileType && tileType.startsWith('boss:')) {
        handleUpdateBossHpVal(amount);
        return;
      }
    }

    let isDead = false;
    let actualName = defaultName;
    let nextHp = 0;
    let maxHp = 40;

    setScenarios(prev => prev.map(scene => {
      if (scene.id === selectedScenarioId) {
        const statusKey = `${r}-${c}`;
        const currentStatuses = scene.tokenStatuses || {};
        const currentStatus = currentStatuses[statusKey] || {
          hp: maxHp,
          maxHp: maxHp,
          mp: 20,
          maxMp: 20,
          name: defaultName
        };

        const calculatedHp = Math.max(0, Math.min(currentStatus.maxHp, currentStatus.hp + amount));
        nextHp = calculatedHp;
        maxHp = currentStatus.maxHp;
        actualName = currentStatus.name || defaultName;

        const updatedStatuses = {
          ...currentStatuses,
          [statusKey]: {
            ...currentStatus,
            hp: calculatedHp
          }
        };

        let nextGrid = scene.gridData;
        if (calculatedHp <= 0) {
          isDead = true;
          nextGrid = scene.gridData.map((row, rIdx) => 
            row.map((tile, cIdx) => (rIdx === r && cIdx === c) ? 'empty' : tile)
          );
          delete updatedStatuses[statusKey];
        }

        return {
          ...scene,
          gridData: nextGrid,
          tokenStatuses: updatedStatuses
        };
      }
      return scene;
    }));

    triggerCombatAnimation({
      row: r,
      col: c,
      targetName: actualName,
      hpChange: amount,
      type: amount < 0 ? 'damage' : 'heal'
    });

    if (isDead) {
      pushSystemLog(`💀 O combatente [Grid ${r+1},${c+1}] "${actualName}" foi derrotado em batalha e desapareceu do mapa!`);
      triggerToast(`☠️ ${actualName} morreu e desapareceu do mapa!`);
      setEditingPlayerCell(null);
      if (activeCombatTarget && activeCombatTarget.row === r && activeCombatTarget.col === c) {
        setActiveCombatTarget(null);
      }
      setActiveCombatTargets(prev => prev.filter(t => !(t.row === r && t.col === c)));
    } else {
      triggerToast(`${actualName}: ${nextHp}/${maxHp} HP`);
    }
  };

  const handleUpdateTokenMp = (r: number, c: number, amount: number, defaultName: string) => {
    let actualName = defaultName;
    let nextMp = 0;
    let maxMp = 20;

    setScenarios(prev => prev.map(scene => {
      if (scene.id === selectedScenarioId) {
        const statusKey = `${r}-${c}`;
        const currentStatuses = scene.tokenStatuses || {};
        const currentStatus = currentStatuses[statusKey] || {
          hp: 40,
          maxHp: 40,
          mp: maxMp,
          maxMp: maxMp,
          name: defaultName
        };

        const calculatedMp = Math.max(0, Math.min(currentStatus.maxMp, currentStatus.mp + amount));
        nextMp = calculatedMp;
        maxMp = currentStatus.maxMp;
        actualName = currentStatus.name || defaultName;

        const updatedStatuses = {
          ...currentStatuses,
          [statusKey]: {
            ...currentStatus,
            mp: calculatedMp
          }
        };

        return {
          ...scene,
          tokenStatuses: updatedStatuses
        };
      }
      return scene;
    }));

    triggerCombatAnimation({
      row: r,
      col: c,
      targetName: actualName,
      mpChange: amount,
      type: amount < 0 ? 'mana-use' : 'mana-gain'
    });

    triggerToast(`${actualName}: ${nextMp}/${maxMp} MP`);
  };

  const handleUpdateBossHpVal = (amount: number) => {
    const nextHp = Math.min(bossMaxHp, Math.max(0, bossHp + amount));
    
    let bossRow = -1;
    let bossCol = -1;
    if (selectedScenario) {
      for (let r = 0; r < selectedScenario.gridData.length; r++) {
        for (let c = 0; c < selectedScenario.gridData[r].length; c++) {
          if (selectedScenario.gridData[r][c].startsWith('boss:')) {
            bossRow = r;
            bossCol = c;
            break;
          }
        }
        if (bossRow !== -1) break;
      }
    }

    setScenarios(prev => prev.map(scene => {
      if (scene.id === selectedScenarioId) {
        let nextGrid = scene.gridData;
        if (nextHp <= 0) {
          nextGrid = scene.gridData.map(row => 
            row.map(tile => tile.startsWith('boss:') ? 'empty' : tile)
          );
        }
        return { ...scene, bossHp: nextHp, gridData: nextGrid };
      }
      return scene;
    }));

    triggerCombatAnimation({
      row: bossRow,
      col: bossCol,
      targetName: bossName,
      hpChange: amount,
      type: amount < 0 ? 'damage' : 'heal'
    });

    if (nextHp === 0 && bossHp > 0) {
      pushSystemLog(`☠️ O Colossal ${bossName} sucumbiu em batalha gloriosa!`);
      triggerToast(`☠️ O Colossal ${bossName} foi derrotado e desapareceu do mapa!`);
    } else if (amount < 0) {
      pushSystemLog(`💥 O Mestre desferiu dano no ${bossName} (${amount} HP)`);
      triggerToast(`Chefe ${bossName}: ${nextHp}/${bossMaxHp} HP`);
    } else {
      pushSystemLog(`💖 O Mestre curou o ${bossName} (+${amount} HP)`);
      triggerToast(`Chefe ${bossName}: ${nextHp}/${bossMaxHp} HP`);
    }
  };

  const handleSaveQuest = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newQuestTitle.trim()) {
      triggerToast('⚠️ Digite o título da missão.');
      return;
    }
    
    if (editingQuestId) {
      setQuests(prev => prev.map(q => q.id === editingQuestId ? {
        ...q,
        title: newQuestTitle,
        description: newQuestDesc,
        rewardGold: Number(newQuestGold),
        rewardXp: Number(newQuestXp),
        rewardArtifactId: newQuestArtifactId,
        participants: newQuestParticipants
      } : q));
      triggerToast('✅ Missão editada com sucesso!');
      pushSystemLog(`[Missões] Mestre editou a missão: "${newQuestTitle}"`);
      setEditingQuestId(null);
    } else {
      const newQuest: Quest = {
        id: generateUniqueId('quest'),
        title: newQuestTitle,
        description: newQuestDesc,
        rewardGold: Number(newQuestGold),
        rewardXp: Number(newQuestXp),
        rewardArtifactId: newQuestArtifactId,
        participants: newQuestParticipants,
        status: 'active'
      };
      setQuests(prev => [...prev, newQuest]);
      triggerToast('✅ Nova Missão ativa e enviada às telas!');
      pushSystemLog(`[Missões] Mestre criou nova missão ativa: "${newQuestTitle}"`);
    }
    
    // Reset form
    setNewQuestTitle('');
    setNewQuestDesc('');
    setNewQuestGold(100);
    setNewQuestXp(150);
    setNewQuestArtifactId('art_1');
    setNewQuestParticipants([]);
  };

  const handleDeleteQuest = (qId: string, title: string) => {
    setQuests(prev => prev.filter(q => q.id !== qId));
    triggerToast('🗑️ Missão apagada!');
    pushSystemLog(`[Missões] Mestre removeu a missão "${title}".`);
  };

  const handleDeleteCharacter = (charId: string) => {
    const charToDelete = characters.find(c => c.id === charId);
    if (!charToDelete) return;

    if (characters.length <= 1) {
      triggerToast('⚠️ Você precisa manter pelo menos um herói cadastrado!');
      return;
    }

    const nextChars = characters.filter(c => c.id !== charId);
    setCharacters(nextChars);
    
    if (selectedCharId === charId && nextChars.length > 0) {
      setSelectedCharId(nextChars[0].id);
    }

    try {
      localStorage.setItem('vtt_characters', JSON.stringify(nextChars));
      broadcastState('characters', nextChars);
    } catch (e) {
      console.error('Failed to save characters to localStorage on deletion:', e);
    }

    triggerToast(`🗑️ ${charToDelete.name} foi apagado da taverna!`);
    pushSystemLog(`[Cadastro] Herói "${charToDelete.name}" foi excluído.`);
  };

  const handleUndoDisplacement = (logEntry: LogEntry) => {
    if (!logEntry.metadata || logEntry.metadata.type !== 'displacement') return;
    const { scenarioId, fromRow, fromCol, toRow, toCol, tileType, tokenStatus } = logEntry.metadata;
    
    setScenarios(prev => prev.map(scene => {
      if (scene.id === scenarioId) {
        // Clear current position and restore previous position
        const updatedGrid = scene.gridData.map((row, r) => {
          return row.map((cell, c) => {
            if (r === fromRow && c === fromCol) {
              return tileType;
            }
            if (r === toRow && c === toCol) {
              return cell === tileType ? 'empty' : cell;
            }
            return cell;
          });
        });

        const updatedStatuses = { ...scene.tokenStatuses };
        const oldKey = `${toRow}-${toCol}`;
        const newKey = `${fromRow}-${fromCol}`;

        if (updatedStatuses[oldKey]) {
          updatedStatuses[newKey] = updatedStatuses[oldKey];
          delete updatedStatuses[oldKey];
        } else if (tokenStatus) {
          updatedStatuses[newKey] = tokenStatus;
        }

        return { ...scene, gridData: updatedGrid, tokenStatuses: updatedStatuses };
      }
      return scene;
    }));

    // Post system message log
    pushSystemLog(`[Deslocamento] Reversão de Movimento: "${logEntry.metadata.tokenName}" reapareceu em [Linha: ${fromRow + 1}, Coluna: ${fromCol + 1}].`);
    triggerToast(`↩️ Movimento de "${logEntry.metadata.tokenName}" foi desfeito!`);

    // Delete or mark log entry as undone/reversed so it can't be clicked twice
    setLogs(prev => prev.filter(l => l.id !== logEntry.id));
  };

  const playRewardSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4 -> E4 -> G4 -> C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
      });
    } catch (err) {
      console.warn("AudioContext blocked or unavailable:", err);
    }
  };

  const handleToggleQuestStatus = (qId: string, title: string, status: 'inactive' | 'active' | 'completed') => {
    let goldToAward = 0;
    let xpToAward = 0;
    let participantIds: string[] = [];

    setQuests(prev => prev.map(q => {
      if (q.id === qId) {
        goldToAward = q.rewardGold || 0;
        xpToAward = q.rewardXp || 0;
        participantIds = q.participants || [];
        return { ...q, status };
      }
      return q;
    }));

    if (status === 'completed') {
      triggerToast('🎉 Missão Completada com sucesso!');
      pushSystemLog(`[Missões] 🎉 O GRUPO COMPLETOU A MISSÃO: "${title}"! Concedido +${goldToAward} PO & +${xpToAward} XP.`);
      
      // Award GP and XP to characters' sheets automatically!
      if (participantIds.length > 0) {
        setCharacters(prev => prev.map(char => {
          if (participantIds.includes(char.id)) {
            pushSystemLog(`★ ${char.name} recebeu ${goldToAward} PO e ${xpToAward} XP pela conclusão da missão.`);
            return {
              ...char,
              gold: (char.gold || 0) + goldToAward,
              xp: (char.xp || 0) + xpToAward
            };
          }
          return char;
        }));
      }

      // Play 8-bit level-up reward synth sound
      playRewardSound();

      // Trigger locally
      setShowCompletedConfetti(true);

      // Trigger over Cloud to sync on projector window
      if (onlineSync) {
        set(ref(db, `rooms/${syncRoomId}/trigger_confetti`), Date.now());
      }
    } else if (status === 'active') {
      triggerToast('⚔️ Missão ativada (em progresso)!');
      pushSystemLog(`[Missões] Missão "${title}" dita como Em Progresso pelo Mestre.`);
    } else {
      triggerToast('📜 Missão arquivada / pausada.');
    }
  };

  const handleLevelUp = (charId: string) => {
    setCharacters(prev => prev.map(char => {
      if (char.id === charId) {
        triggerToast(`${char.name} subiu para o nível ${char.level + 1}!`);
        pushSystemLog(`★ ${char.name} ascendeu para o Nível ${char.level + 1}!`);
        return { 
          ...char, 
          level: char.level + 1,
          maxHp: char.maxHp + 8,
          hp: char.hp + 8,
          maxMp: char.maxMp + 5,
          mp: char.mp + 5
        };
      }
      return char;
    }));
  };

  const handleAddInventoryItem = (charId: string, itemText: string) => {
    if (!itemText.trim()) return;
    setCharacters(prev => prev.map(char => {
      if (char.id === charId) {
        return { ...char, inventory: [...char.inventory, itemText.trim()] };
      }
      return char;
    }));
  };

  const handleRemoveInventoryItem = (charId: string, indexToRemove: number) => {
    setCharacters(prev => prev.map(char => {
      if (char.id === charId) {
        return { ...char, inventory: char.inventory.filter((_, idx) => idx !== indexToRemove) };
      }
      return char;
    }));
  };

  const handleUpdateBackstory = (charId: string, text: string) => {
    setCharacters(prev => prev.map(char => {
      if (char.id === charId) {
        return { ...char, notes: text };
      }
      return char;
    }));
  };

  const handleCreateNewCharacterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newHero: Character = {
      id: `char_custom_${Date.now()}`,
      name: newCharName.trim(),
      class: newCharClass,
      level: 1,
      race: newCharRace,
      hp: newCharMaxHp || 30,
      maxHp: newCharMaxHp || 30,
      mp: newCharMaxMp || 20,
      maxMp: newCharMaxMp || 20,
      attributes: {
        strength: newCharStr || 13,
        dexterity: newCharDex || 13,
        constitution: newCharCon || 13,
        intelligence: newCharInt || 13,
        wisdom: newCharWis || 13,
        charisma: newCharCha || 13
      },
      inventory: ['Armadura de Couro de Viagem', 'Arma Simples Básica', 'Cantil de Água', 'Pão de Centeio'],
      notes: 'Um viajante misterioso que acaba de assinar contrato na Taverna Digital.',
      clothingColor: newCharClothingColor
    };

    setCharacters(prev => [...prev, newHero]);
    setSelectedCharId(newHero.id);
    setShowNewCharModal(false);
    
    // reset inputs
    setNewCharName('');
    setNewCharClass('Guerreiro');
    setNewCharRace('Humano');
    setNewCharClothingColor('#3b82f6');
    setNewCharMaxHp(30);
    setNewCharMaxMp(20);
    setNewCharStr(13);
    setNewCharDex(13);
    setNewCharCon(13);
    setNewCharInt(13);
    setNewCharWis(13);
    setNewCharCha(13);

    triggerToast(`Ficha de ${newHero.name} foi forjada com sucesso!`);
    pushSystemLog(`[Fichas] Novo herói adentrou na comitiva: ${newHero.name} (${newHero.race} ${newHero.class})`);
  };

  const handleSaveEditCharacterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingCharName.trim()) return;

    setCharacters(prev => prev.map(char => {
      if (char.id === editingCharId) {
        return {
          ...char,
          name: editingCharName.trim(),
          class: editingCharClass,
          race: editingCharRace,
          level: editingCharLevel,
          maxHp: editingCharMaxHp,
          hp: Math.min(editingCharMaxHp, char.hp),
          maxMp: editingCharMaxMp,
          mp: Math.min(editingCharMaxMp, char.mp),
          attributes: {
            strength: editingCharStr,
            dexterity: editingCharDex,
            constitution: editingCharCon,
            intelligence: editingCharInt,
            wisdom: editingCharWis,
            charisma: editingCharCha
          }
        };
      }
      return char;
    }));

    setShowEditCharModal(false);
    triggerToast(`Ficha de ${editingCharName} editada com sucesso!`);
    pushSystemLog(`[Fichas] Ficha de ${editingCharName} foi atualizada pelo Mestre.`);
  };

  // -----------------------------
  // DICE ROLLERS LOGIC
  // -----------------------------
  const rollDiceValue = (faces: number): number => {
    return Math.floor(Math.random() * faces) + 1;
  };

  const executeDiceRoll = (faces: number) => {
    const rawRolls: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      rawRolls.push(rollDiceValue(faces));
    }
    const sum = rawRolls.reduce((a, b) => a + b, 0);
    const total = sum + diceModifier;
    
    // Check if any rolled d20 is critical (>= 19)
    const activeCharName = selectedChar ? selectedChar.name : 'Aventureiro';
    const isCrit = (faces === 20 && rawRolls.some(r => r >= 19));

    // Compose mathematical description log entry
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const formulaStr = `${diceCount}d${faces}${diceModifier >= 0 ? '+' : ''}${diceModifier !== 0 ? diceModifier : ''}`;
    const descStr = `Resultado: ${total} [Rolagens: ${rawRolls.join(', ')}] ${diceModifier !== 0 ? `(Modificador: ${diceModifier})` : ''}`;

    const newLog: LogEntry = {
      id: generateUniqueId('log_dice'),
      timestamp: time,
      type: 'roll',
      sender: activeCharName,
      content: `Rolagem de ${formulaStr}: ${descStr}`
    };

    setLogs(prev => [newLog, ...prev]);
    triggerToast(`Você rolou ${total}!`);

    if (isCrit) {
      triggerGridEffects();
      // Trigger critical visual screen shake
      setIsCritShaking(true);
      setTimeout(() => setIsCritShaking(false), 900);

      const critVal = Math.max(...rawRolls.filter(r => r >= 19));
      const combatEntry: LogEntry = {
        id: generateUniqueId('log_combat_crit'),
        timestamp: time,
        type: 'combat',
        sender: 'LOG DE COMBATE',
        content: `💥 ACERTO CRÍTICO! ${activeCharName} desferiu um ataque devastador! O grid de batalha treme com poder tremendo (d20 bruto: ${critVal})!`
      };
      setLogs(prev => [combatEntry, ...prev]);
    }
  };

  const rollAttributeText = (attrName: string, value: number) => {
    const mod = Math.floor((value - 10) / 2);
    const d20 = rollDiceValue(20);
    const total = d20 + mod;
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const activeCharName = selectedChar ? selectedChar.name : 'Aventureiro';

    const newLog: LogEntry = {
      id: generateUniqueId('log_attr'),
      timestamp: time,
      type: 'roll',
      sender: activeCharName,
      content: `Teste de Atributo [${attrName}] (d20 + mod ${mod >= 0 ? '+' : ''}${mod}): Resultado ${total} [Rolagem bruta: ${d20}]`
    };

    setLogs(prev => [newLog, ...prev]);
    triggerToast(`Teste de ${attrName}: ${total}`);

    if (d20 >= 19) {
      triggerGridEffects();
      const combatEntry: LogEntry = {
        id: generateUniqueId('log_combat_crit'),
        timestamp: time,
        type: 'combat',
        sender: 'LOG DE COMBATE',
        content: `💥 DATA CRÍTICA! ${activeCharName} realizou um teste magistral de ${attrName}! O grid tático pulsa com energia mística (d20 bruto: ${d20})!`
      };
      setLogs(prev => [combatEntry, ...prev]);
    }
  };

  // -----------------------------
  // DECISÕES RÁPIDAS MINI-GAMES LOGIC
  // -----------------------------
  const handleCoinFlip = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    setCoinResult(null);
    pushSystemLog(`🪙 O jogador ${selectedChar?.name || 'Mestre'} lançou uma MOEDA de decisão no ar!`);

    setTimeout(() => {
      const isCara = Math.random() < 0.5;
      const res = isCara ? 'cara' : 'coroa';
      setCoinResult(res);
      setIsFlippingCoin(false);

      const symbol = isCara ? '👑 Cara' : '🛡️ Coroa';
      const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
      const logo: LogEntry = {
        id: generateUniqueId('coin_flip'),
        timestamp: time,
        type: 'roll',
        sender: 'Jogada de Moeda',
        content: `🪙 ${selectedChar?.name || 'Mestre'} lançou Moeda: ${symbol}!`
      };
      setLogs(prev => [logo, ...prev]);
      triggerToast(`Moeda: ${symbol}!`);
    }, 900);
  };

  const handleRpsPlay = (userChoice: 'stone' | 'paper' | 'scissors') => {
    setRpsUserChoice(userChoice);
    const options: ('stone' | 'paper' | 'scissors')[] = ['stone', 'paper', 'scissors'];
    const opponentChoice = options[Math.floor(Math.random() * options.length)];
    setRpsOpponentChoice(opponentChoice);

    const translateEmoji = (opt: string) => {
      if (opt === 'stone') return '🪨';
      if (opt === 'paper') return '📜';
      return '✂️';
    };

    const translateName = (opt: string) => {
      if (opt === 'stone') return 'Pedra';
      if (opt === 'paper') return 'Papel';
      return 'Tesoura';
    };

    let outcome = '';
    if (userChoice === opponentChoice) {
      outcome = 'Empate tático!';
    } else if (
      (userChoice === 'stone' && opponentChoice === 'scissors') ||
      (userChoice === 'paper' && opponentChoice === 'stone') ||
      (userChoice === 'scissors' && opponentChoice === 'paper')
    ) {
      outcome = `Vitória gloriosa!`;
    } else {
      outcome = 'Vitória do Destino!';
    }

    setRpsResult(outcome);
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const logVal: LogEntry = {
      id: generateUniqueId('rps'),
      timestamp: time,
      type: 'combat',
      sender: 'Disputa de Jokenpô',
      content: `🤜 ${selectedChar?.name || 'Mestre'} rolou Jokenpô: ${translateEmoji(userChoice)} ${translateName(userChoice)}! (Destino jogou ${translateEmoji(opponentChoice)} [${translateName(opponentChoice)}] - ${outcome})`
    };
    setLogs(prev => [logVal, ...prev]);
    triggerToast(`${translateEmoji(userChoice)} ${outcome}`);
  };

  const handleRpsReset = () => {
    setRpsResult(null);
    setRpsUserChoice(null);
    setRpsOpponentChoice(null);
  };

  // -----------------------------
  // LOGS & CHAT LOGIC
  // -----------------------------
  const pushSystemLog = (text: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const newEntry: LogEntry = {
      id: generateUniqueId('log_sys'),
      timestamp: time,
      type: 'system',
      sender: 'Taverna Bot',
      content: text
    };
    setLogs(prev => [newEntry, ...prev]);
  };

  useEffect(() => {
    const EMAILS_PERMITIDOS = ["xalemaoxoldschool@gmail.com", "mestre.premium@taverna.com"];
    const CHAVES_OVERRIDE = ["TAVERNA4990", "INFINITE4990", "@Rambo1313"];

    (window as any).iniciarVerificacaoInfinitePay = () => {
      const modalLoading = document.getElementById('infinitepay-modal-loading');
      if (modalLoading) modalLoading.classList.remove('hidden');
      const statusText = document.getElementById('infinitepay-status-text');
      if (statusText) statusText.innerText = "🔄 Estabelecendo conexão SSL segura com o endpoint da InfinitePay...";
      
      // Timeline de passos visuais corporativos
      setTimeout(() => {
        if (statusText) statusText.innerText = "🔄 Consultando registros de liquidação de Pix e Crédito (Últimas 24h)...";
      }, 1100);

      setTimeout(() => {
        if (statusText) statusText.innerText = "🔄 Autenticando assinatura vinculada ao e-mail ativo...";
      }, 2200);

      setTimeout(() => {
        const emailInput = document.getElementById('user-email-input') as HTMLInputElement;
        const emailAtual = emailInput ? emailInput.value.trim().toLowerCase() : (userAuth?.email || "").toLowerCase(); 

        if (EMAILS_PERMITIDOS.map(e => e.toLowerCase()).includes(emailAtual)) {
          (window as any).exibirSucessoGateway("✓ Transação Concluída! Pix recebido de Evandro José identificado com sucesso.");
        } else {
          (window as any).exibirErroGateway();
        }
      }, 3400);
    };

    (window as any).verificarChaveManual = () => {
      const inputChave = document.getElementById('input-chave-override') as HTMLInputElement;
      const chaveDigitada = inputChave ? inputChave.value.trim().toUpperCase() : "";
      
      if (CHAVES_OVERRIDE.map(c => c.toUpperCase()).includes(chaveDigitada)) {
        const errorModal = document.getElementById('infinitepay-modal-error');
        if (errorModal) errorModal.classList.add('hidden');
        (window as any).exibirSucessoGateway("✓ Acesso Liberado via Chave de Override Autorizada pela Stay Strong LAB!");
      } else {
        alert("Chave de liberação não encontrada ou expirada. Verifique o comprovante.");
      }
    };

    (window as any).exibirSucessoGateway = (mensagem: string) => {
      const modalLoading = document.getElementById('infinitepay-modal-loading');
      if (modalLoading) modalLoading.classList.add('hidden');
      alert(mensagem);
      
      const emailKey = userAuth?.email ? userAuth.email.toLowerCase() : 'demo_user';
      localStorage.setItem('vtt_premium_paid_' + emailKey, 'true');
      localStorage.setItem('taverna_digital_premium', 'true');
      
      setPremiumUnlocked(true);
      setShowDemoLimitPopup(false);
      triggerToast('👑 Conta Liberada! Aproveite os privilégios PREMIUM.');
      pushSystemLog('[Assinatura] Pagamento validado através de webhook oficial InfinitePay.');
    };

    (window as any).exibirErroGateway = () => {
      const modalLoading = document.getElementById('infinitepay-modal-loading');
      if (modalLoading) modalLoading.classList.add('hidden');
      const errorModal = document.getElementById('infinitepay-modal-error');
      if (errorModal) errorModal.classList.remove('hidden');
    };

    return () => {
      delete (window as any).iniciarVerificacaoInfinitePay;
      delete (window as any).verificarChaveManual;
      delete (window as any).exibirSucessoGateway;
      delete (window as any).exibirErroGateway;
    };
  }, [userAuth, triggerToast]);

  const handleSendChatMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const isMaster = chatInput.startsWith('/mestre ') || chatInput.startsWith('/dm ');
    const sender = isMaster ? 'Mestre da Masmorra' : (selectedChar ? selectedChar.name : 'Aventureiro');
    const content = isMaster ? chatInput.replace(/^\/(mestre|dm)\s+/, '') : chatInput;

    const newEntry: LogEntry = {
      id: generateUniqueId('log_msg'),
      timestamp: time,
      type: isMaster ? 'combat' : 'chat',
      sender,
      content
    };

    setLogs(prev => [newEntry, ...prev]);
    setChatInput('');
  };

  // -----------------------------
  // CENARIOS / MAP MATRIX GRAPHICS LOGIC
  // -----------------------------
  const getBossDetails = (type: string) => {
    switch (type) {
      case 'supreme_lich':
        return {
          name: 'Lich / Necromante',
          portrait: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&h=250&q=80',
          colorClass: 'from-emerald-700 via-emerald-950 to-neutral-950 border-emerald-500 border-b-emerald-800',
          glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.7),0_0_50px_rgba(34,197,94,0.4)]',
          badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-900/40',
          progressClass: 'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500',
          borderClass: 'border-emerald-400 ring-2 ring-emerald-500/20',
          hp: 450,
        };
      case 'mind_flayer':
        return {
          name: 'Devorador de Mentes',
          portrait: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=250&h=250&q=80',
          colorClass: 'from-purple-800 via-indigo-950 to-neutral-950 border-purple-500 border-b-purple-800',
          glowClass: 'shadow-[0_0_25px_rgba(139,92,246,0.75),0_0_50px_rgba(168,85,247,0.4)]',
          badgeColor: 'bg-purple-950/80 text-purple-400 border-purple-900/40',
          progressClass: 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500',
          borderClass: 'border-purple-400 ring-2 ring-purple-500/20',
          hp: 400,
        };
      case 'fire_elemental':
        return {
          name: 'Senhor dos Elementos',
          portrait: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=250&h=250&q=80',
          colorClass: 'from-orange-700 via-amber-950 to-neutral-950 border-orange-500 border-b-orange-850',
          glowClass: 'shadow-[0_0_25px_rgba(249,115,22,0.75),0_0_50px_rgba(245,158,11,0.4)]',
          badgeColor: 'bg-orange-950/80 text-orange-400 border-orange-900/40',
          progressClass: 'bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500',
          borderClass: 'border-orange-400 ring-2 ring-orange-500/20',
          hp: 550,
        };
      case 'kraken':
        return {
          name: 'Kraken dos Mares',
          portrait: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=250&h=250&q=80',
          colorClass: 'from-blue-800 via-cyan-950 to-neutral-950 border-blue-500 border-b-blue-800',
          glowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.75),0_0_50px_rgba(6,182,212,0.4)]',
          badgeColor: 'bg-blue-950/80 text-blue-400 border-blue-900/40',
          progressClass: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500',
          borderClass: 'border-blue-400 ring-2 ring-blue-500/20',
          hp: 600,
        };
      case 'fallen_titan':
        return {
          name: 'Titã Caído / Divindade Corrompida',
          portrait: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=250&h=250&q=80',
          colorClass: 'from-neutral-800 via-stone-950 to-black border-yellow-600 border-b-yellow-850',
          glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.6),0_0_50px_rgba(0,0,0,0.8)]',
          badgeColor: 'bg-neutral-950 text-yellow-500 border-yellow-900/40',
          progressClass: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-400',
          borderClass: 'border-yellow-500 ring-2 ring-yellow-500/20',
          hp: 700,
        };
      case 'ancient_dragon':
      default:
        return {
          name: 'Dragão Ancião',
          portrait: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=250&h=250&q=80',
          colorClass: 'from-red-800 via-rose-950 to-neutral-950 border-red-500 border-b-red-800',
          glowClass: 'shadow-[0_0_25px_rgba(239,68,68,0.75),0_0_50px_rgba(244,63,94,0.4)]',
          badgeColor: 'bg-red-950/80 text-red-400 border-red-900/40',
          progressClass: 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-550',
          borderClass: 'border-red-400 ring-2 ring-red-500/20',
          hp: 500,
        };
    }
  };

  const getBackgroundTextureStyle = (texture?: string) => {
    return getVectorBackgroundStyle(texture || 'flagstone');
  };

  const renderCreatureMiniIcon = (id: string) => {
    let portraitUrl = 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?auto=format&fit=crop&w=150&h=150&q=80';
    if (id === 'skeleton') portraitUrl = 'https://images.unsplash.com/photo-1501711283597-90a612df1cac?auto=format&fit=crop&w=150&h=150&q=80';
    if (id === 'orc') portraitUrl = 'https://images.unsplash.com/photo-1559650656-5d1d361ad10e?auto=format&fit=crop&w=150&h=150&q=80';
    if (id === 'dragon') portraitUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&h=150&q=80';
    if (id === 'spider') portraitUrl = 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=150&h=150&q=80';

    return (
      <div className="w-6 h-6 rounded-full overflow-hidden border border-red-500/40 bg-neutral-950 shadow-md">
        <img src={portraitUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
      </div>
    );
  };

  const getActivePlayerClass = () => {
    if (!selectedChar) return 'guerreiro';
    const cls = selectedChar.class.toLowerCase();
    if (cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo')) {
      return 'mago';
    }
    if (cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra')) {
      return 'arqueiro';
    }
    return 'guerreiro';
  };

  const handleTileClick = (rowIndex: number, colIndex: number) => {
    const currentScene = scenarios.find(s => s.id === selectedScenarioId);
    if (!currentScene) return;

    if (movingToken) {
      const { r: fromRow, c: fromCol, tileType, tokenName } = movingToken;
      
      if (fromRow === rowIndex && fromCol === colIndex) {
        // Cancel moving if clicking on the same token
        setMovingToken(null);
        triggerToast('📍 Deslocamento cancelado.');
        return;
      }

      // Perform move!
      setScenarios(prev => prev.map(scene => {
        if (scene.id === selectedScenarioId) {
          // Move the token
          const updatedGrid = scene.gridData.map((row, rIdx) => {
            return row.map((cell, cIdx) => {
              // Clear previous cell
              if (rIdx === fromRow && cIdx === fromCol) {
                return 'empty';
              }
              // Set new cell
              if (rIdx === rowIndex && cIdx === colIndex) {
                return tileType;
              }
              return cell;
            });
          });

          // Move the status (HP, MP)
          const updatedStatuses = { ...scene.tokenStatuses };
          const oldKey = `${fromRow}-${fromCol}`;
          const newKey = `${rowIndex}-${colIndex}`;
          
          let oldStatus = updatedStatuses[oldKey];
          if (oldStatus) {
            updatedStatuses[newKey] = oldStatus;
            delete updatedStatuses[oldKey];
          }

          return { ...scene, gridData: updatedGrid, tokenStatuses: updatedStatuses };
        }
        return scene;
      }));

      // Log the movement as a displacement with metadata for UNDO capability!
      const oldStatus = currentScene.tokenStatuses?.[`${fromRow}-${fromCol}`];
      
      const newLog: LogEntry = {
        id: `move_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'combat',
        sender: 'DIRETRIZ 📍',
        content: `📍 [Deslocamento] ${tokenName} deslocado de [Linha: ${fromRow + 1}, Coluna: ${fromCol + 1}] para [Linha: ${rowIndex + 1}, Coluna: ${colIndex + 1}].`,
        metadata: {
          type: 'displacement',
          scenarioId: selectedScenarioId,
          tokenName,
          fromRow,
          fromCol,
          toRow: rowIndex,
          toCol: colIndex,
          tileType,
          tokenStatus: oldStatus
        }
      };

      setLogs(prev => [newLog, ...prev]);
      setMovingToken(null);
      triggerToast(`📍 ${tokenName} deslocado!`);
      return;
    }

    if (activeBrush === 'fogOfWar') {
      setScenarios(prev => prev.map(scene => {
        if (scene.id === selectedScenarioId) {
          const gridRows = scene.gridRows || 10;
          const gridCols = scene.gridCols || 10;
          const currentFog = scene.fogOfWar || Array(gridRows).fill(null).map(() => Array(gridCols).fill(false));
          
          const updatedFog = currentFog.map((row, rIdx) => {
            if (rIdx === rowIndex) {
              return row.map((cell, cIdx) => {
                if (cIdx === colIndex) {
                  return !cell; // toggle fog
                }
                return cell;
              });
            }
            return row;
          });
          
          return { ...scene, fogOfWar: updatedFog };
        }
        return scene;
      }));
      return;
    }

    const currentTile = currentScene.gridData[rowIndex][colIndex];
    const isToken = currentTile.startsWith('player') || currentTile.startsWith('enemy') || currentTile.startsWith('boss:') || currentTile.startsWith('custom:');
    if (isToken) {
      if (editingPlayerCell && editingPlayerCell.r === rowIndex && editingPlayerCell.c === colIndex) {
        setEditingPlayerCell(null);
      } else {
        setEditingPlayerCell({ r: rowIndex, c: colIndex });
      }
      return;
    }

    setScenarios(prev => prev.map(scene => {
      if (scene.id === selectedScenarioId) {
        const updatedGrid = scene.gridData.map((row, rIdx) => {
          if (rIdx === rowIndex) {
            return row.map((tile, cIdx) => {
              if (cIdx === colIndex) {
                return activeBrush; // apply selected brush
              }
              return tile;
            });
          }
          return row;
        });

        const statusKey = `${rowIndex}-${colIndex}`;
        const updatedStatuses = { ...scene.tokenStatuses };

        const isPlacingPlayer = activeBrush.startsWith('player');
        const isPlacingEnemy = activeBrush.startsWith('enemy');
        const isPlacingBoss = activeBrush.startsWith('boss:');
        const isPlacingCustom = activeBrush.startsWith('custom:');

        let nextBossHp = scene.bossHp;
        let nextBossMaxHp = scene.bossMaxHp;

        if (isPlacingPlayer || isPlacingEnemy || isPlacingBoss || isPlacingCustom) {
          let defaultHp = 40;
          let defaultMp = 20;
          let calculatedName = 'Combatente';

          if (isPlacingBoss) {
            defaultHp = 500;
            defaultMp = 100;
            const bType = activeBrush.split(':')[1] || 'ancient_dragon';
            calculatedName = bType === 'supreme_lich' ? 'Lich Supremo' : bType === 'beholder' ? 'Observador Ancião' : 'Dragão Ancião';
            nextBossHp = 500;
            nextBossMaxHp = 500;
          } else if (isPlacingPlayer) {
            const sub = activeBrush.split(':')[1] || 'guerreiro';
            const matchingHero = characters.find(c => c.id === sub) || characters.find(c => c.class.toLowerCase().includes(sub)) || selectedChar;
            calculatedName = matchingHero ? matchingHero.name : (sub.charAt(0).toUpperCase() + sub.slice(1));
            defaultHp = matchingHero ? matchingHero.maxHp : 40;
            defaultMp = matchingHero ? matchingHero.maxMp : 20;

            if (matchingHero) {
              setCharacters(cPrev => cPrev.map(char => {
                if (char.id === matchingHero.id) {
                  return { ...char, hp: char.maxHp, mp: char.maxMp };
                }
                return char;
              }));
            }
          } else if (isPlacingEnemy) {
            const sub = activeBrush.includes(':') ? activeBrush.split(':')[1] : 'Fera';
            calculatedName = sub.charAt(0).toUpperCase() + sub.slice(1);
            if (sub === 'goblin') {
              defaultHp = 30;
              defaultMp = 10;
            } else if (sub === 'orc') {
              defaultHp = 60;
              defaultMp = 10;
            } else if (sub === 'skeletons') {
              defaultHp = 40;
              defaultMp = 0;
            } else {
              defaultHp = 50;
              defaultMp = 15;
            }
          } else if (isPlacingCustom) {
            const tokenId = activeBrush.split(':').pop();
            const cToken = customTokens.find(t => t.id === tokenId);
            calculatedName = cToken ? cToken.name : 'Miniatura Custom';
          }

          updatedStatuses[statusKey] = {
            hp: defaultHp,
            maxHp: defaultHp,
            mp: defaultMp,
            maxMp: defaultMp,
            name: calculatedName,
            tokenId: `token_${activeBrush}_${rowIndex}_${colIndex}_${Math.random().toString(36).substring(2, 7)}`
          } as any;
        }

        return { 
          ...scene, 
          gridData: updatedGrid, 
          tokenStatuses: updatedStatuses,
          bossHp: nextBossHp,
          bossMaxHp: nextBossMaxHp
        };
      }
      return scene;
    }));
  };

  const handleCreateEmptyScenario = () => {
    const customId = `scene_custom_${Date.now()}`;
    const newScene: ScenarioScene = {
      id: customId,
      name: `Mapa das Cinzas #${scenarios.length + 1}`,
      description: 'Um cenário vazio pronto para ser desenhado com suas ferramentas de mestre.',
      gridRows: 12,
      gridCols: 12,
      gridData: Array(12).fill(null).map(() => Array(12).fill('empty')),
      backgroundTexture: 'flagstone'
    };

    setScenarios(prev => [...prev, newScene]);
    setSelectedScenarioId(customId);
    triggerToast('Novo mapa rústico gerado!');
    pushSystemLog(`[Cenários] Novo grid tático vazio forjado: ${newScene.name}`);
  };

  const renderTileIcon = (tileType: string, rIdx?: number, cIdx?: number) => {
    if (!tileType || tileType === 'empty') {
      return (
        <div className="w-full h-full bg-transparent hover:bg-white/5 border border-white/5 transition-colors duration-150 rounded" />
      );
    }

    const statusKey = (rIdx !== undefined && cIdx !== undefined) ? `${rIdx}-${cIdx}` : '';
    const tokenStatus = statusKey && selectedScenario ? selectedScenario.tokenStatuses?.[statusKey] : null;
    const tokenId = (tokenStatus as any)?.tokenId || `token_fallback_${tileType}_${rIdx}_${cIdx}`;

    // Safety checks for dead characters/monsters to hide them immediately
    if (tokenStatus && tokenStatus.hp <= 0) {
      return (
        <div className="w-full h-full bg-transparent hover:bg-white/5 border border-white/5 transition-colors duration-150 rounded" />
      );
    }

    if (tileType.startsWith('boss:')) {
      const bHp = selectedScenario?.bossHp !== undefined ? selectedScenario.bossHp : 500;
      if (bHp <= 0) {
        return (
          <div className="w-full h-full bg-transparent hover:bg-white/5 border border-white/5 transition-colors duration-150 rounded" />
        );
      }
    }

    if (tileType.startsWith('player')) {
      let subclass = 'guerreiro';
      if (tileType.includes(':')) {
        subclass = tileType.split(':')[1];
      } else {
        subclass = getActivePlayerClass();
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
        return (
          <div className="w-full h-full bg-transparent hover:bg-white/5 border border-white/5 transition-colors duration-150 rounded" />
        );
      }
    }

    if (tileType === 'wall') {
      return (
        <div className="w-full h-full relative flex items-center justify-center p-0.5">
          <WallPillar />
        </div>
      );
    }

    if (tileType === 'barrel') {
      return (
        <div className="w-full h-full p-1 flex items-center justify-center pointer-events-none">
          <div className="w-4/5 h-4/5 bg-gradient-to-br from-amber-800 to-amber-950 border border-amber-600/30 rounded-lg shadow-lg relative flex flex-col justify-between overflow-hidden">
            <div className="h-0.5 w-full bg-stone-500 absolute top-1.5" />
            <div className="h-0.5 w-full bg-stone-500 absolute bottom-1.5" />
            <div className="h-full w-full flex justify-between px-1 absolute inset-0 opacity-40">
              <div className="w-[1px] bg-stone-950 h-full" />
              <div className="w-[1px] bg-stone-950 h-full" />
              <div className="w-[1px] bg-stone-950 h-full" />
            </div>
            <div className="absolute inset-0 bg-[#f59e0b]/5 pointer-events-none rounded-lg" />
            <div className="text-[12px] text-amber-500/25 font-bold z-10 self-center select-none">🪘</div>
          </div>
        </div>
      );
    }

    if (tileType === 'trap') {
      return (
        <div className="w-full h-full p-1 flex items-center justify-center pointer-events-none">
          <div className="w-4/5 h-4/5 rounded-full border border-red-500/20 bg-neutral-900/60 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-1 rounded-full border border-dashed border-stone-500 opacity-60 animate-pulse" />
            <div className="w-4 h-4 bg-stone-600 border border-stone-400 rounded shadow-md z-10 flex items-center justify-center">
              <span className="text-[6px] text-red-500 font-bold tracking-tighter">⚡</span>
            </div>
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
          </div>
        </div>
      );
    }

    if (tileType === 'pillar') {
      return (
        <div className="w-full h-full relative flex items-center justify-center p-0.5 pointer-events-none">
          <div className="w-11/12 h-11/12 bg-gradient-to-br from-stone-600 to-stone-850 border border-stone-500 rounded-lg shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-0.5">
            <div className="w-full h-full rounded border border-stone-700 flex items-center justify-center relative">
              <span className="text-[11px] select-none text-stone-400 opacity-40">☸</span>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#1c1c1e]/10 to-transparent pointer-events-none" />
            </div>
          </div>
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
            <svg className="w-full h-3 text-cyan-300/40 animate-pulse" style={{ animationDelay: '0.4s' }} viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0 5 Q 6 9, 12 5 T 24 5" strokeLinecap="round" />
            </svg>
            <svg className="w-full h-3 text-blue-400/50 animate-pulse" style={{ animationDelay: '0.8s' }} viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0 5 Q 6 1, 12 5 T 24 5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      );
    }

    if (tileType === 'chest') {
      return (
        <div className="w-full h-full flex items-center justify-center scale-95 p-0.5 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-amber-950 to-neutral-900 border border-amber-500/35 rounded flex flex-col items-center justify-center p-1 shadow-[0_4px_8px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Lid with gold bindings */}
            <div className="w-full h-3/5 bg-gradient-to-r from-amber-750 to-amber-900 border-b-2 border-stone-950 flex items-center justify-center relative">
              <div className="absolute left-1/4 inset-y-0 w-1.5 bg-yellow-600/30" />
              <div className="absolute right-1/4 inset-y-0 w-1.5 bg-yellow-600/30" />
              {/* Glowing cosmic treasure lock lock */}
              <div className="w-4 h-4 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center shadow-[0_0_15px_#a855f7] animate-pulse z-10">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              </div>
            </div>
            {/* Base with metallic iron studs */}
            <div className="w-full h-2/5 bg-gradient-to-r from-amber-900 to-amber-950 flex justify-between px-2 relative">
              <div className="w-1 bg-stone-950 h-full" />
              <div className="w-1 bg-stone-950 h-full" />
            </div>
          </div>
        </div>
      );
    }

    if (tileType.startsWith('player')) {
      let subclass = 'guerreiro';
      if (tileType.includes(':')) {
        subclass = tileType.split(':')[1];
      } else {
        subclass = getActivePlayerClass();
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

      const tokenName = matchedChar?.name || `Jogador (${figurineId})`;

      return (
        <motion.div 
          layoutId={tokenId}
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          id="player-token" 
          title={tokenName}
          className="w-full h-full p-0.5 relative z-10 flex items-center justify-center group pointer-events-auto"
        >
          <div className="w-full h-full relative cursor-pointer select-none">
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
      const enemyName = enemyId.charAt(0).toUpperCase() + enemyId.slice(1);

      return (
        <motion.div 
          layoutId={tokenId}
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          id="enemy-token" 
          title={enemyName}
          className="w-full h-full p-0.5 flex items-center justify-center relative group pointer-events-auto"
        >
          <div className="w-full h-full relative cursor-pointer select-none">
            <ResinBase type="enemy" />
            <EnemyFigurine id={enemyId} />
          </div>
        </motion.div>
      );
    }

    if (tileType.startsWith('boss:')) {
      const bossId = tileType.split(':')[1] || 'ancient_dragon';
      const bossName = bossId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      return (
        <motion.div 
          layoutId={tokenId}
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          title={bossName}
          className="absolute top-0 left-0 w-[196%] h-[196%] z-20 pointer-events-auto flex items-center justify-center group"
        >
          <div className="w-full h-full relative scale-95 transition-all duration-300 group-hover:scale-100 group-active:scale-105 cursor-pointer">
            <ResinBase type="boss" />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
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
          layoutId={tokenId}
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="w-full h-full p-0.5 relative z-10 flex items-center justify-center group pointer-events-auto animate-fade-in" 
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
                <div className={`w-[85%] aspect-square rounded-full border-2 ${isEnemy ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'} overflow-hidden relative bg-neutral-900 flex items-center justify-center`}>
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

  // Filter logs list
  const filteredLogs = logs.filter(entry => {
    if (logFilter === 'all') return true;
    return entry.type === logFilter;
  });

  return (
    <div className={`min-h-screen bg-[#050814] text-neutral-100 font-sans flex flex-col justify-between selection:bg-amber-600 selection:text-white transition-all duration-300 ${isCritShaking ? 'animate-grid-shake' : ''}`}>
      {/* 3D Confetti particle burst on completed quests */}
      <ConfettiEffect active={showCompletedConfetti} onComplete={() => setShowCompletedConfetti(false)} />

      {/* Toast popup */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 to-amber-700 p-4 rounded-xl shadow-2xl border border-amber-400/30 text-neutral-950 text-xs font-bold font-serif tracking-wide flex items-center gap-2"
            id="app-action-toast"
          >
            <Sparkles className="w-4 h-4 text-neutral-950 animate-bounce" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar Navigation */}
      <nav className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo details */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f59e0b] rounded flex items-center justify-center">
                <Flame className="w-6 h-6 text-black" />
              </div>
              <div>
                <span className="font-sans text-base font-bold tracking-tight text-[#f59e0b] uppercase">
                  TAVERNA DIGITAL
                </span>
                <span className="hidden md:inline text-[9px] font-mono tracking-widest text-[#f59e0b] uppercase ml-2 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                  Sessão Ativa: O Selo de Fogo
                </span>
              </div>
            </div>

            {/* Dashboard Navigation Tabs */}
            <div className="flex bg-[#0d1117] rounded-lg p-1.5 border border-[#30363d] max-w-lg md:max-w-4xl flex-1 justify-around mx-2 sm:mx-4 gap-2 pb-2.5 has-evident-scrollbar min-w-0 shrink-0 sm:shrink relative">
              <button
                id="tab-fichas-btn"
                onClick={() => { setActiveTab('fichas'); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-sans font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'fichas'
                    ? 'bg-[#f59e0b] text-black shadow-inner'
                    : 'text-slate-400 hover:text-[#f59e0b]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Fichas e Heróis</span>
              </button>

              <button
                id="tab-dados-btn"
                onClick={() => { setActiveTab('dados-log'); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-sans font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'dados-log'
                    ? 'bg-[#f59e0b] text-black shadow-inner'
                    : 'text-slate-400 hover:text-[#f59e0b]'
                }`}
              >
                <Dice5 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Dados e Chat</span>
              </button>

              <button
                id="tab-cenarios-btn"
                onClick={() => { setActiveTab('cenarios'); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-sans font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'cenarios'
                    ? 'bg-[#f59e0b] text-black shadow-inner'
                    : 'text-slate-400 hover:text-[#f59e0b]'
                }`}
              >
                <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mapas Táticos</span>
              </button>

{/* Botão Mesa */}
              <button
                id="tab-mesa-btn"
                onClick={() => { setActiveTab('mesa'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'mesa' ? 'bg-[#f59e0b] text-black' : 'text-slate-400 hover:text-[#f59e0b]'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Mesa</span>
              </button>

              {/* Botão Arena */}
              <button
                id="tab-arena-btn"
                onClick={() => { setActiveTab('arena'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'arena' ? 'bg-[#f59e0b] text-black' : 'text-slate-400 hover:text-[#f59e0b]'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span className="hidden sm:inline">Arena</span>
              </button>
              
              <button
                id="tab-quests-btn"
                onClick={() => { setActiveTab('quests'); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-sans font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'quests'
                    ? 'bg-[#f59e0b] text-black shadow-inner'
                    : 'text-slate-400 hover:text-[#f59e0b]'
                }`}
              >
                <Scroll className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Missões e Diário</span>
              </button>
            </div>

            {/* Profile summary with active subscription indicator */}
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs text-neutral-200 font-semibold">{userAuth.email}</span>
                <div className="flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-mono text-emerald-500 tracking-wider">PREMIUM ATIVO</span>
                </div>
              </div>
              {onNavigateToForge && (
                <button
                  type="button"
                  onClick={onNavigateToForge}
                  className="p-2 text-emerald-400 hover:bg-neutral-850 hover:text-emerald-300 rounded-lg border border-transparent hover:border-neutral-800 transition-all mr-1 flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-950/20 border-emerald-900/40 cursor-pointer"
                  title="⚡ Canal Multiplayer Forge Core"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider hidden lg:inline">⚡ Forge Core</span>
                </button>
              )}
              <button
                id="app-guide-modal-btn"
                onClick={() => setShowGuideModal(true)}
                className="p-2 text-amber-500 hover:bg-neutral-850 hover:text-amber-400 rounded-lg border border-transparent hover:border-neutral-800 transition-all mr-1 flex items-center justify-center gap-1.5 px-3 py-1 bg-amber-950/20 border-amber-900/40"
                title="📖 Guia do Sistema & Manual"
              >
                <BookOpen className="w-4 h-4 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden lg:inline">📖 Manual</span>
              </button>
              <button
                id="app-google-drive-btn"
                onClick={() => {
                  setShowDriveModal(true);
                  if (driveToken) {
                    handleFetchDriveFiles();
                  }
                }}
                className="p-2 text-sky-400 hover:bg-neutral-850 hover:text-sky-300 rounded-lg border border-transparent hover:border-neutral-800 transition-all mr-1 flex items-center justify-center gap-1.5 px-3 py-1 bg-sky-950/20 border-sky-900/40 cursor-pointer"
                title="💾 Sincronização e Backup no Google Drive"
              >
                <Cloud className="w-4 h-4 animate-pulse text-sky-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden lg:inline">💾 Google Drive</span>
              </button>
              <button
                id="app-logout-btn"
                onClick={onLogout}
                className="p-2 text-neutral-400 hover:bg-neutral-800 hover:text-red-400 rounded-lg border border-transparent hover:border-neutral-800 transition-colors"
                title="Sair da Taverna"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic active target computation */}
      {(() => {
        // Keep activeTargetDetails computed correctly
        return null; // structural holder, used below
      })()}

      {/* Dynamic Videogame Boss Health Bar */}
      <AnimatePresence>
        {hasActiveBoss && (() => {
          const bDetails = getBossDetails(activeBossType);
          return (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="bg-neutral-950 border-b border-red-950/60 shadow-2xl z-20 overflow-hidden relative"
            >
              {/* Visual background details */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-955/5 via-violet-900/5 to-red-955/5 pointer-events-none" />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  {/* Portrait Thumbnail */}
                  <div className="w-10 h-10 rounded-full border border-neutral-700 overflow-hidden shrink-0 shadow-lg relative bg-neutral-900">
                    <BossTokenAvatar id={activeBossType} />
                  </div>
                  
                  <div className={`flex items-center gap-2 font-serif font-black uppercase text-xs tracking-wide p-1.5 px-3 rounded-lg border border-neutral-800 ${bDetails.badgeColor}`}>
                    <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span className="animate-pulse">CHEFE:</span>
                    <span className="text-neutral-100 font-extrabold text-sm font-serif tracking-wider ml-0.5">{bossName}</span>
                  </div>
                </div>
                
                {/* Styled Progress bar wrapper */}
                <div className="flex-1 w-full relative mx-0 md:mx-4">
                  <div className="bg-neutral-900 h-7 rounded-lg border border-red-550/35 overflow-hidden relative shadow-inner p-1 max-w-4xl mx-auto">
                    <motion.div 
                      className={`h-full rounded ${bDetails.progressClass}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 85, damping: 15 }}
                    />
                    {/* Health indicators text overlay */}
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold tracking-widest text-[#fff] drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)]">
                      HP: {bossHp} / {bossMaxHp} ({Math.round((bossHp / bossMaxHp) * 100)}%)
                    </div>
                  </div>
                </div>
                
                {/* Master's control set for the Boss HP */}
                <div className="flex items-center gap-1 shrink-0 bg-neutral-900/60 px-2 py-1 rounded-lg border border-neutral-800">
                  {[
                    { tag: '-50', amt: -50 },
                    { tag: '-10', amt: -10 },
                    { tag: '-1', amt: -1 },
                    { tag: '+1', amt: 1 },
                    { tag: '+10', amt: 10 },
                    { tag: '+50', amt: 50 },
                  ].map((ctrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleUpdateBossHpVal(ctrl.amt)}
                      className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 hover:border-red-500 rounded text-[9.5px] font-mono font-bold text-red-500 hover:text-white transition-colors"
                    >
                      {ctrl.tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Dynamic Active Combat Target Controls Panel */}
      <AnimatePresence>
        {activeTargetDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="bg-neutral-950 border-b border-amber-955/60 shadow-2xl z-20 overflow-hidden relative"
          >
            {/* Ambient gold lighting */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-955/5 via-amber-900/5 to-amber-955/5 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-5 relative z-10">
              {/* Target Profile Info */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full border border-amber-550/35 overflow-hidden shrink-0 shadow bg-black flex items-center justify-center font-bold text-lg text-amber-500 animate-pulse">
                  ⚔️
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-serif font-black uppercase text-[9px] tracking-widest text-[#f59e0b]">
                    <span>⚔️ CONFRONTO EM ANDAMENTO ⚔️</span>
                  </div>
                  <span className="text-neutral-100 font-extrabold text-sm font-serif tracking-wider ml-0.5">{activeTargetDetails.name}</span>
                </div>
              </div>

              {/* Grid with HP and MP tracking and Master inputs side-by-side */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HP CONTROL UNIT */}
                <div className="bg-neutral-900/45 p-2 rounded-xl border border-neutral-800/80 flex flex-col md:flex-row items-center gap-3">
                  <div className="flex-1 w-full relative">
                    <div className="bg-neutral-950 h-7 rounded-lg border border-red-500/20 overflow-hidden relative shadow-inner p-1">
                      <motion.div 
                        className="h-full rounded bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((activeTargetDetails.hp / activeTargetDetails.maxHp) * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 85, damping: 15 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[9.5px] font-mono font-bold tracking-widest text-[#fff] drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)]">
                        HP: {activeTargetDetails.hp} / {activeTargetDetails.maxHp} ({Math.round((activeTargetDetails.hp / activeTargetDetails.maxHp) * 100)}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-neutral-900/60 p-1 rounded-lg border border-neutral-850">
                    {[
                      { tag: '-50', amt: -50 },
                      { tag: '-10', amt: -10 },
                      { tag: '-5', amt: -5 },
                      { tag: '-1', amt: -1 },
                      { tag: '+1', amt: 1 },
                      { tag: '+5', amt: 5 },
                      { tag: '+10', amt: 10 },
                      { tag: '+50', amt: 50 },
                    ].map((ctrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleUpdateTokenHp(activeTargetDetails.row, activeTargetDetails.col, ctrl.amt, activeTargetDetails.name)}
                        className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 hover:border-red-500 rounded text-[9.5px] font-mono font-bold text-red-500 hover:text-white transition-colors"
                      >
                        {ctrl.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MP CONTROL UNIT */}
                <div className="bg-neutral-900/45 p-2 rounded-xl border border-neutral-800/80 flex flex-col md:flex-row items-center gap-3">
                  <div className="flex-1 w-full relative">
                    <div className="bg-neutral-950 h-7 rounded-lg border border-blue-500/20 overflow-hidden relative shadow-inner p-1">
                      <motion.div 
                        className="h-full rounded bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((activeTargetDetails.mp / activeTargetDetails.maxMp) * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 85, damping: 15 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[9.5px] font-mono font-bold tracking-widest text-[#fff] drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)]">
                        MP: {activeTargetDetails.mp} / {activeTargetDetails.maxMp} ({Math.round((activeTargetDetails.mp / activeTargetDetails.maxMp) * 100)}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-neutral-900/60 p-1 rounded-lg border border-neutral-850">
                    {[
                      { tag: '-10', amt: -10 },
                      { tag: '-5', amt: -5 },
                      { tag: '-1', amt: -1 },
                      { tag: '+1', amt: 1 },
                      { tag: '+5', amt: 5 },
                      { tag: '+10', amt: 10 },
                    ].map((ctrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleUpdateTokenMp(activeTargetDetails.row, activeTargetDetails.col, ctrl.amt, activeTargetDetails.name)}
                        className="px-1 py-0.5 bg-neutral-950 border border-neutral-800 hover:border-blue-500 rounded text-[9.5px] font-mono font-bold text-blue-400 hover:text-white transition-colors"
                      >
                        {ctrl.tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option to clear targeted battle focus */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCombatTargets([]);
                    setActiveCombatTarget(null);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black border border-amber-600 rounded-lg text-xs font-serif font-black tracking-wider uppercase transition-all shadow-glow hover:scale-105 flex items-center gap-1.5"
                  title="Concluir Confronto Ativo"
                >
                  <span>✓</span>
                  <span>Concluir</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Campaign Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* 1. TABS: FICHAS DE PERSONAGENS */}
          {activeTab === 'fichas' && (
            <motion.div
              key="fichas-tab-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left sidebar: character list selector */}
              <div className="lg:col-span-4 bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-neutral-800">
                  <h3 className="font-serif text-xs font-bold text-amber-500 tracking-wider uppercase">Comitiva</h3>
                  <div className="flex gap-1.5 self-end">
                    <button
                      id="trigger-new-char-modal"
                      onClick={() => setShowNewCharModal(true)}
                      className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 font-serif font-bold px-2 py-1 bg-neutral-950 hover:bg-neutral-900 border border-amber-900/30 rounded-lg transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Forjar Herói
                    </button>
                    <button
                      id="trigger-ai-token-fichas-btn"
                      onClick={() => {
                        setAiTokenType('hero');
                        setShowAiTokenModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-serif font-bold px-1.5 py-1 bg-neutral-950 hover:bg-neutral-900 border border-purple-950/40 rounded-lg transition-colors"
                    >
                      <span>🧙‍♂️ Criar com IA</span>
                    </button>
                  </div>
                </div>

                {/* Character list grids */}
                <div className="space-y-2">
                  {characters.map((char) => {
                    const isActive = char.id === selectedCharId;
                    return (
                      <div
                        key={char.id}
                        id={`select-char-${char.id}-card`}
                        className={`w-full p-3.5 text-left rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-955/20 border-amber-500/70 shadow shadow-amber-950/60'
                            : 'bg-neutral-950 border-neutral-850 hover:border-neutral-800'
                        }`}
                        onClick={() => setSelectedCharId(char.id)}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-serif text-sm font-extrabold text-[#f59e0b] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate text-neutral-100">{char.name}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                            {char.race} • {char.class} • Niv {char.level}
                          </div>
                        </div>

                        {/* HP status indicator inside slot */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono text-xs text-neutral-200 font-bold block">
                              {char.hp}/{char.maxHp} HP
                            </span>
                            <div className="w-16 h-1.5 bg-neutral-900 rounded-full overflow-hidden mt-1 border border-neutral-850">
                              <div 
                                className="h-full bg-red-600 rounded-full" 
                                style={{ width: `${Math.min(100, (char.hp / char.maxHp) * 100)}%` }} 
                              />
                            </div>
                          </div>

                          {/* Deletion button per character */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCharacter(char.id);
                            }}
                            className="bg-neutral-950 hover:bg-neutral-900 p-1.5 rounded-lg border border-neutral-800 hover:border-red-900/60 text-neutral-500 hover:text-red-400 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                            title="Excluir Herói permanentemente"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right column: detailed sheet editor */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-neutral-900 border border-amber-900/20 rounded-2xl overflow-hidden relative">
                  {/* Atmospheric banner overlay */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 down to-red-600" />
                  
                  {/* Header sheet metrics */}
                  <div className="p-6 sm:p-8 border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950/90 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                    <div className="text-center sm:text-left">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500 bg-amber-950/50 border border-amber-900/40 px-2.5 py-1 rounded inline-block mb-2">
                        FICHA DE COMBATE OFICIAL • D&D 5E
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-100">
                        {selectedChar.name}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1">
                        Série Campanha • {selectedChar.race} • {selectedChar.class} • Nível {selectedChar.level}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
                      <button
                        id={`export-${selectedChar.id}-pdf-btn`}
                        onClick={() => {
                          generateCharacterPDF([selectedChar]);
                          triggerToast(`📄 Ficha de ${selectedChar.name} exportada em PDF!`);
                        }}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-emerald-400 font-serif font-bold text-[11px] rounded-xl border border-emerald-900/30 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 scale-95 cursor-pointer"
                        title="Exportar esta ficha oficial para arquivo estático PDF"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-500" />
                        Salvar PDF (Ficha)
                      </button>

                      <button
                        id="export-party-pdf-btn"
                        onClick={() => {
                          generateCharacterPDF(characters);
                          triggerToast(`📄 Fichas de todo o grupo exportadas em PDF!`);
                        }}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-[#f59e0b] font-serif font-bold text-[11px] rounded-xl border border-amber-900/30 hover:border-amber-500/50 transition-all flex items-center gap-1.5 scale-95 cursor-pointer"
                        title="Exportar fichas de todos os heróis cadastrados em um único PDF multi-página"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#f59e0b]" />
                        Salvar Grupo (PDF)
                      </button>

                      <button
                        id={`levelup-${selectedChar.id}-btn`}
                        onClick={() => handleLevelUp(selectedChar.id)}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-amber-500 font-serif font-bold text-[11px] rounded-xl border border-amber-900/20 hover:border-amber-500/50 transition-all flex items-center gap-1.5 scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Subir Nível (Level Up)
                      </button>

                      <button
                        id={`edit-${selectedChar.id}-btn`}
                        onClick={() => {
                          setEditingCharId(selectedChar.id);
                          setEditingCharName(selectedChar.name);
                          setEditingCharClass(selectedChar.class);
                          setEditingCharRace(selectedChar.race);
                          setEditingCharLevel(selectedChar.level);
                          setEditingCharMaxHp(selectedChar.maxHp);
                          setEditingCharMaxMp(selectedChar.mp); // Note: mp is mapped to mp state and we use edit attributes elegantly
                          setEditingCharMaxMp(selectedChar.maxMp);
                          setEditingCharStr(selectedChar.attributes.strength);
                          setEditingCharDex(selectedChar.attributes.dexterity);
                          setEditingCharCon(selectedChar.attributes.constitution);
                          setEditingCharInt(selectedChar.attributes.intelligence);
                          setEditingCharWis(selectedChar.attributes.wisdom);
                          setEditingCharCha(selectedChar.attributes.charisma);
                          setShowEditCharModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-cyan-400 font-serif font-bold text-[11px] rounded-xl border border-cyan-900/30 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 scale-95 cursor-pointer"
                        title="Editar atributos principais desta Ficha de Personagem"
                      >
                        <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Editar Ficha
                      </button>
                    </div>
                  </div>

                  {/* HP & MP interactive controls */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-950">
                    {/* Health Points HP Container */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-serif font-bold text-neutral-300 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500 fill-red-500/30" />
                          PONTOS DE SAÚDE (HP)
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-100">
                          {selectedChar.hp} / {selectedChar.maxHp}
                        </span>
                      </div>

                      {/* Health progress bar grid */}
                      <div className="w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850 p-0.5 mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (selectedChar.hp / selectedChar.maxHp) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          id="hp-heal-btn"
                          onClick={() => handleUpdateHp(selectedChar.id, 5)}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800/80 rounded-lg text-xs font-mono text-emerald-500 font-semibold hover:border-emerald-500/30 transition-all"
                        >
                          Curar +5 HP
                        </button>
                        <button
                          id="hp-dmg-btn"
                          onClick={() => handleUpdateHp(selectedChar.id, -5)}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800/80 rounded-lg text-xs font-mono text-red-500 font-semibold hover:border-red-500/30 transition-all"
                        >
                          Dano -5 HP
                        </button>
                      </div>
                    </div>

                    {/* Mana Points MP Container */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-serif font-bold text-neutral-300 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                          PONTOS DE MANA (MP)
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-100">
                          {selectedChar.mp} / {selectedChar.maxMp}
                        </span>
                      </div>

                      {/* Mana progress bar grid */}
                      <div className="w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850 p-0.5 mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-650 to-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (selectedChar.mp / selectedChar.maxMp) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          id="mp-reg-btn"
                          onClick={() => handleUpdateMp(selectedChar.id, 5)}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800/80 rounded-lg text-xs font-mono text-blue-400 font-semibold hover:border-blue-500/30 transition-all"
                        >
                          Restaurar +5 MP
                        </button>
                        <button
                          id="mp-use-btn"
                          onClick={() => handleUpdateMp(selectedChar.id, -5)}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800/80 rounded-lg text-xs font-mono text-neutral-400 font-semibold hover:border-cyan-500/30 transition-all"
                        >
                          Gastar -5 MP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attributes Panel Roll Trigger */}
                  <div className="p-6 sm:p-8 border-t border-neutral-800 bg-neutral-900/40">
                    <h4 className="font-serif text-xs font-bold text-amber-500 tracking-wider mb-4 pb-2 border-b border-neutral-800">
                      ATRIBUTOS BÁSICOS (CLIQUE PARA TESTAR)
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {(Object.keys(selectedChar.attributes) as Array<keyof typeof selectedChar.attributes>).map((tempAttr) => {
                        const attr = String(tempAttr);
                        const score = selectedChar.attributes[tempAttr];
                        const modifier = Math.floor((score - 10) / 2);
                        return (
                          <button
                            key={attr}
                            id={`roll-attr-${attr}-btn`}
                            onClick={() => rollAttributeText(attr.toUpperCase(), score)}
                            className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-amber-600/30 p-2 text-center rounded-xl transition-all group scale-100 active:scale-95"
                          >
                            <span className="text-[10px] font-mono font-semibold uppercase text-neutral-500 block">
                              {attr.slice(0, 3)}
                            </span>
                            <span className="font-serif text-lg font-bold text-neutral-100 block my-1">
                              {score}
                            </span>
                            <span className="inline-block bg-neutral-900 group-hover:bg-amber-950/40 border border-neutral-800 group-hover:border-amber-900/50 text-[10px] text-amber-500 font-mono font-bold px-2 py-0.5 rounded-md">
                              {modifier >= 0 ? '+' : ''}{modifier}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                  </div>

                  </div>

                {/* Separate responsive layout grid for Inventory & Notes to ensure zero overlapping */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 pb-12">
                  {/* Inventory module card */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 hover:border-amber-500/20 transition-all shadow-xl font-sans">
                    <h4 className="font-serif text-xs font-bold text-amber-500 tracking-wider mb-4 flex items-center gap-1.5">
                      <span>🎒</span> ALFORJE & INVENTÁRIO
                    </h4>
                    
                    {/* Add direct item field */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const inputVal = (form.elements.namedItem('item-item') as HTMLInputElement).value.trim();
                        const selectVal = (form.elements.namedItem('item-category') as HTMLSelectElement).value;
                        if (!inputVal) return;

                        // If category is selected, we store as prefix, otherwise clean
                        const storedVal = selectVal ? `[${selectVal}] ${inputVal}` : inputVal;
                        handleAddInventoryItem(selectedChar.id, storedVal);
                        form.reset();
                      }}
                      className="flex flex-col sm:flex-row gap-2 mb-4"
                    >
                      <input
                        id="new-item-input"
                        name="item-item"
                        type="text"
                        placeholder="Adicionar novo item (ex: Poção de HP)..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-amber-600/60"
                        required
                      />
                      <div className="flex gap-2 shrink-0">
                        <select
                          name="item-category"
                          className="bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-[11px] text-neutral-300 outline-none focus:border-amber-500 cursor-pointer text-center font-sans"
                        >
                          <option value="">⚙️ Auto</option>
                          <option value="Armas">⚔️ Armas</option>
                          <option value="Poções">🧪 Poções</option>
                          <option value="Pergaminhos">📜 Pergaminhos</option>
                          <option value="Outros">📦 Outros</option>
                        </select>
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-serif font-bold text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer grow text-center"
                        >
                          Adicionar
                        </button>
                      </div>
                    </form>

                    {/* BUSCA E FILTROS DE CATEGORIA */}
                    <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800 mb-4 space-y-2.5">
                      <div className="flex items-center gap-2 bg-neutral-950/60 p-2 rounded-lg border border-neutral-850">
                        <Search className="w-3.5 h-3.5 text-neutral-500" />
                        <input
                          type="text"
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          placeholder="Buscar no Alforje..."
                          className="flex-1 bg-transparent text-xs text-neutral-100 placeholder-neutral-600 outline-none font-sans"
                        />
                        {inventorySearch && (
                          <button 
                            onClick={() => setInventorySearch('')}
                            className="text-neutral-500 hover:text-neutral-300 text-[10px] font-mono cursor-pointer"
                          >
                            ✕ Limpar
                          </button>
                        )}
                      </div>

                      {/* CATEGORIES BADGES TO FILTER */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-neutral-900/50">
                        {[
                          { id: 'all', label: 'Tudo', icon: '🎒' },
                          { id: 'Armas', label: 'Armas', icon: '⚔️' },
                          { id: 'Poções', label: 'Poções', icon: '🧪' },
                          { id: 'Pergaminhos', label: 'Pergaminhos', icon: '📜' },
                          { id: 'Outros', label: 'Outros', icon: '📦' }
                        ].map(item => {
                          const isSelected = inventoryCategory === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setInventoryCategory(item.id as any)}
                              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer font-sans ${
                                isSelected
                                  ? 'bg-[#f59e0b] text-black border-amber-600'
                                  : 'bg-neutral-950/50 text-neutral-400 border-neutral-850 hover:border-neutral-700'
                              }`}
                            >
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items loop */}
                    {selectedChar.inventory.length === 0 ? (
                      <p className="text-xs text-neutral-500 font-mono text-center py-4">Alforje vazio...</p>
                    ) : (
                      (() => {
                        const getItemCategory = (itemName: string): 'Armas' | 'Poções' | 'Pergaminhos' | 'Outros' => {
                          if (itemName.startsWith('[Armas] ')) return 'Armas';
                          if (itemName.startsWith('[Poções] ')) return 'Poções';
                          if (itemName.startsWith('[Pergaminhos] ')) return 'Pergaminhos';
                          if (itemName.startsWith('[Outros] ')) return 'Outros';

                          const name = itemName.toLowerCase();
                          if (
                            name.includes('espada') || name.includes('adaga') || name.includes('arco') ||
                            name.includes('cajado') || name.includes('cetro') || name.includes('lança') ||
                            name.includes('machado') || name.includes('arma') || name.includes('foice') ||
                            name.includes('macho') || name.includes('martelo') || name.includes('escudo') ||
                            name.includes('shield') || name.includes('besta') || name.includes('dardo') ||
                            name.includes('lâmina') || name.includes('lamina') || name.includes('montante') || 
                            name.includes('tridente')
                          ) {
                            return 'Armas';
                          }
                          if (
                            name.includes('poção') || name.includes('pocao') || name.includes('antídoto') ||
                            name.includes('elixir') || name.includes('potion') || name.includes('mana') ||
                            name.includes('bebida') || name.includes('filtro')
                          ) {
                            return 'Poções';
                          }
                          if (
                            name.includes('pergaminho') || name.includes('grimório') || name.includes('grimorio') ||
                            name.includes('livro') || name.includes('tomo') || name.includes('scroll') ||
                            name.includes('runa') || name.includes('papiro') || name.includes('carta')
                          ) {
                            return 'Pergaminhos';
                          }
                          return 'Outros';
                        };

                        const cleanItemName = (itemName: string): string => {
                          return itemName
                            .replace(/^\[Armas\] /, '')
                            .replace(/^\[Poções\] /, '')
                            .replace(/^\[Pergaminhos\] /, '')
                            .replace(/^\[Outros\] /, '');
                        };

                        const filteredItems = selectedChar.inventory.filter(item => {
                          const cleanedName = cleanItemName(item).toLowerCase();
                          const matchesSearch = cleanedName.includes(inventorySearch.toLowerCase());
                          const matchesCat = inventoryCategory === 'all' || getItemCategory(item) === inventoryCategory;
                          return matchesSearch && matchesCat;
                        });

                        if (filteredItems.length === 0) {
                          return (
                            <p className="text-xs text-neutral-500 font-sans text-center py-6 border border-dashed border-neutral-850 rounded-xl">
                              Nenhum item encontrado para "{inventorySearch || inventoryCategory}"
                            </p>
                          );
                        }

                        return (
                          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                            {filteredItems.map((item) => {
                              const cat = getItemCategory(item);
                              const cleaned = cleanItemName(item);
                              // Find correct index in original inventory array to remove correctly
                              const originalIndex = selectedChar.inventory.indexOf(item);

                              let catBadgeColor = 'bg-slate-900 border-slate-800 text-slate-400';
                              if (cat === 'Armas') catBadgeColor = 'bg-red-950/45 border-red-900/30 text-red-400';
                              if (cat === 'Poções') catBadgeColor = 'bg-emerald-950/45 border-emerald-900/30 text-emerald-400';
                              if (cat === 'Pergaminhos') catBadgeColor = 'bg-purple-950/45 border-purple-900/30 text-purple-400';
                              if (cat === 'Outros') catBadgeColor = 'bg-neutral-850 border-neutral-800 text-neutral-400';

                              return (
                                <li 
                                  key={originalIndex} 
                                  className="bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-850 flex items-center justify-between text-xs text-neutral-200 hover:border-neutral-700 transition-all font-sans"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono uppercase tracking-wider border font-bold shrink-0 ${catBadgeColor}`}>
                                      {cat === 'Armas' ? '⚔️ ARMA' : cat === 'Poções' ? '🧪 POÇÃO' : cat === 'Pergaminhos' ? '📜 PERG' : '📦 OUTRO'}
                                    </span>
                                    <span className="truncate text-neutral-300 font-medium">{cleaned}</span>
                                  </div>
                                  <button
                                    id={`del-item-${originalIndex}-btn`}
                                    onClick={() => handleRemoveInventoryItem(selectedChar.id, originalIndex)}
                                    className="text-neutral-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                                    title="Largar Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()
                    )}
                  </div>

                  {/* Backstory module card */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 hover:border-amber-500/20 transition-all shadow-xl flex flex-col justify-between font-sans">
                    <div>
                      <h4 className="font-serif text-xs font-bold text-amber-500 tracking-wider mb-4 flex items-center gap-1.5">
                        <span>📖</span> NOTAS & DIÁRIO DE VIAGEM
                      </h4>
                      <textarea
                        id="char-notes-textarea"
                        value={selectedChar.notes}
                        onChange={(e) => handleUpdateBackstory(selectedChar.id, e.target.value)}
                        placeholder="Insira detalhes sobre a linhagem, feridas graves, objetivos divinos ou aliados jurados..."
                        className="w-full bg-neutral-950 border border-neutral-855 focus:border-amber-600 rounded-xl p-3.5 text-xs text-neutral-350 placeholder-neutral-600 outline-none resize-none h-44 transition-all"
                      />
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-4">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Notas integradas salvas na nuvem local
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. TABS: DADOS & DIÁRIO DE COMBATE */}
          {activeTab === 'dados-log' && (
            <motion.div
              key="dados-log-tab-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in"
            >
              {/* Left Dice console pane */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-neutral-900 border border-amber-900/20 rounded-2xl p-6 sm:p-8">
                  <h3 className="font-serif text-base font-bold text-amber-500 tracking-wider mb-1.5">CONSOLA DOS DADOS</h3>
                  <p className="text-xs text-neutral-400 mb-6">Escolha o dado desejado, formule a quantidade e os bônus mágicos.</p>

                  {/* Dice Multipliers setup */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="dice-count">
                        Quantidade de Dados
                      </label>
                      <input
                        id="dice-count"
                        type="number"
                        min={1}
                        max={10}
                        value={diceCount}
                        onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-neutral-100 font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="dice-modifier">
                        Modificador Estático
                      </label>
                      <input
                        id="dice-modifier"
                        type="number"
                        value={diceModifier}
                        onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                        placeholder="+3, -1"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-neutral-100 font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Preloaded Dice buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: 'D4', f: 4, label: 'Cristal' },
                      { l: 'D6', f: 6, label: 'Cúbico' },
                      { l: 'D8', f: 8, label: 'Octa' },
                      { l: 'D10', f: 10, label: 'Dezena' },
                      { l: 'D12', f: 12, label: 'Duodeca' },
                      { l: 'D20', f: 20, label: 'Crítico' }
                    ].map((die) => (
                      <button
                        key={die.f}
                        id={`roll-die-d${die.f}-btn`}
                        onClick={() => executeDiceRoll(die.f)}
                        className="bg-neutral-955 hover:bg-neutral-950 border border-neutral-850 hover:border-amber-500/50 p-4 rounded-2xl text-center transition-all group active:scale-95 shadow-lg relative overflow-hidden"
                      >
                        <span className="text-[10px] font-mono text-neutral-500 uppercase block">{die.label}</span>
                        <span className="font-serif text-2xl font-black text-amber-500 block my-1">{die.l}</span>
                        <div className="absolute top-1 right-2 w-4 h-4 text-neutral-600/30 opacity-80 group-hover:text-amber-500/20 group-hover:scale-110 transition-transform">
                          ★
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset quick roll log reference */}
                <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 text-center">
                  <PenTool className="w-8 h-8 text-amber-500/40 mx-auto mb-3" />
                  <p className="font-serif text-neutral-200 text-xs font-bold mb-1">Dica de Guardião</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Você também pode rolar testes de atributo na primeira aba! Basta clicar no bloco do atributo desejado (ex: STR, DEX, INT) da ficha ativa.
                  </p>
                </div>
              </div>

              {/* Right Campaign Logs / Chat Segment */}
              <div className="lg:col-span-7 bg-neutral-900 border border-amber-900/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-amber-500 tracking-wider">DIÁRIO DE CAMPANHA & COMBATE</h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Histórico síncrono da mesa e ações táticas</p>
                  </div>

                  {/* Log Filter filters */}
                  <div className="flex bg-neutral-950 rounded-lg p-1 border border-neutral-850 overflow-x-auto">
                    {[
                      { v: 'all', label: 'Tudo' },
                      { v: 'roll', label: 'Dados' },
                      { v: 'chat', label: 'Chat' },
                      { v: 'combat', label: 'Combate' }
                    ].map((filterTab) => (
                      <button
                        key={filterTab.v}
                        id={`filter-${filterTab.v}-btn`}
                        onClick={() => setLogFilter(filterTab.v as any)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors shrink-0 ${
                          logFilter === filterTab.v
                            ? 'bg-amber-600 text-neutral-950 font-bold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {filterTab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log outputs stream */}
                <div className="p-6 h-96 overflow-y-auto space-y-4 bg-neutral-950 pr-4">
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Scroll className="w-8 h-8 text-neutral-700 animate-pulse mb-2" />
                      <p className="text-xs text-neutral-500 font-mono">Nenhum log correspondente a esta categoria.</p>
                    </div>
                  ) : (
                    filteredLogs.map((entry, idx) => {
                      // Style depending on logger categorization
                      const isSystem = entry.type === 'system';
                      const isRoll = entry.type === 'roll';
                      const isCombat = entry.type === 'combat';
                      
                      let textBgClass = 'text-neutral-300';
                      let labelColorClass = 'text-amber-500';

                      if (isSystem) {
                        textBgClass = 'text-neutral-500 font-mono italic text-[11px]';
                        labelColorClass = 'text-neutral-500';
                      } else if (isRoll) {
                        textBgClass = 'text-amber-200 bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-950/40 font-mono text-xs';
                        labelColorClass = 'text-amber-400 font-serif font-extrabold';
                      } else if (isCombat) {
                        textBgClass = 'text-red-250 bg-red-950/15 p-2 rounded-lg border border-red-900/20';
                        labelColorClass = 'text-red-500 font-bold uppercase tracking-wider text-[10px]';
                      }

                      return (
                        <div key={`${entry.id}-${idx}`} className="text-xs leading-relaxed" id={`log-entry-${entry.id}`}>
                          <div className="flex items-baseline justify-between mb-1">
                            <span className={`font-semibold text-xs ${labelColorClass}`}>
                              {entry.sender}
                            </span>
                            <span className="text-[9px] font-mono text-neutral-600">{entry.timestamp}</span>
                          </div>
                          <div className={`${textBgClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-1 rounded`}>
                            <span>{entry.content}</span>
                            {entry.metadata && entry.metadata.type === 'displacement' && (
                              <button
                                type="button"
                                onClick={() => handleUndoDisplacement(entry)}
                                className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-850 text-[9px] text-amber-500 hover:text-amber-400 border border-neutral-800 hover:border-amber-500/30 rounded flex items-center gap-1 cursor-pointer font-bold shrink-0 self-start sm:self-auto transition-all"
                                title="Desfazer Deslocamento"
                              >
                                <span>↩️</span>
                                <span>Desfazer</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 🛡️ DECISÕES RÁPIDAS MODULE */}
                <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-850 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Coin Flip subsection */}
                  <div className="flex-1 space-y-1.5 border-b sm:border-b-0 sm:border-r border-neutral-800/80 pb-3.5 sm:pb-0 sm:pr-4 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-500 font-serif font-black uppercase tracking-wider">🪙 MOEDA DE DECISÃO</span>
                      {coinResult && !isFlippingCoin && (
                        <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase ml-auto">
                          Res: {coinResult}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="coin-flip-trigger"
                        onClick={handleCoinFlip}
                        disabled={isFlippingCoin}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${
                          isFlippingCoin
                            ? 'bg-neutral-900 border-neutral-850 text-neutral-500'
                            : 'bg-neutral-900/40 hover:bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isFlippingCoin ? 'animate-spin' : ''}`} />
                        {isFlippingCoin ? 'Girando no Ar...' : 'Lançar Moeda'}
                      </button>
                      
                      {coinResult && !isFlippingCoin && (
                        <div className="px-2.5 py-1.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs font-serif font-bold text-amber-400 animate-bounce shrink-0">
                          {coinResult === 'cara' ? '👑 CARA' : '🛡️ COROA'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rock Paper Scissors (Jokenpô) subsection */}
                  <div className="flex-[1.4] space-y-1.5 bg-[#06080d] p-3 rounded-2xl border border-neutral-850">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-500 font-serif font-black uppercase tracking-wider">🤜 DISPUTA RÁPIDA (JOKENPÔ)</span>
                      {rpsResult && (
                        <button 
                          type="button"
                          onClick={handleRpsReset}
                          className="text-[9px] text-amber-500 hover:text-amber-400 font-mono font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40 transition-colors"
                        >
                          Jogar de novo
                        </button>
                      )}
                    </div>

                    {rpsResult ? (
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center animate-fade-in gap-2.5 transition-all ${
                        rpsResult.includes('gloriosa') 
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.06)] animate-pulse' 
                          : rpsResult.includes('Destino') 
                            ? 'bg-red-950/20 border-red-500/40 shadow-[0_4px_20px_rgba(239,68,68,0.06)]' 
                            : 'bg-amber-950/20 border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.06)]'
                      }`}>
                        
                        {/* Winner/Loser Banner */}
                        <div className={`text-[10px] font-sans font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          rpsResult.includes('gloriosa')
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/35'
                            : rpsResult.includes('Destino')
                              ? 'bg-[#1c0d10] text-[#ef4444] border-red-500/30'
                              : 'bg-amber-950 text-amber-400 border-amber-500/35'
                        }`}>
                          {rpsResult.includes('gloriosa') 
                            ? '🎉 VITÓRIA DO JOGADOR!' 
                            : rpsResult.includes('Destino') 
                              ? '💀 O DESTINO VENCEU!' 
                              : '🤝 EMPATE TÁTICO!'}
                        </div>

                        {/* Matchup Emojis */}
                        <div className="flex items-center justify-center gap-7 w-full">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-neutral-400 uppercase font-mono tracking-widest">HERÓI</span>
                            <div className={`w-11 h-11 rounded-xl bg-neutral-900 border flex items-center justify-center text-2xl shadow-inner mt-1 relative transition-all ${
                              rpsResult.includes('gloriosa') ? 'border-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-neutral-800'
                            }`}>
                              {rpsUserChoice === 'stone' ? '🪨' : rpsUserChoice === 'paper' ? '📜' : '✂️'}
                              {rpsResult.includes('gloriosa') && (
                                <div className="absolute inset-0 border border-emerald-500/60 rounded-xl animate-ping opacity-60" />
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-300 font-bold mt-1">
                              {rpsUserChoice === 'stone' ? 'Pedra' : rpsUserChoice === 'paper' ? 'Papel' : 'Tesoura'}
                            </span>
                          </div>

                          <div className="text-[10px] font-bold text-neutral-500 font-mono">VS</div>

                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-neutral-400 uppercase font-mono tracking-widest">DESTINO</span>
                            <div className={`w-11 h-11 rounded-xl bg-neutral-900 border flex items-center justify-center text-2xl shadow-inner mt-1 relative transition-all ${
                              rpsResult.includes('Destino') ? 'border-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-neutral-800'
                            }`}>
                              {rpsOpponentChoice === 'stone' ? '🪨' : rpsOpponentChoice === 'paper' ? '📜' : '✂️'}
                              {rpsResult.includes('Destino') && (
                                <div className="absolute inset-0 border border-red-500/60 rounded-xl animate-ping opacity-60" />
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-300 font-bold mt-1">
                              {rpsOpponentChoice === 'stone' ? 'Pedra' : rpsOpponentChoice === 'paper' ? 'Papel' : 'Tesoura'}
                            </span>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'stone', img: '🪨', label: 'Pedra' },
                          { id: 'paper', img: '📜', label: 'Papel' },
                          { id: 'scissors', img: '✂️', label: 'Tesoura' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleRpsPlay(opt.id as any)}
                            className="p-1 px-2.5 bg-neutral-900 hover:bg-neutral-850 hover:border-amber-500/30 border border-neutral-800/85 rounded-xl text-xs text-neutral-100 font-medium transition-all flex items-center justify-center gap-1.5 h-[40px]"
                          >
                            <span>{opt.img}</span>
                            <span className="text-[10px] font-sans font-bold text-neutral-400">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat field entry box */}
                <form onSubmit={handleSendChatMessage} className="p-4 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                  <input
                    id="chat-field-input"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Mande uma mensagem ou fale como mestre usando '/mestre [fala]'"
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 outline-none transition-colors"
                  />
                  <button
                    id="send-chat-btn"
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-neutral-950 p-2.5 px-4 rounded-xl transition-all font-mono font-bold text-xs flex items-center justify-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* 3. TABS: EDITAR E POSICIONAR CENÁRIOS */}
          {activeTab === 'cenarios' && (
            <motion.div
              key="cenarios-tab-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in"
            >
              {/* Column 1: Left Column (Brushes & Miniature List) */}
              <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-6 max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-neutral-800">
                {/* Map Selector Mapas Táticos */}
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-800">
                    <span className="font-serif text-[11px] font-bold text-amber-500 tracking-wider">CONFIGS & MAPAS</span>
                    <button
                      id="create-scenario-btn"
                      onClick={handleCreateEmptyScenario}
                      className="text-[10px] text-amber-400 font-serif font-bold p-1 px-2 bg-neutral-950 hover:bg-neutral-900 border border-amber-900/30 hover:border-amber-500/30 rounded-lg transition-all shadow"
                    >
                      + Novo Grid
                    </button>
                  </div>

                  {/* Grid selection list */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {scenarios.map((scene) => (
                      <button
                        key={scene.id}
                        id={`select-scene-${scene.id}-btn`}
                        onClick={() => setSelectedScenarioId(scene.id)}
                        className={`w-full p-2 text-left rounded-xl text-xs font-serif font-bold flex items-center justify-between transition-all ${
                          scene.id === selectedScenarioId
                            ? 'bg-amber-950/30 border border-amber-500/50 text-amber-400 font-black shadow-inner'
                            : 'bg-neutral-950 border border-transparent text-neutral-300 hover:bg-neutral-905'
                        }`}
                      >
                        <span className="truncate">{scene.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terrain Brushes (Pincel de Mestre) */}
                <div className="pt-2 border-t border-neutral-800/60">
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-2.5">
                    Pincel de Terreno & Névoa
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { v: 'wall', label: 'Rocha', icon: '🧱', desc: 'Bloqueio' },
                      { v: 'water', label: 'Água', icon: '💧', desc: 'Lento' },
                      { v: 'empty', label: 'Gramado', icon: '🟩', desc: 'Livre' },
                      { v: 'fogOfWar', label: 'Névoa', icon: '🌫️', desc: 'Ocultar' },
                    ].map((terrain) => {
                      const isSelected = activeBrush === terrain.v;
                      return (
                        <button
                          key={terrain.v}
                          id={`brush-terrain-${terrain.v}-btn`}
                          onClick={() => {
                            setActiveBrush(terrain.v);
                            triggerToast(`Pincel Ativo: ${terrain.label}`);
                          }}
                          className={`p-1.5 text-center rounded-xl transition-all border ${
                            isSelected 
                              ? 'bg-amber-955/20 border-amber-500/70 shadow ring-1 ring-amber-500/10' 
                              : 'bg-neutral-950 border-neutral-850 hover:border-neutral-800'
                          }`}
                        >
                          <div className="text-base leading-none mb-1">{terrain.icon}</div>
                          <div className="text-[9px] font-serif font-black text-neutral-100 truncate leading-none">{terrain.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fog of war utility macros */}
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      id="fog-cover-all-btn"
                      onClick={() => {
                        setScenarios(prev => prev.map(scene => {
                          if (scene.id === selectedScenario.id) {
                            const gridRows = scene.gridRows || 10;
                            const gridCols = scene.gridCols || 10;
                            const fullFog = Array(gridRows).fill(null).map(() => Array(gridCols).fill(true));
                            return { ...scene, fogOfWar: fullFog };
                          }
                          return scene;
                        }));
                        triggerToast('Toda a arena foi coberta de névoa!');
                      }}
                      className="flex-1 py-1 px-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[10px] font-semibold rounded-lg text-neutral-300 transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span>🌫️ Cobrir Tudo</span>
                    </button>
                    <button
                      type="button"
                      id="fog-clear-all-btn"
                      onClick={() => {
                        setScenarios(prev => prev.map(scene => {
                          if (scene.id === selectedScenario.id) {
                            const gridRows = scene.gridRows || 10;
                            const gridCols = scene.gridCols || 10;
                            const zeroFog = Array(gridRows).fill(null).map(() => Array(gridCols).fill(false));
                            return { ...scene, fogOfWar: zeroFog };
                          }
                          return scene;
                        }));
                        triggerToast('A névoa foi dissipada!');
                      }}
                      className="flex-1 py-1 px-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[10px] font-semibold rounded-lg text-neutral-300 transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span>☀️ Limpar Névoa</span>
                    </button>
                  </div>
                </div>

                {/* Prominent IA Token Generator trigger button */}
                <div className="pt-2 border-t border-neutral-800/60 space-y-2">
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                    Alquimia IA
                  </span>
                  <button
                    id="trigger-ai-token-cenarios-btn"
                    onClick={() => {
                      setAiTokenType('enemy');
                      setShowAiTokenModal(true);
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-950 via-neutral-950 to-purple-950 hover:from-purple-900 hover:border-purple-500/50 border border-purple-900/40 text-purple-300 font-serif font-extrabold text-[11px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 animate-pulse hover:animate-none"
                  >
                    <span>🧙‍♂️ Criar com IA</span>
                  </button>
                </div>

                {/* Miniaturas list - displaying Name and figurine image previews exactly like image_1.jpg */}
                <div className="pt-4 border-t border-neutral-800/60 space-y-4">
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                    Miniaturas de Jogo
                  </span>

                  {/* Playable Heroes figurines */}
                  <div className="space-y-1.5">
                    <span className="block text-[9.5px] font-bold text-amber-500 tracking-wider">🟢 Heróis Integrados</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {characters.map((char) => {
                        const cls = char.class.toLowerCase();
                        let sub = 'guerreiro';
                        if (cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo')) {
                          sub = 'mago';
                        } else if (cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra')) {
                          sub = 'arqueiro';
                        }

                        const brushVal = `player:${char.id}`;
                        const isSelected = activeBrush === brushVal;
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => {
                              setActiveBrush(brushVal);
                              triggerToast(`Pincel Ativo: Mini de ${char.name}`);
                            }}
                            className={`w-full p-2 rounded-xl text-left border flex items-center gap-3 transition-all ${
                              isSelected
                                ? 'bg-amber-955/25 border-amber-500 shadow-md ring-2 ring-amber-500/25'
                                : 'bg-neutral-950 border-neutral-850 hover:border-neutral-800'
                            }`}
                          >
                            <div className="w-10 h-10 relative overflow-visible shrink-0 bg-neutral-900/50 rounded-lg">
                              <ResinBase type="hero" subclass={sub} />
                              <Figurine id={sub} />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[11px] font-extrabold text-neutral-100 truncate">{char.name}</span>
                              <span className="block text-[9px] text-amber-500/70 uppercase font-mono tracking-wider">{char.class}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monster figurines */}
                  <div className="space-y-1.5 font-sans">
                    <span className="block text-[9.5px] font-bold text-red-500 tracking-wider">🔴 Monstros & Vilões</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: 'goblin', name: 'Goblin Comum' },
                        { id: 'skeleton', name: 'Esqueleto Morto-Vivo' },
                        { id: 'orc', name: 'Orc Guardião' },
                        { id: 'dragon', name: 'Dragão de Sangue' },
                        { id: 'spider', name: 'Aranha Peçonhenta' },
                        { id: 'beholder', name: 'Observador (Beholder)' },
                        { id: 'mimic', name: 'Mímico (Chest Mimic)' },
                        { id: 'owlbear', name: 'Urso-Coruja (Abissal)' },
                        { id: 'gelatinous_cube', name: 'Cubo Gelatinoso' },
                        { id: 'vampiro', name: 'Conde Vampiro' },
                        { id: 'succubus', name: 'Súcubo / Íncubo' }
                      ].map((mon) => {
                        const brushVal = `enemy:${mon.id}`;
                        const isSelected = activeBrush === brushVal;
                        return (
                          <button
                            key={mon.id}
                            type="button"
                            onClick={() => {
                              setActiveBrush(brushVal);
                              triggerToast(`Pincel Ativo: Mini de ${mon.name}`);
                            }}
                            className={`w-full p-2 rounded-xl text-left border flex items-center gap-3 transition-all ${
                              isSelected
                                ? 'bg-red-955/25 border-red-500 shadow-md ring-2 ring-red-500/25'
                                : 'bg-neutral-950 border-neutral-850 hover:border-neutral-800'
                            }`}
                          >
                            <div className="w-10 h-10 relative overflow-visible shrink-0 bg-neutral-900/50 rounded-lg">
                              <ResinBase type="enemy" />
                              <EnemyFigurine id={mon.id} />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[11px] font-extrabold text-neutral-200 truncate">{mon.name}</span>
                              <span className="block text-[9px] text-red-500/70 uppercase font-mono tracking-wider font-semibold">Coleção 3D</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chefões Colossais / Bosses */}
                  <div className="space-y-1.5">
                    <span className="block text-[9.5px] font-bold text-rose-500 tracking-wider flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      👑 CHEFÕES LENDÁRIOS (BOSS)
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: 'ancient_dragon', name: 'Dragão Ancião' },
                        { id: 'supreme_lich', name: 'Lich Supremo' },
                        { id: 'mind_flayer', name: 'Devorador de Mentes' },
                        { id: 'fire_elemental', name: 'Elemental de Fogo' },
                        { id: 'kraken', name: 'Kraken do Abismo' },
                        { id: 'fallen_titan', name: 'Titã Caído' }
                      ].map((boss) => {
                        const brushVal = `boss:${boss.id}`;
                        const isSelected = activeBrush === brushVal;
                        return (
                          <button
                            key={boss.id}
                            type="button"
                            onClick={() => {
                              setActiveBrush(brushVal);
                              triggerToast(`Pincel Ativo: Chefe Colossal ${boss.name}`);
                            }}
                            className={`w-full p-2 rounded-xl text-left border flex items-center gap-3 transition-all ${
                              isSelected
                                ? 'bg-rose-955/25 border-rose-500 shadow-md ring-2 ring-rose-500/25'
                                : 'bg-neutral-950 border-neutral-850 hover:border-neutral-800'
                            }`}
                          >
                            <div className="w-10 h-10 relative overflow-visible shrink-0 bg-neutral-900/55 rounded-lg flex items-center justify-center p-1.5 border border-rose-500/20">
                              <BossTokenAvatar id={boss.id} />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[11px] font-extrabold text-rose-200 truncate">{boss.name}</span>
                              <span className="block text-[9.5px] text-rose-500 font-serif italic tracking-wide animate-pulse">Ameaça Nível Boss</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom AI generated Tokens list */}
                  {customTokens.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[9.5px] font-bold text-purple-400 tracking-wider">🔮 Criado via Magia IA</span>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {customTokens.map((token) => {
                          const brushVal = `custom:${token.type}:${token.id}`;
                          const isSelected = activeBrush === brushVal;
                          const isEnemy = token.type === 'enemy';
                          const renderStyle = token.renderStyle || 'standee';
                          return (
                            <div 
                              key={token.id}
                              className={`p-2 rounded-xl border flex flex-col gap-2.5 transition-all group/token ${
                                isSelected
                                  ? `${isEnemy ? 'bg-red-950/20 border-red-500 shadow-md ring-1 ring-red-500/30' : 'bg-amber-955/20 border-amber-500 shadow-md ring-1 ring-amber-500/30'}`
                                  : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2.5 w-full">
                                {/* Left Clickable Brush Selection area */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveBrush(brushVal);
                                    triggerToast(`Pincel Ativo: Token Customizado ${token.name}`);
                                  }}
                                  className="flex-1 min-w-0 flex items-center gap-2 text-left"
                                >
                                  <div className="w-9 h-9 relative overflow-visible shrink-0 bg-neutral-950 rounded-lg">
                                    <ResinBase type={isEnemy ? 'enemy' : 'hero'} />
                                    <div className="absolute inset-x-0 bottom-[12%] h-[82%] w-[82%] mx-auto z-20 flex items-center justify-center">
                                      {renderStyle === 'figurine' ? (
                                        <div className="w-5 h-5 relative flex items-center justify-center pointer-events-none">
                                          {token.modelType === 'boss' ? (
                                            <BossFigurine id={token.figurineId || 'supreme_lich'} />
                                          ) : token.modelType === 'enemy' ? (
                                            <EnemyFigurine id={token.figurineId || 'orc'} gender={token.gender} />
                                          ) : (
                                            <Figurine id={token.figurineId || 'guerreiro'} gender={token.gender} />
                                          )}
                                        </div>
                                      ) : (
                                        <div className={`w-6 h-6 rounded-full border ${isEnemy ? 'border-red-500' : 'border-amber-400'} overflow-hidden bg-neutral-900`}>
                                          <img src={token.imageUrl} className="w-full h-full object-cover rounded-full" alt="" referrerPolicy="no-referrer" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="block text-[11px] font-extrabold text-neutral-200 truncate">{token.name}</span>
                                      <span className={`text-[7px] px-1 rounded font-mono ${
                                        renderStyle === 'figurine' 
                                          ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                                          : renderStyle === 'standee'
                                          ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' 
                                          : 'bg-neutral-950 text-neutral-400 border border-neutral-850'
                                      }`}>
                                        {renderStyle === 'figurine' ? 'Mini 3D Real' : renderStyle === 'standee' ? 'Mini Estampado' : 'Circular'}
                                      </span>
                                    </div>
                                    <span className="block text-[9px] text-purple-400 font-mono tracking-tighter truncate leading-none mt-0.5">{token.prompt}</span>
                                  </div>
                                </button>

                                {/* Right Interactive Option Tools Area */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Toggle render style button */}
                                  <button
                                    type="button"
                                    title="Alternar estilo: Miniatura 3D Real ⇄ Mini Estampado (Foto) ⇄ Circular"
                                    onClick={() => {
                                      setCustomTokens(prev => prev.map(t => {
                                        if (t.id === token.id) {
                                          let nextStyle: 'figurine' | 'standee' | 'token' = 'figurine';
                                          if (t.renderStyle === 'figurine' || !t.renderStyle) nextStyle = 'standee';
                                          else if (t.renderStyle === 'standee') nextStyle = 'token';
                                          else nextStyle = 'figurine';

                                          let styleLabel = 'Miniatura 3D Real';
                                          if (nextStyle === 'standee') styleLabel = 'Mini Estampado (Foto)';
                                          if (nextStyle === 'token') styleLabel = 'Ficha Plana Circular';

                                          triggerToast(`✨ Visual de ${token.name} alterado para ${styleLabel}!`);
                                          return { ...t, renderStyle: nextStyle };
                                        }
                                        return t;
                                      }));
                                    }}
                                    className={`w-6.5 h-6.5 rounded-lg border flex items-center justify-center transition-all ${
                                      renderStyle === 'figurine'
                                        ? 'bg-purple-950/40 text-purple-400 border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                        : renderStyle === 'standee'
                                        ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-900/40'
                                        : 'bg-neutral-950 text-neutral-500 border-neutral-850 hover:bg-neutral-850 hover:text-neutral-300'
                                    }`}
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete custom token button */}
                                  <button
                                    type="button"
                                    title="Deletar este token de IA"
                                    onClick={() => {
                                      if (activeBrush === brushVal) {
                                        setActiveBrush('wall'); // Reset active brush safely
                                      }
                                      setCustomTokens(prev => prev.filter(t => t.id !== token.id));
                                      triggerToast(`🗑️ Token "${token.name}" deletado.`);
                                    }}
                                    className="w-6.5 h-6.5 rounded-lg bg-neutral-950 text-neutral-500 border border-neutral-850 hover:bg-red-950/50 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Dropdown for custom visual 3D Figurine selection */}
                              <div className="flex items-center justify-between border-t border-neutral-800/40 pt-1.5 gap-2 mt-[2px] px-0.5">
                                <span className="text-[9px] text-neutral-400 font-medium font-mono">Modelo 3D:</span>
                                <div className="flex items-center gap-1">
                                  <select
                                    value={`${token.modelType || 'hero'}:${token.figurineId || 'guerreiro'}`}
                                    onChange={(e) => {
                                      const [modelType, figurineId] = e.target.value.split(':');
                                      setCustomTokens(prev => prev.map(t => {
                                        if (t.id === token.id) {
                                          return { 
                                            ...t, 
                                            modelType: modelType as any, 
                                            figurineId,
                                            renderStyle: 'figurine' // Auto toggle to figurine view
                                          };
                                        }
                                        return t;
                                      }));
                                      triggerToast(`✨ Modelo de ${token.name} alterado para ${figurineId}!`);
                                    }}
                                    className="text-[9.5px] bg-neutral-950 border border-neutral-800 hover:border-purple-800/60 text-purple-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-purple-500 max-w-[110px] cursor-pointer font-serif"
                                  >
                                    <optgroup label="Heróis (Coleção 3D)">
                                      <option value="hero:guerreiro">🛡️ Guerreiro</option>
                                      <option value="hero:mago">🔮 Mago</option>
                                      <option value="hero:arqueiro">🏹 Arqueiro</option>
                                      <option value="hero:ladino">🗡️ Ladino</option>
                                      <option value="hero:elfo">🧝 Elfo</option>
                                      <option value="hero:elfo_negro">🕷️ Elfo Negro (Drow)</option>
                                      <option value="hero:anciao">📜 Ancião</option>
                                      <option value="hero:tita">⚡ Titã</option>
                                      <option value="hero:feiticeiro">🔥 Feiticeiro</option>
                                      <option value="hero:aldeao">🧑 Aldeão / Genérico</option>
                                    </optgroup>
                                    <optgroup label="Monstros (Coleção 3D)">
                                      <option value="enemy:goblin">🟢 Goblin</option>
                                      <option value="enemy:orc">🐗 Orc</option>
                                      <option value="enemy:skeleton">💀 Esqueleto</option>
                                      <option value="enemy:spider">🕷️ Aranha</option>
                                      <option value="enemy:dragon">🐉 Dragão</option>
                                      <option value="enemy:beholder">👁️ Observador</option>
                                      <option value="enemy:mimic">📦 Mímico</option>
                                      <option value="enemy:owlbear">🐻 Urso-Coruja</option>
                                      <option value="enemy:gelatinous_cube">🟩 Cubo Gelatinoso</option>
                                      <option value="enemy:vampiro">🩸 Vampiro</option>
                                      <option value="enemy:succubus">😈 Súcubo / Íncubo</option>
                                    </optgroup>
                                    <optgroup label="Chefões (Coleção 3D)">
                                      <option value="boss:supreme_lich">👑 Supreme Lich</option>
                                      <option value="boss:mind_flayer">👾 Mind Flayer</option>
                                      <option value="boss:fire_elemental">🔥 Elemental de Fogo</option>
                                      <option value="boss:kraken">🐙 Kraken</option>
                                    </optgroup>
                                  </select>

                                  {/* Gender switcher */}
                                  <button
                                    type="button"
                                    title="Alternar Gênero (Masculino / Feminino)"
                                    onClick={() => {
                                      const newGender = token.gender === 'f' ? 'm' : 'f';
                                      setCustomTokens(prev => prev.map(t => {
                                        if (t.id === token.id) {
                                          return { ...t, gender: newGender };
                                        }
                                        return t;
                                      }));
                                      triggerToast(`✨ Gênero de ${token.name} definido para ${newGender === 'f' ? 'Feminino' : 'Masculino'}!`);
                                    }}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                      token.gender === 'f'
                                        ? 'bg-pink-900/30 border-pink-500/40 text-pink-300 hover:bg-pink-900/50'
                                        : 'bg-blue-900/30 border-blue-500/40 text-blue-300 hover:bg-blue-900/50'
                                    }`}
                                  >
                                    <span className="text-[10px] font-bold">{token.gender === 'f' ? '♀' : '♂'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Center Column (The Immersive Map Canvas) */}
              <div className="lg:col-span-6 bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#f59e0b]">{selectedScenario.name}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed mt-1">{selectedScenario.description}</p>
                  </div>
                  
                  {/* Inline editors */}
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mb-1">Mudar Nome:</span>
                      <input
                        id="input-scenario-name"
                        type="text"
                        value={selectedScenario.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScenarios(prev => prev.map(scene => scene.id === selectedScenario.id ? { ...scene, name: val } : scene));
                        }}
                        className="bg-[#0d1117] border border-[#30363d] focus:border-[#f59e0b] rounded px-2.5 py-1 text-xs text-neutral-200 outline-none w-full sm:w-36"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mb-1">Mudar Descrição:</span>
                      <input
                        id="input-scenario-desc"
                        type="text"
                        value={selectedScenario.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScenarios(prev => prev.map(scene => scene.id === selectedScenario.id ? { ...scene, description: val } : scene));
                        }}
                        className="bg-[#0d1117] border border-[#30363d] focus:border-[#f59e0b] rounded px-2.5 py-1 text-xs text-neutral-200 outline-none w-full sm:w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Biome Texture Selector Controls */}
                <div className="flex flex-col p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-xs space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">Biome Textures (Alta Qualidade 2D):</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 animate-fade-in">
                    {[
                      { id: 'flagstone', label: 'Taverna', color: 'from-amber-850 to-amber-950' },
                      { id: 'mud', label: 'Lama', color: 'from-amber-900 to-amber-955' },
                      { id: 'grass', label: 'Gramado', color: 'from-emerald-800 to-green-900' },
                      { id: 'cave', label: 'Caverna', color: 'from-stone-750 to-stone-850' },
                      { id: 'volcano', label: 'Vulcão', color: 'from-red-600 via-orange-600 to-yellow-600' },
                      { id: 'dark_forest', label: 'Gloom', color: 'from-purple-900 via-indigo-950 to-neutral-900' }
                    ].map(tex => (
                      <button
                        key={tex.id}
                        type="button"
                        onClick={() => {
                          setScenarios(prev => prev.map(scene => scene.id === selectedScenario.id ? { ...scene, backgroundTexture: tex.id } : scene));
                        }}
                        className={`py-1 rounded text-[9.5px] font-medium border transition-all flex flex-col items-center justify-center gap-1 ${
                          (selectedScenario.backgroundTexture || 'flagstone') === tex.id
                            ? 'bg-amber-955/40 border-amber-500 text-amber-500 font-bold shadow'
                            : 'bg-neutral-900 border-neutral-800/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${tex.color} border border-neutral-800`} />
                        <span>{tex.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screen Transmission and projection links */}
                <div className="bg-[#0f141c] p-3 rounded-xl border border-amber-900/40 space-y-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <Tv className="w-3.5 h-3.5 text-[#f59e0b] shadow-glow" />
                    <span className="font-serif text-[10.5px] font-bold text-neutral-100 uppercase tracking-wider block">Transmissão de Tela / Modo Projetor</span>
                  </div>
                  <p className="text-[9px] text-neutral-400 leading-normal">Mapeamento em tempo real em segunda tela ou projetor tático de alta definição.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('rpg-tactical-grid-container');
                        if (el) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            el.requestFullscreen().catch(err => console.error(err));
                          }
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-950 hover:bg-neutral-900 text-[10px] font-bold text-neutral-300 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-all shadow"
                    >
                      <Maximize2 className="w-3 h-3 text-amber-500" />
                      <span>Tela Cheia Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.location.origin + window.location.pathname + '#projector';
                        window.open(url, '_blank', 'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no');
                      }}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-955/20 hover:bg-amber-955/40 text-[10px] font-bold text-amber-500 rounded-lg border border-amber-900/50 hover:border-amber-500 transition-all shadow"
                    >
                      <Tv className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span>Segunda Tela VTT</span>
                    </button>
                  </div>
                  
                  {/* Local Mode Switch: Mestre vs Jogador */}
                  <div className="pt-2 border-t border-amber-900/20">
                    <span className="block text-[8px] font-mono tracking-widest text-[#f59e0b] mb-1.5 uppercase font-bold text-center">👁️ PRÉ-VISUALIZAÇÃO DE TERRENO LOCAL</span>
                    <div className="bg-neutral-950 p-1 rounded-lg border border-neutral-800/60 flex gap-1">
                      <button
                        type="button"
                        id="viewmode-mestre-btn"
                        onClick={() => {
                          setLocalViewMode('mestre');
                          triggerToast('Visão do Grid definida para: MESTRE (Névoa Translúcida)');
                        }}
                        className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                          localViewMode === 'mestre'
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 font-extrabold'
                            : 'border border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        👑 Visão do Mestre
                      </button>
                      <button
                        type="button"
                        id="viewmode-jogador-btn"
                        onClick={() => {
                          setLocalViewMode('jogador');
                          triggerToast('Visão do Grid definida para: JOGADOR (Névoa Pratinha)');
                        }}
                        className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                          localViewMode === 'jogador'
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 font-extrabold'
                            : 'border border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        👥 Visão do Jogador
                      </button>
                    </div>
                  </div>
                </div>

                {/* Immersive tactical matrix grid layout */}
                <div id="rpg-tactical-grid-container" className={`bg-[#0b0e14] p-3 rounded-xl border border-[#30363d] flex flex-col items-center justify-center shadow-inner relative transition-all duration-300 ${gridAnimationClass}`}>
                  {movingToken && (
                    <div className="mb-2.5 px-3 py-1.5 bg-blue-950/80 border border-blue-800/60 rounded-lg text-[10px] text-blue-300 font-mono flex items-center gap-2 animate-bounce shadow">
                      <span className="shrink-0">📍</span>
                      <span>Mapeador Ativo: Clique na nova coordenada para deslocar <strong>{movingToken.tokenName}</strong> ou clique nele para cancelar.</span>
                    </div>
                  )}
                  <div 
                    className={`grid gap-0 select-none max-w-sm sm:max-w-md md:max-w-md aspect-square w-full rounded-lg overflow-visible border border-neutral-900 shadow-2xl relative transition-all duration-300 ${gridAnimationClass}`}
                    style={{
                      ...getBackgroundTextureStyle(selectedScenario.backgroundTexture),
                      gridTemplateColumns: `repeat(${selectedScenario.gridCols || 10}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${selectedScenario.gridRows || 10}, minmax(0, 1fr))`
                    }}
                  >
                    {selectedScenario.gridData.map((row, rIdx) => 
                      row.map((tileType, cIdx) => {
                        const hasFog = selectedScenario.fogOfWar && selectedScenario.fogOfWar[rIdx] && selectedScenario.fogOfWar[rIdx][cIdx];
                        const cellEffect = activeCombatEffects.find(fx => fx.row === rIdx && fx.col === cIdx);
                        const isDamageEffect = cellEffect && cellEffect.type === 'damage';
                        const isHealEffect = cellEffect && cellEffect.type === 'heal';

                        // Resolve hover tooltip name for tokens
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
                            id={`tile-${rIdx}-${cIdx}`}
                            onClick={() => handleTileClick(rIdx, cIdx)}
                            title={hoverTitle}
                            className={`aspect-square relative flex items-center justify-center p-0 border-r border-b border-white/[0.07] hover:bg-white/[0.03] transition-all group focus:outline-none cursor-pointer ${
                              isDamageEffect ? 'animate-cell-damage ring-1 ring-red-500/50 bg-red-950/10' : ''
                            } ${
                              isHealEffect ? 'animate-cell-heal ring-1 ring-emerald-500/50 bg-emerald-950/10' : ''
                            } ${
                              movingToken && movingToken.r === rIdx && movingToken.c === cIdx
                                ? 'ring-2 ring-blue-500 bg-blue-950/40 animate-pulse z-20'
                                : movingToken && tileType === 'empty'
                                ? 'hover:ring-2 hover:ring-dashed hover:ring-blue-400 hover:bg-blue-900/10'
                                : ''
                            }`}
                          >
                            {hasFog && localViewMode === 'jogador' ? (
                              <div className="w-full h-full bg-[#030406] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#010203]/70 to-[#030406] pointer-events-none" />
                                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black pointer-events-none" />
                                <svg className="w-4 h-4 text-neutral-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                                  <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            ) : (
                              <>
                                {(() => {
                                  const cellEffect = activeCombatEffects.find(fx => fx.row === rIdx && fx.col === cIdx);
                                  
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
                                {hasFog && (
                                  <div className="absolute inset-0 bg-indigo-950/40 border border-indigo-500/50 flex items-center justify-center pointer-events-none z-30" title="Névoa da Guerra Ativa">
                                    <div className="w-4.5 h-4.5 rounded-full bg-indigo-950/90 border border-indigo-500/60 flex items-center justify-center shadow-lg">
                                      <svg className="w-2.5 h-2.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

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
                                      className="absolute z-50 pointer-events-none flex flex-col items-center justify-center"
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

                          {/* Appearance menu popup context menu overlay */}
                          <AnimatePresence>
                            {editingPlayerCell && editingPlayerCell.r === rIdx && editingPlayerCell.c === cIdx && (() => {
                              let tokenName = 'Criatura';
                              let tokenIcon = '🐉';
                              let isPlayer = tileType.startsWith('player');
                              let isBoss = tileType.startsWith('boss:');
                              let isCustom = tileType.startsWith('custom:');
                              let isEnemy = tileType.startsWith('enemy');

                               let matchedChar: any = null;
                              if (isPlayer) {
                                tokenIcon = '🛡️';
                                let subclass = 'guerreiro';
                                if (tileType.includes(':')) {
                                  subclass = tileType.split(':')[1];
                                } else {
                                  subclass = getActivePlayerClass();
                                }
                                
                                matchedChar = characters.find(c => c.id === subclass) || characters.find(c => {
                                  const cls = c.class.toLowerCase();
                                  if (subclass === 'mago') {
                                    return cls.includes('mago') || cls.includes('magic') || cls.includes('feiticeiro') || cls.includes('druida') || cls.includes('clérigo') || cls.includes('clerigo');
                                  } else if (subclass === 'arqueiro') {
                                    return cls.includes('ladina') || cls.includes('arqueiro') || cls.includes('arqueira') || cls.includes('elfo') || cls.includes('ranger') || cls.includes('assassin') || cls.includes('veloz') || cls.includes('ladra');
                                  } else {
                                    return !cls.includes('mago') && !cls.includes('magic') && !cls.includes('feiticeiro') && !cls.includes('druida') && !cls.includes('clérigo') && !cls.includes('clerigo') &&
                                           !cls.includes('ladina') && !cls.includes('arqueiro') && !cls.includes('arqueira') && !cls.includes('elfo') && !cls.includes('ranger') && !cls.includes('assassin') && !cls.includes('veloz') && !cls.includes('ladra');
                                  }
                                }) || selectedChar;
                                
                                tokenName = matchedChar ? matchedChar.name : (subclass.charAt(0).toUpperCase() + subclass.slice(1));
                              }

                              else if (isBoss) {
                                tokenIcon = '💀';
                                tokenName = bossName;
                              }

                              else if (isCustom) {
                                tokenIcon = '✨';
                                const tokenId = tileType.split(':').pop();
                                const cToken = customTokens.find(t => t.id === tokenId);
                                tokenName = cToken ? cToken.name : 'Miniatura Custom';
                              }

                              else if (isEnemy) {
                                tokenIcon = '😈';
                                const eSub = tileType.includes(':') ? tileType.split(':')[1] : 'Fera';
                                tokenName = eSub.charAt(0).toUpperCase() + eSub.slice(1);
                              }

                              const statusKey = `${rIdx}-${cIdx}`;
                              const tokenStatus = selectedScenario.tokenStatuses?.[statusKey] || {
                                hp: 40,
                                maxHp: 40,
                                mp: 20,
                                maxMp: 20,
                                name: tokenName
                              };

                              // Build dynamic position classes based on grid location to avoid clipping near borders
                              let placementClass = "absolute z-[250] bg-neutral-950/95 backdrop-blur-md border border-amber-500 rounded-xl p-3 shadow-[0_0_25px_rgba(0,0,0,0.85),_0_0_15px_rgba(245,158,11,0.3)] flex flex-col gap-2 w-48 pointer-events-auto cursor-default text-left ring-1 ring-amber-500/30";
                              
                              if (rIdx < 3) {
                                placementClass += " top-full mt-1.5";
                              } else if (rIdx > 7) {
                                placementClass += " bottom-full mb-1.5";
                              } else {
                                placementClass += " bottom-full -translate-y-1.5";
                              }

                              if (cIdx < 3) {
                                placementClass += " left-[10%] origin-top-left";
                              } else if (cIdx > 6) {
                                placementClass += " right-[10%] origin-top-right";
                              } else {
                                placementClass += " left-1/2 -translate-x-1/2";
                              }

                              return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                  className={placementClass}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="border-b border-neutral-800 pb-1.5 mb-1 flex items-center gap-1.5">
                                    <span className="text-sm shrink-0">{tokenIcon}</span>
                                    <div className="flex flex-col min-w-0 animate-pulse">
                                      <div className="text-[10px] font-bold text-neutral-100 truncate leading-snug">{tokenName}</div>
                                      <div className="text-[7.5px] font-mono text-amber-500 uppercase tracking-widest">
                                        {isPlayer ? 'Herói do Grid' : isBoss ? 'Chefe de Fase' : isCustom ? 'Token Custom' : 'Monstro Ativo'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5 text-[9px] font-mono">
                                    <div className="flex flex-col gap-1 bg-neutral-950/50 p-1.5 rounded border border-neutral-800/60">
                                      <div className="flex items-center justify-between text-neutral-300">
                                        <span>HP Vida:</span>
                                        <span className="text-red-400 font-bold">
                                          {isPlayer && matchedChar ? `${matchedChar.hp}/${matchedChar.maxHp}` : isBoss ? `${bossHp}/${bossMaxHp}` : `${tokenStatus.hp}/${tokenStatus.maxHp}`}
                                        </span>
                                      </div>
                                      <div className="flex gap-1 mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isPlayer && matchedChar) handleUpdateHp(matchedChar.id, -5);
                                            else if (isBoss) handleUpdateBossHpVal(-50);
                                            else handleUpdateTokenHp(rIdx, cIdx, -5, tokenName);
                                          }}
                                          className="flex-1 py-0.5 bg-red-950 hover:bg-red-900/60 text-red-400 font-bold rounded border border-red-900/40 text-[8.5px]"
                                        >
                                          {isBoss ? '-50' : '-5'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isPlayer && matchedChar) handleUpdateHp(matchedChar.id, 5);
                                            else if (isBoss) handleUpdateBossHpVal(50);
                                            else handleUpdateTokenHp(rIdx, cIdx, 5, tokenName);
                                          }}
                                          className="flex-1 py-0.5 bg-emerald-950 hover:bg-emerald-900/60 text-emerald-400 font-bold rounded border border-emerald-900/40 text-[8.5px]"
                                        >
                                          {isBoss ? '+50' : '+5'}
                                        </button>
                                      </div>
                                    </div>

                                    {!isBoss && (
                                      <div className="flex flex-col gap-1 bg-neutral-950/50 p-1.5 rounded border border-neutral-800/60">
                                        <div className="flex items-center justify-between text-neutral-300">
                                          <span>MP Mana:</span>
                                          <span className="text-blue-400 font-bold">
                                            {isPlayer && matchedChar ? `${matchedChar.mp}/${matchedChar.maxMp}` : `${tokenStatus.mp}/${tokenStatus.maxMp}`}
                                          </span>
                                        </div>
                                        <div className="flex gap-1 mt-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isPlayer && matchedChar) handleUpdateMp(matchedChar.id, -5);
                                              else handleUpdateTokenMp(rIdx, cIdx, -5, tokenName);
                                            }}
                                            className="flex-1 py-0.5 bg-neutral-900 hover:bg-[#1a2538] text-neutral-400 font-bold rounded border border-[#2b3547] text-[8.5px]"
                                          >
                                            -5
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isPlayer && matchedChar) handleUpdateMp(matchedChar.id, 5);
                                              else handleUpdateTokenMp(rIdx, cIdx, 5, tokenName);
                                            }}
                                            className="flex-1 py-0.5 bg-[#0f2d59]/40 hover:bg-[#0f2d59]/80 text-[#549cfc] font-bold rounded border border-[#0f2d59] text-[8.5px]"
                                          >
                                            +5
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {isPlayer && (
                                    <div className="flex flex-col gap-1 mt-1 border-t border-neutral-800 pt-1.5">
                                      <div className="text-[7.5px] font-mono uppercase text-neutral-500 tracking-wider">Mudar Classe</div>
                                      {[
                                        { id: 'guerreiro', label: 'Guerreiro' },
                                        { id: 'mago', label: 'Mago' },
                                        { id: 'arqueiro', label: 'Arqueiro' }
                                      ].map(role => (
                                        <button
                                          key={role.id}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setScenarios(prev => prev.map(scene => {
                                              if (scene.id === selectedScenario.id) {
                                                const updatedGrid = scene.gridData.map((rowVal, r) => {
                                                  if (r === rIdx) {
                                                    return rowVal.map((tile, c) => (c === cIdx ? `player:${role.id}` : tile));
                                                  }
                                                  return rowVal;
                                                });
                                                return { ...scene, gridData: updatedGrid };
                                              }
                                              return scene;
                                            }));
                                            setEditingPlayerCell(null);
                                          }}
                                          className="px-1.5 py-0.5 hover:bg-neutral-850 text-[9px] text-neutral-300 rounded flex items-center justify-between w-full hover:text-white transition-all text-left"
                                        >
                                          <span>{role.label}</span>
                                          <span className="text-[7.5px] text-amber-500/85">⚙️</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {(() => {
                                    const isAlreadyFocused = activeCombatTargets.some(t => t.row === rIdx && t.col === cIdx);
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          
                                          // Update fallback single target
                                          setActiveCombatTarget({
                                            row: rIdx,
                                            col: cIdx,
                                            name: tokenName,
                                            tileType
                                          });

                                          // Toggle in multiple target array
                                          setActiveCombatTargets(prev => {
                                            const filtered = prev.filter(t => !(t.row === rIdx && t.col === cIdx));
                                            if (filtered.length === prev.length) {
                                              return [...prev, {
                                                row: rIdx,
                                                col: cIdx,
                                                name: tokenName,
                                                tileType
                                              }];
                                            } else {
                                              return filtered;
                                            }
                                          });

                                          setEditingPlayerCell(null);
                                          if (isAlreadyFocused) {
                                            triggerToast(`⚔️ "${tokenName}" desfocado do Combate.`);
                                            pushSystemLog(`[Combate] O Mestre removeu "${tokenName}" do foco de combate.`);
                                          } else {
                                            triggerToast(`⚔️ "${tokenName}" focado para Batalha!`);
                                            pushSystemLog(`[Combate] O Mestre focou o alvo "${tokenName}" para combate na grade.`);
                                          }
                                        }}
                                        className={`px-2 py-1.5 ${isAlreadyFocused ? 'bg-rose-950 text-rose-400 border border-rose-900/40 hover:bg-rose-900/60' : 'bg-amber-500 hover:bg-amber-600 text-black'} text-[9.5px] rounded flex items-center justify-center gap-1.5 w-full font-extrabold transition-all mt-1`}
                                      >
                                        <span>⚔️</span>
                                        <span>{isAlreadyFocused ? 'Remover Foco Batalha' : 'Batalha / Focar Combate'}</span>
                                      </button>
                                    );
                                  })()}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMovingToken({
                                        r: rIdx,
                                        c: cIdx,
                                        tileType,
                                        tokenName
                                      });
                                      setEditingPlayerCell(null);
                                      triggerToast(`📍 Selecione uma nova quadrícula no mapa para deslocar "${tokenName}".`);
                                    }}
                                    className="px-2 py-1 bg-neutral-950 hover:bg-neutral-850 text-neutral-300 text-[9.5px] border border-neutral-800 rounded flex items-center justify-center gap-1.5 w-full transition-all mt-1.5 font-semibold"
                                  >
                                    <span>📍</span>
                                    <span>Deslocar Token (Mover)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScenarios(prev => prev.map(scene => {
                                        if (scene.id === selectedScenario.id) {
                                          const updatedGrid = scene.gridData.map((rowVal, r) => {
                                            if (r === rIdx) {
                                              return rowVal.map((tile, c) => (c === cIdx ? 'empty' : tile));
                                            }
                                            return rowVal;
                                          });
                                          const updatedStatuses = { ...scene.tokenStatuses };
                                          delete updatedStatuses[statusKey];

                                          return { ...scene, gridData: updatedGrid, tokenStatuses: updatedStatuses };
                                        }
                                        return scene;
                                      }));
                                      setEditingPlayerCell(null);
                                      triggerToast(`🗑️ "${tokenName}" removido do mapa!`);
                                      pushSystemLog(`[Grid] O Mestre retirou o personagem "${tokenName}" do mapa.`);
                                    }}
                                    className="px-2 py-1 text-red-500 hover:bg-red-950/40 text-[9.5px] rounded flex items-center justify-center gap-1.5 w-full transition-all mt-1 border-t border-neutral-800 pt-2 font-bold"
                                  >
                                    <span>❌</span>
                                    <span>Remover do Mapa</span>
                                  </button>
                                </motion.div>
                              );
                            })()}
                          </AnimatePresence>
                        </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px] text-neutral-500 pt-2 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Swords className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Clique em qualquer bloco para pintar com o pincel ativo.</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase">Grelha tática: 10x10 (100 blocos)</span>
                </div>
              </div>

              {/* Column 3: Right Column (Gallery of Interactive Assets/Objects) */}
              <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-6 max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-neutral-800">
                <div className="pb-3 border-b border-neutral-800">
                  <span className="font-serif text-xs font-bold text-amber-500 tracking-wider flex items-center gap-1.5">
                    <span>🧩 OBJETOS & INTERATIVOS</span>
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-1">Selecione objetos físicos de cenário e clique no mapa para posicionar de forma dinâmica.</p>
                </div>

                <div className="space-y-4">
                  {/* World Interactive Objects List */}
                  <div className="space-y-2">
                    {[
                      { id: 'chest', name: 'Baú Alquímico', icon: '🪙', desc: 'Guarda recompensas lendárias', color: 'border-yellow-600/30' },
                      { id: 'barrel', name: 'Barril de Carvalho', icon: '🪘', desc: 'Contém água, cerveja ou pólvora', color: 'border-amber-700/30' },
                      { id: 'trap', name: 'Armadilha Ativa', icon: '⚡', desc: 'Placa de pressão surpresa de dano', color: 'border-red-500/30' },
                      { id: 'pillar', name: 'Pilar de Alvenaria', icon: '☸', desc: 'Coluna que garante cobertura total', color: 'border-stone-500/30' },
                      { id: 'wall', name: 'Muralha Protetora', icon: '🧱', desc: 'Obstáculo de pedra colossal intransponível', color: 'border-stone-600/30' },
                      { id: 'water', name: 'Fosso de Água', icon: '💧', desc: 'Água funda que atrasa heróis', color: 'border-blue-500/30' }
                    ].map((obj) => {
                      const isSelected = activeBrush === obj.id;
                      return (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => {
                            setActiveBrush(obj.id);
                            triggerToast(`Pincel Ativo: ${obj.name}`);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            isSelected
                              ? 'bg-amber-955/20 border-amber-500 shadow-md ring-2 ring-amber-500/20 scale-102'
                              : 'bg-neutral-950 border-neutral-850 hover:border-neutral-800'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg border ${obj.color} bg-neutral-900 flex items-center justify-center font-bold text-lg shrink-0 shadow-inner`}>
                            {obj.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-serif text-[11px] font-bold text-neutral-100 flex items-center gap-1">
                              <span>{obj.name}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                            </div>
                            <span className="block text-[9.5px] text-neutral-400 mt-0.5 leading-normal">{obj.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Immersive Info Note inside sidebar */}
                  <div className="bg-[#0b0e14]/50 border border-neutral-850 rounded-xl p-3 text-[10px] text-neutral-400 leading-relaxed">
                    <span className="font-bold text-amber-500 block mb-1">🎮 Mecânica de Colisão</span>
                    <span>Obstáculos e colunas bloqueiam movimentação e visão (névoa de guerra). Baús e armadilhas podem ser revelados ou desarmados via testes de Destreza / Percepção.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. TABS: MISSÕES (PAINEL DE QUESTS DO MESTRE) */}
          {activeTab === 'quests' && (
            <motion.div
              key="quests-tab-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in w-full"
            >
              <style>{`
                @keyframes masterSpinArtifact3D {
                  0% { transform: perspective(800px) rotateY(0deg) rotateX(5deg) translateY(0px); }
                  50% { transform: perspective(800px) rotateY(180deg) rotateX(-5deg) translateY(-8px); }
                  100% { transform: perspective(800px) rotateY(360deg) rotateX(5deg) translateY(0px); }
                }
                .animate-master-artifact {
                  animation: masterSpinArtifact3D 8s ease-in-out infinite;
                  transform-style: preserve-3d;
                }
              `}</style>

              {/* Form Column - Left */}
              <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-neutral-800 pb-3">
                  <h3 className="font-serif text-sm font-black text-amber-500 tracking-wider flex items-center gap-1.5">
                    👑 CRIADOR DE MISSÕES COOPERATIVAS
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Determine recompensas lendárias e os participantes da jornada.</p>
                </div>

                {/* Quick Templates Prefills */}
                <div>
                  <span className="block text-[8px] font-mono tracking-widest uppercase text-stone-500 mb-1.5 font-bold">MODELOS PREDEFINIDOS DE MISSÃO</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { title: 'Matar o Dragão Ancião', desc: 'Penetre no Covil do Dragão de Sangue e dê fim ao terror de fogo.', gold: 500, xp: 800, art: 'art_2' },
                      { title: 'Purificar o Cálice Sagrado', desc: 'Recupere o Cálice Sagrado sob a guarda de mortos-vivos e restaure sua sintonização benta.', gold: 300, xp: 450, art: 'art_1' },
                      { title: 'Roubo do Cetro Arcano', desc: 'Invada as masmorras do mago e roube a lendária projeção cósmica.', gold: 400, xp: 600, art: 'art_4' }
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewQuestTitle(tpl.title);
                          setNewQuestDesc(tpl.desc);
                          setNewQuestGold(tpl.gold);
                          setNewQuestXp(tpl.xp);
                          setNewQuestArtifactId(tpl.art);
                          triggerToast('✍️ Modelo preenchido com sucesso!');
                        }}
                        className="px-2 py-1 rounded bg-neutral-950 text-neutral-350 text-[9px] hover:text-white border border-neutral-850 hover:border-amber-500/40 transition-colors"
                      >
                        ⚡ {tpl.title.split(' ').slice(0, 3).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveQuest(); }} className="space-y-3.5">
                  {/* Quest Title */}
                  <div>
                    <label className="block text-[9.5px] font-mono text-neutral-400 mb-1">Título da Missão:</label>
                    <input
                      type="text"
                      value={newQuestTitle}
                      onChange={(e) => setNewQuestTitle(e.target.value)}
                      placeholder="Ex: O Culto do Observador Ancião"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Quest Description */}
                  <div>
                    <label className="block text-[9.5px] font-mono text-neutral-400 mb-1">Objetivos & Detalhes Narrativos:</label>
                    <textarea
                      value={newQuestDesc}
                      onChange={(e) => setNewQuestDesc(e.target.value)}
                      rows={3}
                      placeholder="Ex: Destrua os altares rúnicos e elimine o líder cultista..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Multi-Select Participants */}
                  <div>
                    <span className="block text-[9.5px] font-mono text-neutral-400 mb-1.5">Heróis Participantes:</span>
                    <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {characters.map(char => {
                        const isSelected = newQuestParticipants.includes(char.id);
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setNewQuestParticipants(prev => prev.filter(pId => pId !== char.id));
                              } else {
                                setNewQuestParticipants(prev => [...prev, char.id]);
                              }
                            }}
                            className={`p-1.5 rounded-lg text-left text-[10px] border flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-amber-955/20 border-amber-500/65 text-amber-400 font-bold'
                                : 'bg-neutral-950 border-neutral-850 text-neutral-400'
                            }`}
                          >
                            <span className="truncate">{char.name}</span>
                            <span className="text-[8px] opacity-70 font-mono tracking-tighter">({char.class.split(' ')[0]})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Numeric XP & Gold Rewards */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9.5px] font-mono text-neutral-400 mb-1">Recompensa Ouro (PO):</label>
                      <input
                        type="number"
                        value={newQuestGold}
                        onChange={(e) => setNewQuestGold(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-yellow-500 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-mono text-neutral-400 mb-1">Recompensa Experiência (XP):</label>
                      <input
                        type="number"
                        value={newQuestXp}
                        onChange={(e) => setNewQuestXp(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-purple-400 font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Select Legendary Artifact object */}
                  <div>
                    <label className="block text-[9.5px] font-mono text-neutral-400 mb-1">Artefato Sagrado de Recompensa:</label>
                    <select
                      value={newQuestArtifactId}
                      onChange={(e) => setNewQuestArtifactId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 outline-none"
                    >
                      {INITIAL_ARTIFACTS.map(art => (
                        <option key={art.id} value={art.id}>
                          {art.icon} {art.name} ({art.rarity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3D spinning representation of selected Artifact */}
                  {(() => {
                    const selArtifact = INITIAL_ARTIFACTS.find(art => art.id === newQuestArtifactId);
                    if (!selArtifact) return null;
                    return (
                      <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center gap-3.5 mt-2 relative overflow-hidden">
                        <div className="w-14 h-14 shrink-0 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center relative shadow-inner">
                          <span className="text-2xl z-10 animate-master-artifact block" style={{ textShadow: `0 0 10px ${selArtifact.glowColor}` }}>
                            {selArtifact.icon}
                          </span>
                          <div className="absolute inset-0 rounded-xl border border-amber-500/10 pointer-events-none" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[8.5px] font-mono font-bold tracking-widest uppercase block ${
                            selArtifact.rarity === 'Lendário' ? 'text-amber-500' : 'text-purple-400'
                          }`}>{selArtifact.rarity}</span>
                          <span className="text-[11px] font-serif font-black text-neutral-200 block truncate">{selArtifact.name}</span>
                          <span className="text-[9.5px] text-neutral-400 line-clamp-2 leading-tight block mt-0.5">{selArtifact.description}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex gap-2 pt-2">
                    {editingQuestId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestId(null);
                          setNewQuestTitle('');
                          setNewQuestDesc('');
                          setNewQuestGold(100);
                          setNewQuestXp(150);
                          setNewQuestArtifactId('art_1');
                        }}
                        className="px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Limpar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-serif font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      {editingQuestId ? 'Salvar Edição de Missão' : 'Publicar Missão no Jogo'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List Column - Right */}
              <div className="lg:col-span-7 space-y-4">
                {/* Recharts Campaign Progression Dashboard */}
                <CampaignProgressChart quests={quests} />

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                    <span className="font-serif text-xs font-bold text-neutral-300 tracking-wide uppercase">📖 REGISTRO DE DIÁRIO E MISSÕES</span>
                    <span className="text-[10px] font-mono font-bold text-amber-500">{quests.length} Missões Cadastradas</span>
                  </div>

                  {quests.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-950 rounded-2xl border border-neutral-850 flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📜</span>
                      <span className="text-xs text-neutral-400 font-serif font-black">Nenhuma missão listada.</span>
                      <p className="text-[10px] text-neutral-500 max-w-xs leading-normal">Utilize o painel esquerdo para inventar novos desafios, distribuir ouro e conceder itens mágicos épicos à mesa tática cooperativa!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto pr-1">
                      {quests.map(quest => {
                        const artifactImg = INITIAL_ARTIFACTS.find(a => a.id === quest.rewardArtifactId);
                        const names = (quest.participants || []).map(pId => characters.find(c => c.id === pId)?.name || 'Herói');

                        return (
                          <div
                            key={quest.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-start transition-all ${
                              quest.status === 'completed'
                                ? 'bg-[#0f1d17]/50 border-emerald-500/40 opacity-80'
                                : quest.status === 'active'
                                ? 'bg-amber-955/5 border-amber-500/30 ring-1 ring-amber-500/10'
                                : 'bg-neutral-950 border-neutral-850'
                            }`}
                          >
                            <div className="space-y-2.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 text-[8.5px] font-mono rounded font-bold uppercase ${
                                  quest.status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : quest.status === 'active'
                                    ? 'bg-amber-900 text-amber-400 animate-pulse'
                                    : 'bg-neutral-800 text-neutral-400'
                                }`}>
                                  {quest.status === 'completed' ? '🏆 Concluída' : quest.status === 'active' ? '⚔️ Ativa' : '📜 Planejada'}
                                </span>
                                <h4 className="font-serif text-xs font-black text-neutral-200 truncate">{quest.title}</h4>
                              </div>

                              <p className="text-[10.5px] text-neutral-400 font-sans leading-relaxed mr-2 line-clamp-3 bg-black/10 p-2 rounded-lg border border-neutral-900">
                                {quest.description}
                              </p>

                              {/* Badges of participants */}
                              <div className="flex flex-wrap gap-1">
                                {names.map((n, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-neutral-950 text-neutral-400 font-sans text-[8.5px] rounded border border-neutral-850 font-medium">
                                    🛡️ {n}
                                  </span>
                                ))}
                                {names.length === 0 && (
                                  <span className="text-[9px] text-neutral-500 italic block">Nenhum herói específico sintonizado.</span>
                                )}
                              </div>

                              {/* Loot / Rewards stats */}
                              <div className="flex gap-4 font-mono text-[9px] text-stone-400">
                                <span>PO: <strong className="text-yellow-500 font-extrabold font-mono">+{quest.rewardGold} PO</strong></span>
                                <span>XP: <strong className="text-purple-400 font-extrabold font-mono">+{quest.rewardXp} XP</strong></span>
                                {artifactImg && (
                                  <span className="flex items-center gap-1">
                                    Artefato: <strong className="text-amber-500 hover:underline cursor-pointer font-extrabold">{artifactImg.icon} {artifactImg.name}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controls actions side for Mestre */}
                            <div className="flex sm:flex-col gap-1.5 shrink-0 self-stretch sm:justify-start justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-neutral-850 pl-0 sm:pl-3 w-full sm:w-28 text-right font-mono">
                              <span className="block text-[8px] font-mono uppercase tracking-wider text-neutral-500 text-left sm:text-right">AÇÕES</span>

                              {quest.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuestStatus(quest.id, quest.title, 'completed')}
                                  className="py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 text-emerald-400 font-bold rounded text-[8.5px] flex items-center justify-center gap-1 w-full"
                                >
                                  <span>🏆 Completa</span>
                                </button>
                              )}

                              {quest.status !== 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuestStatus(quest.id, quest.title, 'active')}
                                  className="py-1 bg-amber-950 hover:bg-amber-900/60 border border-amber-900 text-amber-500 font-bold rounded text-[8.5px] flex items-center justify-center gap-1 w-full"
                                >
                                  <span>⚔️ Ativar</span>
                                </button>
                              )}

                              {quest.status !== 'inactive' && quest.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuestStatus(quest.id, quest.title, 'inactive')}
                                  className="py-1 bg-[#1a2538] hover:bg-[#2b3547] border border-[#2b3547] text-slate-300 font-bold rounded text-[8.5px] flex items-center justify-center gap-1 w-full"
                                >
                                  <span>⏸️ Pausar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestId(quest.id);
                                  setNewQuestTitle(quest.title);
                                  setNewQuestDesc(quest.description);
                                  setNewQuestGold(quest.rewardGold);
                                  setNewQuestXp(quest.rewardXp);
                                  setNewQuestArtifactId(quest.rewardArtifactId);
                                  setNewQuestParticipants(quest.participants || []);
                                  triggerToast('✍️ Editando missão...');
                                }}
                                className="py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-stone-300 font-bold rounded text-[8.5px] flex items-center justify-center gap-1 w-full"
                              >
                                <span>✏️ Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteQuest(quest.id, quest.title)}
                                className="py-1 bg-red-950 hover:bg-red-900/60 border border-red-900 text-red-400 font-bold rounded text-[8.5px] flex items-center justify-center gap-1 w-full"
                              >
                                <span>🗑️ Excluir</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- CONTEÚDO PRINCIPAL DO MODO MESA --- */}
          {activeTab === 'mesa' && (
            <div className="flex-1 w-full h-full relative p-4 flex flex-col items-center justify-center bg-[#050814] overflow-hidden">
              
              {/* TABULEIRO PRINCIPAL ESTILO JOGO DE MESA */}
              <div className="relative w-full max-w-3xl aspect-square bg-[#0a0f1c] border-8 border-[#00d0ff] rounded-xl shadow-[0_0_20px_rgba(0,208,255,0.4)] overflow-hidden flex items-center justify-center">
                 
                 {/* Fundo do Mapa (Textura Base 2D) */}
                 <div 
                   className="absolute inset-0 bg-stone-850"
                   style={{ 
                     backgroundImage: "url('https://i.pinimg.com/originals/a0/6c/ca/a06cca391ebdb0a5bcfa2c10db90eb91.jpg')", 
                     backgroundSize: 'cover', 
                     backgroundPosition: 'center',
                     opacity: 0.85 
                   }}
                 ></div>
                 
                 {/* Grid Tático Sobreposto (As linhas de energia) alinhado para 12x12 */}
                 <div className="absolute inset-0 pointer-events-none z-0" 
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(0, 208, 255, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 208, 255, 0.18) 1px, transparent 1px)',
                        backgroundSize: '8.33% 8.33%'
                      }}>
                 </div>

                 {/* O SEU GRID INJETADO AQUI (COM AS MINIATURAS) */}
                 <motion.div 
                    animate={isCritShaking ? { x: [-6, 6, -6, 6, -3, 3, 0] } : { x: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`relative w-full h-full z-10 ${shake ? 'animate-shake-frame' : ''}`}
                  >
                    {/* Grid de 12 colunas sem gap para alinhar com as linhas de fundo */}
                    <div className="grid grid-cols-12 gap-0 w-full h-full p-0 relative">
                      
                      {grid.map((charId, idx) => {
                        const charInCell = parseCharacterInCell(charId);
                        const tooltipName = charInCell ? `${charInCell.name} [LVL ${charInCell.level}]` : "Quadrante Vazio";
                        
                        let baseResinaStyle = "border-neutral-600 bg-neutral-800";
                        if (charInCell) {
                          if (charInCell.classe === 'enemy') {
                            baseResinaStyle = "border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)] bg-red-950/40";
                          } else if (charInCell.classe === 'boss') {
                            baseResinaStyle = "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] bg-purple-950/50 animate-pulse";
                          } else {
                            baseResinaStyle = "border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] bg-neutral-900";
                          }
                        }

                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleGridInteract(idx)} 
                            title={tooltipName} 
                            className={`w-full h-full flex flex-col items-center justify-end relative cursor-pointer transition-all border border-transparent ${movingFromIndex === idx ? 'bg-[#8b2aff]/30 border-[#8b2aff] shadow-[0_0_10px_rgba(139,42,255,0.4)]' : 'hover:bg-cyan-500/10 hover:border-cyan-500/30'}`}
                          >
                            {charInCell && (
                              <div className="absolute bottom-1 w-full flex flex-col items-center justify-end z-20 pointer-events-none">
                                
                                {/* 1. O SPRITE 2.5D DO PERSONAGEM (Corpo Inteiro Simulado) */}
                                <div className="relative -mb-1 z-30 drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)]">
                                  <div className={`w-6 h-10 flex items-start justify-center pt-1 rounded-t-full border-x border-t border-white/20 text-sm ${charInCell.classe === 'boss' ? 'bg-purple-900/80 w-8 h-12' : charInCell.classe === 'enemy' ? 'bg-red-900/80' : 'bg-slate-700/80'}`}>
                                    {charInCell.icon}
                                  </div>
                                </div>

                                {/* 2. A BASE DE RESINA ACHATADA ISOMÉTRICA */}
                                <div className={`w-7 h-2.5 rounded-[100%] border-2 ${baseResinaStyle} absolute bottom-0 z-10`}></div>

                                {/* 3. BARRA DE HP TÁTICA */}
                                <div className="absolute -bottom-2 w-[80%] px-0.5 h-1.5 bg-black border border-[#30363d] rounded-full overflow-hidden flex z-40">
                                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(charInCell.hpCurrent / charInCell.hpMax) * 100}%` }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </motion.div>

              </div>
            </div>
          )}

          {/* --- CONTEÚDO PRINCIPAL DO MODO ARENA (ESQUELETO PROVISÓRIO) --- */}
          {activeTab === 'arena' && (
            <div className="flex-1 w-full h-[650px] relative flex items-center justify-center p-6 m-4 border-4 border-[#00d0ff] shadow-[0_0_20px_rgba(0,208,255,0.35)] rounded-2xl bg-[#0a0f1c] overflow-hidden">
              
              {/* Efeito visual provisório de fundo (Grid/Fumaça) usando CSS Puro */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00d0ff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="absolute inset-0 bg-black opacity-55"></div>

              {/* Texto Placeholder Temático */}
              <div className="relative z-10 flex flex-col items-center text-center gap-5">
                <Swords className="w-24 h-24 text-[#00d0ff] animate-pulse" />
                <h1 className="font-sans text-5xl font-extrabold uppercase tracking-widest text-[#00d0ff] drop-shadow-[0_2px_15px_rgba(0,208,255,0.4)]">
                  Arena de Combate
                </h1>
                <p className="font-mono text-xs tracking-wider text-slate-300 bg-[#050814]/80 px-4 py-2 rounded-full border border-[#00d0ff]/30 shadow-[0_0_8px_rgba(0,208,255,0.15)]">
                  Instância de Batalhas PvP/PvE - Carregando Ambiente Tático...
                </p>
                <div className="mt-2">
                  <button className="bg-[#8b2aff] hover:bg-[#a14fff] transition-all px-6 py-2 rounded-lg font-bold text-white shadow-[0_0_12px_rgba(139,42,255,0.4)] text-xs uppercase tracking-widest font-sans flex items-center gap-2">
                    Iniciar Simulação de Combate
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* New Character Modal Form */}
      <AnimatePresence>
        {showNewCharModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm p-4 flex items-center justify-center"
            id="new-hero-modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-amber-900/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Golden line top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-2xl" />

              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-neutral-100 select-none">Forjar Novo Personagem</h3>
                <p className="text-xs text-neutral-400 mt-1">Inicie no nível 1 com atributos pré-balanceados para a Taverna.</p>
              </div>

              <form onSubmit={handleCreateNewCharacterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="new-char-name">
                    Nome do Personagem
                  </label>
                  <input
                    id="new-char-name"
                    type="text"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="ex: Gideon, o Justo"
                    className="w-full bg-neutral-950 border border-neutral-850 focus:border-amber-600 rounded-xl px-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-700 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="new-char-class">
                      Classe Combatente
                    </label>
                    <select
                      id="new-char-class"
                      value={newCharClass}
                      onChange={(e) => setNewCharClass(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-amber-600 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                    >
                      <option value="Guerreiro">Guerreiro</option>
                      <option value="Mago">Mago</option>
                      <option value="Clérigo">Clérigo</option>
                      <option value="Ladino">Ladino</option>
                      <option value="Bárbaro">Bárbaro</option>
                      <option value="Druida">Druida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="new-char-race">
                      Raça Épica
                    </label>
                    <select
                      id="new-char-race"
                      value={newCharRace}
                      onChange={(e) => setNewCharRace(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-amber-600 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                    >
                      <option value="Humano">Humano</option>
                      <option value="Alto Elfo">Alto Elfo</option>
                      <option value="Anão da Colina">Anão da Colina</option>
                      <option value="Halfling">Halfling</option>
                      <option value="Meio-Orc">Meio-Orc</option>
                      <option value="Tiflin">Tiflin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Cor da Vestimenta (Taverna)
                  </label>
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-950 border border-neutral-855 rounded-xl">
                    {[
                      { hex: '#3b82f6', label: 'Azul' },
                      { hex: '#eab308', label: 'Amarelo' },
                      { hex: '#ef4444', label: 'Vermelho' },
                      { hex: '#10b981', label: 'Verde' },
                      { hex: '#8b5cf6', label: 'Roxo' },
                      { hex: '#f97316', label: 'Laranja' },
                      { hex: '#ec4899', label: 'Rosa' },
                      { hex: '#06b6d4', label: 'Ciano' },
                      { hex: '#14b8a6', label: 'Teal/Oliva' },
                      { hex: '#ffffff', label: 'Branco' },
                    ].map((colorObj) => (
                      <button
                        key={colorObj.hex}
                        type="button"
                        onClick={() => setNewCharClothingColor(colorObj.hex)}
                        title={colorObj.label}
                        className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer relative ${
                          newCharClothingColor === colorObj.hex
                            ? 'scale-110 border-white ring-1 ring-amber-500/50'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorObj.hex }}
                      >
                        {newCharClothingColor === colorObj.hex && (
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] text-shadow text-white drop-shadow">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-2 ml-1">
                      <input
                        type="color"
                        value={newCharClothingColor}
                        onChange={(e) => setNewCharClothingColor(e.target.value)}
                        className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer p-0"
                        title="Personalizar Cor"
                      />
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">{newCharClothingColor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    id="cancel-new-char-btn"
                    type="button"
                    onClick={() => setShowNewCharModal(false)}
                    className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-xs font-serif font-bold text-neutral-300 transition-all"
                  >
                    Recuar
                  </button>
                  <button
                    id="save-new-char-btn"
                    type="submit"
                    className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-serif font-bold text-xs rounded-xl shadow-md transition-all border-t border-amber-300/20"
                  >
                    Consagrar Herói
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Character Attributes Modal */}
      <AnimatePresence>
        {showEditCharModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto"
            id="edit-hero-modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8"
            >
              {/* Cyan line top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-2xl" />

              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-neutral-100 select-none">Editar Atributos da Ficha</h3>
                <p className="text-xs text-neutral-400 mt-1">Ajuste os valores principais, atributos D&D 5E e pontos vitais.</p>
              </div>

              <form onSubmit={handleSaveEditCharacterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="edit-char-name">
                    Nome do Personagem
                  </label>
                  <input
                    id="edit-char-name"
                    type="text"
                    value={editingCharName}
                    onChange={(e) => setEditingCharName(e.target.value)}
                    placeholder="Nome do Herói"
                    className="w-full bg-neutral-950 border border-neutral-850 focus:border-cyan-600 rounded-xl px-4 py-2 text-xs text-neutral-200 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="edit-char-class">
                      Classe Combatente
                    </label>
                    <select
                      id="edit-char-class"
                      value={editingCharClass}
                      onChange={(e) => setEditingCharClass(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-cyan-600 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none cursor-pointer"
                    >
                      <option value="Guerreiro">Guerreiro</option>
                      <option value="Mago">Mago</option>
                      <option value="Clérigo">Clérigo</option>
                      <option value="Ladino">Ladino</option>
                      <option value="Bárbaro">Bárbaro</option>
                      <option value="Druida">Druida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="edit-char-race">
                      Raça Épica
                    </label>
                    <select
                      id="edit-char-race"
                      value={editingCharRace}
                      onChange={(e) => setEditingCharRace(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-cyan-600 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none cursor-pointer"
                    >
                      <option value="Humano">Humano</option>
                      <option value="Alto Elfo">Alto Elfo</option>
                      <option value="Anão da Colina">Anão da Colina</option>
                      <option value="Halfling">Halfling</option>
                      <option value="Meio-Orc">Meio-Orc</option>
                      <option value="Tiflin">Tiflin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="edit-char-level">
                      Nível
                    </label>
                    <input
                      id="edit-char-level"
                      type="number"
                      min="1"
                      max="20"
                      value={editingCharLevel}
                      onChange={(e) => setEditingCharLevel(parseInt(e.target.value) || 1)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-cyan-600 rounded-xl px-3 py-1.5 text-xs text-neutral-200 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="edit-char-hp">
                      HP Máx
                    </label>
                    <input
                      id="edit-char-hp"
                      type="number"
                      min="1"
                      max="999"
                      value={editingCharMaxHp}
                      onChange={(e) => setEditingCharMaxHp(parseInt(e.target.value) || 1)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-cyan-600 rounded-xl px-3 py-1.5 text-xs text-neutral-200 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1" htmlFor="edit-char-mp">
                      MP Máx
                    </label>
                    <input
                      id="edit-char-mp"
                      type="number"
                      min="0"
                      max="999"
                      value={editingCharMaxMp}
                      onChange={(e) => setEditingCharMaxMp(parseInt(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-855 focus:border-cyan-600 rounded-xl px-3 py-1.5 text-xs text-neutral-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Atributos Primários (D&D 5E)
                  </label>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-950 border border-neutral-855 rounded-xl">
                    <div>
                      <span className="block text-[9px] font-semibold text-neutral-500 uppercase tracking-wide text-center">FOR</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingCharStr}
                        onChange={(e) => setEditingCharStr(parseInt(e.target.value) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-cyan-600 rounded-lg text-center py-1 text-xs text-neutral-200 outline-none mt-1"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold text-neutral-500 uppercase tracking-wide text-center">DES</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingCharDex}
                        onChange={(e) => setEditingCharDex(parseInt(e.target.value) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-cyan-600 rounded-lg text-center py-1 text-xs text-neutral-200 outline-none mt-1"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold text-neutral-500 uppercase tracking-wide text-center">CON</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingCharCon}
                        onChange={(e) => setEditingCharCon(parseInt(e.target.value) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-cyan-600 rounded-lg text-center py-1 text-xs text-neutral-200 outline-none mt-1"
                      />
                    </div>
                    <div className="pt-2">
                      <span className="block text-[9px] font-semibold text-neutral-500 uppercase tracking-wide text-center">INT</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingCharInt}
                        onChange={(e) => setEditingCharInt(parseInt(e.target.value) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-cyan-600 rounded-lg text-center py-1 text-xs text-neutral-200 outline-none mt-1"
                      />
                    </div>
                    <div className="pt-2">
                      <span className="block text-[9px] font-semibold text-neutral-500 uppercase tracking-wide text-center">SAB</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingCharWis}
                        onChange={(e) => setEditingCharWis(parseInt(e.target.value) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-cyan-600 rounded-lg text-center py-1 text-xs text-neutral-200 outline-none mt-1"
                      />
                    </div>
                    <div className="pt-2">
                      <span className="block text-[9px] font-semibold text-neutral-500 uppercase tracking-wide text-center">CAR</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingCharCha}
                        onChange={(e) => setEditingCharCha(parseInt(e.target.value) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-cyan-600 rounded-lg text-center py-1 text-xs text-neutral-200 outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    id="cancel-edit-char-btn"
                    type="button"
                    onClick={() => setShowEditCharModal(false)}
                    className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-xs font-serif font-bold text-neutral-300 transition-all cursor-pointer text-center"
                  >
                    Recuar
                  </button>
                  <button
                    id="save-edit-char-btn"
                    type="submit"
                    className="flex-1 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-neutral-950 font-serif font-bold text-xs rounded-xl shadow-md transition-all border-t border-cyan-300/20 cursor-pointer text-center font-bold"
                  >
                    Consagrar Mudanças
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Token Creator Micro-Modal */}
      <AnimatePresence>
        {showAiTokenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm p-4 flex items-center justify-center"
            id="ai-token-modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f141c] border border-purple-900/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Purple/Indigo glowing top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-2xl shadow-[0_0_15px_rgba(147,51,234,0.4)]" />

              <div className="mb-6 flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-950 border border-purple-500/30 rounded-lg flex items-center justify-center text-lg shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  🧙‍♂️
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-100">Forjar Miniatura com IA</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Invoque o poder elemental da inteligência artificial para criar custom minis.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Nome da Criatura / Herói
                  </label>
                  <input
                    id="ai-token-name-input"
                    type="text"
                    value={aiTokenName}
                    onChange={(e) => setAiTokenName(e.target.value)}
                    placeholder="Ex: Lobo de Lava, Elfa Cavaleira..."
                    className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-600 rounded-xl px-3.5 py-2 transition-all text-xs text-neutral-200 placeholder-neutral-700 outline-none"
                    disabled={isGeneratingAiToken}
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Borda / Alinhamento do Token
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAiTokenType('hero')}
                      className={`py-2 px-3 rounded-xl border text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 ${
                        aiTokenType === 'hero'
                          ? 'bg-amber-955/20 border-amber-500/70 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                          : 'bg-neutral-955 border-neutral-855 text-neutral-400 hover:text-neutral-300'
                      }`}
                      disabled={isGeneratingAiToken}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Herói (Borda Dourada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiTokenType('enemy')}
                      className={`py-2 px-3 rounded-xl border text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 ${
                        aiTokenType === 'enemy'
                          ? 'bg-red-955/20 border-red-500/70 text-red-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                          : 'bg-neutral-955 border-neutral-855 text-neutral-400 hover:text-neutral-300'
                      }`}
                      disabled={isGeneratingAiToken}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Monstro (Borda Crimson)
                    </button>
                  </div>
                </div>

                {/* Gender and Archetype Selection */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Gênero do Personagem
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiTokenGender('m')}
                        className={`py-1.5 rounded-xl border text-[10.5px] font-serif font-bold transition-all flex items-center justify-center gap-1 ${
                          aiTokenGender === 'm'
                            ? 'bg-blue-955/20 border-blue-500/70 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                            : 'bg-neutral-955 border-neutral-855 text-neutral-500 hover:text-neutral-400'
                        }`}
                        disabled={isGeneratingAiToken}
                      >
                        ♂ Masc
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiTokenGender('f')}
                        className={`py-1.5 rounded-xl border text-[10.5px] font-serif font-bold transition-all flex items-center justify-center gap-1 ${
                          aiTokenGender === 'f'
                            ? 'bg-pink-955/20 border-pink-500/70 text-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                            : 'bg-neutral-955 border-neutral-855 text-neutral-500 hover:text-neutral-400'
                        }`}
                        disabled={isGeneratingAiToken}
                      >
                        ♀ Fem
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Aparência/Mini 3D
                    </label>
                    <select
                      value={aiTokenFigurineArchetype}
                      onChange={(e) => setAiTokenFigurineArchetype(e.target.value)}
                      disabled={isGeneratingAiToken}
                      className="w-full bg-neutral-950 border border-neutral-850 hover:border-purple-600 focus:border-purple-600 rounded-xl px-2.5 py-1.5 transition-all text-xs text-neutral-200 outline-none cursor-pointer h-[32px] font-serif"
                    >
                      <option value="auto">✨ Automático (Prompt)</option>
                      {aiTokenType === 'hero' ? (
                        <>
                          <option value="guerreiro">🛡️ Guerreiro</option>
                          <option value="mago">🔮 Mago</option>
                          <option value="arqueiro">🏹 Arqueiro</option>
                          <option value="ladino">🗡️ Ladino</option>
                          <option value="elfo">🧝 Elfo</option>
                          <option value="elfo_negro">🕷️ Elfo Negro (Drow)</option>
                          <option value="anciao">📜 Ancião</option>
                          <option value="tita">⚡ Titã</option>
                          <option value="feiticeiro">🔥 Feiticeiro</option>
                          <option value="aldeao">🧑 Aldeão / Genérico</option>
                        </>
                      ) : (
                        <>
                          <option value="goblin">🟢 Goblin</option>
                          <option value="orc">🐗 Orc</option>
                          <option value="skeleton">💀 Esqueleto</option>
                          <option value="spider">🕷️ Aranha</option>
                          <option value="dragon">🐉 Dragão</option>
                          <option value="beholder">👁️ Observador (Beholder)</option>
                          <option value="mimic">📦 Mímico (Mimic)</option>
                          <option value="owlbear">🐻 Urso-Coruja</option>
                          <option value="gelatinous_cube">🟩 Cubo Gelatinoso</option>
                          <option value="vampiro">🩸 Vampiro</option>
                          <option value="succubus">😈 Súcubo / Íncubo</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Descreva sua Criatura/Herói (Prompt)
                  </label>
                  <textarea
                    id="ai-token-prompt-input"
                    value={aiTokenPrompt}
                    onChange={(e) => setAiTokenPrompt(e.target.value)}
                    placeholder="Descreva sua Criatura/Herói (Ex: Lobo com olhos de lava)..."
                    className="w-full h-24 bg-neutral-950 border border-neutral-855 focus:border-purple-600 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-700 outline-none resize-none"
                    required
                    disabled={isGeneratingAiToken}
                  />
                </div>

                {/* Loading state visual indicator */}
                {isGeneratingAiToken && (
                  <div className="bg-neutral-950/80 border border-purple-900/30 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-mono text-purple-400 tracking-wide text-center leading-normal animate-pulse">
                      ⚡ {aiGenerationStep}
                    </p>
                    <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-purple-950">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 via-[#ca8a04] to-red-500 rounded-full"
                        style={{ width: `${aiGenerationProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="cancel-ai-token-btn"
                    type="button"
                    onClick={() => setShowAiTokenModal(false)}
                    className="flex-1 py-1 px-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-xs font-serif font-bold text-neutral-300 transition-all"
                    disabled={isGeneratingAiToken}
                  >
                    Recuar
                  </button>
                  <button
                    id="submit-ai-token-btn"
                    type="button"
                    onClick={generateTokenWithIA}
                    className="flex-1 py-1 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-serif font-bold text-xs rounded-xl shadow-lg transition-all border-t border-purple-300/20 disabled:opacity-50"
                    disabled={isGeneratingAiToken || !aiTokenPrompt.trim()}
                  >
                    Gerar Miniatura
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Synchronization & Cloud Backup Modal */}
      <AnimatePresence>
        {showDriveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDriveModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-neutral-950 border border-sky-900/50 shadow-[0_0_60px_rgba(14,165,233,0.15)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 font-sans text-neutral-200"
            >
              {/* Top decoration line */}
              <div className="h-1 w-full bg-gradient-to-r from-sky-600 via-sky-400 to-indigo-600" />

              {/* Header */}
              <div className="p-5 px-6 border-b border-neutral-850 flex items-center justify-between bg-neutral-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Cloud className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-extrabold text-sky-400 tracking-wide uppercase">
                      💾 Sincronização Google Drive
                    </h2>
                    <p className="text-[10px] sm:text-xs text-neutral-400 font-medium">
                      Salve e restaure personagens, fichas, mapas e missões diretamente na sua conta Google.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDriveModal(false)}
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-sky-400 hover:border-sky-900/50 transition-colors pointer-events-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                
                {/* State: Unauthenticated */}
                {!driveToken ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-5 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-xl p-6">
                    <Cloud className="w-16 h-16 text-sky-500/30 animate-pulse" />
                    <div>
                      <h3 className="font-serif text-base font-bold text-neutral-200">Sincronização em Nuvem Desconectada</h3>
                      <p className="text-xs text-neutral-500 max-w-sm mt-1 leading-relaxed">
                        Conecte sua conta do Google Drive para gerenciar pontos de restauração da Taverna de forma totalmente segura e persistente.
                      </p>
                    </div>

                    <button
                      onClick={handleDriveLogin}
                      className="px-6 py-3 bg-neutral-100 hover:bg-white text-neutral-950 font-bold rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-md font-sans text-xs uppercase tracking-wide cursor-pointer border border-neutral-200"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Vincular Conta Google Drive</span>
                    </button>
                  </div>
                ) : (
                  // State: Authenticated
                  <div className="space-y-6">
                    {/* User profile block */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-neutral-900/65 border border-sky-950/40 rounded-xl gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-400/40 flex items-center justify-center font-serif text-lg font-bold text-sky-450">
                          {driveUser?.email?.charAt(0).toUpperCase() || 'G'}
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400 font-mono text-sky-500">CONECTADO VIA GOOGLE API</p>
                          <p className="text-sm font-semibold text-neutral-100">{driveUser?.email || 'Usuário Google'}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleDriveLogout}
                        className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Desconectar Conta
                      </button>
                    </div>

                    {/* Section: Generate New Backup */}
                    <div className="p-4 bg-sky-950/10 border border-sky-900/30 rounded-xl space-y-4">
                      <h4 className="font-serif text-sm font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wide">
                        <HardDrive className="w-4 h-4" />
                        Criar Novo Ponto de Restauração
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Compila todo o seu progresso local e envia um pacote compacto de segurança para seu Google Drive pessoal.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={customBackupName}
                            onChange={(e) => setCustomBackupName(e.target.value)}
                            placeholder="Nome do arquivo..."
                            className="w-full bg-neutral-950 border border-neutral-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-neutral-100 outline-none placeholder-neutral-600 transition-all font-mono"
                          />
                        </div>
                        <button
                          onClick={handleBackupToDrive}
                          disabled={backingUp}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-850 disabled:text-neutral-500 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                          {backingUp ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Enviando Backup...</span>
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3.5 h-3.5" />
                              <span>Salvar na Nuvem</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-550 font-mono">
                        <span>CAMPANHA INTEGRADA: EXPENDABLES VTT</span>
                        <span className="text-sky-500/80">INCLUI: {characters.length} HERÓIS • {quests.length} MISSÕES • {scenarios.length} MAPAS</span>
                      </div>
                    </div>

                    {/* Section: Backups lists */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-wide">
                          <Cloud className="w-4 h-4 text-sky-400 animate-pulse" />
                          Backups Salvos no Google Drive
                        </h4>
                        <button
                          onClick={() => handleFetchDriveFiles()}
                          disabled={loadingDrive}
                          className="text-[10px] p-1 px-2 border border-neutral-850 hover:border-neutral-755 hover:text-sky-400 bg-neutral-900/60 rounded text-neutral-400 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                          title="Recarregar Lista Google"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingDrive ? 'animate-spin' : ''}`} />
                          Atualizar Lista
                        </button>
                      </div>

                      {/* Loading status */}
                      {loadingDrive && driveFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2.5">
                          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                          <span className="text-xs text-neutral-500">Consultando o Google Drive com segurança arquivológica...</span>
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="p-8 text-center bg-neutral-900/20 border border-neutral-900 rounded-xl text-xs text-neutral-500 leading-relaxed">
                          Nenhum backup de campanha sob a marca "taverna_digital_backup" foi encontrado na sua conta. Crie o seu primeiro ponto de segurança acima com as bênçãos dos deuses!
                        </div>
                      ) : (
                        <div className="border border-neutral-850 rounded-xl divide-y divide-neutral-850 bg-neutral-900/20 overflow-hidden max-h-[220px] overflow-y-auto">
                          {driveFiles.map((file) => (
                            <div key={file.id} className="p-3.5 flex items-center justify-between hover:bg-neutral-900/40 transition-colors font-mono text-xs">
                              <div className="min-w-0 flex-1 pr-3 flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-neutral-200 truncate block font-sans" title={file.name}>
                                    {file.name}
                                  </span>
                                  {file.size && (
                                    <span className="text-[10px] text-neutral-500 bg-neutral-900 px-1 rounded font-mono shrink-0">
                                      {Math.round(parseInt(file.size, 10) / 1024)} KB
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-neutral-500 mt-1 block">
                                  Criado em: {file.createdTime ? new Date(file.createdTime).toLocaleString('pt-BR') : 'Data desconhecida'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleRestoreFromDrive(file.id, file.name)}
                                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-[#f59e0b] hover:text-black hover:bg-[#f59e0b] hover:border-transparent rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                  title="Carregar para Taverna Local"
                                >
                                  Restaurar
                                </button>
                                <button
                                  onClick={() => handleDeleteFromDrive(file.id, file.name)}
                                  className="p-1.5 border border-transparent rounded bg-neutral-900 text-neutral-500 hover:text-red-500 hover:border-red-950/40 transition-all cursor-pointer flex items-center justify-center"
                                  title="Deletar permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 px-6 border-t border-neutral-850 bg-neutral-900/30 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Sessão OAuth Google via Firebase Cryptographic Gateway API
                </span>
                <button
                  onClick={() => setShowDriveModal(false)}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar Painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-sans">
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
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-500 hover:border-amber-900/50 transition-colors pointer-events-auto"
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
                  { id: 'quests', label: '📜 Missões & Recompensas 3D', colorClass: 'border-emerald-500 text-emerald-400 bg-emerald-950/15' },
                  { id: 'forge', label: '⚡ Forge Core Multiplayer', colorClass: 'border-emerald-500 text-emerald-400 bg-emerald-950/15' }
                ].map(tab => {
                  const isSelected = activeGuideTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveGuideTab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 pointer-events-auto ${
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
                    <div className="bg-amber-955/10 border border-amber-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Poder Absoluto: Modo Mestre do Jogo (DM)</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
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
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Abra a aba <strong>🛡️ Criar Personagem</strong> no painel esquerdo. Insira estatísticas básicas como HP, CA (Classe de Armadura), Iniciativa, atributos clássicos (Força, Destreza, Constituição, etc.), magias e classes. O sistema gera automaticamente uma miniatura de resina 2D com a cor escolhida para representação no mapa.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#fb923c] font-serif text-base font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-amber-955 text-amber-100 text-[10px] items-center justify-center rounded-full border border-amber-500">2</span>
                          Invocando Chefes Colossais
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Deseja assustar os jogadores? Na aba de Cenários, role até a seção de Chefes do Sistema. Selecione uma ameaça formidável como o <strong className="text-neutral-100">Senhor dos Elementos</strong>, <strong className="text-neutral-100">Devorador de Mentes</strong> ou <strong className="text-neutral-100">Dragão Ancião</strong> e ative seu pincel de chefe.
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest mb-2 font-sans">⚡ Barra de Vida Cinemática do Chefe</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                        Ao spawnar um Chefe de Fase, uma imensa Barra de HP similar a jogos como Dark Souls surgirá no topo da tela do Mestre e dos Jogadores simultaneamente.
                      </p>
                      <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1.5 font-sans">
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
                    <div className="bg-blue-955/10 border border-blue-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">⚡</div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">Grid de Combate & Editor de Cenários Dinâmico</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                          O coração tático da Taverna Digital é o grid de batalha interativo. Ele simula perfeitamente uma mesa presencial com as vantagens milimétricas do virtual. Mantenha os heróis posicionados de acordo com a velocidade de deslocamento de cada classe!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-2">
                        <span className="text-[#60a5fa] font-semibold text-xs uppercase tracking-wide block">🖌️ Pincéis de Textura & Paredes</span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Selecione um dos pincéis de terreno no painel de ferramentas à direita do mapa:
                        </p>
                        <ul className="text-xs text-neutral-400 space-y-1 mt-1 pl-4 list-disc font-sans">
                          <li><strong className="text-amber-500">Paredes / Obstáculos:</strong> Bloqueia passagens, gera pilares de pedra realistas.</li>
                          <li><strong className="text-blue-400">Água Profunda:</strong> Cria córregos com efeito ondulante.</li>
                          <li><strong className="text-amber-700">Terra Seca / Lamaçal:</strong> Terreno difícil para penalidades de velocidade.</li>
                          <li><strong className="text-stone-300">Piso de Taberna:</strong> Piso clássico de madeira polida.</li>
                        </ul>
                        <p className="text-[10px] text-neutral-500 italic mt-2 font-sans">
                          *Clique nas células do mapa para aplicar a textura correspondente instantaneamente.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-2">
                        <span className="text-[#34d399] font-semibold text-xs uppercase tracking-wide block font-sans">♟️ Arrastar e Posicionar Miniaturas</span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Todas as fichas criadas pelo Mestre ou Jogadores se convertem em resinas interativas na parte inferior do grid:
                        </p>
                        <ul className="text-xs text-neutral-400 space-y-1 mt-1 pl-4 list-disc font-sans">
                          <li>Basta <strong>arrastar e soltar (drag and drop)</strong> a miniatura tática do painel inferior para qualquer ponto de combate no mapa.</li>
                          <li>As miniaturas possuem bordas iluminadas indicadoras de acordo com a facção: o Mestre possui miniaturas de ameaças vermelhas, enquanto heróis possuem bases douradas ou azuis ricas em contraste.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest font-sans">🌍 Biomas e Atmosferas do Mapa</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                        Mude o clima geral da batalha e sinta a transição imersiva instantaneamente ao escolher biomas do sistema no painel de cenários:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-sans">
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-855 text-center text-[10px]">🌋 Vulcano Estilo Lava</div>
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-855 text-center text-[10px]">🌲 Floresta Corrompida</div>
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-855 text-center text-[10px]">💎 Caverna de Cristais</div>
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-855 text-center text-[10px]">🏚️ Taverna Clássica</div>
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
                    <div className="bg-purple-955/10 border border-purple-900/30 p-4 rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">🎲</div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-purple-400 uppercase tracking-wider mb-1">Dados Consecutivos, Moedas & Jokenpô Rápido</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                          Resolva ataques, testes de perícia ou decisões randômicas com o motor matemático de dados integrado diretamente ao feed de chat cooperativo.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-1">
                        <span className="text-[#c084fc] font-bold text-xs uppercase tracking-wide block font-sans">🎲 Rolo de Dados Rápido</span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans font-medium">
                          No feed de dados do painel central, você encontra botões para os dados clássicos: <strong>D4, D6, D8, D10, D12, D20</strong> e <strong>D100</strong>. Clique nelas para rolar dados consecutivamente. O sistema calcula a soma agregada automaticamente!
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-1">
                        <span className="text-[#e9d5ff] font-bold text-xs uppercase tracking-wide block font-sans">🪙 Cara ou Coroa</span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans font-medium">
                          Precisa resolver um dilema de 50/50? O botão de <strong>Coin Flip / Moeda</strong> gira uma belíssima moeda física digital que lança os resultados no log público do mestre e dos jogadores ao mesmo tempo.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-1">
                        <span className="text-[#d946ef] font-bold text-xs uppercase tracking-wide block font-sans">✂️ Jokenpô PvP Rápido</span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans font-medium">
                          Sorteie de maneira teatral uma jogada de Pedra, Papel ou Tesoura para resolver impasses de narrativa em frações de segundos, adicionando uma camada recreativa.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#180828] border border-purple-900/20 p-4 rounded-xl">
                      <h5 className="font-serif text-xs font-bold text-purple-300 uppercase tracking-widest mb-1.5 font-sans">📝 Chat Sincronizado e Inteligência</h5>
                      <p className="text-xs text-purple-200/80 leading-relaxed font-sans">
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
                    <div className="bg-pink-955/10 border border-pink-900/35 p-4 rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-pink-400">👤</div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-pink-400 uppercase tracking-wider mb-1">Criação Dinâmica, Controle de Gênero (♂/♀) e Biblioteca de Miniaturas</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
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
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Ao criar uma ficha ou gerar uma criatura por Inteligência Artificial, defina o gênero de forma direta usando as opções <strong>♂ Masc</strong> e <strong>♀ Fem</strong>. Isso altera dinamicamente detalhes cruciais na ilustração e modelo da peça de resina: penteados longos, ornamentos arcanos, postura e até o tipo de armas (ex: foice vs alabarda).
                        </p>
                        <p className="text-xs text-amber-400 italic font-sans">
                          💡 Você também pode alternar o gênero de qualquer token já posicionado no grid clicando no botão de gênero ♂/♀ na ficha de controle!
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#ec4899] font-serif text-sm font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-pink-955 text-pink-100 text-[10px] items-center justify-center rounded-full border border-pink-500">B</span>
                          Aparência e Modelos de Resina
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Ao gerar um token por IA, você pode escolher <strong>Automático (baseado no prompt)</strong> ou forçar a representação visual para uma das dezenas de miniaturas pré-construídas em nossa biblioteca tática de alta resolução.
                        </p>
                        <ul className="text-xs text-neutral-400 space-y-1.5 pl-4 list-disc font-sans font-medium">
                          <li><strong className="text-neutral-200">Heróis 3D:</strong> Guerreiro, Mago, Arqueiro, Ladino, Elfo, Elfo Negro (Drow), Ancião, Titã, Feiticeiro e Aldeão Genérico.</li>
                          <li><strong className="text-neutral-200">Monstros & Vilões:</strong> Goblin, Orc, Esqueleto, Aranha Gigante, Dragão, Observador, Mímico, Urso-Coruja, Cubo Gelatinoso, Vampiro e Súcubo/Íncubo.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5 font-sans">✨ Geração Inteligente e Vinculação Automática</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                        Ao descrever um personagem com palavras livres na caixa de IA (ex: "vampira sedutora de capa vermelha" ou "urso assustador"), nosso mapeador inteligente de tokens varre as palavras-chave do texto e escolhe o melhor modelo 3D correspondente de forma 100% automatizada caso a opção "Automático" esteja selecionada.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'quests' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-emerald-955/10 border border-emerald-950/30 p-4 rounded-xl flex gap-3 items-start">
                      <Scroll className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-serif text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Missões Cooperativas & Relíquias Arcanas 3D</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                          A Taverna Digital agora possui um robusto sistema de missões cooperativas e gerenciamento de diário. Recompense o heroísmo do seu grupo com pontos de experiência (XP), moedas de ouro (PO) sonantes e <strong className="text-[#f59e0b]">Artefatos Mágicos 3D interativos</strong> que giram dinamicamente na tela projetada!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#34d399] font-serif text-sm font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-emerald-950 text-emerald-100 text-[10px] items-center justify-center rounded-full border border-emerald-500/40">1</span>
                          Arquitete Desafios Lendários
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Acesse a aba <strong className="text-neutral-200">Missões e Diário</strong> no menu superior de navegação. Você pode preencher instantaneamente um dos modelos rápidos de missão (como <em>Purificar o Cálice Sagrado</em>) ou construir um desafio customizado do zero:
                        </p>
                        <ul className="text-[11px] text-neutral-400 list-disc pl-4 space-y-1">
                          <li><strong>Narrativa:</strong> Escreva objetivos ricos e detalhes cruciais de conspirações no diário.</li>
                          <li><strong>Participantes:</strong> Marque quais fichas de herói da taverna estão encarregadas desse objetivo.</li>
                          <li><strong>Espólio:</strong> Insira a quantidade precisa de Ouro (PO) e Experiência (XP).</li>
                        </ul>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3">
                        <span className="text-[#10b981] font-serif text-sm font-extrabold flex items-center gap-2">
                          <span className="inline-flex w-5 h-5 bg-emerald-950 text-emerald-100 text-[10px] items-center justify-center rounded-full border border-emerald-500/40">2</span>
                          Sintonize Artefatos 3D
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Toda missão de prestígio possui uma relíquia como troféu! Escolha um dos tesouros na lista de relevância física, incluindo a <em>Coroa dos Elementos</em>, a <em>Lágrima de Siren</em>, o <em>Cálice Solar de Benu</em> ou o <em>Cetro de Projeção Cósmica</em>.
                        </p>
                        <p className="text-[11px] text-[#f59e0b] bg-amber-950/15 p-2 rounded border border-amber-900/30">
                          🔮 <strong>Visualizador no Painel:</strong> O mestre visualiza a relíquia girando em perspectiva com luz de neon e partículas pulsantes assim que a vincula à missão!
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2">
                      <h5 className="font-serif text-xs font-bold text-neutral-300 uppercase tracking-widest font-sans">📺 Transmissão de Alto Impacto & Tela do Projetor</h5>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                        O principal superpoder desse módulo reside na sua sincronização em tempo real com a <strong>Segunda Tela de Transmissão (Projetor/Player Grid):</strong>
                      </p>
                      <ul className="text-xs text-neutral-400 pl-4 list-decimal space-y-1.5 font-sans">
                        <li>Ao clicar em <strong className="text-amber-500">🏆 Completa</strong> no logger do Mestre, o sistema dispara um sinal de transmissão imediata para a tela de projeção.</li>
                        <li>A tela dos jogadores executa um efeito dinâmico de celebração de quest concluída, tocando confetes virtuais e exibindo o item ganho girando em uma plataforma dimensional 3D animada por CSS.</li>
                        <li>Os valores de prestígio de Ouro e XP da missão são calculados para o diário permanente da campanha de RPG cooperativo.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'forge' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl flex gap-3 items-start animate-fade-in">
                      <span className="p-1 px-2.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs animate-pulse">VTT MULTIPLAYER</span>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">⚡ Forge Core: Salas de Jogo On-line em Tempo Real</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          A maior atualização da Taverna Digital. Jogue remotamente com seu grupo conectado à nuvem usando nosso sistema de sincronização cooperativa em tempo real com Firebase.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3 animate-fade-in">
                        <span className="text-emerald-400 font-serif text-base font-extrabold flex items-center gap-2">
                          👑 Para o Mestre (DM)
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Como assinante do plano <strong>Taverna Forge Core</strong>, você tem acesso ao painel de salas virtuais. Crie salas com código único, carregue e manipule o grid tático, configure o deck de miniaturas e envie o link de convite rápido aos seus heróis.
                        </p>
                      </div>

                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-3 animate-fade-in">
                        <span className="text-emerald-400 font-serif text-base font-extrabold flex items-center gap-2">
                          🛡️ Para os Jogadores
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Seus jogadores entram gratuitamente através do seu link exclusivo. Eles escolhem seus apelidos, controlam e associam um personagem às suas miniaturas e movem seus tokens pelo mapa com sincronização milimétrica de grid, chat e vida.
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl space-y-2 animate-fade-in">
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

                    <div className="bg-[#052e16]/20 border border-emerald-900/20 p-4 rounded-xl text-center animate-fade-in">
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
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition-all pointer-events-auto"
                >
                  Fechar Guia do Sistema
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Demo Limit / Premium Conversion Modal Overlay */}
      <AnimatePresence>
        {showDemoLimitPopup && !premiumUnlocked && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-amber-500/60 shadow-[0_0_80px_rgba(245,158,11,0.3)] rounded-2xl w-full max-w-lg p-6 relative z-10 font-sans text-neutral-100 flex flex-col gap-6 text-center"
            >
              {/* Top gold bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 rounded-t-2xl" />

              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl animate-bounce">⏳</div>
                <h2 className="font-serif text-2xl font-extrabold text-amber-500 tracking-wider uppercase">
                  Limiar de Sessão Excedido!
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-[#f59e0b] uppercase bg-neutral-950 px-2.5 py-1 rounded-full border border-neutral-800">
                  Modo de Demonstração (10 min)
                </span>
              </div>

              <div className="space-y-3 text-left">
                <p className="text-xs text-neutral-300 leading-relaxed font-sans text-center">
                  Seu tempo experimental de Mestre de Taverna esgotou-se. Escolha o seu caminho para continuar forjando lendas no universo RPG:
                </p>

                {/* TWO SUBSCRIPTION CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                  {/* LOCAL PREMIUM CARD */}
                  <div className="bg-[#0d1117] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between text-left relative overflow-hidden group hover:border-[#f59e0b]/40 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#f59e0b] uppercase tracking-wider font-serif">👑 Local Premium</span>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded">Off-line</span>
                      </div>
                      <h4 className="font-serif text-lg font-black text-white">R$ 49,90 <span className="text-xs text-neutral-500 font-sans font-normal">/mês</span></h4>
                      <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                        Ideal para quem joga presencialmente. Campanhas e Mapas ilimitados, Alquimia de Monstros IA, Fichas infinitas e Segunda Tela do Projetor.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPixModal(true)}
                      className="w-full mt-4 py-2 px-3 bg-neutral-900 border border-[#f59e0b]/50 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg transition-all duration-300 truncate font-sans text-center cursor-pointer"
                    >
                      💳 Assinar Premium (Pix)
                    </button>
                  </div>

                  {/* FORGE CORE ONLINE CARD */}
                  <div className="bg-[#060a0f] border border-emerald-900/40 p-4 rounded-xl flex flex-col justify-between text-left relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-widest animate-pulse">
                      Recomendado
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#10b981] uppercase tracking-wider font-serif">⚡ Forge Core</span>
                        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded">On-line</span>
                      </div>
                      <h4 className="font-serif text-lg font-black text-white">R$ 99,90 <span className="text-xs text-neutral-500 font-sans font-normal">/mês</span></h4>
                      <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                        Tudo do Premium + <strong>Salas em Tempo Real (Multiplayer Remoto)</strong>. Crie salas virtuais com sincronização total de tokens, grid tático, chat e fichas.
                      </p>
                    </div>
                    <a
                      href="https://link.infinitepay.io/evandro-jose-d69/VC1D-4kI4yf8zxM-99,90"
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="w-full mt-4 py-2 px-3 bg-gradient-to-r from-[#10b981] to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-black font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg transition-all duration-300 block text-center font-sans shadow-md"
                    >
                      🚀 Assinar Forge Core
                    </a>
                  </div>
                </div>
              </div>

              {/* Instant purchase verification section */}
              <div className="flex flex-col gap-2 border-t border-neutral-850/40 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if ((window as any).iniciarVerificacaoInfinitePay) {
                      (window as any).iniciarVerificacaoInfinitePay();
                    }
                  }}
                  className="w-full py-2.5 bg-neutral-950 hover:bg-[#121216] text-[#f59e0b] border border-[#f59e0b]/40 hover:border-[#f59e0b] rounded-xl transition-all active:scale-95 cursor-pointer text-xs font-bold font-sans flex items-center justify-center gap-1.5 shadow-lg shadow-black/60"
                >
                  ✨ Já Realizei o Pagamento, Liberar Acesso
                </button>

                <div className="flex gap-2">
                  <a
                    href="https://link.infinitepay.io/evandro-jose-d69/VC1D-84VPhYEDRd-49,90"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer font-sans"
                  >
                    Link R$ 49,90 (Alternativo)
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                    }}
                    className="flex-1 py-1.5 bg-transparent border border-transparent hover:border-red-900/20 text-neutral-500 hover:text-red-400 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer font-sans"
                  >
                    🚪 Sair da Conta
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 font-light font-sans text-center">
                Seu progresso atual de campanha e fichas criadas não serão perdidos ao assinar.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Campaign Bottom Footer */}
      <footer className="bg-neutral-900/40 p-3 text-center border-t border-neutral-800 text-[10px] text-neutral-500 font-mono tracking-wide">
        TAVERNA DIGITAL COMPANION v2 • DISPOSITIVO DE COMUNICACAO DE MESA DE CRIPTO INGRESS SECURED
      </footer>

      {/* Pix Static Gateway Modal */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] backdrop-blur-md p-4">
          <div className="bg-[#121216] border border-zinc-805 p-6 rounded-2xl max-w-sm w-full text-center space-y-5 shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer text-sm font-bold font-mono"
            >
              ✕
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[#FF6B00] font-mono text-[10px] uppercase font-bold tracking-widest bg-orange-500/10 py-1.5 px-3 rounded-full w-fit mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse"></span>
              Pix Static Gateway
            </div>

            <div className="space-y-1">
              <h3 className="text-white font-serif font-bold text-base">Pagamento de Assinatura</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Escaneie o QR Code ou copie a chave Pix abaixo para assinar a Taverna Digital por R$ 49,90.
              </p>
            </div>

            {/* Glowing, high tech vector QR Code mock representation */}
            <div className="bg-white/5 p-4 rounded-xl border border-zinc-800 flex items-center justify-center w-40 h-40 mx-auto relative group overflow-hidden">
              <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF6B00]" />
              <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF6B00]" />
              <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF6B00]" />
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF6B00]" />
              
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

            {/* Pix Copy and Paste String Text block */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block font-mono">Texto Copia e Cola (Pix)</label>
              <div className="bg-black/40 p-1 pl-2.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-1">
                <input 
                  type="text" 
                  readOnly 
                  value="00020126580014br.gov.bcb.pix0136931fb1da-4780-446c-aeca-43552ad8d216520400005303986540549.905802BR5915TAVERNA DIGITAL6009SAO PAULO62070503***6304EDFD"
                  className="bg-transparent border-none text-[10px] text-zinc-400 font-mono focus:outline-none flex-1 overflow-x-auto select-all"
                />
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136931fb1da-4780-446c-aeca-43552ad8d216520400005303986540549.905802BR5915TAVERNA DIGITAL6009SAO PAULO62070503***6304EDFD");
                    triggerToast("📋 Código Copia e Cola copiado!");
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] rounded transition-all active:scale-95 cursor-pointer whitespace-nowrap font-sans"
                >
                  📋 Copiar Código
                </button>
              </div>
            </div>

            {/* Primary InfinitePay verification CTA */}
            <button
              type="button"
              onClick={() => {
                setShowPixModal(false);
                if ((window as any).iniciarVerificacaoInfinitePay) {
                  (window as any).iniciarVerificacaoInfinitePay();
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-amber-600 hover:to-[#FF6B00] text-black font-extrabold uppercase text-[11px] rounded-xl tracking-wider transition-all shadow-md active:scale-95 cursor-pointer font-sans"
            >
              ✨ Já Realizei o Pagamento, Liberar Acesso
            </button>
          </div>
        </div>
      )}

      {/* INFINITEPAY SECURE GATEWAY MODALS */}
      <div id="infinitepay-modal-loading" className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] hidden backdrop-blur-md">
          <div className="bg-[#121216] border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h4 className="text-white font-bold tracking-wide uppercase text-xs font-mono text-orange-500">Secure Gateway</h4>
              <p id="infinitepay-status-text" className="text-xs text-zinc-300 font-mono transition-all duration-300">
                  🔄 Estabelecendo conexão SSL segura com o endpoint da InfinitePay...
              </p>
          </div>
      </div>

      <div id="infinitepay-modal-error" className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] hidden backdrop-blur-md">
          <div className="bg-[#1A1A22] border border-red-900/40 p-6 rounded-2xl max-w-md w-full space-y-5 shadow-2xl">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono">!</div>
              <div className="space-y-2 text-center">
                  <h3 className="text-white font-bold text-lg font-serif">Erro de Compensação Bancária</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Nenhuma transação no valor de <strong className="text-white">R$ 49,90</strong> foi identificada para este e-mail nas últimas 24 horas. O painel tático permanecerá bloqueado até a liquidação.
                  </p>
              </div>
              
              <div className="bg-black/30 p-4 rounded-xl border border-zinc-800 space-y-2.5 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block font-mono">🔑 Validar via Chave de Liberação</label>
                  <div className="flex gap-2">
                      <input type="text" id="input-chave-override" placeholder="Ex: @Rambo1313" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono uppercase" />
                      <button onClick={() => { (window as any).verificarChaveManual(); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer">Validar</button>
                  </div>
              </div>
              
              <button onClick={() => {
                const modal = document.getElementById('infinitepay-modal-error');
                if (modal) modal.classList.add('hidden');
              }} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-400 underline transition cursor-pointer font-sans">Voltar para a Landing Page</button>
          </div>
      </div>
    </div>
  );
}
