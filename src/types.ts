export interface UserAuth {
  loggedIn: boolean;
  email: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
}

export type CurrentView = 'landing' | 'login' | 'register' | 'app' | 'paywall' | 'forge';

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  race: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  inventory: string[];
  notes: string;
  clothingColor?: string;
}

export interface DiceRoll {
  id: string;
  timestamp: string;
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  type: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'roll' | 'chat' | 'system' | 'combat';
  sender: string;
  content: string;
  metadata?: {
    type: 'displacement';
    scenarioId: string;
    tokenName: string;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    tileType: string;
    tokenStatus?: { hp: number; maxHp: number; mp: number; maxMp: number; name: string };
  };
}

export interface ScenarioScene {
  id: string;
  name: string;
  description: string;
  gridRows: number;
  gridCols: number;
  gridData: string[][]; // tile type identifiers: 'empty', 'wall', 'water', 'player', 'enemy', 'chest'
  backgroundTexture?: string;
  fogOfWar?: boolean[][];
  bossHp?: number;
  bossMaxHp?: number;
  tokenStatuses?: Record<string, { hp: number; maxHp: number; mp: number; maxMp: number; name: string }>;
}

export interface QuestArtifact {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  glowColor: string;
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  model3DLabel: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  participants: string[]; // Selected Character IDs
  rewardGold: number;
  rewardXp: number;
  rewardArtifactId: string; // Unlocks a 3D Artifact item
  status: 'inactive' | 'active' | 'completed';
}

