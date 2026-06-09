import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Trash2, Plus, Link, Swords, Map, Shield, Zap, Backpack, Star, Tv, User, Check, Edit3, Save, Sliders, ToggleLeft, ToggleRight, Eye, Settings, Briefcase
} from 'lucide-react';

// --- INFRAESTRUTURA DE SINCRONIZAÇÃO EM NUVEM FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDZxKVH7v_F8vmx_D9jd8C9byhHbCvFX-Y",
  authDomain: "taverna-forge-core.firebaseapp.com",
  databaseURL: "https://taverna-forge-core-default-rtdb.firebaseio.com",
  projectId: "taverna-forge-core",
  storageBucket: "taverna-forge-core.firebasestorage.app",
  messagingSenderId: "1074679072751",
  appId: "1:1074679072751:web:b33e58860a2681934ad81a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const NEW_PRICE = "R$ 99,90";
const CHAVES_OVERRIDE = ["TAVERNA4990", "INFINITE4990", "@Rambo1313", "FORGE99"];
const LISTA_ICONES_ITENS = ['⚔️', '🪄', '🗡️', '🏹', '🛡️', '📖', '🧥', '📿', '💍', '🥾', '🧪', '🔮', '🏆', '👑', '🔱', '💥', '☀️', '🍃', '🌋'];

interface Habilidade {
  id: string;
  name: string;
  type: 'damage' | 'heal' | 'mp_restore';
  baseValue: number;
  cost: number;
  isUltimate: boolean;
  icon: string;
  description: string;
}

interface ItemTatico {
  uid: string; // ID único da instância gerada na mochila
  id: string;  // ID base do compêndio
  name: string;
  icon: string;
  bonusHp: number;
  bonusMp: number;
  bonusStr: number;
  bonusVel: number;
  isEquipped?: boolean;
}

// --- CATALOGAÇÃO ORIGINAL DE 50 ITENS TÁTICOS DO ALMANAQUE ---
const COMPENDIO_50_BASE = Array.from({ length: 50 }, (_, i) => ({
  id: `base-it-${i + 1}`,
  name: i === 0 ? 'Machado Rúnico Anão' : i === 1 ? 'Cajado Celestial de Valerius' : `Item de Forja Tático №${i + 1}`,
  icon: i === 0 ? '🪓' : i === 1 ? '🪄' : '🔮',
  bonusHp: 15 + (i * 2),
  bonusMp: 10 + (i * 3),
  bonusStr: 2 + Math.floor(i / 5),
  bonusVel: 1 + Math.floor(i / 6)
}));

const COMPENDIO_PODERES: Record<string, Habilidade[]> = {
  guerreiro: [
    { id: 'w-1', name: 'Golpe de Impacto', type: 'damage', baseValue: 22, cost: 6, isUltimate: false, icon: '🪓', description: 'Corte frontal pesado' },
    { id: 'w-2', name: 'Fôlego de Força', type: 'heal', baseValue: 18, cost: 10, isUltimate: false, icon: '🛡️', description: 'Restaura vigor físico tático' },
    { id: 'w-3', name: 'EXECUÇÃO DO ANÃO', type: 'damage', baseValue: 65, cost: 0, isUltimate: true, icon: '⚔️', description: 'Especial Supremo: Consome 35% do MP Máximo' }
  ],
  mago: [
    { id: 'm-1', name: 'Bola de Fogo', type: 'damage', baseValue: 26, cost: 8, isUltimate: false, icon: '🔥', description: 'Explosão incandescente arcana' },
    { id: 'm-2', name: 'Barreira de Éter', type: 'heal', baseValue: 20, cost: 12, isUltimate: false, icon: '🔮', description: 'Converte mana em vida ativa' },
    { id: 'm-3', name: 'DESINTEGRAÇÃO ARCANA', type: 'damage', baseValue: 75, cost: 0, isUltimate: true, icon: '☄️', description: 'Especial Supremo: Consome 35% do MP Máximo' }
  ],
  enemy: [
    { id: 'en-1', name: 'Mordida Atroz', type: 'damage', baseValue: 16, cost: 4, isUltimate: false, icon: '🐺', description: 'Ataque de criatura' },
    { id: 'en-2', name: 'Investida Selvagem', type: 'damage', baseValue: 20, cost: 7, isUltimate: false, icon: '🐗', description: 'Avanço pesado de impacto' },
    { id: 'en-3', name: 'FÚRIA DA MATILHA', type: 'damage', baseValue: 42, cost: 0, isUltimate: true, icon: '🐾', description: 'Especial: Consome 35% do MP Máximo' }
  ],
  boss: [
    { id: 'b-1', name: 'Esmagar Crânio', type: 'damage', baseValue: 38, cost: 10, isUltimate: false, icon: '👹', description: 'Impacto destruidor massivo' },
    { id: 'b-2', name: 'Onda de Terremoto', type: 'damage', baseValue: 30, cost: 14, isUltimate: false, icon: '🌋', description: 'Fissura tectônica em área' },
    { id: 'b-3', name: 'RUGIDO DO APOCALIPSE', type: 'damage', baseValue: 90, cost: 0, isUltimate: true, icon: '🗣️', description: 'Especial Supremo: Consome 35% do MP Máximo' }
  ]
};
COMPENDIO_PODERES.ladino = COMPENDIO_PODERES.guerreiro;
COMPENDIO_PODERES.elfo = COMPENDIO_PODERES.mago;

interface Character {
  id: string;
  name: string;
  classe: 'guerreiro' | 'mago' | 'ladino' | 'elfo' | 'enemy' | 'boss';
  level: number;
  exp: number;
  hpMax: number;
  hpCurrent: number;
  energyMax: number;
  energyCurrent: number;
  str: number;
  vel: number;
  icon: string;
  mochila: ItemTatico[]; // Iniciada 100% zerada de fábrica
  isGerente: boolean;   // Flag do Gerente Organizador Co-Mestre
  permMapas: boolean;   // Permissão para trocar texturas e biomas
  permItens: boolean;   // Permissão para gerenciar e injetar itens
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
}

