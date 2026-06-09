import { Character, ScenarioScene, LogEntry } from '../types';

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  cta: string;
  stripePriceId: string;
}

export const PLATFORM_PLANS: Plan[] = [
  {
    id: 'premium',
    name: 'Taverneiro Premium (Local)',
    price: 'R$ 49,90',
    period: 'por mês',
    badge: 'Mesa Presencial / TV',
    description: 'Acesso total e irrestrito para mesas no mesmo ambiente, TV ou projetor.',
    features: [
      'Mapas Táticos Visuais Imersivos com Texturas de Alta Resolução, Sistema de Chefões (Boss) Colossais e Biblioteca Expansiva de Tokens Premium 2D.',
      'Fichas de Personagem Ilimitadas com Inventário Avançado',
      'Rolo de Dados Avançado (Multiplicadores e Modificadores)',
      'Histórico de Combate & Log em Tempo Real',
      'Editor de Cenários Interativo com Grid tático para Mestre',
      'Ativação Local Instantânea sem necessidade de Nuvem Compartilhada'
    ],
    cta: 'Assinar por R$ 49,90/mês',
    stripePriceId: 'price_taverneiro_monthly'
  },
  {
    id: 'forge',
    name: 'Taverna Forge Core (Online)',
    price: 'R$ 99,90',
    period: 'por mês',
    badge: 'Multiplayer On-line',
    description: 'Conexão direta em nuvem Firebase. Salas online infinitas para seus jogadores jogarem remotamente.',
    features: [
      'Tudo do plano Premium e mais:',
      'Multiplayer em tempo real conectado com Firebase (Sem limites de jogadores remotos)',
      'Link de convite direto sala-a-sala de forma simples',
      'Sincronização instantânea de Grid Tático, Chat, Logs de Fórmulas de dados e HP de criaturas',
      'Chat com suporte a upload de imagens de referência rápida',
      'Módulos de jogo online e painel mestre / jogador dinâmico'
    ],
    cta: 'Assinar por R$ 99,90/mês',
    stripePriceId: 'price_forge_monthly'
  }
];

export const SAAS_FEATURES = [
  {
    icon: 'Shield',
    title: 'Fichas de Personagens Dinâmicas',
    description: 'Crie e edite fichas interativas para D&D, Tormenta ou Ordem Paranormal. Altere HP, MP e atributos com um clique.'
  },
  {
    icon: 'Dice5',
    title: 'Rolador de Dados Tridimensional Sincronizado',
    description: 'Role d4, d6, d8, d10, d12, d20 ou faça rolagens customizadas com fórmulas avançadas, bônus automáticos e somatória instantânea.'
  },
  {
    icon: 'Scroll',
    title: 'Visualizador de Logs Narrativos',
    description: 'Acompanhe a história do combate e as interações do grupo em tempo real com marcadores visuais para acertos críticos e falhas dramáticas.'
  },
  {
    icon: 'Map',
    title: 'Editor de Cenários Tático (Grid)',
    description: 'Como Mestre, customize mapas de combate desenhando obstáculos (paredes), água, posicionando jogadores ou monstros diretamente na matriz.'
  }
];

