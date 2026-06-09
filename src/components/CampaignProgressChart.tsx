import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Quest } from '../types';

interface CampaignProgressChartProps {
  quests: Quest[];
}

export default function CampaignProgressChart({ quests }: CampaignProgressChartProps) {
  const safeQuests = (Array.isArray(quests) ? quests : Object.values(quests || {})) as Quest[];
  // Extract completed quests and calculate cumulative Gold & XP
  const completed = safeQuests.filter((q) => q && q.status === 'completed');

  // Chart data starts with an index 0 base anchor
  const data = [
    { name: 'Início', Ouro: 0, XP: 0 }
  ];

  let cumulativeGold = 0;
  let cumulativeXp = 0;

  completed.forEach((q, idx) => {
    cumulativeGold += q.rewardGold || 0;
    cumulativeXp += q.rewardXp || 0;
    data.push({
      name: q.title.length > 12 ? q.title.substring(0, 10) + '...' : q.title,
      Ouro: cumulativeGold,
      XP: cumulativeXp
    });
  });

  if (completed.length === 0) {
    return (
      <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl text-center flex flex-col items-center justify-center min-h-[180px]">
        <span className="text-3xl mb-2">📊</span>
        <h4 className="font-serif text-xs font-bold text-neutral-400 uppercase tracking-widest">Dashboard de Progressão</h4>
        <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto leading-normal">
          Nenhuma missão foi concluída nesta campanha ainda. Conclua missões para pintar curvas de Ouro e XP conquistados!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/60 p-5 rounded-2xl shadow-xl space-y-4">
      <div>
        <span className="text-[9px] font-mono tracking-widest text-amber-500 font-black block uppercase">MÉTRICAS DA CAMPANHA</span>
        <h3 className="font-serif text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
          📈 Evolução Histórica do Grupo
        </h3>
        <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">Progressão cumulativa de saques de ouro e prestígio (experiência) adquiridos ao longo das campanhas.</p>
      </div>

      <div className="w-full h-56 font-mono text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOuro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.4} />
            <XAxis dataKey="name" stroke="#555" tickLine={false} />
            <YAxis stroke="#555" tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c0d10',
                border: '1px solid #30363d',
                borderRadius: '10px',
                color: '#e2e8f0',
                fontFamily: 'monospace'
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area
              type="monotone"
              dataKey="Ouro"
              name="Ouro Acumulado (PO)"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOuro)"
            />
            <Area
              type="monotone"
              dataKey="XP"
              name="XP Acumulada"
              stroke="#a78bfa"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorXp)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