export default function TavernaForgeCore({ userAuth, onLogout }: any) {
  const [accessTier, setAccessTier] = useState<'none' | 'premium' | 'forge' | 'jogador'>('none');
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'forge'>('forge');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');

  const [playerNickname, setPlayerNickname] = useState<string>('');
  const [hasEnteredNickname, setHasEnteredNickname] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'exploracao' | 'arena'>('exploracao');

  const [role, setRole] = useState<'mestre' | 'jogador'>('mestre');
  const [roomId, setRoomId] = useState<string>('SALA-FORGE-777');
  const [movingFromIndex, setMovingFromIndex] = useState<number | null>(null);
  const [activeSpellQueued, setActiveSpellQueued] = useState<Habilidade | null>(null);

  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  // Estados do Gerenciador Allocator de Itens
  const [selectedBaseItemId, setSelectedBaseItemId] = useState<string>(COMPENDIO_50_BASE[0].id);
  const [customItemName, setCustomItemName] = useState(COMPENDIO_50_BASE[0].name);
  const [customItemIcon, setCustomItemIcon] = useState(COMPENDIO_50_BASE[0].icon);
  const [customHp, setCustomHp] = useState(COMPENDIO_50_BASE[0].bonusHp);
  const [customMp, setCustomMp] = useState(COMPENDIO_50_BASE[0].bonusMp);
  const [customStr, setCustomStr] = useState(COMPENDIO_50_BASE[0].bonusStr);
  
  // Estado das Texturas e Biomas Espelho da primeira foto
  const [currentBiome, setCurrentBiome] = useState<'gramado' | 'taverna' | 'lama' | 'caverna' | 'vulcao' | 'gloom'>('gramado');

  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Pool contendo o Anão Karnak com a mochila vazia pronto para receber os buffs
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Karnak Quebra-Escudos', classe: 'guerreiro', level: 1, exp: 0, hpMax: 140, hpCurrent: 140, energyMax: 40, energyCurrent: 40, str: 18, vel: 8, icon: '🪨', mochila: [], isGerente: false, permMapas: false, permItens: false },
    { id: '2', name: 'Valerius, Mago Celestial', classe: 'mago', level: 1, exp: 0, hpMax: 70, hpCurrent: 70, energyMax: 100, energyCurrent: 100, str: 8, vel: 14, icon: '🧙‍♂️', mochila: [], isGerente: false, permMapas: false, permItens: false },
    { id: '3', name: 'Orc da Montanha', classe: 'enemy', level: 1, exp: 0, hpMax: 90, hpCurrent: 90, energyMax: 30, energyCurrent: 30, str: 12, vel: 9, icon: '👹', mochila: [], isGerente: false, permMapas: false, permItens: false },
    { id: '4', name: 'Dragão Vermelho Ancestral', classe: 'boss', level: 1, exp: 0, hpMax: 350, hpCurrent: 350, energyMax: 150, energyCurrent: 150, str: 28, vel: 12, icon: '🐉', mochila: [], isGerente: false, permMapas: false, permItens: false }
  ]);
  
  const [playerDeck, setPlayerDeck] = useState<string[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [grid, setGrid] = useState<(string | null)[]>(Array(144).fill(null));
  const [chatBg, setChatBg] = useState<'default' | 'dungeon' | 'taverna' | 'castle'>('default');

  const [questTitle, setQuestTitle] = useState('O DESPERTAR DO VULCÃO');
  const [questDesc, setQuestDesc] = useState('Investigar as trepidações anômalas no sopé da montanha de cinzas e deter o ritual do Culto da Chama Negra.');

  const [newCharName, setNewCharName] = useState('');
  const [newCharClasse, setNewCharClasse] = useState<'guerreiro' | 'mago' | 'ladino' | 'elfo' | 'enemy' | 'boss'>('guerreiro');
  const [newCharHp, setNewCharHp] = useState('100');
  const [newCharEnergy, setNewCharEnergy] = useState('50');
  const [newCharIcon, setNewCharIcon] = useState('⚔️');
  const [newIsGerente, setNewIsGerente] = useState(false);
  const [newPermMapas, setNewPermMapas] = useState(false);
  const [newPermItens, setNewPermItens] = useState(false);

  const [msgInput, setMsgInput] = useState('');

  // Estados de Trepidação da Tela para combate e dados
  const [shake, setShake] = useState(false);
  const [isCritShaking, setIsCritShaking] = useState(false);

  const triggerShake = (intensity: 'low' | 'high') => {
    setShake(true);
    setIsCritShaking(true);
    setTimeout(() => {
      setShake(false);
      setIsCritShaking(false);
    }, intensity === 'high' ? 800 : 400);
  };

  // --- COMPATIBILIDADE DE BOTÕES E SUPORTE DE TIER ---
  const configureRolesInterface = () => {};
  const initFirebaseSync = () => {};

  // Sincronização em Nuvem do Firebase Realtime
  useEffect(() => {
    if (accessTier === 'none' || accessTier === 'premium') return;

    const roomRef = ref(db, 'rooms/' + roomId);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.characters) setCharacters(data.characters);
        if (data.chatMessages) setChatMessages(data.chatMessages);
        if (data.questTitle) setQuestTitle(data.questTitle);
        if (data.questDesc) setQuestDesc(data.questDesc);
        if (data.currentBiome) setCurrentBiome(data.currentBiome);
        if (data.grid) {
          let reconstitutedGrid: (string | null)[] = Array(144).fill(null);
          if (Array.isArray(data.grid)) {
            for (let i = 0; i < Math.min(data.grid.length, 144); i++) {
              reconstitutedGrid[i] = data.grid[i] || null;
            }
          } else if (typeof data.grid === 'object' && data.grid !== null) {
            Object.entries(data.grid).forEach(([key, val]) => {
              const idx = parseInt(key, 10);
              if (idx >= 0 && idx < 144) {
                reconstitutedGrid[idx] = val as string | null;
              }
            });
          }
          setGrid(reconstitutedGrid);
        }
      }
    });
    return () => unsubscribe();
  }, [roomId, accessTier]);

  const updateCloudState = (updatedCharacters: Character[], updatedChat: ChatMessage[], updatedGrid: (string | null)[], extra = {}) => {
    const payload = { 
      characters: updatedCharacters, 
      chatMessages: updatedChat, 
      grid: updatedGrid,
      questTitle,
      questDesc,
      currentBiome,
      ...extra 
    };
    if (accessTier === 'premium') {
      localStorage.setItem(`taverna_forge_room_${roomId}`, JSON.stringify(payload));
      return;
    }
    set(ref(db, 'rooms/' + roomId), payload);
  };

  // --- MOTOR DE VERIFICAÇÃO DE HIERARQUIA E PERMISSÕES DO GERENTE ---
  const hasPermission = (type: 'mapas' | 'itens'): boolean => {
    if (role === 'mestre') return true;
    const charFocado = characters.find(c => c.id === selectedCharId);
    if (charFocado && charFocado.isGerente) {
      if (type === 'mapas' && charFocado.permMapas) return true;
      if (type === 'itens' && charFocado.permItens) return true;
    }
    return false;
  };

  const handleBaseItemSelectChange = (id: string) => {
    setSelectedBaseItemId(id);
    const item = COMPENDIO_50_BASE.find(i => i.id === id);
    if (item) {
      setCustomItemName(item.name);
      setCustomItemIcon(item.icon);
      setCustomHp(item.bonusHp);
      setCustomMp(item.bonusMp);
      setCustomStr(item.bonusStr);
    }
  };

  // --- INJETOR DINÂMICO DE ITENS DIRETO NA MOCHILA EM TEMPO REAL ---
  const allocateCustomItemToBackpack = () => {
    if (!selectedCharId) return alert("Selecione um herói ou monstro para receber o item.");
    if (!hasPermission('itens')) return alert("Seu cargo de jogador não possui permissões para injetar relíquias.");

    const novoItem: ItemTatico = {
      uid: `it-uid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      id: selectedBaseItemId,
      name: customItemName,
      icon: customItemIcon,
      bonusHp: customHp,
      bonusMp: customMp,
      bonusStr: customStr,
      bonusVel: 2,
      isEquipped: false
    };

    const nextChars = characters.map(c => {
      if (c.id === selectedCharId) {
        const clonado = { ...c };
        if (!clonado.mochila) clonado.mochila = [];
        clonado.mochila.push(novoItem);
        return clonado;
      }
      return c;
    });

    setCharacters(nextChars);
    pushNewChatMessage("Sistema", `🎁 Alocou item de relíquia [${novoItem.icon} ${novoItem.name}] na mochila de ${characters.find(c => c.id === selectedCharId)?.name}!`);
    updateCloudState(nextChars, chatMessages, grid);
  };

  const parseCharacterInCell = (cellValue: string | null): Character | null => {
    if (!cellValue) return null;
    let match = characters.find(c => c.id === cellValue);
    if (match) return match;

    if (cellValue.includes(':')) {
      const idPart = cellValue.split(':')[1];
      match = characters.find(c => c.id === idPart || c.id === cellValue);
      if (match) return match;
    }
    return null;
  };

  const handleGridInteract = (index: number) => {
    const nextGrid = [...grid];
    const cellValue = nextGrid[index];
    const targetChar = parseCharacterInCell(cellValue);

    if (activeSpellQueued && targetChar) {
      executeSkillOnTarget(activeSpellQueued, targetChar);
      setActiveSpellQueued(null);
      return;
    }

    if (cellValue) {
      if (movingFromIndex === index) {
        if (role === 'mestre') nextGrid[index] = null;
        setMovingFromIndex(null);
      } else {
        setMovingFromIndex(index);
        const parsed = parseCharacterInCell(cellValue);
        if (parsed) setSelectedCharId(parsed.id);
      }
    } else {
      if (movingFromIndex !== null) {
        nextGrid[index] = nextGrid[movingFromIndex];
        nextGrid[movingFromIndex] = null;
        setMovingFromIndex(null); 
      } else if (selectedCharId) {
        nextGrid[index] = selectedCharId;
        setSelectedCharId(null); 
      }
    }

    setGrid(nextGrid);
    updateCloudState(characters, chatMessages, nextGrid);
  };

  const executeSkillOnTarget = (poder: Habilidade, alvo: Character) => {
    const atacante = characters.find(c => c.id === selectedCharId);
    if (!atacante) return;

    const bonusAtacante = getCharacterBackpackBonus(atacante);
    const maxMpReal = atacante.energyMax + bonusAtacante.mp;
    const custoCalculado = poder.isUltimate ? Math.floor(maxMpReal * 0.35) : poder.cost;

    if (atacante.energyCurrent < custoCalculado) return alert("Mana/Energia insuficiente!");
    const valorEscalado = poder.baseValue + (atacante.level * 5);

    const nextChars = characters.map(c => {
      if (c.id === atacante.id) c.energyCurrent = Math.max(0, c.energyCurrent - custoCalculado);
      if (c.id === alvo.id) {
        if (poder.type === 'damage') c.hpCurrent = Math.max(0, c.hpCurrent - valorEscalado);
        if (poder.type === 'heal') c.hpCurrent = Math.min(c.hpMax + getCharacterBackpackBonus(c).hp, c.hpCurrent + valorEscalado);
      }
      return c;
    });

    setCharacters(nextChars);
    triggerShake(poder.isUltimate ? 'high' : 'low');
    pushNewChatMessage(atacante.name, `⚔️ Desfechou <strong>${poder.name}</strong> em <strong>${alvo.name}</strong> redefinindo os status de combate!`);
    updateCloudState(nextChars, chatMessages, grid);
  };

  const handleRollDice = (faces: number) => {
    const res = Math.floor(Math.random() * faces) + 1;
    triggerShake(faces >= 20 ? 'high' : 'low');
    pushNewChatMessage(getActiveActorName(), `🎲 Rolou d${faces} obtendo: <strong>${res}</strong>`);
  };

  const handleSelectSkillToQueue = (poder: Habilidade) => {
    setActiveSpellQueued(poder);
    alert(`Ação engatilhada: [${poder.name}]. CLIQUE NO ALVO NO TABULEIRO PARA APLICAR O GOLPE!`);
  };

  const handleMiniGame = (type: 'coin' | 'jokenpo') => {
    const res = type === 'coin' 
      ? `🪙 Cara ou Coroa: <strong>${Math.random() > 0.5 ? 'CARA' : 'COROA'}</strong>`
      : `🪨 Jokenpô: <strong>${["Pedra", "Papel", "Tesoura"][Math.floor(Math.random() * 3)]}</strong>`;
    pushNewChatMessage(getActiveActorName(), res);
  };

  const handleConfirmPayment = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setProcessingStep('🔑 Conectando segurança SSL com endpoint da InfinitePay...');

    setTimeout(() => {
      setProcessingStep('🔍 Analisando confirmação de liquidação bancária...');
    }, 900);

    setTimeout(() => {
      setAccessTier(selectedPlan);
      setIsProcessing(false);
    }, 2000);
  };

  const handleVerifyManualKey = () => {
    const key = manualKey.trim().toUpperCase();
    if (CHAVES_OVERRIDE.includes(key)) {
      alert("✓ Autenticação via Chave Mestre Forjada aceita!");
      setAccessTier('forge');
    } else {
      alert("Chave inválida.");
    }
  };

  const handleGenerateInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&role=jogador`;
    navigator.clipboard.writeText(inviteUrl);
    alert(`Link de convite tático copiado para a sala ${roomId}!`);
  };

  const handleOpenProjectorWindow = () => {
    window.open(window.location.origin + window.location.pathname + '?projector=true', '_blank', 'width=1200,height=800');
  };

  const handleApplyLiveModifier = (type: 'damage' | 'heal' | 'energy', value: number) => {
    if (!selectedCharId) return alert("Selecione um token ativo.");
    
    let logAcao = "";
    const nextChars = characters.map(c => {
      if (c.id === selectedCharId) {
        const atualizado = { ...c };
        const bonus = getCharacterBackpackBonus(atualizado);

        if (type === 'damage') {
          atualizado.hpCurrent = Math.max(0, atualizado.hpCurrent - value);
          logAcao = `💥 Modificação: <strong>-${value} HP</strong> (${atualizado.hpCurrent}/${atualizado.hpMax + bonus.hp})`;
        } else if (type === 'heal') {
          atualizado.hpCurrent = Math.min(atualizado.hpMax + bonus.hp, atualizado.hpCurrent + value);
          logAcao = `💚 Cura: <strong>+${value} HP</strong> (${atualizado.hpCurrent}/${atualizado.hpMax + bonus.hp})`;
        } else if (type === 'energy') {
          atualizado.energyCurrent = Math.max(0, atualizado.energyCurrent - value);
          logAcao = `⚡ENG: <strong>-${value} ENG</strong>`;
        }
        return atualizado;
      }
      return c;
    });

    setCharacters(nextChars);
    if (type === 'damage') {
      triggerShake(value >= 25 ? 'high' : 'low');
    }
    if (logAcao) pushNewChatMessage(characters.find(c => c.id === selectedCharId)?.name || "Arena", logAcao);
    updateCloudState(nextChars, chatMessages, grid);
  };

  const handleGrantExp = (amount: number) => {
    if (!selectedCharId) return;
    const nextChars = characters.map(c => {
      if (c.id === selectedCharId) {
        const clonado = { ...c };
        clonado.exp += amount;
        if (clonado.exp >= clonado.level * 100) {
          clonado.level += 1; clonado.exp = 0;
          clonado.hpMax += 25; clonado.hpCurrent = clonado.hpMax;
          clonado.energyMax += 15; clonado.energyCurrent = clonado.energyMax;
          pushNewChatMessage(clonado.name, `⭐ LEVEL UP! Alcançou o <strong>Nível ${clonado.level}</strong>!`);
        }
        return clonado;
      }
      return c;
    });
    setCharacters(nextChars);
    updateCloudState(nextChars, chatMessages, grid);
  };

  const getCharacterBackpackBonus = (c: Character) => {
    let hp = 0, mp = 0, str = 0, vel = 0;
    if (c.mochila) {
      c.mochila.forEach(item => {
        if (item.isEquipped) {
          hp += item.bonusHp; mp += item.bonusMp; str += item.bonusStr; vel += item.bonusVel;
        }
      });
    }
    return { hp, mp, str, vel };
  };

  const toggleEquipItemInsideBackpack = (itemUid: string) => {
    if (!selectedCharId) return;
    const nextChars = characters.map(c => {
      if (c.id === selectedCharId) {
        const clonado = { ...c };
        clonado.mochila = (clonado.mochila || []).map(it => {
          if (it.uid === itemUid) {
            it.isEquipped = !it.isEquipped;
          }
          return it;
        });
        return clonado;
      }
      return c;
    });
    setCharacters(nextChars);
    updateCloudState(nextChars, chatMessages, grid);
  };

  const handleSelectCharacter = (id: string) => {
    if (role === 'jogador' && !playerDeck.includes(id)) {
      if (playerDeck.length >= 20) return alert("Limite de 20 fichas por deck de jogador!");
      setPlayerDeck([...playerDeck, id]);
    }
    setSelectedCharId(id);
    setMovingFromIndex(null); 
  };

  const handleCreateSheet = () => {
    if (!newCharName.trim()) return;
    const nC: Character = {
      id: `char-${Date.now()}`,
      name: newCharName,
      classe: newCharClasse,
      level: 1, exp: 0,
      hpMax: parseInt(newCharHp) || 100, hpCurrent: parseInt(newCharHp) || 100,
      energyMax: 50, energyCurrent: 50,
      str: 10, vel: 10, icon: newCharIcon,
      mochila: [], // 100% Zerada de fábrica
      isGerente: newIsGerente,
      permMapas: newPermMapas,
      permItens: newPermItens
    };
    const next = [...characters, nC];
    setCharacters(next);
    setShowCreateModal(false);
    updateCloudState(next, chatMessages, grid);
  };

  const sendTextMessage = () => {
    if (!msgInput.trim()) return;
    pushNewChatMessage(getActiveActorName(), msgInput);
    setMsgInput('');
  };

  const pushNewChatMessage = (sender: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`, sender, content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextChat = [...chatMessages, newMsg];
    setChatMessages(nextChat);
    updateCloudState(characters, nextChat, grid);
  };

  const getActiveActorName = () => {
    if (accessTier === 'jogador') return `👤 ${playerNickname || 'Jogador'}`;
    if (role === 'mestre') return "👑 Mestre";
    if (selectedCharId) {
      const active = characters.find(c => c.id === selectedCharId);
      if (active) return active.icon + " " + active.name;
    }
    return "⚔️ Convidado";
  };

  const bossChar = characters.find(c => c.classe === 'boss');
  const bossBonus = bossChar ? getCharacterBackpackBonus(bossChar) : { hp: 0 };

  // Mapeamento dinâmico de cores de biomas da primeira imagem (adf.jpg)
  const biomeGradients = {
    gramado: 'from-[#142614] to-[#0a100a] border-emerald-900/60',
    taverna: 'from-[#2a1a08] to-[#0c0a08] border-amber-950/60',
    lama: 'from-[#221c16] to-[#0c0a09] border-stone-800',
    caverna: 'from-[#1a1b20] to-[#090a0c] border-zinc-800',
    vulcao: 'from-[#3a1414] to-[#0c0505] border-red-950',
    gloom: 'from-[#1a1426] to-[#07050c] border-purple-950'
  }[currentBiome];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-neutral-100 flex flex-col justify-between select-none font-sans antialiased">
      
      {/* SIMULAÇÃO DE PAGAMENTO DE TIER */}
      {accessTier === 'none' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-between">
          <header className="p-4 bg-[#121216] border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded flex items-center justify-center shadow-lg"><Flame className="w-5 h-5 text-black" /></div>
              <span className="text-sm font-black text-amber-500 uppercase font-fantasy">TAVERNA FORGE ECOSYSTEM</span>
            </div>
            <button onClick={onLogout} className="text-xs text-neutral-400 border border-neutral-800 rounded px-3 py-1.5 font-mono">Sair</button>
          </header>

          <main className="max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center self-center">
            <div className="lg:col-span-12 max-w-xl mx-auto text-center space-y-6">
              <Flame className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
              <h2 className="text-3xl font-black font-fantasy text-amber-400 uppercase tracking-widest text-center">Ativar Taverna Forge Core</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">Selecione o plano desejado e libere as mesas reativas de RPG com sincronismo de ficha mútua.</p>

              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setSelectedPlan('premium')} className={`p-4 rounded-xl border text-left cursor-pointer transition ${selectedPlan === 'premium' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-neutral-900/40'}`}>
                  <span className="text-xs font-bold text-white block">Taverna Premium (Local)</span>
                  <span className="text-[10px] text-zinc-400">R$ 49,90</span>
                </div>
                <div onClick={() => setSelectedPlan('forge')} className={`p-4 rounded-xl border text-left cursor-pointer transition ${selectedPlan === 'forge' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-neutral-900/40'}`}>
                  <span className="text-xs font-bold text-amber-400 block">Taverna Forge Core (Online)</span>
                  <span className="text-[10px] text-zinc-400">{NEW_PRICE}</span>
                </div>
              </div>

              <div className="bg-[#121216] border border-zinc-800 rounded-2xl p-6 space-y-4">
                <button onClick={() => handleConfirmPayment()} className="w-full py-3 bg-amber-500 text-neutral-950 font-black text-xs uppercase rounded-xl tracking-wider">Confirmar Forja</button>
                <div className="flex gap-2">
                  <input type="text" placeholder="Chave Manual" value={manualKey} onChange={(e) => setManualKey(e.target.value)} className="flex-1 bg-neutral-950 border border-zinc-800 p-2 text-xs rounded-lg uppercase text-white font-mono" />
                  <button onClick={handleVerifyManualKey} className="px-4 bg-[#1e1f24] font-bold text-xs rounded-lg text-white border border-zinc-850">Validar</button>
                </div>
              </div>
            </div>
          </main>
        </motion.div>
      )}

      {/* AMBIENTE OPERACIONAL UNIFICADO ESPELHO DA MESA LOCAL */}
      {accessTier !== 'none' && (
        <div className="flex-1 flex flex-col justify-between h-screen overflow-hidden">
          
          {/* HEADER PREMIUM DE ATIVIDADES */}
          <header className="bg-[#121216] border-b border-zinc-800 p-3 px-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black tracking-widest text-amber-500 uppercase font-fantasy">TAVERNA FORGE V2</span>
              <div className="bg-black/40 p-0.5 rounded flex border border-zinc-800">
                <button onClick={() => setRole('mestre')} className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${role === 'mestre' ? 'bg-amber-500 text-black shadow font-black' : 'text-neutral-500 hover:text-neutral-300'}`}>Mestre</button>
                <button onClick={() => setRole('jogador')} className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${role === 'jogador' ? 'bg-amber-500 text-black shadow font-black' : 'text-neutral-500 hover:text-neutral-300'}`}>Jogador</button>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={roomId} className="bg-black/60 text-emerald-400 font-bold font-mono text-[10px] w-22 border border-zinc-800 rounded p-1 text-center" />
                <button onClick={handleGenerateInviteLink} className="p-1.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1"><Link className="w-3 h-3" /> Convidar</button>
                <button onClick={handleOpenProjectorWindow} className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1"><Tv className="w-3 h-3" /> Segunda Tela VTT</button>
              </div>
              <button onClick={onLogout} className="text-xs text-zinc-500 hover:text-white underline ml-2">Sair</button>
            </div>
          </header>

          {/* MASTER GRID DE PROPORÇÕES TÁTICAS COMPATÍVEIS */}
          <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden h-[85vh]">
            
            {/* LADO ESQUERDO: BIOMAS (SE FOR MESTRE/GERENTE) + POOL GERAL (col-span-2) */}
            <div className="col-span-2 bg-[#121216] border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-xl">
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                
                {/* Seletor de Biomas / Texturas da primeira imagem (Apenas para autorizados) */}
                {hasPermission('mapas') && (
                  <div className="space-y-1.5 border-b border-zinc-800 pb-2">
                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest block font-fantasy">BIOME TEXTURES (2D HD)</span>
                    <div className="grid grid-cols-3 gap-1 col-span-1">
                      {['gramado', 'taverna', 'lama', 'caverna', 'vulcao', 'gloom'].map(bio => (
                        <button key={bio} onClick={() => { setCurrentBiome(bio as any); updateCloudState(characters, chatMessages, grid, { currentBiome: bio }); }} className={`py-1 rounded text-[8px] font-mono font-bold capitalize border ${currentBiome === bio ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-800 bg-black/40 text-zinc-400'}`}>{bio}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                  <span className="text-[10px] font-black text-neutral-400 font-fantasy">STATUS DOS HERÓIS</span>
                  {role === 'mestre' && <button onClick={() => setShowCreateModal(true)} className="p-1 bg-amber-500/10 text-amber-400 border rounded border-amber-500/20"><Plus className="w-3 h-3" /></button>}
                </div>

                <div className="space-y-2">
                  {characters.map(c => {
                    const isSelected = selectedCharId === c.id;
                    const bonus = getCharacterBackpackBonus(c);
                    let cardStyle = isSelected ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-black/20';
                    if (c.isGerente) cardStyle += ' border-l-2 border-l-blue-500';

                    return (
                      <div key={c.id} onClick={() => handleSelectCharacter(c.id)} className={`p-2 rounded-xl border text-left transition relative cursor-pointer ${cardStyle}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-white truncate max-w-[100px] uppercase">{c.icon} {c.name}</span>
                          {c.isGerente && <Briefcase className="w-3 h-3 text-blue-400" title="Gerente Organizador Co-Mestre" />}
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${(c.hpCurrent/(c.hpMax+bonus.hp))*100}%`}}></div></div>
                          <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${(c.energyCurrent/(c.energyMax+bonus.mp))*100}%`}}></div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedCharId && (
                <button onClick={() => setShowInventoryModal(true)} className="w-full py-2 bg-black border border-zinc-800 text-[10px] font-bold uppercase rounded-xl text-neutral-300 flex items-center justify-center gap-1"><Backpack className="w-3.5 h-3.5 text-amber-500" /> Mochila do Herói</button>
              )}
            </div>

            {/* LADO CENTRAL: TABULÉIRO 12x12 ESPELHO IDENTITÁRIO COM BARRA DE BOSS (col-span-7) */}
            <div className="col-span-7 bg-[#121216] border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between items-center overflow-hidden shadow-xl">
              
              {/* Barra de Ameaça do Observador Ancião espelhada da foto sdafdsfg.jpg */}
              <div className="w-full max-w-xl bg-black/40 border border-zinc-800 p-2 rounded-xl text-center relative overflow-hidden mb-1">
                <div className="absolute top-0 left-0 bg-red-600 text-[9px] px-2 font-mono font-bold uppercase">AMEAÇA RIVAL ATIVA</div>
                <h3 className="text-xs font-black uppercase text-red-500 tracking-widest font-fantasy">{bossChar ? bossChar.name : 'Nenhum Alvo de Elite Encontrado'}</h3>
                {bossChar && (
                  <div className="mt-1 flex items-center gap-3 justify-center">
                    <div className="w-72 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300" style={{ width: `${(bossChar.hpCurrent / (bossChar.hpMax + bossBonus.hp)) * 100}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid 12x12 herdando os gradientes de biomas reais */}
              <motion.div 
                animate={isCritShaking ? { x: [-6, 6, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`flex-1 flex items-center justify-center relative w-full overflow-auto ${shake ? 'animate-shake-frame' : ''}`}
              >
                <div className={`grid grid-cols-12 gap-0.5 w-[450px] h-[450px] p-2 rounded-xl border bg-gradient-to-b ${biomeGradients} shadow-2xl relative shadow-black/80`}>
                  {grid.map((charId, idx) => {
                    const charInCell = parseCharacterInCell(charId);
                    const tooltipName = charInCell ? `${charInCell.name} [LVL ${charInCell.level}]` : "Quadrante Vazio";
                    
                    let baseResinaStyle = "border-neutral-600 bg-neutral-800";
                    if (charInCell) {
                      if (charInCell.classe === 'enemy') baseResinaStyle = "border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)] bg-red-950/40";
                      else if (charInCell.classe === 'boss') baseResinaStyle = "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] bg-purple-950/50 animate-pulse";
                      else baseResinaStyle = "border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] bg-neutral-900";
                    }

                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleGridInteract(idx)} 
                        title={tooltipName} 
                        className={`w-full h-full border border-zinc-800/40 rounded flex flex-col items-center justify-center relative hover:bg-zinc-700/30 cursor-pointer transition-all ${movingFromIndex === idx ? 'bg-amber-500/20 border-amber-500' : ''}`}
                      >
                        {charInCell && (
                          <div className="flex flex-col items-center justify-center w-full h-full p-0.5 relative">
                            <div className={`w-7 h-7 rounded-full border-2 ${baseResinaStyle} flex items-center justify-center text-xs select-none z-10 font-bold bg-[#141419]`}>
                              {charInCell.icon}
                            </div>
                            <div className="absolute bottom-0 inset-x-0.5 h-1 bg-black/80 rounded-full overflow-hidden flex z-20">
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

            {/* LADO DIREITO: DIÁRIO DE MISSÕES MESA SINCRO + CHAT + ALLOCATOR INJECTOR DE ITENS (col-span-3) */}
            <div className="col-span-3 border border-zinc-800 bg-[#121216] rounded-2xl flex flex-col justify-between overflow-hidden shadow-xl">
              
              {/* Diário de Missões Consultivo e Reativo */}
              <div className="p-3 bg-black/30 border-b border-zinc-800/80 space-y-1">
                <span className="text-[8px] font-mono font-black text-amber-500 uppercase tracking-widest block">🛡️ Diário de Missões em Curso</span>
                <h4 className="text-[11px] font-black text-white uppercase tracking-wide font-fantasy">{questTitle}</h4>
                <p className="text-[9px] text-zinc-400 leading-tight">{questDesc}</p>
              </div>

              {/* ABA EXCLUSIVA: INJETOR / ALLOCATOR DE FICHA DO MESTRE (Cria e altera itens em jogo) */}
              {role === 'mestre' && selectedCharId && (
                <div className="p-2.5 bg-black/20 border-b border-zinc-800 space-y-2 text-[10px]">
                  <span className="text-[8px] font-mono font-black text-amber-500 uppercase tracking-widest block flex items-center gap-1"><Settings className="w-3 h-3" /> Forjador Injector de Relíquias</span>
                  
                  <div className="flex gap-1.5">
                    <select value={selectedBaseItemId} onChange={(e) => handleBaseItemSelectChange(e.target.value)} className="flex-1 bg-neutral-950 border border-zinc-800 p-1 rounded text-white outline-none">
                      {COMPENDIO_50_BASE.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <select value={customItemIcon} onChange={(e) => setCustomItemIcon(e.target.value)} className="bg-neutral-950 border border-zinc-800 p-1 rounded text-white outline-none">
                      {LISTA_ICONES_ITENS.map(ico => <option key={ico} value={ico}>{ico}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <input type="text" value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} className="bg-neutral-950 border border-zinc-800 p-1 rounded text-white outline-none" placeholder="Nome" />
                    <input type="number" value={customHp} onChange={(e) => setCustomHp(parseInt(e.target.value) || 0)} className="bg-neutral-950 border border-zinc-800 p-1 rounded text-white outline-none font-mono" placeholder="+HP" />
                    <input type="number" value={customStr} onChange={(e) => setCustomStr(parseInt(e.target.value) || 0)} className="bg-neutral-950 border border-zinc-800 p-1 rounded text-white outline-none font-mono" placeholder="+STR" />
                  </div>

                  <button onClick={allocateCustomItemToBackpack} className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[9px] rounded flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Injetar na Mochila da Ficha</button>
                </div>
              )}

              {/* FEED DO CHAT LOG OPERACIONAL */}
              <div ref={chatFeedRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[25vh] bg-black/5">
                {chatMessages.map(m => (
                  <div key={m.id} className="p-2 bg-black/40 border border-zinc-800/40 rounded-xl text-[11px] font-mono">
                    <div className="flex justify-between text-[8px] text-zinc-500 mb-0.5"><span className="text-amber-400 font-bold">{m.sender}</span><span>{m.time}</span></div>
                    <p className="text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: m.content }} />
                  </div>
                ))}
              </div>

              {/* CONSOLE OPERACIONAL DE DISPAROS DE COMBATE */}
              <div className="p-3 bg-black/40 space-y-2 shrink-0">
                <div className="grid grid-cols-7 gap-1">
                  {[4, 6, 8, 10, 12, 20, 100].map(f => (
                    <button key={f} onClick={() => handleRollDice(f)} className="py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-bold font-mono text-zinc-400 rounded">d{f}</button>
                  ))}
                </div>

                <div className="border-t border-zinc-800/60 pt-2 space-y-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Ações de Fábrica</span>
                  {selectedCharId ? (
                    (() => {
                      const charAtivo = characters.find(c => c.id === selectedCharId);
                      const skills = COMPENDIO_PODERES[charAtivo?.classe || 'guerreiro'];
                      const bonus = getCharacterBackpackBonus(charAtivo!);
                      const maxMpReal = charAtivo!.energyMax + bonus.mp;

                      return (
                        <div className="grid grid-cols-1 gap-1">
                          {skills.map(poder => {
                            const custo = poder.isUltimate ? Math.floor(maxMpReal * 0.35) : poder.cost;
                            const isQueued = activeSpellQueued?.id === poder.id;
                            return (
                              <button key={poder.id} onClick={() => handleSelectSkillToQueue(poder)} className={`p-1.5 rounded-lg border text-left flex justify-between items-center ${isQueued ? 'border-red-500 bg-red-950/30 animate-pulse' : poder.isUltimate ? 'bg-amber-600/10 border-amber-500/40' : 'bg-black border-zinc-800'}`}>
                                <span className="text-[10px] font-bold block text-zinc-200">{poder.icon} {poder.name}</span>
                                <span className="text-[8px] font-mono text-blue-400">-{custo} ENG</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-2 bg-black/40 border border-zinc-900 rounded-lg text-center text-[9px] text-zinc-500 italic">Selecione uma miniatura no painel...</div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1">
                  <button onClick={() => handleApplyLiveModifier('damage', 10)} className="py-1 bg-red-950/40 border border-red-900 text-red-400 font-bold text-[9px] rounded">-10 HP</button>
                  <button onClick={() => handleApplyLiveModifier('heal', 10)} className="py-1 bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-bold text-[9px] rounded">+10 HP</button>
                  <button onClick={() => handleApplyLiveModifier('energy', 5)} className="py-1 bg-blue-950/40 border border-blue-800 text-blue-400 font-bold text-[9px] rounded">-5 ENG</button>
                </div>

                {role === 'mestre' && selectedCharId && (
                  <button onClick={() => handleGrantExp(25)} className="w-full py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold rounded flex items-center justify-center gap-1"><Star className="w-3 h-3" /> Conceder +25 EXP</button>
                )}

                <div className="flex gap-2 pt-1">
                  <input type="text" placeholder="Ação..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 text-xs p-1.5 rounded text-white focus:outline-none" />
                  <button onClick={sendTextMessage} className="px-3 bg-amber-500 text-black font-bold text-xs rounded">Enviar</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL MOCHILA: CENTRAL DE EQUIPAMENTOS DA CAMPANHA */}
      <AnimatePresence>
        {showInventoryModal && selectedCharId && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl max-w-md w-full max-h-[60vh] flex flex-col justify-between gap-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-bold uppercase text-amber-500 tracking-wider">🎒 Mochila Inventário do Personagem</h3>
                <button onClick={() => setShowInventoryModal(false)} className="text-xs text-zinc-500 hover:text-white underline">Fechar</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {(characters.find(c => c.id === selectedCharId)?.mochila || []).length === 0 ? (
                  <div className="text-center p-8 text-zinc-600 text-xs italic">Sua mochila está completamente vazia. O mestre precisa alocar relíquias para você durante a jornada!</div>
                ) : (
                  (characters.find(c => c.id === selectedCharId)?.mochila || []).map(item => (
                    <div key={item.uid} onClick={() => toggleEquipItemInsideBackpack(item.uid)} className={`p-2.5 rounded-xl border text-left cursor-pointer flex items-center justify-between transition-all ${item.isEquipped ? 'bg-emerald-600/10 border-emerald-500 shadow shadow-emerald-500/10' : 'bg-black/40 border-zinc-800 hover:border-zinc-700'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <span className="text-[11px] font-bold block text-white">{item.name}</span>
                          <span className="text-[8px] font-mono text-zinc-500 block">BÔNUS EQUIPADO: HP:+{item.bonusHp} STR:+{item.bonusStr}</span>
                        </div>
                      </div>
                      <span className={`text-[8px] px-2 py-0.5 rounded font-mono font-bold ${item.isEquipped ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{item.isEquipped ? 'EQUIPADO' : 'GUARDADO'}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CRIADOR DE FICHAS COM DESIGN DE GERENTE ORGANIZADOR */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl max-w-sm w-full space-y-4">
              <h3 className="text-xs font-bold uppercase text-amber-500 tracking-wider">Forjar Nova Ficha de Campanha</h3>
              <div className="space-y-3 text-xs">
                <input type="text" placeholder="Nome" value={newCharName} onChange={(e) => setNewCharName(e.target.value)} className="w-full bg-neutral-950 border border-zinc-800 p-2 rounded-lg text-white outline-none" />
                <select value={newCharClasse} onChange={(e: any) => setNewCharClasse(e.target.value)} className="w-full bg-neutral-950 border border-zinc-800 p-2 rounded-lg text-white outline-none">
                  <option value="guerreiro">🪓 Guerreiro</option>
                  <option value="mago">🔥 Mago</option>
                  <option value="ladino">🗡️ Ladino</option>
                  <option value="elfo">✨ Elfo Healer</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Vida Max" value={newCharHp} onChange={(e) => setNewCharHp(e.target.value)} className="w-full bg-neutral-950 border p-2 rounded-lg text-white outline-none" />
                  <input type="text" placeholder="Emoji (🧙‍♂️, 🧝‍♂️, 🪨)" value={newCharIcon} onChange={(e) => setNewCharIcon(e.target.value)} className="w-full bg-neutral-950 border p-2 rounded-lg text-white outline-none" />
                </div>

                {/* CONTAINER CARGO GERENTE ORGANIZADOR (CO-MESTRE) */}
                <div className="bg-black/30 border border-zinc-800 p-2.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-300">Promover a Gerente Organizador</span>
                    <button onClick={() => setNewIsGerente(!newIsGerente)} className="text-blue-400">
                      {newIsGerente ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-zinc-600" />}
                    </button>
                  </div>
                  {newIsGerente && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-800 text-[9px] font-mono text-zinc-400">
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={newPermMapas} onChange={(e) => setNewPermMapas(e.target.checked)} /> Permitir Alterar Biomas e Texturas</label>
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={newPermItens} onChange={(e) => setNewPermItens(e.target.checked)} /> Permitir Customizar/Injetar Itens</label>
                    </div>
                  )}
                </div>

              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 bg-neutral-800 text-xs rounded-lg text-zinc-400">Cancelar</button>
                <button onClick={handleCreateSheet} className="flex-1 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