export const FAQS = [
  {
    q: 'Como funciona a cobrança de R$ 49,90/mês?',
    a: 'É uma assinatura mensal sem fidelidade. Você pode cancelar quando quiser diretamente no seu painel. Aceitamos Cartão de Crédito e PIX com liberação instantânea.'
  },
  {
    q: 'Meus jogadores precisam pagar também?',
    a: 'Não! Apenas quem cria as campanhas (o Mestre) precisa da assinatura ativa. Seus jogadores podem entrar e usar as fichas gratuitamente sob o seu guarda-chuva!'
  },
  {
    q: 'Vocês têm integração com sistemas oficiais como D&D 5e?',
    a: 'Sim, nosso modelo de ficha de personagem é adaptado e altamente compatível com Dungeons & Dragons, Pathfinder, Tormenta20 e personalizáveis para outros sistemas.'
  }
];

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char_1',
    name: 'Eldrin Solis',
    class: 'Mago Evocador',
    level: 5,
    race: 'Alto Elfo',
    hp: 28,
    maxHp: 32,
    mp: 45,
    maxMp: 50,
    attributes: {
      strength: 8,
      dexterity: 15,
      constitution: 12,
      intelligence: 18,
      wisdom: 14,
      charisma: 11
    },
    inventory: ['Cajado de Carvalho Antigo', 'Grimório de runas douradas', 'Anel de Proteção contra Elementos', '3x Poções de Mana'],
    notes: 'Estudou na Academia de Cinzas. Anda à procura de pergaminhos antigos no Vale do Vento.'
  },
  {
    id: 'char_2',
    name: 'Karnak Quebra-Escudos',
    class: 'Guerreiro Campeão',
    level: 5,
    race: 'Meio-Orc',
    hp: 58,
    maxHp: 58,
    mp: 10,
    maxMp: 10,
    attributes: {
      strength: 18,
      dexterity: 13,
      constitution: 16,
      intelligence: 9,
      wisdom: 10,
      charisma: 8
    },
    inventory: ['Espada de Duas Mãos de Aço Negro', 'Armadura de Placas do Sol', 'Escudo de Ferro Batido', 'Ração de Viagem (7 dias)'],
    notes: 'Expulso do Clã do Lobo Cinzento por não aceitar ordens de um xamã maligno.'
  },
  {
    id: 'char_3',
    name: 'Lyra Corda-Veloz',
    class: 'Ladina Assassina',
    level: 4,
    race: 'Humana',
    hp: 31,
    maxHp: 35,
    mp: 15,
    maxMp: 15,
    attributes: {
      strength: 11,
      dexterity: 17,
      constitution: 13,
      intelligence: 12,
      wisdom: 11,
      charisma: 15
    },
    inventory: ['Adaga Curva Venenosa', 'Arco Curto Élfico', 'Cinto de Utilidades', 'Ferramentas de Ladrão'],
    notes: 'Trabalhava no sindicato das sombras em Porto Real. Fugiu após roubar um diamante do Barão.'
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log_1',
    timestamp: '13:05:22',
    type: 'system',
    sender: 'Taverna Bot',
    content: 'Mestre da Masmorra acabou de iniciar a sessão "O Selo de Fogo". Bem-vindos!'
  },
  {
    id: 'log_2',
    timestamp: '13:06:10',
    type: 'chat',
    sender: 'Eldrin Solis',
    content: 'Estou com meu cajado pronto e focado. Sinto uma presença mágica instável à nossa frente.'
  },
  {
    id: 'log_3',
    timestamp: '13:06:55',
    type: 'roll',
    sender: 'Karnak Quebra-Escudos',
    content: 'Rolagem de Percepção (d20 + 2): Resultado 18 [Rolagem bruta: 16]'
  },
  {
    id: 'log_4',
    timestamp: '13:07:30',
    type: 'combat',
    sender: 'Mestre da Masmorra',
    content: 'Dois Orcs saem das sombras do corredor carregando machados enferrujados! Iniciem Combate!'
  }
];

export const INITIAL_SCENARIOS: ScenarioScene[] = [
  {
    id: 'scene_1',
    name: 'Taverna do Dragão Dorminhoco',
    description: 'Um salão rústico de madeira com lareira acesa, mesas pesadas e um balcão do tavernista ao norte.',
    gridRows: 12,
    gridCols: 12,
    gridData: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'chest', 'wall'],
      ['wall', 'empty', 'water', 'water', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'player', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'enemy', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'wall', 'wall', 'empty', 'empty', 'wall', 'wall', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'water', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  },
  {
    id: 'scene_2',
    name: 'Masmorra Alagada',
    description: 'Uma série de corredores de pedra consumidos pela maré e infestados por criaturas marinhas.',
    gridRows: 12,
    gridCols: 12,
    gridData: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'wall'],
      ['wall', 'water', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'water', 'wall'],
      ['wall', 'water', 'empty', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'empty', 'water', 'wall'],
      ['wall', 'water', 'player', 'wall', 'chest', 'empty', 'empty', 'wall', 'enemy', 'empty', 'water', 'wall'],
      ['wall', 'water', 'empty', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'empty', 'water', 'wall'],
      ['wall', 'water', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'water', 'wall'],
      ['wall', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ]
  }
];

import { QuestArtifact, Quest } from '../types';

export const INITIAL_ARTIFACTS: QuestArtifact[] = [
  {
    id: 'art_1',
    name: 'Cálice do Fogo Sagrado',
    description: 'Um cálice dourado cravejado de rubis que contém uma chama eterna capaz de purificar qualquer maledicência.',
    icon: '🏆',
    color: 'from-yellow-500 via-amber-500 to-red-500',
    glowColor: 'rgba(245,158,11,0.6)',
    rarity: 'Lendário',
    model3DLabel: 'Cálice Dourado Flamejante'
  },
  {
    id: 'art_2',
    name: 'Espada do Rei Dragão',
    description: 'Forjada no sopro do primeiro dragão, esta lâmina rúnica cintila com energia ígnea destrutiva.',
    icon: '⚔️',
    color: 'from-red-600 via-orange-500 to-yellow-500',
    glowColor: 'rgba(239,68,68,0.6)',
    rarity: 'Épico',
    model3DLabel: 'Montante Incandescente'
  },
  {
    id: 'art_3',
    name: 'Anel do Éter Celestial',
    description: 'Um anel feito de metal estelar, permitindo ao usuário levitar e sintonizar com correntes arcanas cósmicas.',
    icon: '💍',
    color: 'from-blue-400 via-cyan-400 to-indigo-500',
    glowColor: 'rgba(56,189,248,0.6)',
    rarity: 'Épico',
    model3DLabel: 'Aliança Gravitacional'
  },
  {
    id: 'art_4',
    name: 'Cetro Arcano Estelar',
    description: 'Este cetro canaliza a luz das estrelas mortas para desencadear explosões de energia astral pura.',
    icon: '🔮',
    color: 'from-purple-500 via-pink-500 to-blue-500',
    glowColor: 'rgba(168,85,247,0.6)',
    rarity: 'Lendário',
    model3DLabel: 'Cajado de Meteorito'
  },
  {
    id: 'art_5',
    name: 'Chave do Portal de Prata',
    description: 'Uma relíquia de eras esquecidas que pode abrir fendas interdimensionais para terras inimagináveis.',
    icon: '🔑',
    color: 'from-slate-400 via-emerald-400 to-teal-500',
    glowColor: 'rgba(52,211,153,0.6)',
    rarity: 'Raro',
    model3DLabel: 'Chave Dimencional'
  },
  {
    id: 'art_6',
    name: 'Elmo do Guardião Solar',
    description: 'Um elmo radiante que emite uma aura de calor protetora e cega temporariamente os inimigos da luz.',
    icon: '🪖',
    color: 'from-amber-400 via-yellow-300 to-orange-400',
    glowColor: 'rgba(251,191,36,0.6)',
    rarity: 'Raro',
    model3DLabel: 'Elmo Helíaco de Latão'
  }
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_1',
    title: 'O Despertar do Vulcão',
    description: 'Investigar as trepidações anômalas no sopé da montanha de cinzas e deter o ritual do Culto da Chama Negra.',
    participants: ['char_1', 'char_2'],
    rewardGold: 350,
    rewardXp: 1200,
    rewardArtifactId: 'art_1',
    status: 'active'
  },
  {
    id: 'quest_2',
    title: 'O Resgate no Pântano das Almas',
    description: 'Localizar a comitiva perdida do rei e recuperar os pertences reais antes que as criaturas lodosas os destruam.',
    participants: ['char_3'],
    rewardGold: 200,
    rewardXp: 750,
    rewardArtifactId: 'art_5',
    status: 'inactive'
  }
];

