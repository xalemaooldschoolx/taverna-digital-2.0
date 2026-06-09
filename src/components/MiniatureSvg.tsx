import { motion } from 'motion/react';

// -----------------------------------------------------------------
// METALLIC RESIN BASE FOR TABLETOP VTT LOOK
// -----------------------------------------------------------------
interface ResinBaseProps {
  type: string; // 'hero' | 'enemy' | 'boss'
  subclass?: string;
  clothingColor?: string;
}

export function ResinBase({ type, subclass, clothingColor }: ResinBaseProps) {
  let rimColor = 'url(#heroGoldBaseGrad)';
  let borderColor = '#f59e0b';
  let floorColor = 'url(#heroStoneFloorGrad)';
  let isBoss = type.startsWith('boss');
  let isEnemy = type.startsWith('enemy') && !isBoss;

  if (isBoss) {
    rimColor = 'url(#bossPurpleBaseGrad)';
    borderColor = '#bf80ff';
    floorColor = 'url(#bossMagicFloorGrad)';
  } else if (isEnemy) {
    rimColor = 'url(#enemyRubyBaseGrad)';
    borderColor = '#ef4444';
    floorColor = 'url(#enemyObsidianFloorGrad)';
  }

  // Choose subclass-specific light circles if hero
  if (!isBoss && !isEnemy) {
    if (clothingColor) {
      borderColor = clothingColor;
      floorColor = 'url(#heroStoneFloorGrad)';
    } else if (subclass === 'mago') {
      rimColor = 'url(#heroAmethystBaseGrad)';
      borderColor = '#a855f7';
      floorColor = 'url(#heroMageFloorGrad)';
    } else if (subclass === 'arqueiro' || subclass === 'hunter') {
      rimColor = 'url(#heroJadeBaseGrad)';
      borderColor = '#10b981';
      floorColor = 'url(#heroForestFloorGrad)';
    }
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 select-none overflow-visible pointer-events-none z-10">
      <defs>
        {/* Hero Metallic Gradients */}
        <linearGradient id="heroGoldBaseGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#ca8a04" />
          <stop offset="50%" stopColor="#854d0e" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        <linearGradient id="heroAmethystBaseGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="30%" stopColor="#8b5cf6" />
          <stop offset="60%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#ddd6fe" />
        </linearGradient>
        <linearGradient id="heroJadeBaseGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="30%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>

        {/* Enemy / Mob Base Gradients */}
        <linearGradient id="enemyRubyBaseGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="35%" stopColor="#b91c1c" />
          <stop offset="70%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#fee2e2" />
        </linearGradient>

        {/* Boss Colossal Gradients */}
        <linearGradient id="bossPurpleBaseGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fae8ff" />
          <stop offset="20%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#6b21a8" />
          <stop offset="80%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#f5d0fe" />
        </linearGradient>

        {/* Top-deck flooring fills */}
        <radialGradient id="heroStoneFloorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="75%" stopColor="#1c0a00" />
          <stop offset="100%" stopColor="#0a0300" />
        </radialGradient>
        <radialGradient id="heroMageFloorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2e1065" />
          <stop offset="75%" stopColor="#0f0521" />
          <stop offset="100%" stopColor="#05010a" />
        </radialGradient>
        <radialGradient id="heroForestFloorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="75%" stopColor="#022c22" />
          <stop offset="100%" stopColor="#011210" />
        </radialGradient>
        <radialGradient id="enemyObsidianFloorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="70%" stopColor="#0c0a09" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <radialGradient id="bossMagicFloorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#581c87" />
          <stop offset="40%" stopColor="#1e1b4b" />
          <stop offset="85%" stopColor="#0f051d" />
          <stop offset="100%" stopColor="#030005" />
        </radialGradient>

        {/* Shadow Drop filter */}
        <filter id="resinDropShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Pulsing Aura Circle below */}
      <ellipse 
        cx="50" cy="74" rx="43" ry="15" 
        fill="none" 
        stroke={borderColor} 
        strokeWidth={isBoss ? "2.5" : "1.5"} 
        strokeDasharray={isBoss ? "5,5" : "3,4"} 
        className={isBoss ? "animate-spin" : ""}
        style={{ transformOrigin: '50px 74px', animationDuration: '24s' }}
        opacity={isBoss ? "0.85" : "0.5"}
      />

      {/* Shadow layer */}
      <ellipse cx="50" cy="78" rx="38" ry="12" fill="#000" filter="url(#resinDropShadow)" opacity="0.9" />

      {/* 3D Vertical Side extrusion (oblique ring bevel) */}
      <path d="M 12,74 A 38,13 0 0 0 88,74 L 88,81 A 38,13 0 0 1 12,81 Z" fill={rimColor} />

      {/* Top face of the pedestal */}
      <ellipse cx="50" cy="74" rx="38" ry="13" fill={floorColor} stroke={borderColor} strokeWidth={isBoss ? "3" : "2"} />
      
      {/* Intrinsic inside groove for detail */}
      <ellipse cx="50" cy="74" rx="35" ry="11.5" fill="none" stroke="#000000" strokeWidth="1.2" opacity="0.55" />
    </svg>
  );
}

// -----------------------------------------------------------------
// HIGH-FIDELITY FIGURINES (PURE VECTOR HEROES & MONSTERS)
// -----------------------------------------------------------------
interface FigurineProps {
  id: string; // class identifier or enemy type or boss type
  gender?: 'm' | 'f';
  clothingColor?: string;
}

export function Figurine({ id, gender = 'm', clothingColor }: FigurineProps) {
  const normId = id.toLowerCase();
  const isFemale = gender === 'f';

  // Draw customized vector figures matching the requested character categories:
  switch (normId) {
    // ------------------- HEROES -------------------
    case 'guerreiro':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)]">
          <defs>
            <linearGradient id="steelArmor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="goldHilt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Cape */}
          <path d="M 32,55 Q 15,68 35,84 Q 50,86 65,84 Q 85,68 68,55 Z" fill={clothingColor || (isFemale ? "#9333ea" : "#b91c1c")} opacity="0.9" />
          
          {/* Heavy Boots */}
          <ellipse cx="40" cy="78" rx="6" ry="3" fill="#1e293b" />
          <ellipse cx="60" cy="78" rx="6" ry="3" fill="#1e293b" />

          {/* Torso Plate */}
          <path d="M 30,45 C 30,68 45,72 50,72 C 55,72 70,68 70,45 Z" fill="url(#steelArmor)" stroke="#1e293b" strokeWidth="1.5" />
          {/* Rune insignia on torso */}
          <path d="M 50,48 L 50,62 M 44,53 L 56,53" stroke={isFemale ? "#ca8a04" : "#f59e0b"} strokeWidth="2.5" strokeLinecap="round" />

          {/* Long flowing ponytail for female */}
          {isFemale && (
            <path d="M 50,24 Q 68,26 65,58" fill="none" stroke="#fef08a" strokeWidth="5.5" strokeLinecap="round" />
          )}

          {/* Giant Shield (Left Arm) */}
          <path d="M 18,35 C 18,35 12,65 30,76 C 48,65 42,35 42,35 Z" fill={isFemale ? "#581c87" : "#991b1b"} stroke="url(#goldHilt)" strokeWidth="2.5" />
          <circle cx="30" cy="52" r="6" fill="url(#goldHilt)" />

          {/* Right Arm swinging Glistening weapon */}
          <path d="M 68,44 Q 85,38 88,28" stroke="url(#steelArmor)" strokeWidth="5" strokeLinecap="round" />
          {isFemale ? (
            /* Golden Halberd Spear */
            <path d="M 88,28 L 72,-16 M 72,-16 L 68,-10 L 76,-16 Z" stroke="url(#goldHilt)" strokeWidth="3" fill="url(#goldHilt)" />
          ) : (
            /* Big sword blade */
            <path d="M 87,26 L 75,-2 L 70,0 L 83,28 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          )}

          {/* Helmet/Head */}
          <rect x="40" y="24" width="20" height="20" rx={isFemale ? "9" : "6"} fill="url(#steelArmor)" stroke="#1e293b" strokeWidth="1.5" />
          <path d="M 42,30 L 58,30" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
          {isFemale ? (
            <path d="M 50,24 L 50,15" stroke="url(#goldHilt)" strokeWidth="2.5" />
          ) : (
            <path d="M 50,14 Q 38,-3 48,-6 Q 58,-4 52,14 Z" fill="#ef4444" />
          )}
        </svg>
      );

    case 'mago':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(147,51,234,0.5)]">
          <defs>
            <linearGradient id={`magoRobeGrad-${clothingColor ? clothingColor.replace('#', '') : (isFemale ? 'female' : 'male')}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={clothingColor || (isFemale ? "#ec4899" : "#c084fc")} />
              <stop offset="50%" stopColor={clothingColor || (isFemale ? "#be185d" : "#673ab7")} />
              <stop offset="100%" stopColor={clothingColor ? "#0a0f1d" : "#311b92"} />
            </linearGradient>
            <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <radialGradient id="crystalBallGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor={isFemale ? "#ec4899" : "#a855f7"} />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
          </defs>
          {/* Star Swirl background */}
          <ellipse cx="50" cy="78" rx="28" ry="8" fill="none" stroke={isFemale ? "#f472b6" : "#bf80ff"} strokeWidth="1.5" className="animate-pulse" />

          {/* Robe Gown */}
          <path d="M 32,78 L 40,46 L 60,46 L 68,78 Q 50,82 32,78 Z" fill={`url(#magoRobeGrad-${clothingColor ? clothingColor.replace('#', '') : (isFemale ? 'female' : 'male')})`} stroke="#1e182a" strokeWidth="1.5" />

          {/* Floating cosmic hair of wizardess */}
          {isFemale ? (
            <path d="M 33,36 Q 16,56 34,70 M 67,36 Q 84,56 66,70" fill="none" stroke="#f472b6" strokeWidth="3" opacity="0.8" />
          ) : (
            <path d="M 41.5,41 Q 50,60 58.5,41 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" /> /* Beard */
          )}

          {/* Staff */}
          <path d="M 28,82 L 28,15" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          {/* Levitating Crystal Top */}
          <circle cx="28" cy="8" r="8" fill="url(#crystalBallGlow)" className="animate-pulse" />

          {/* Right Hand Magic Shield */}
          <circle cx="82" cy="40" r="10" fill="none" stroke={isFemale ? "#ec4899" : "#a855f7"} strokeWidth="2.5" strokeDasharray="3,3" className="animate-spin" style={{ animationDuration: '4s', transformOrigin: '82px 40px' }} />

          {/* Hood / Hat */}
          <path d="M 34,34 Q 50,28 66,34 L 50,2 L 34,34 Z" fill={`url(#magoRobeGrad-${clothingColor ? clothingColor.replace('#', '') : (isFemale ? 'female' : 'male')})`} stroke="#2e1065" strokeWidth="1.5" />
          <ellipse cx="50" cy="34" rx="16" ry="4" fill="url(#goldTrim)" />
          
          <circle cx="50" cy="38" r="9" fill={isFemale ? "#fbcfe8" : "#fed7aa"} />
          <circle cx="46" cy="38" r="1.5" fill="#22d3ee" className="animate-pulse" />
          <circle cx="54" cy="38" r="1.5" fill="#22d3ee" className="animate-pulse" />
        </svg>
      );

    case 'arqueiro':
    case 'hunter':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(16,185,129,0.5)]">
          <defs>
            <linearGradient id={`forestGreenGrad-${clothingColor ? clothingColor.replace('#', '') : 'default'}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={clothingColor || "#34d399"} />
              <stop offset="60%" stopColor={clothingColor || "#047857"} stopOpacity={0.8} />
              <stop offset="100%" stopColor={clothingColor ? "#080c14" : "#064e3b"} />
            </linearGradient>
            <linearGradient id="woodBow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <path d="M 30,46 L 38,72 L 62,72 L 70,46 Z" fill={`url(#forestGreenGrad-${clothingColor ? clothingColor.replace('#', '') : 'default'})`} stroke="#022c22" strokeWidth="1.5" />

          {/* Female wild long hair */}
          {isFemale && (
            <path d="M 34,38 Q 20,54 28,74 M 66,38 Q 80,54 72,74" fill="none" stroke="#f59e0b" strokeWidth="3" />
          )}

          {/* Long bow */}
          <path d="M 80,12 Q 52,44 80,76" fill="none" stroke="url(#woodBow)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 80,12 L 80,76" stroke="#67e8f9" strokeWidth="1" opacity="0.6" />

          {/* Drawn Arrow */}
          <path d="M 40,44 L 84,44" stroke="#cbd5e1" strokeWidth="2.5" />
          <polygon points="84,44 78,41 78,47" fill="#10b981" />

          {/* Hood */}
          <path d="M 36,36 Q 50,22 64,36 C 64,44 36,44 36,36 Z" fill={`url(#forestGreenGrad-${clothingColor ? clothingColor.replace('#', '') : 'default'})`} stroke="#022c22" strokeWidth="1.5" />
          <circle cx="50" cy="38" r="7.5" fill="#fed7aa" />
          {/* Elven ears poking out */}
          <path d="M 42,36 L 35,32 L 41,39 Z" fill="#fed7aa" />
          <path d="M 58,36 L 65,32 L 59,39 Z" fill="#fed7aa" />
          <circle cx="50" cy="38" r="1.5" fill="#4ade80" />
        </svg>
      );

    case 'ladino':
    case 'rogue':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(17,24,39,0.85)]">
          <defs>
            <linearGradient id="midnightDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={isFemale ? "#701a75" : "#4b5563"} />
              <stop offset="50%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>
            <linearGradient id="venomGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <path d="M 32,46 L 38,70 L 62,70 L 68,46 Z" fill="url(#midnightDark)" stroke="#030712" strokeWidth="1.5" />

          {/* Female dynamic sleek cloak flow */}
          {isFemale && (
            <path d="M 33,52 Q 15,62 18,85" stroke="url(#midnightDark)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          )}

          {/* Left / Right poison daggers */}
          <path d="M 24,46 L 10,34" stroke="url(#venomGreen)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 76,46 L 90,34" stroke="url(#venomGreen)" strokeWidth="4" strokeLinecap="round" />

          {/* Hood */}
          <path d="M 34,36 Q 50,18 66,36 C 66,48 34,48 34,36 Z" fill="url(#midnightDark)" stroke="#030712" strokeWidth="1.5" />
          <path d="M 38,38 Q 50,30 62,38 Z" fill="#030712" />
          <ellipse cx="45" cy="37" rx="2" ry="1" fill="#eab308" />
          <ellipse cx="55" cy="37" rx="2" ry="1" fill="#eab308" />
        </svg>
      );

    case 'elfo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(52,211,153,0.5)]">
          <defs>
            <linearGradient id="elfGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="elfGown" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ecfdf5" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          {/* Woodland aura */}
          <circle cx="50" cy="50" r="32" fill="none" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="4,6" className="animate-pulse" />

          {/* Tunic / Gown */}
          <path d="M 32,76 L 40,46 L 60,46 L 68,76 Z" fill="url(#elfGown)" stroke="#047857" strokeWidth="1.5" />

          {/* Long Flowing hair and beautiful ears */}
          <path d="M 36,32 Q 22,54 28,78 M 64,32 Q 78,54 72,78" fill="none" stroke="#fef08a" strokeWidth="3.5" />
          {/* Elven Crown */}
          <path d="M 40,24 L 50,14 L 60,24" fill="none" stroke="url(#elfGold)" strokeWidth="2" />

          {/* Hand staff */}
          <path d="M 24,82 L 24,18" stroke="url(#elfGold)" strokeWidth="3" />
          <circle cx="24" cy="14" r="5" fill="#34d399" className="animate-pulse" />

          {/* Head */}
          <circle cx="50" cy="32" r="10" fill="#fef08a" opacity="0.15" />
          <circle cx="50" cy="32" r="8" fill="#fed7aa" />
          {/* Pointy ears */}
          <path d="M 42,32 L 32,25 L 42,36 Z" fill="#fed7aa" />
          <path d="M 58,32 L 68,25 L 58,36 Z" fill="#fed7aa" />
          <ellipse cx="47" cy="31" rx="1.5" ry="1" fill="#4ade80" />
          <ellipse cx="53" cy="31" rx="1.5" ry="1" fill="#4ade80" />
        </svg>
      );

    case 'elfo_negro':
    case 'elfo negro':
    case 'dark_elf':
    case 'dark elf':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(168,85,247,0.6)]">
          <defs>
            <linearGradient id="drowArmor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4a044e" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>
            <linearGradient id="magicViolet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#701a75" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="30" fill="none" stroke="#f472b6" strokeWidth="1" strokeDasharray="2,4" className="animate-ping" style={{ animationDuration: '3s' }} />

          {/* Jet black body */}
          <path d="M 32,76 L 40,46 L 60,46 L 68,76 Z" fill="url(#drowArmor)" stroke="#d946ef" strokeWidth="1" />

          {/* Long silver hair */}
          <path d="M 36,32 Q 20,54 26,78 M 64,32 Q 80,54 74,78" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />

          {/* Dual scimitars of venom */}
          <path d="M 22,50 L 8,36" stroke="url(#magicViolet)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 78,50 L 92,36" stroke="url(#magicViolet)" strokeWidth="3" strokeLinecap="round" />

          {/* Charcoal skin head */}
          <circle cx="50" cy="32" r="8" fill="#312e81" />
          {/* Long pointy elven ears */}
          <path d="M 42,32 L 32,28 L 42,36 Z" fill="#312e81" />
          <path d="M 58,32 L 68,28 L 58,36 Z" fill="#312e81" />
          {/* Evil red eyes */}
          <circle cx="47" cy="31" r="1.5" fill="#f43f5e" className="animate-pulse" />
          <circle cx="53" cy="31" r="1.5" fill="#f43f5e" className="animate-pulse" />
        </svg>
      );

    case 'anciao':
    case 'anciões':
    case 'ancião':
    case 'elder':
    case 'ancião com cajado':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]">
          {/* Rustic cloak */}
          <path d="M 30,78 L 40,46 L 60,46 L 70,78 Z" fill="#78350f" opacity="0.85" stroke="#451a03" strokeWidth="1.5" />
          <path d="M 40,46 L 50,78 L 60,46" fill="none" stroke="#fbbf24" strokeWidth="1" />

          {/* Hair representation */}
          {isFemale ? (
            /* Bun of elder sage */
            <>
              <circle cx="50" cy="20" r="5" fill="#94a3b8" />
              <path d="M 42,18 L 58,22" stroke="#cbd5e1" strokeWidth="1.5" />
            </>
          ) : (
            /* Very long white beard */
            <path d="M 38,36 Q 50,76 62,36 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
          )}

          {/* Lantern Staff */}
          <path d="M 26,82 L 26,14" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
          {/* Glowing lantern */}
          <circle cx="26" cy="14" r="6.5" fill="#fef08a" className="animate-pulse" />
          <circle cx="26" cy="14" r="12" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />

          {/* Hunched face */}
          <circle cx="50" cy="32" r="8" fill="#fed7aa" />
          <ellipse cx="47" cy="31" rx="1" ry="1" fill="#1e1b4b" />
          <ellipse cx="53" cy="31" rx="1" ry="1" fill="#1e1b4b" />
        </svg>
      );

    case 'tita':
    case 'titã':
    case 'titan':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[120%] w-[120%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_10px_20px_rgba(6,182,212,0.65)]">
          <defs>
            <linearGradient id="titanMuscular" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="stormLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Swirling lightning ring */}
          <circle cx="50" cy="50" r="35" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeDasharray="6,12" className="animate-spin" style={{ animationDuration: '6s' }} />

          {/* Giant Muscular Core */}
          <path d="M 24,40 C 24,68 40,76 50,76 C 60,76 76,68 76,40 Z" fill="url(#titanMuscular)" stroke="#0f172a" strokeWidth="2" />
          
          {/* Runic tattoos */}
          <path d="M 36,46 Q 50,56 64,46" fill="none" stroke="#67e8f9" strokeWidth="2.5" className="animate-pulse" />

          {/* Electric Warhammer (or Spear) */}
          <path d="M 82,84 L 82,-4" stroke="#cbd5e1" strokeWidth="3" />
          {/* Hammer Block */}
          <rect x="72" y="-12" width="20" height="12" rx="2" fill="#475569" stroke="#67e8f9" strokeWidth="1.5" />

          {/* Colossal Head */}
          <circle cx="50" cy="24" r="10" fill="url(#titanMuscular)" />
          {/* Glowing Eyes */}
          <circle cx="46" cy="24" r="2" fill="#fff" className="animate-ping" />
          <circle cx="54" cy="24" r="2" fill="#fff" className="animate-ping" />
        </svg>
      );

    case 'feiticeiro':
    case 'feiticeira':
    case 'sorcerer':
    case 'sorceress':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(239,68,68,0.7)]">
          <defs>
            <linearGradient id="fireCape" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          {/* Flaming auric wings */}
          <path d="M 25,48 Q -4,22 15,68 Z M 75,48 Q 104,22 85,68 Z" fill="url(#fireCape)" stroke="#ea580c" strokeWidth="1" />

          {/* Core Body */}
          <path d="M 32,76 L 40,46 L 60,46 L 68,76 Z" fill="#7f1d1d" stroke="#f59e0b" strokeWidth="1.5" />

          {/* Casting spell effect */}
          <circle cx="80" cy="42" r="6" fill="#f59e0b" className="animate-ping" />

          {/* Crown */}
          <path d="M 42,22 L 46,12 L 50,18 L 54,12 L 58,22" fill="url(#fireCape)" stroke="#f59e0b" strokeWidth="1" />

          {/* Head & hair */}
          <path d="M 36,32 Q 22,54 26,74 M 64,32 Q 78,54 74,74" fill="none" stroke={isFemale ? "#ef4444" : "#1e1b4b"} strokeWidth="4" />
          <circle cx="50" cy="30" r="8" fill="#fbcfe8" />
          <circle cx="47" cy="29" r="1.5" fill="#f59e0b" />
          <circle cx="53" cy="29" r="1.5" fill="#f59e0b" />
        </svg>
      );

    case 'aldeao':
    case 'aldeão':
    case 'generic':
    default:
      if (normId.startsWith('boss')) return null; // handled separately
      if (normId.startsWith('enemy:')) return null; // handled separately
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(245,158,11,0.5)]">
          {/* Peasant apron/tunic */}
          <path d="M 32,78 L 40,46 L 60,46 L 68,78 Z" fill={isFemale ? "#2563eb" : "#78350f"} stroke="#111" strokeWidth="1" />
          {isFemale && (
            <path d="M 35,52 L 65,52 Z" stroke="#fff" strokeWidth="3" /> /* White apron */
          )}

          {/* Carrying accessory */}
          {isFemale ? (
            /* Fruit Basket */
            <>
              <circle cx="24" cy="56" r="6" fill="#ca8a04" />
              <circle cx="22" cy="54" r="2.5" fill="#ef4444" />
              <circle cx="25" cy="54" r="2.5" fill="#ef4444" />
            </>
          ) : (
            /* Peasant pitchfork */
            <>
              <line x1="26" y1="82" x2="26" y2="18" stroke="#451a03" strokeWidth="2.5" />
              <path d="M 22,18 L 30,18 M 22,18 L 22,8 M 26,18 L 26,8 M 30,18 L 30,18" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Cheerful Head & Hat */}
          <circle cx="50" cy="32" r="8" fill="#fed7aa" />
          {isFemale ? (
            /* Bandana on hair */
            <path d="M 38,28 Q 50,14 62,28 Z" fill="#ef4444" />
          ) : (
            /* Straw Hat */
            <>
              <ellipse cx="50" cy="24" rx="14" ry="4" fill="#fbbf24" stroke="#d97706" />
              <path d="M 40,24 Q 50,8 60,24 Z" fill="#fbbf24" stroke="#d97706" />
            </>
          )}
          
          <circle cx="47" cy="31" r="1" fill="#111" />
          <circle cx="53" cy="31" r="1" fill="#111" />
          <path d="M 46,35 Q 50,38 54,35" fill="none" stroke="#e11d48" strokeWidth="1.5" />
        </svg>
      );
  }
}

// -----------------------------------------------------------------
// MENACING ENEMY FIGURINES (GOBLIN, ORC, SKELETON, SPIDER, DRAGON)
// -----------------------------------------------------------------
interface EnemyFigurineProps {
  id: string;
  gender?: 'm' | 'f';
}

export function EnemyFigurine({ id, gender = 'm' }: EnemyFigurineProps) {
  const normId = id.toLowerCase();
  const isFemale = gender === 'f';

  switch (normId) {
    case 'goblin':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[110%] w-[110%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_6px_12px_rgba(16,185,129,0.45)]">
          <ellipse cx="50" cy="74" rx="20" ry="5" fill="#0d1f14" opacity="0.8" />
          <path d="M 35,52 L 40,72 L 60,72 L 65,52 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
          
          {/* Weapon */}
          {isFemale ? (
            /* Short elven blowpipe / bow */
            <path d="M 62,56 Q 78,44 65,30" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            /* Rusty dagger */
            <path d="M 64,56 L 78,54" stroke="#78716c" strokeWidth="3.5" strokeLinecap="round" />
          )}

          {/* Ears & Head */}
          <path d="M 34,34 Q 15,22 34,38 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
          <path d="M 66,34 Q 85,22 66,38 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
          <circle cx="50" cy="38" r="12" fill="#4ade80" stroke="#166534" strokeWidth="1.5" />

          {/* Female earrings of gold */}
          {isFemale && (
            <>
              <circle cx="31" cy="40" r="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="69" cy="40" r="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            </>
          )}

          <ellipse cx="45" cy="36" rx="2" ry="1" fill="#fbbf24" />
          <ellipse cx="55" cy="36" rx="2" ry="1" fill="#fbbf24" />
        </svg>
      );

    case 'orc':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(239,68,68,0.5)]">
          <defs>
            <linearGradient id="orcSkin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="rustyIron" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#44403c" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="74" rx="28" ry="7" fill="#1c0101" opacity="0.8" />

          <rect x="34" y="64" width="10" height="12" rx="2" fill="url(#orcSkin)" />
          <rect x="56" y="64" width="10" height="12" rx="2" fill="url(#orcSkin)" />
          
          <path d="M 28,50 L 36,66 L 64,66 L 72,50 Z" fill="#7f1d1d" stroke="#520707" strokeWidth="1.5" />

          {/* Muscle Torso */}
          <path d="M 22,38 C 22,58 35,62 50,62 L 78,38 Z" fill="url(#orcSkin)" stroke="#064e3b" strokeWidth="2" />

          {/* Female wild long hair braid */}
          {isFemale && (
            <path d="M 50,18 Q 28,24 24,54" fill="none" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" />
          )}

          {/* Dual Axe weapon */}
          <line x1="80" y1="48" x2="94" y2="20" stroke="#78350f" strokeWidth="3" />
          <path d="M 94,20 Q 106,14 98,6 Q 88,-1 92,14 Z" fill="url(#rustyIron)" stroke="#111" strokeWidth="1" />

          {/* Head */}
          <rect x="36" y="16" width="28" height="24" rx="8" fill="url(#orcSkin)" stroke="#064e3b" strokeWidth="1.5" />
          <ellipse cx="44" cy="24" rx="3" ry="1.5" fill="#ef4444" />
          <ellipse cx="56" cy="24" rx="3" ry="1.5" fill="#ef4444" />
          {/* Tusk */}
          <polygon points="41,36 43,30 45,36" fill="#fff" />
          <polygon points="59,36 57,30 55,36" fill="#fff" />
        </svg>
      );

    case 'skeleton':
    case 'esqueleto':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[110%] w-[110%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_6px_12px_rgba(255,255,255,0.25)]">
          <ellipse cx="50" cy="74" rx="20" ry="5" fill="#0f172a" opacity="0.85" />
          <line x1="50" y1="36" x2="50" y2="68" stroke="#f1f5f9" strokeWidth="4.5" />

          {/* Ribs */}
          <path d="M 38,44 Q 50,41 62,44" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <path d="M 36,50 Q 50,47 64,50" fill="none" stroke="#f1f5f9" strokeWidth="3" />

          {/* Female Crown for Skeletal Warlock / Maiden */}
          {isFemale ? (
            <>
              {/* Glowing purple spell dust */}
              <circle cx="80" cy="46" r="6" fill="#c084fc" className="animate-pulse" />
              <polygon points="42,16 46,6 50,14 54,6 58,16" fill="#bf80ff" stroke="#701a75" strokeWidth="0.8" />
            </>
          ) : (
            /* Shield for warrior */
            <>
              <circle cx="16" cy="52" r="13" fill="#78350f" stroke="#e2e8f0" strokeWidth="1.5" />
              <path d="M 68,52 L 80,44" stroke="#f1f5f9" strokeWidth="3" />
              <path d="M 80,44 Q 96,16 88,8" fill="none" stroke="#cbd5e1" strokeWidth="3" />
            </>
          )}

          {/* Skull */}
          <rect x="42" y="16" width="16" height="16" rx="4" fill="#f1f5f9" stroke="#94a3b8" />
          <circle cx="46" cy="22" r="2.5" fill="#000" />
          <circle cx="46" cy="22" r="1.5" fill="#06b6d4" className="animate-pulse" />
          <circle cx="54" cy="22" r="2.5" fill="#000" />
          <circle cx="54" cy="22" r="1.5" fill="#06b6d4" className="animate-pulse" />
        </svg>
      );

    case 'spider':
    case 'aranha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[110%] w-[110%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_6px_12px_rgba(168,85,247,0.55)]">
          <ellipse cx="50" cy="74" rx="26" ry="6" fill="#1e0a3b" opacity="0.85" />
          
          {/* Multiple creepy crawling legs */}
          <path d="M 40,48 Q 14,40 8,66 M 40,54 Q 10,50 6,76" fill="none" stroke={isFemale ? "#4a044e" : "#1e1b4b"} strokeWidth="4" />
          <path d="M 60,48 Q 86,40 92,66 M 60,54 Q 90,50 94,76" fill="none" stroke={isFemale ? "#4a044e" : "#1e1b4b"} strokeWidth="4" />

          {/* Bulbous rear abdomen */}
          <ellipse cx="50" cy="32" rx="18" ry="14" fill={isFemale ? "#2e1065" : "#180029"} stroke="#581c87" strokeWidth="2" />
          
          {/* Female: Big glowing green egg sacs or Web markings */}
          {isFemale ? (
            <circle cx="50" cy="32" r="6" fill="#22c55e" className="animate-pulse" />
          ) : (
            <path d="M 50,20 L 50,44" stroke="#f43f5e" strokeWidth="2.5" />
          )}

          {/* Head & eyes */}
          <circle cx="50" cy="50" r="10" fill="#3b0764" />
          <circle cx="45" cy="48" r="1.5" fill="#ef4444" />
          <circle cx="50" cy="47" r="1.5" fill="#ef4444" />
          <circle cx="55" cy="48" r="1.5" fill="#ef4444" />
        </svg>
      );

    case 'dragon':
    case 'dragao':
    case 'dragão':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(239,68,68,0.6)]">
          <ellipse cx="50" cy="74" rx="24" ry="6" fill="#120205" />

          {/* Female/Ice Dragon vs Male/Fire Dragon scales */}
          <path d="M 34,44 Q 5,15 15,48 Z M 66,44 Q 95,15 85,48 Z" fill={isFemale ? "#0891b2" : "#7f1d1d"} stroke={isFemale ? "#00ffff" : "#ef4444"} strokeWidth="1" />

          {/* Dragon Snarling Mask */}
          <path d="M 32,56 L 50,82 L 68,56 Z" fill={isFemale ? "#0284c7" : "#991b1b"} stroke="#111" strokeWidth="2" />
          
          {/* Horns */}
          <path d="M 32,46 Q 16,30 22,22 M 68,46 Q 84,30 78,22" fill="none" stroke={isFemale ? "#06b6d4" : "#fbbf24"} strokeWidth="4.5" />

          <circle cx="42" cy="38" r="2.5" fill={isFemale ? "#22d3ee" : "#f59e0b"} />
          <circle cx="58" cy="38" r="2.5" fill={isFemale ? "#22d3ee" : "#f59e0b"} />
        </svg>
      );

    case 'beholder':
    case 'observador':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(168,85,247,0.8)]">
          <circle cx="50" cy="78" rx="26" ry="6" fill="#2d134d" opacity="0.7" />

          {/* Star eye-stalks */}
          <path d="M 30,30 L 22,14 M 40,24 L 38,6 M 50,22 L 50,4 M 60,24 L 62,6 M 70,30 L 78,14" stroke="#581c87" strokeWidth="3" strokeLinecap="round" />
          {/* Eye-stalk mini eyes */}
          <circle cx="22" cy="14" r="3" fill="#fff" stroke="#900" strokeWidth="0.5" />
          <circle cx="22" cy="14" r="1" fill="#ef4444" />
          <circle cx="38" cy="6" r="3" fill="#fff" stroke="#900" strokeWidth="0.5" />
          <circle cx="38" cy="6" r="1" fill="#ef4444" />
          <circle cx="50" cy="4" r="3" fill="#fff" stroke="#900" strokeWidth="0.5" />
          <circle cx="50" cy="4" r="1" fill="#ef4444" />
          <circle cx="62" cy="6" r="3" fill="#fff" stroke="#900" strokeWidth="0.5" />
          <circle cx="62" cy="6" r="1" fill="#ef4444" />
          <circle cx="78" cy="14" r="3" fill="#fff" stroke="#900" strokeWidth="0.5" />
          <circle cx="78" cy="14" r="1" fill="#ef4444" />

          {/* Central ball body */}
          <circle cx="50" cy="46" r="22" fill="#3b0764" stroke="#701a75" strokeWidth="2.5" />

          {/* Large ominous golden center eye */}
          <ellipse cx="50" cy="42" rx="11" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
          <circle cx="50" cy="42" r="5" fill="#facc15" />
          <line x1="50" y1="38" x2="50" y2="46" stroke="#000" strokeWidth="2" /> {/* Slit iris */}

          {/* Giant toothy snarl mouth */}
          <path d="M 34,54 Q 50,68 66,54 Z" fill="#000" stroke="#701a75" strokeWidth="1" />
          {/* Jagged teeth */}
          <polygon points="38,55 42,55 40,59" fill="#fff" />
          <polygon points="44,55 48,55 46,59" fill="#fff" />
          <polygon points="52,55 56,55 54,59" fill="#fff" />
          <polygon points="58,55 62,55 60,59" fill="#fff" />
        </svg>
      );

    case 'mimic':
    case 'mimico':
    case 'mímico':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(244,63,94,0.65)]">
          <ellipse cx="50" cy="74" rx="22" ry="5" fill="#2d1c1a" opacity="0.8" />

          {/* Wooden Chest body bottom */}
          <rect x="25" y="46" width="50" height="26" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          
          {/* Lid gap showing open mouth */}
          <path d="M 23,43 C 23,20 77,20 77,43 Z" fill="#500724" stroke="#451a03" strokeWidth="2" />

          {/* Golden locks and metal brackets */}
          <rect x="28" y="34" width="4" height="34" fill="#fbbf24" opacity="0.7" />
          <rect x="68" y="34" width="4" height="34" fill="#fbbf24" opacity="0.7" />

          {/* Giant rolling purple tongue */}
          <path d="M 50,46 Q 30,52 28,68 Q 45,74 54,56 Z" fill="#b1479d" stroke="#5b0a43" strokeWidth="1.5" className="animate-pulse" />

          {/* Terrifying human-like teeth on lid and box */}
          {/* Upper teeth */}
          <polygon points="32,36 34,36 33,40" fill="#fff" />
          <polygon points="38,36 40,36 39,41" fill="#fff" />
          <polygon points="44,36 46,36 45,41" fill="#fff" />
          <polygon points="50,36 52,36 51,41" fill="#fff" />
          <polygon points="56,36 58,36 57,41" fill="#fff" />
          <polygon points="62,36 64,36 63,41" fill="#fff" />
          <polygon points="68,36 70,36 69,40" fill="#fff" />
          
          {/* Multiple tiny evil yellow eyes blinking on current frame */}
          <circle cx="34" cy="30" r="2.5" fill="#facc15" className="animate-pulse" />
          <circle cx="34" cy="30" r="0.8" fill="#000" />
          <circle cx="50" cy="27" r="3" fill="#facc15" />
          <circle cx="50" cy="27" r="1" fill="#000" />
          <circle cx="66" cy="30" r="2.5" fill="#facc15" className="animate-pulse" />
          <circle cx="66" cy="30" r="0.8" fill="#000" />
        </svg>
      );

    case 'owlbear':
    case 'urso':
    case 'urso_coruja':
    case 'urso coruja':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[120%] w-[120%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(120,53,4,0.6)]">
          <ellipse cx="50" cy="74" rx="28" ry="7" fill="#2d1c0c" opacity="0.8" />

          {/* Broad Grizzly body of brown */}
          <circle cx="50" cy="52" r="24" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />

          {/* Razor feather shoulders */}
          <path d="M 22,40 Q 6,46 14,30 Z M 78,40 Q 94,46 86,30 Z" fill="#451a03" />

          {/* Heavy hawk talons/arms */}
          <path d="M 28,62 L 20,78 M 72,62 L 80,78" stroke="#1c1917" strokeWidth="4.5" strokeLinecap="round" />

          {/* Fluffy Owl Head with huge eyes and beak */}
          <circle cx="50" cy="30" r="16" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
          {/* Owl eye rings */}
          <circle cx="42" cy="28" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="42" cy="28" r="2.5" fill="#000" />
          <circle cx="58" cy="28" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="58" cy="28" r="2.5" fill="#000" />

          {/* Large hook black beak */}
          <path d="M 50,26 L 47,38 Q 50,44 53,38 Z" fill="#1c1917" />
        </svg>
      );

    case 'gelatinous_cube':
    case 'cubo_gelatinoso':
    case 'cubo gelatinoso':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_20px_rgba(34,197,94,0.55)]">
          <ellipse cx="50" cy="74" rx="28" ry="6" fill="#14532d" opacity="0.75" />

          {/* Translucent cubic walls of acid */}
          <rect x="20" y="16" width="60" height="60" rx="6" fill="#22c55e" fillOpacity="0.45" stroke="#4ade80" strokeWidth="3" />
          <rect x="25" y="21" width="50" height="50" rx="4" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" />

          {/* Suspended items inside the jelly! */}
          {/* Skun skull */}
          <rect x="42" y="38" width="12" height="12" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" fillOpacity="0.8" />
          <circle cx="46" cy="42" r="1.5" fill="#000" />
          <circle cx="50" cy="42" r="1.5" fill="#000" />
          {/* Floating rusty sword */}
          <path d="M 32,56 L 68,36" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          {/* Suspended coin stars */}
          <circle cx="34" cy="28" r="2.5" fill="#eab308" className="animate-pulse" />
          <circle cx="62" cy="52" r="2" fill="#eab308" />
        </svg>
      );

    case 'vampiro':
    case 'vampire':
    case 'vampira':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(225,29,72,0.65)]">
          {/* Gothic high collar bat cape */}
          <path d="M 32,76 Q 10,48 20,40 Q 50,22 80,40 Q 90,48 68,76 Z" fill="#111827" stroke="#e11d48" strokeWidth="1" />
          {/* Cape interior colors */}
          <path d="M 35,46 L 24,72 L 40,76 Z" fill="#9f1239" />
          <path d="M 65,46 L 76,72 L 60,76 Z" fill="#9f1239" />

          {/* Gown / Peasant suit */}
          <path d="M 32,76 L 40,46 L 60,46 L 68,76 Z" fill={isFemale ? "#4c0519" : "#111"} stroke="#000" strokeWidth="1.5" />

          {/* Tiny bats orbiting vampire */}
          <path d="M 12,30 Q 18,24 22,32 Z M 88,30 Q 82,24 78,32 Z" fill="#111" className="animate-bounce" />

          {/* Pale head & fangs */}
          <circle cx="50" cy="32" r="8" fill="#f1f5f9" />
          <path d="M 36,32 Q 22,54 26,74 M 64,32 Q 78,54 74,74" fill="none" stroke="#111" strokeWidth="3.5" />

          {/* Seductive red eyes */}
          <circle cx="47" cy="31" r="1.5" fill="#f43f5e" />
          <circle cx="53" cy="31" r="1.5" fill="#f43f5e" />
          {/* Vampire teeth */}
          <polygon points="48,34 49,37 50,34" fill="#fff" />
          <polygon points="52,34 51,37 50,34" fill="#fff" />
        </svg>
      );

    case 'succubus':
    case 'sucubo':
    case 'súcubo':
    case 'incubus':
    case 'incubo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(236,72,153,0.7)]">
          {/* Demonic bats wing flaps */}
          <path d="M 28,48 Q -4,18 10,56 Z M 72,48 Q 104,18 90,56 Z" fill="#1e1b4b" stroke="#db2777" strokeWidth="1.2" />

          {/* Sexy pink skin body */}
          <path d="M 32,76 L 40,46 L 60,46 L 68,76 Z" fill="#db2777" stroke="#310022" strokeWidth="1.5" />

          {/* Seductive floating pink heart charm */}
          <path d="M 82,34 Q 82,26 88,30 Q 94,26 94,34 L 88,42 Z" fill="#f43f5e" className="animate-ping" style={{ transformOrigin: '88px 34px' }} />

          {/* Curved horns */}
          <path d="M 40,24 Q 28,14 34,4 M 60,24 Q 72,14 66,4" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />

          {/* Beautiful face/hair */}
          <ellipse cx="50" cy="30" r="8" fill="#fda4af" />
          <path d="M 36,32 Q 22,54 26,74 M 64,32 Q 78,54 74,74" fill="none" stroke="#f43f5e" strokeWidth="3" />
          
          <circle cx="47" cy="29" r="1.5" fill="#ec4899" />
          <circle cx="53" cy="29" r="1.5" fill="#ec4899" />
        </svg>
      );

    case 'dragon_default':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-x-0 bottom-[8%] h-[115%] w-[115%] z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(239,68,68,0.6)]">
          <ellipse cx="50" cy="74" rx="24" ry="6" fill="#120205" />
          <path d="M 34,44 Q 5,15 15,48 Z M 66,44 Q 95,15 85,48 Z" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
          <path d="M 32,56 L 50,82 L 68,56 Z" fill="#991b1b" stroke="#310006" strokeWidth="2" />
          <circle cx="42" cy="38" r="2.5" fill="#fbbf24" />
          <circle cx="58" cy="38" r="2.5" fill="#fbbf24" />
        </svg>
      );
  }
}

// -----------------------------------------------------------------
// UNIQUE COLOSSAL BOSS FIGURINES (2X2 IN GAME, COLOSSAL SCALE)
// -----------------------------------------------------------------
export function BossFigurine({ id }: { id: string }) {
  const normId = id.toLowerCase();

  switch (normId) {
    case 'supreme_lich':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(168,85,247,0.85)]">
          <defs>
            <linearGradient id="lichVoid" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bf80ff" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#2e1065" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="necroGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
          </defs>

          {/* Levitating mystical clouds background */}
          <g className="animate-pulse" style={{ animationDuration: '3s' }}>
            <ellipse cx="100" cy="148" rx="55" ry="16" fill="url(#necroGlow)" opacity="0.3" filter="blur(6px)" />
            <circle cx="70" cy="130" r="16" fill="#22c55e" opacity="0.1" filter="blur(4px)" className="animate-ping" />
            <circle cx="130" cy="130" r="16" fill="#22c55e" opacity="0.1" filter="blur(4px)" className="animate-ping" />
          </g>

          {/* Legendary floating Astral Shroud cloak */}
          <path d="M 60,140 Q 100,60 140,140 Q 155,160 120,170 Q 100,165 80,170 Q 45,160 60,140 Z" fill="url(#lichVoid)" stroke="#4c1d95" strokeWidth="2" />
          <path d="M 75,145 L 100,70 L 125,145" stroke="url(#necroGlow)" strokeWidth="2.5" fill="none" opacity="0.45" />

          {/* Glowing Green Orbs / Floating skulls circulating the boss */}
          <circle cx="50" cy="110" r="9" fill="url(#necroGlow)" className="animate-bounce" />
          <circle cx="150" cy="110" r="9" fill="url(#necroGlow)" className="animate-bounce" style={{ animationDelay: '0.6s' }} />

          {/* Floating Astral Crown of Souls */}
          <polygon points="80,48 85,32 90,44 100,22 110,44 115,32 120,48" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="100" cy="40" r="2.5" fill="#4ade80" /> {/* Glowing gem */}

          {/* Hovering Skeletal Death Mask Skull */}
          <rect x="84" y="52" width="32" height="32" rx="10" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <rect x="92" y="74" width="16" height="12" rx="4" fill="#cbd5e1" /> {/* jaw */}
          {/* Evil sockets */}
          <ellipse cx="93" cy="64" rx="4.5" ry="3" fill="#000" />
          <circle cx="93" cy="64" r="1.5" fill="#22c55e" className="animate-ping" />
          <ellipse cx="107" cy="64" rx="4.5" ry="3" fill="#000" />
          <circle cx="107" cy="64" r="1.5" fill="#22c55e" className="animate-ping" />
          <path d="M 96,82 L 104,82" stroke="#000" strokeWidth="2" />

          {/* Staff of the Underworld (Left arm height) */}
          <line x1="50" y1="165" x2="50" y2="30" stroke="#78350f" strokeWidth="4.5" />
          <circle cx="50" cy="22" r="10" fill="#a855f7" />
          {/* Floating spirit glyph atop staff */}
          <path d="M 50,12 L 44,22 L 56,22 Z" fill="#22c55e" className="animate-pulse" />
        </svg>
      );

    case 'mind_flayer':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(232,121,249,0.8)]">
          <defs>
            <linearGradient id="mindVoid" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="60%" stopColor="#a21caf" />
              <stop offset="100%" stopColor="#1e0029" />
            </linearGradient>
            <linearGradient id="psionicField" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="50%" stopColor="#f5d0fe" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Psionic lightning circles */}
          <circle cx="100" cy="90" r="75" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3,15" className="animate-spin" style={{ animationDuration: '10s', transformOrigin: '100px 90px' }} />
          <circle cx="100" cy="90" r="50" fill="none" stroke="#d946ef" strokeWidth="2" strokeDasharray="8,6" className="animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse', transformOrigin: '100px 90px' }} />

          {/* Levitation shadow */}
          <ellipse cx="100" cy="154" rx="42" ry="12" fill="#1e1b4b" opacity="0.6" filter="blur(4px)" />

          {/* Flowing Obsidian Robes */}
          <path d="M 65,145 Q 100,55 135,145 L 125,160 L 75,160 Z" fill="url(#mindVoid)" stroke="#4a044e" strokeWidth="2" />
          <path d="M 85,115 L 100,140 L 115,115" stroke="#f472b6" strokeWidth="1.5" fill="none" />

          {/* Left / Right Arm casting Psionic waves */}
          <path d="M 68,90 Q 30,78 25,74" fill="none" stroke="url(#mindVoid)" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="25" cy="74" rx="14" ry="14" fill="url(#psionicField)" className="animate-pulse" />
          
          <path d="M 132,90 Q 170,78 175,74" fill="none" stroke="url(#mindVoid)" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="175" cy="74" rx="14" ry="14" fill="url(#psionicField)" className="animate-pulse" />

          {/* Cephalopod Alien Head with Writhing Tentacles */}
          {/* Head dome */}
          <ellipse cx="100" cy="56" rx="22" ry="16" fill="#a21caf" stroke="#4a044e" strokeWidth="2" />
          {/* Glistening alien skin ridge */}
          <path d="M 100,40 L 100,56" stroke="#f472b6" strokeWidth="2" opacity="0.6" />

          {/* Menacing White-Orange Glowing Alien Eyes */}
          <ellipse cx="90" cy="54" rx="5" ry="2" fill="#fed7aa" />
          <circle cx="90" cy="54" r="1.5" fill="#f97316" className="animate-pulse" />
          <ellipse cx="110" cy="54" rx="5" ry="2" fill="#fed7aa" />
          <circle cx="110" cy="54" r="1.5" fill="#f97316" className="animate-pulse" />

          {/* Writhing Face Tentacles sweeping down */}
          <path d="M 90,64 Q 72,92 88,110" fill="none" stroke="#a21caf" strokeWidth="4.5" strokeLinecap="round" className="animate-pulse" />
          <path d="M 97,66 Q 88,102 96,118" fill="none" stroke="#c084fc" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 103,66 Q 112,102 104,118" fill="none" stroke="#c084fc" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 110,64 Q 128,92 112,110" fill="none" stroke="#a21caf" strokeWidth="4.5" strokeLinecap="round" className="animate-pulse" />
        </svg>
      );

    case 'fire_elemental':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(249,115,22,0.8)]">
          <defs>
            <linearGradient id="fireLava" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#9a1102" />
            </linearGradient>
            <linearGradient id="smokeSlate" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#44403c" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
          </defs>

          {/* Flame aura swirling base */}
          <ellipse cx="100" cy="154" rx="55" ry="14" fill="#7c2d12" opacity="0.5" filter="blur(2.5px)" />
          <ellipse cx="100" cy="154" rx="40" ry="10" fill="url(#fireLava)" opacity="0.8" className="animate-pulse" />

          {/* Ash and smoke columns rising around */}
          <path d="M 45,150 Q 25,100 35,60" fill="none" stroke="url(#smokeSlate)" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          <path d="M 155,150 Q 175,100 165,60" fill="none" stroke="url(#smokeSlate)" strokeWidth="6" strokeLinecap="round" opacity="0.6" />

          {/* Molten Core Body (Tornado of Fire style) */}
          <path d="M 75,150 Q 100,50 60,35 Q 100,20 140,35 Q 100,50 125,150 Z" fill="url(#fireLava)" stroke="#7c2d12" strokeWidth="1" />
          <path d="M 85,110 L 100,135 L 115,110" stroke="#facc15" strokeWidth="3" fill="none" />

          {/* Floating magma rocks orbiting the chest */}
          <rect x="75" y="80" width="12" height="12" rx="3" fill="#292524" stroke="#f97316" strokeWidth="1" transform="rotate(45 75 80)" />
          <rect x="115" y="70" width="16" height="10" rx="2" fill="#292524" stroke="#f97316" strokeWidth="1" transform="rotate(-15 115 70)" />
          <rect x="95" y="100" width="10" height="10" rx="3" fill="#292524" stroke="#fcc419" strokeWidth="1" />

          {/* Giant Fire Claws */}
          <path d="M 70,80 Q 40,70 30,50" stroke="url(#fireLava)" strokeWidth="8" strokeLinecap="round" />
          <circle cx="30" cy="50" r="5" fill="#fff" className="animate-ping" />
          
          <path d="M 130,80 Q 160,70 170,50" stroke="url(#fireLava)" strokeWidth="8" strokeLinecap="round" />
          <circle cx="170" cy="50" r="5" fill="#fff" className="animate-ping" />

          {/* Fiery head crown with blank voids for eyes */}
          <path d="M 82,36 L 100,4 L 118,36 Z" fill="url(#fireLava)" />
          <circle cx="100" cy="28" r="14" fill="#ea580c" stroke="#9a1102" strokeWidth="2" />
          {/* Intense shining eyes */}
          <ellipse cx="92" cy="26" rx="4.5" ry="1.5" fill="#fff" />
          <ellipse cx="108" cy="26" rx="4.5" ry="1.5" fill="#fff" />
        </svg>
      );

    case 'kraken':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(6,182,212,0.8)]">
          <defs>
            <linearGradient id="krakenTentacle" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>
            <linearGradient id="waterSplash" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Sea foam / ripple backdrop */}
          <circle cx="100" cy="148" r="65" fill="#083344" opacity="0.4" filter="blur(4px)" />
          <ellipse cx="100" cy="148" rx="60" ry="14" fill="url(#waterSplash)" opacity="0.8" className="animate-pulse" />

          {/* Shipwreck mast being crushed in the center */}
          <line x1="100" y1="150" x2="115" y2="60" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
          <line x1="90" y1="110" x2="125" y2="105" stroke="#78350f" strokeWidth="4.5" /> {/* yardarm */}
          <path d="M 85,110 L 98,105 L 118,65 L 105,75 Z" fill="#fff" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" /> {/* torn sail */}
          {/* Split break line on mast */}
          <line x1="106" y1="115" x2="110" y2="95" stroke="#ef4444" strokeWidth="2.5" />

          {/* Giant coiling tentacles */}
          <path d="M 50,150 Q 30,110 55,75 Q 75,50 65,30 Q 55,42 45,70 Q 25,100 40,150" fill="url(#krakenTentacle)" stroke="#083344" strokeWidth="1.5" />
          {/* Suction cups */}
          <circle cx="48" cy="74" r="2.5" fill="#fff" opacity="0.8" />
          <circle cx="58" cy="62" r="2" fill="#fff" opacity="0.8" />
          <circle cx="61" cy="50" r="1.5" fill="#fff" opacity="0.8" />

          <path d="M 150,150 Q 170,110 145,75 Q 125,50 135,30 Q 145,42 155,70 Q 175,100 160,150" fill="url(#krakenTentacle)" stroke="#083344" strokeWidth="1.5" />
          <circle cx="152" cy="74" r="2.5" fill="#fff" opacity="0.8" />
          <circle cx="142" cy="62" r="2" fill="#fff" opacity="0.8" />
          <circle cx="139" cy="50" r="1.5" fill="#fff" opacity="0.8" />

          <path d="M 100,160 Q 80,130 92,90 Q 105,70 120,50 Q 110,65 102,88 Q 90,110 100,160" fill="url(#krakenTentacle)" stroke="#083344" strokeWidth="1.5" className="animate-bounce" />

          {/* Bioluminescent giant eyeball popping out of water */}
          <circle cx="100" cy="128" r="15" fill="#0c4a6e" stroke="#22d3ee" strokeWidth="3" />
          {/* Glowing neon turquoise iris */}
          <circle cx="100" cy="128" r="8" fill="#22d3ee" className="animate-pulse" />
          <ellipse cx="100" cy="128" rx="8" ry="2" fill="#000" /> {/* horizontal whale/beast pupil */}
          <circle cx="97" cy="124" r="2" fill="#fff" /> {/* gloss sheen */}
        </svg>
      );

    case 'fallen_titan':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(234,179,8,0.7)]">
          <defs>
            <linearGradient id="cosmicGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#ca8a04" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <radialGradient id="titanHeart" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Floating constellation runes behind the titan */}
          <polygon points="100,10 115,25 100,40 85,25" fill="none" stroke="#eab308" strokeWidth="1.2" strokeDasharray="2,2" className="animate-spin" style={{ animationDuration: '35s', transformOrigin: '100px 25px' }} opacity="0.5" />
          
          {/* Deep dark void gravity well */}
          <ellipse cx="100" cy="154" rx="46" ry="11" fill="#020617" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />

          {/* Star-forged Platinum Plates Armor (Body) */}
          <path d="M 60,154 L 75,70 L 125,70 L 140,154 Q 100,165 60,154 Z" fill="url(#cosmicGold)" stroke="#0f172a" strokeWidth="2" />
          {/* Star pattern etched in plate chest */}
          <path d="M 100,80 L 100,118 M 82,98 L 118,98" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          {/* Core glowing singularity in chest */}
          <circle cx="100" cy="98" r="14" fill="url(#titanHeart)" className="animate-pulse" />

          {/* Left / Right Heavy Spaulders */}
          <circle cx="64" cy="74" r="13" fill="url(#cosmicGold)" stroke="#eab308" strokeWidth="1.5" />
          <circle cx="136" cy="74" r="13" fill="url(#cosmicGold)" stroke="#eab308" strokeWidth="1.5" />

          {/* Dark Matter Trident (Right Hand holding staff) */}
          <line x1="145" y1="165" x2="145" y2="20" stroke="#334155" strokeWidth="4.5" />
          {/* Star spear head */}
          <path d="M 145,20 L 135,32 L 141,35 L 141,45 L 149,45 L 149,35 L 155,32 Z" fill="#eab308" />
          <path d="M 145,20 L 145,5 L 140,-2 L 135,10 M 145,5 L 150,-2 L 155,10" fill="none" stroke="#fff" strokeWidth="3" /> {/* trident prongs */}

          {/* Gilded Void Mask Helmet */}
          <rect x="80" y="30" width="40" height="40" rx="10" fill="url(#cosmicGold)" stroke="#0f172a" strokeWidth="2.5" />
          {/* Black starless space gap mask slice */}
          <path d="M 90,44 H 110 V 56 H 90 Z" fill="#000" />
          {/* Glowing central single cyclops star eye */}
          <polygon points="100,44 102,50 108,50 103,53 105,59 100,55 95,59 97,53 92,50 98,50" fill="#fff" className="animate-ping" />
        </svg>
      );

    case 'ancient_dragon':
    default:
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-20 overflow-visible select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(239,68,68,0.85)]">
          <defs>
            <linearGradient id="bossDragonGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="45%" stopColor="#dc2626" />
              <stop offset="85%" stopColor="#7f1d1d" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <linearGradient id="crownGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="lavaGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Lava Ring Vortex underneath */}
          <ellipse cx="100" cy="154" rx="72" ry="16" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="6,4" className="animate-spin" style={{ animationDuration: '18s', transformOrigin: '100px 154px' }} filter="url(#lavaGlow)" />
          <ellipse cx="100" cy="154" rx="60" ry="12" fill="#450a0a" opacity="0.6" />

          {/* Colossal Red wings of destruction */}
          <path d="M 74,104 Q 5,10 25,120 C 35,140 70,120 74,104 Z" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
          <path d="M 126,104 Q 195,10 175,120 C 165,140 130,120 126,104 Z" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

          {/* Spiked Tail whipping (Back) */}
          <path d="M 100,140 Q 150,165 170,145 Q 180,135 155,130" fill="none" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" />
          <polygon points="171,145 178,140 173,152" fill="#fbbf24" /> {/* Spiked tail tip */}

          {/* Colossal Scaly Dragon Torso */}
          <path d="M 65,85 C 65,135 85,150 100,150 C 115,150 135,135 135,85 C 135,78 65,78 65,85 Z" fill="url(#bossDragonGrad)" stroke="#450a0a" strokeWidth="2.5" />
          {/* Ribbed heavy chest scales */}
          <path d="M 80,95 Q 100,105 120,95 M 78,110 Q 100,120 122,110 M 82,125 Q 100,135 118,125" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.8" />

          {/* Giant horned head of the Dragon Patriarch */}
          <path d="M 68,64 L 100,105 L 132,64 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="3" />
          {/* Blazing fire breath throat chamber */}
          <polygon points="80,64 100,95 120,64" fill="url(#steelArmor)" />
          <path d="M 85,64 C 85,64 100,105 100,105 C 100,105 115,64 115,64 Z" fill="url(#fireLava)" />
          {/* Pulsing molten lava center */}
          <circle cx="100" cy="85" r="10" fill="#f59e0b" className="animate-pulse" />

          {/* Golden Patriarch crown horns */}
          <path d="M 68,54 Q 35,32 50,15" fill="none" stroke="url(#crownGold)" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M 132,54 Q 165,32 150,15" fill="none" stroke="url(#crownGold)" strokeWidth="6.5" strokeLinecap="round" />
          
          {/* Head crown skull structure */}
          <path d="M 65,46 Q 100,32 135,46 L 132,64 Q 100,50 68,64 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          {/* Furious slit eyes of power */}
          <ellipse cx="85" cy="48" rx="6" ry="2" fill="#fbbf24" />
          <circle cx="85" cy="48" r="1.5" fill="#fff" className="animate-ping" />
          <ellipse cx="115" cy="48" rx="6" ry="2" fill="#fbbf24" />
          <circle cx="115" cy="48" r="1.5" fill="#fff" className="animate-ping" />

          {/* Flying fire sparks elements */}
          <circle cx="55" cy="62" r="3" fill="#fbbf24" className="animate-ping" />
          <circle cx="145" cy="62" r="3" fill="#ef4444" className="animate-ping" style={{ animationDelay: '0.8s' }} />
        </svg>
      );
  }
}

// -----------------------------------------------------------------
// 3D ISOMETRIC STONE BLOCK FOR HISTORIC WALL BRUSH LOOK
// -----------------------------------------------------------------
export function WallPillar() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full select-none overflow-visible pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
      <defs>
        <linearGradient id="wallTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="100%" stopColor="#44403c" />
        </linearGradient>
        <linearGradient id="wallLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#44403c" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
        <linearGradient id="wallRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#292524" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>
      </defs>

      {/* Isometric 3D stone block faces */}
      {/* Top Lit face Cap */}
      <polygon points="50,10 90,30 50,50 10,30" fill="url(#wallTop)" stroke="#57534e" strokeWidth="1" />
      {/* Chiselled top bevel details */}
      <polygon points="50,15 82,31 50,47 18,31" fill="none" stroke="#a8a29e" strokeWidth="0.8" opacity="0.3" />

      {/* Shadow Front-Left face */}
      <polygon points="10,30 50,50 50,90 10,70" fill="url(#wallLeft)" stroke="#292524" strokeWidth="1" />
      {/* Runic cracked glowing golden etchings on left face */}
      <path d="M 22,44 L 38,52 L 32,68 M 18,38 L 22,60" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />

      {/* Deep Shadow Front-Right face */}
      <polygon points="50,50 90,30 90,70 50,90" fill="url(#wallRight)" stroke="#1c1917" strokeWidth="1" />
      {/* Runic cracked glowing golden etchings on right face */}
      <path d="M 58,54 L 78,44 M 78,44 L 84,60 L 70,68" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />

      {/* Top face rune circle */}
      <circle cx="50" cy="30" r="10" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
      <circle cx="50" cy="30" r="4" fill="#fbbf24" opacity="0.8" className="animate-ping" />
    </svg>
  );
}

// -----------------------------------------------------------------
// BACKGROUND MAP SEAMLESS VECTOR TEXTURES (CSS GRADIENTS & INLINE CODES)
// -----------------------------------------------------------------
export function getVectorBackgroundStyle(texture: string = 'flagstone') {
  switch (texture) {
    case 'volcano':
      return {
        backgroundColor: '#0c0201',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(220, 38, 38, 0.22) 0%, transparent 45%),
          radial-gradient(circle at 80% 70%, rgba(249, 115, 22, 0.18) 0%, transparent 50%),
          linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><defs><linearGradient id='basaltGrad' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23292524'/><stop offset='50%' stop-color='%231c1917'/><stop offset='100%' stop-color='%230c0a09'/></linearGradient></defs><polygon points='5,5 50,2 40,40 2,45' fill='url(%23basaltGrad)' stroke='%23000' stroke-width='1.5'/><path d='M10,12 L35,10 M12,30 L28,28' fill='none' stroke='%231c1917' stroke-width='1' opacity='0.5'/><polygon points='58,2 115,5 118,48 70,35' fill='url(%23basaltGrad)' stroke='%23000' stroke-width='1.5'/><path d='M75,10 L105,12 M80,25 L110,28' fill='none' stroke='%231c1917' stroke-width='1' opacity='0.5'/><polygon points='2,55 35,48 55,80 5,115' fill='url(%23basaltGrad)' stroke='%23000' stroke-width='1.5'/><polygon points='42,45 65,40 118,56 100,105 60,95' fill='url(%23basaltGrad)' stroke='%23000' stroke-width='1.5'/><polygon points='8,118 52,85 58,118' fill='url(%23basaltGrad)' stroke='%23000' stroke-width='1.5'/><polygon points='64,98 98,108 118,118 64,118' fill='url(%23basaltGrad)' stroke='%23000' stroke-width='1.5'/><path d='M 40,40 Q 50,45 60,40' fill='none' stroke='%23f97316' stroke-width='5' opacity='0.9'/><path d='M 40,40 Q 50,45 60,40' fill='none' stroke='%23facc15' stroke-width='2'/><path d='M 40,40 Q 38,44 35,48' fill='none' stroke='%23ef4444' stroke-width='4' opacity='0.85'/><path d='M 40,40 Q 38,44 35,48' fill='none' stroke='%23f97316' stroke-width='1.5'/><path d='M 50,2 Q 54,20 40,40' fill='none' stroke='%23ef4444' stroke-width='5' opacity='0.8'/><path d='M 50,2 Q 54,20 40,40' fill='none' stroke='%23f97316' stroke-width='2'/><path d='M 60,40 Q 64,20 70,35' fill='none' stroke='%23ef4444' stroke-width='4' opacity='0.8'/><path d='M 60,40 Q 64,20 70,35' fill='none' stroke='%23f97316' stroke-width='1.5'/><path d='M 35,48 Q 45,64 52,85' fill='none' stroke='%23f97316' stroke-width='5' opacity='0.95'/><path d='M 35,48 Q 45,64 52,85' fill='none' stroke='%23facc15' stroke-width='2'/><path d='M 60,95 Q 56,108 58,118' fill='none' stroke='%23ef4444' stroke-width='4' opacity='0.85'/><path d='M 60,95 Q 56,108 58,118' fill='none' stroke='%23facc15' stroke-width='1.5'/><path d='M 52,85 Q 56,90 60,95' fill='none' stroke='%23f97316' stroke-width='5' opacity='0.9'/><path d='M 52,85 Q 56,90 60,95' fill='none' stroke='%23facc15' stroke-width='2.5'/><circle cx='46' cy='52' r='3.5' fill='%23facc15' opacity='0.85'/><circle cx='46' cy='52' r='1.5' fill='%23fff'/><circle cx='54' cy='74' r='2' fill='%23f97316' opacity='0.8'/><circle cx='51' cy='102' r='2.5' fill='%23fbbf24' opacity='0.9'/><circle cx='51' cy='102' r='1' fill='%23fff'/></svg>")
        `,
        backgroundSize: '120px 120px',
      };

    case 'grass':
      return {
        backgroundColor: '#05100a',
        backgroundImage: `
          radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.18) 0%, transparent 40%),
          linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><defs><linearGradient id='greenSlab' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23115e59'/><stop offset='50%' stop-color='%230f766e'/><stop offset='100%' stop-color='%23115e59'/></linearGradient></defs><rect x='70' y='20' width='30' height='20' rx='4' fill='url(%23greenSlab)' stroke='%23064e3b' stroke-width='1.5' transform='rotate(12 70 20)'/><path d='M76,28 L94,32' fill='none' stroke='%234ade80' stroke-width='1' opacity='0.25' transform='rotate(12 70 20)'/><path d='M 10,75 C 20,65 30,85 50,75' fill='none' stroke='%23047857' stroke-width='1.5' stroke-linecap='round' opacity='0.4'/><path d='M15,15 Q17,5 20,15' fill='none' stroke='%2310b981' stroke-width='1.5' stroke-linecap='round'/><path d='M18,15 Q21,8 25,15' fill='none' stroke='%23059669' stroke-width='1.5' stroke-linecap='round'/><path d='M12,15 Q13,3 16,15' fill='none' stroke='%23047857' stroke-width='1.2' stroke-linecap='round'/><path d='M35,100 Q38,88 42,100' fill='none' stroke='%2310b981' stroke-width='1.5' stroke-linecap='round'/><path d='M39,100 Q43,92 48,100' fill='none' stroke='%23059669' stroke-width='1.5' stroke-linecap='round'/><path d='M105,45 Q108,32 113,45' fill='none' stroke='%2310b981' stroke-width='1.6' stroke-linecap='round'/><path d='M101,45 Q103,36 107,45' fill='none' stroke='%23047857' stroke-width='1.5' stroke-linecap='round'/><path d='M85,90 Q88,78 92,90' fill='none' stroke='%2310b981' stroke-width='1.5' stroke-linecap='round'/><path d='M88,90 Q92,82 97,90' fill='none' stroke='%23059669' stroke-width='1.5' stroke-linecap='round'/><path d='M81,90 Q83,83 86,90' fill='none' stroke='%23047857' stroke-width='1.2' stroke-linecap='round'/><circle cx='50' cy='25' r='1.5' fill='%23ef4444'/><circle cx='48.5' cy='25' r='1' fill='%23fff'/><circle cx='51.5' cy='25' r='1' fill='%23fff'/><circle cx='50' cy='23.5' r='1' fill='%23fff'/><circle cx='50' cy='26.5' r='1' fill='%23fff'/><circle cx='20' cy='65' r='1.5' fill='%23f59e0b'/><circle cx='18.5' cy='65' r='1' fill='%23fff'/><circle cx='21.5' cy='65' r='1' fill='%23fff'/><circle cx='20' cy='63.5' r='1' fill='%23fff'/><circle cx='20' cy='66.5' r='1' fill='%23fff'/><circle cx='60' cy='50' r='1' fill='%23a7f3d0' opacity='0.4'/><circle cx='110' cy='110' r='1.2' fill='%23a7f3d0' opacity='0.35'/><circle cx='30' cy='45' r='1' fill='%23a7f3d0' opacity='0.3'/></svg>")
        `,
        backgroundSize: '120px 120px',
      };

    case 'cave':
      return {
        backgroundColor: '#111317',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><defs><linearGradient id='stoneTileGrad' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23334155'/><stop offset='50%' stop-color='%231e293b'/><stop offset='100%' stop-color='%230f172a'/></linearGradient><linearGradient id='gemGlow' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='%2367e8f9'/><stop offset='100%' stop-color='%2306b6d4'/></linearGradient></defs><polygon points='2,2 58,2 45,35 2,42' fill='url(%23stoneTileGrad)' stroke='%23090d16' stroke-width='2'/><polygon points='62,2 118,2 115,48 52,38' fill='url(%23stoneTileGrad)' stroke='%23090d16' stroke-width='2'/><polygon points='2,46 48,39 65,85 2,90' fill='url(%23stoneTileGrad)' stroke='%23090d16' stroke-width='2'/><polygon points='118,52 68,42 85,92 118,85' fill='url(%23stoneTileGrad)' stroke='%23090d16' stroke-width='2'/><polygon points='2,94 62,88 58,118 2,118' fill='url(%23stoneTileGrad)' stroke='%23090d16' stroke-width='2'/><polygon points='66,94 118,88 118,118 68,118' fill='url(%23stoneTileGrad)' stroke='%23090d16' stroke-width='2'/><path d='M15,10 L30,12 L38,28' fill='none' stroke='%23475569' stroke-width='1' opacity='0.35'/><path d='M85,15 L100,22' fill='none' stroke='%23475569' stroke-width='1' opacity='0.35'/><path d='M75,60 L95,68' fill='none' stroke='%23475569' stroke-width='1' opacity='0.35'/><path d='M10,105 L35,100' fill='none' stroke='%23475569' stroke-width='1' opacity='0.35'/><polygon points='52,40 56,36 54,44 48,42' fill='url(%23gemGlow)' stroke='%23fff' stroke-width='0.5'/><circle cx='52' cy='40' r='1.5' fill='%23e0f7fa' opacity='0.8'/><polygon points='64,88 68,84 65,92 59,90' fill='url(%23gemGlow)' stroke='%23fff' stroke-width='0.5'/><path d='M 80,14 L 88,22 M 88,14 L 80,22 M 84,10 L 84,26' fill='none' stroke='%2306b6d4' stroke-width='1.5' stroke-linecap='round' opacity='0.5'/></svg>")
        `,
        backgroundSize: '120px 120px',
      };

    case 'dark_forest':
      return {
        backgroundColor: '#0a030f',
        backgroundImage: `
          radial-gradient(circle at 70% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 45%),
          linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><defs><linearGradient id='corruptedRoot' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23c084fc'/><stop offset='50%' stop-color='%23701a75'/><stop offset='100%' stop-color='%234a044e'/></linearGradient></defs><path d='M-10,20 Q40,40 60,80 T130,100' fill='none' stroke='url(%23corruptedRoot)' stroke-width='5.5' stroke-linecap='round' opacity='0.85'/><path d='M-10,20 Q40,40 60,80 T130,100' fill='none' stroke='%23f3e8ff' stroke-width='1.2' opacity='0.6'/><path d='M40,32 Q70,45 100,20' fill='none' stroke='url(%23corruptedRoot)' stroke-width='3' stroke-linecap='round' opacity='0.8'/><path d='M50,60 Q30,85 5,95' fill='none' stroke='url(%23corruptedRoot)' stroke-width='2.5' stroke-linecap='round' opacity='0.75'/><path d='M0,15 L25,12' fill='none' stroke='%232e1065' stroke-width='1.2' opacity='0.4'/><path d='M100,50 L118,58 L114,75' fill='none' stroke='%232e1065' stroke-width='1.2' opacity='0.4'/><path d='M15,104 L35,115' fill='none' stroke='%232e1065' stroke-width='1.2' opacity='0.4'/><path d='M 80,75 L 80,65' stroke='%23e9d5ff' stroke-width='2' stroke-linecap='round'/><path d='M 74,65 C 74,58 86,58 86,65 Z' fill='%23c084fc' stroke='%23581c87' stroke-width='1'/><circle cx='80' cy='61' r='0.8' fill='%23fff'/><path d='M 88,78 L 88,70' stroke='%23e9d5ff' stroke-width='1.5' stroke-linecap='round'/><path d='M 84,70 C 84,65 92,65 92,70 Z' fill='%23a855f7' stroke='%23581c87' stroke-width='0.8'/><ellipse cx='15' cy='45' rx='2.5' ry='1.2' fill='%23f43f5e'/><circle cx='15' cy='45' r='0.6' fill='%23fff'/><ellipse cx='23' cy='45' rx='2.5' ry='1.2' fill='%23f43f5e'/><circle cx='23' cy='45' r='0.6' fill='%23fff'/><ellipse cx='105' cy='95' rx='2' ry='1' fill='%2322d3ee'/><ellipse cx='111' cy='95' rx='2' ry='1' fill='%2322d3ee'/></svg>")
        `,
        backgroundSize: '120px 120px',
      };

    case 'mud':
      return {
        backgroundColor: '#170f07',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><defs><linearGradient id='mudStone' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%2357534e'/><stop offset='100%' stop-color='%23292524'/></linearGradient></defs><path d='M0,20 Q40,10 80,30 T120,20' fill='none' stroke='%23451a03' stroke-width='6' opacity='0.5' stroke-linecap='round'/><path d='M0,70 Q30,60 60,80 T120,65' fill='none' stroke='%23451a03' stroke-width='8' opacity='0.4' stroke-linecap='round'/><path d='M20,0 Q10,40 30,80 T10,120' fill='none' stroke='%23451a03' stroke-width='5' opacity='0.4'/><ellipse cx='40' cy='35' rx='14' ry='8' fill='url(%23mudStone)' stroke='%231c1917' stroke-width='1.5'/><path d='M34,33 Q40,31 46,33' fill='none' stroke='%2378716c' stroke-width='0.8' opacity='0.4'/><ellipse cx='95' cy='85' rx='18' ry='10' fill='url(%23mudStone)' stroke='%231c1917' stroke-width='2'/><path d='M87,83 Q95,80 103,83' fill='none' stroke='%2378716c' stroke-width='1' opacity='0.4'/><circle cx='15' cy='95' r='7' fill='url(%23mudStone)' stroke='%231c1917' stroke-width='1'/><circle cx='65' cy='18' r='3' fill='%237c2d12' opacity='0.6'/><circle cx='64' cy='19' r='1' fill='%23a16207' opacity='0.8'/><circle cx='25' cy='55' r='4' fill='%237c2d12' opacity='0.5'/><circle cx='85' cy='45' r='2.5' fill='%235c1d03' opacity='0.6'/><path d='M80,30 Q90,35 105,32' fill='none' stroke='%2365a30d' stroke-width='2' opacity='0.25' stroke-linecap='round'/></svg>")
        `,
        backgroundSize: '120px 120px',
      };

    case 'flagstone':
    default:
      return {
        backgroundColor: '#1b0f05',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><line x1='0' y1='24' x2='120' y2='24' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='0' y1='48' x2='120' y2='48' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='0' y1='72' x2='120' y2='72' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='0' y1='96' x2='120' y2='96' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='0' y1='120' x2='120' y2='120' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='30' y1='0' x2='30' y2='24' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='90' y1='24' x2='90' y2='48' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='40' y1='48' x2='40' y2='72' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='100' y1='72' x2='100' y2='96' stroke='%23451a03' stroke-width='2' opacity='0.85'/><line x1='50' y1='96' x2='50' y2='120' stroke='%23451a03' stroke-width='2' opacity='0.85'/><path d='M0,8 Q20,15 40,6 T80,18 T120,10' fill='none' stroke='%2378350f' stroke-width='1' opacity='0.35'/><path d='M0,14 Q30,18 60,11 T120,16' fill='none' stroke='%2378350f' stroke-width='1.2' opacity='0.25'/><ellipse cx='70' cy='12' rx='5' ry='3' fill='none' stroke='%235c2407' stroke-width='1' opacity='0.4'/><circle cx='70' cy='12' r='1.5' fill='%235c2407' opacity='0.5'/><path d='M0,32 Q40,26 80,36 T120,30' fill='none' stroke='%2378350f' stroke-width='1' opacity='0.35'/><ellipse cx='25' cy='36' rx='6' ry='2.5' fill='none' stroke='%235c2407' stroke-width='1' opacity='0.4'/><path d='M0,56 Q30,64 70,52 T120,60' fill='none' stroke='%2378350f' stroke-width='1' opacity='0.35'/><path d='M0,62 Q40,55 80,63 T120,57' fill='none' stroke='%2378350f' stroke-width='1.2' opacity='0.25'/><ellipse cx='110' cy='58' rx='4' ry='2' fill='none' stroke='%235c2407' stroke-width='1' opacity='0.4'/><path d='M0,80 Q50,75 100,85 T120,80' fill='none' stroke='%2378350f' stroke-width='1' opacity='0.35'/><ellipse cx='60' cy='82' rx='7' ry='3' fill='none' stroke='%235c2407' stroke-width='1' opacity='0.4'/><path d='M0,108 Q30,102 60,114 T120,106' fill='none' stroke='%2378350f' stroke-width='1' opacity='0.35'/><path d='M0,113 Q45,116 90,108 T120,115' fill='none' stroke='%2378350f' stroke-width='1.2' opacity='0.25'/><circle cx='27' cy='12' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='33' cy='12' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='87' cy='36' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='93' cy='36' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='37' cy='60' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='43' cy='60' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='97' cy='84' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='103' cy='84' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='47' cy='108' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/><circle cx='53' cy='108' r='2' fill='%2352525b' stroke='%231c1917' stroke-width='0.5'/></svg>")
         `,
         backgroundSize: '120px 120px',
       };
  }
}

export function BossTokenAvatar({ id }: { id: string }) {
  // Pure vector RPG Boss Portrait
  switch (id) {
    case 'fire_elemental':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="fireElementalGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#3f1605" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#fireElementalGrad)" stroke="#b45309" strokeWidth="2" />
          <path d="M50 15 C40 35 30 50 50 85 C65 50 60 30 50 15 Z" fill="#facc15" opacity="0.8" filter="url(#glow)" />
          <path d="M50 25 C45 40 38 52 50 80 C60 52 55 38 50 25 Z" fill="#fff" opacity="0.9" />
          <path d="M35 40 Q25 60 45 75" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <path d="M65 40 Q75 60 55 75" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <circle cx="50" cy="62" r="12" fill="#fff" className="animate-pulse" filter="url(#glow)" />
          <circle cx="50" cy="62" r="6" fill="#fef08a" />
          <circle cx="30" cy="30" r="2" fill="#facc15" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="70" cy="35" r="2.5" fill="#fb923c" className="animate-ping" style={{ animationDuration: '4s' }} />
          <circle cx="50" cy="25" r="1.5" fill="#f97316" />
        </svg>
      );
    case 'supreme_lich':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="lichGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#052e16" />
              <stop offset="45%" stopColor="#14532d" />
              <stop offset="85%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
            <filter id="lichGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#lichGrad)" stroke="#10b981" strokeWidth="2" />
          <polygon points="30,35 50,15 70,35 60,40 50,28 40,40" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
          <circle cx="50" cy="22" r="2.5" fill="#22d3ee" filter="url(#lichGlow)" />
          <path d="M35 48 C35 38 65 38 65 48 C65 58 58 68 58 75 L42 75 C42 68 35 58 35 48 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <line x1="46" y1="70" x2="46" y2="75" stroke="#475569" strokeWidth="1.5" />
          <line x1="50" y1="70" x2="50" y2="75" stroke="#475569" strokeWidth="1.5" />
          <line x1="54" y1="70" x2="54" y2="75" stroke="#475569" strokeWidth="1.5" />
          <polygon points="50,56 47,62 53,62" fill="#1e293b" />
          <circle cx="43" cy="48" r="4" fill="#064e3b" />
          <circle cx="43" cy="48" r="2.5" fill="#10b981" filter="url(#lichGlow)" className="animate-pulse" />
          <circle cx="43" cy="48" r="1" fill="#fff" />
          <circle cx="57" cy="48" r="4" fill="#064e3b" />
          <circle cx="57" cy="48" r="2.5" fill="#10b981" filter="url(#lichGlow)" className="animate-pulse" />
          <circle cx="57" cy="48" r="1" fill="#fff" />
          <path d="M 22 25 Q 12 50 25 78" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="1 5" opacity="0.6" />
          <path d="M 78 25 Q 88 50 75 78" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="1 5" opacity="0.6" />
        </svg>
      );
    case 'mind_flayer':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="flayerGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#311042" />
              <stop offset="85%" stopColor="#18021c" />
              <stop offset="100%" stopColor="#0c020f" />
            </radialGradient>
            <filter id="purpleGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#flayerGrad)" stroke="#c084fc" strokeWidth="2" />
          <ellipse cx="40" cy="35" rx="5" ry="2.5" fill="#d946ef" transform="rotate(-6 40 35)" filter="url(#purpleGlow)" className="animate-pulse" />
          <ellipse cx="60" cy="35" rx="5" ry="2.5" fill="#d946ef" transform="rotate(6 60 35)" filter="url(#purpleGlow)" className="animate-pulse" />
          <path d="M30 35 C28 15 72 15 70 35 C70 42 62 48 50 48 C38 48 30 42 30 35 Z" fill="#4c1d95" opacity="0.7" />
          <path d="M 42 46 Q 38 65 30 78 C 34 80 38 72 44 60" fill="#6d28d9" stroke="#4c1d95" strokeWidth="1" />
          <path d="M 47 48 Q 45 70 42 86 C 45 87 48 83 49 68" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
          <path d="M 53 48 Q 55 70 58 86 C 55 87 52 83 51 68" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
          <path d="M 58 46 Q 62 65 70 78 C 66 80 62 72 56 60" fill="#6d28d9" stroke="#4c1d95" strokeWidth="1" />
          <circle cx="36" cy="65" r="1" fill="#e879f9" />
          <circle cx="44" cy="72" r="1" fill="#e879f9" />
          <circle cx="56" cy="72" r="1" fill="#e879f9" />
          <circle cx="64" cy="65" r="1" fill="#e879f9" />
          <circle cx="50" cy="35" r="22" fill="none" stroke="#d946ef" strokeWidth="0.75" strokeDasharray="3 7" opacity="0.4" />
          <circle cx="50" cy="35" r="32" fill="none" stroke="#d946ef" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.25" />
        </svg>
      );
    case 'kraken':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="krakenGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="45%" stopColor="#0369a1" />
              <stop offset="80%" stopColor="#075985" />
              <stop offset="100%" stopColor="#0c1d30" />
            </radialGradient>
            <filter id="oceanGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#krakenGrad)" stroke="#38bdf8" strokeWidth="2" />
          <path d="M 50 10 A 40 40 0 0 0 10 50 A 40 40 0 0 0 50 90 A 40 40 0 0 0 90 50" fill="none" stroke="#0077b6" strokeWidth="1" opacity="0.4" />
          <g transform="translate(50, 48)">
            <ellipse cx="0" cy="0" rx="16" ry="10" fill="#082f49" stroke="#0284c7" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="8" fill="#facc15" filter="url(#oceanGlow)" />
            <polygon points="-1.5,8 -1,-8 1,-8 1.5,8" fill="#000" />
            <circle cx="3" cy="-3" r="2" fill="#fff" />
          </g>
          <path d="M 12 70 Q 25 50 34 40" fill="none" stroke="#0369a1" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 12 70 Q 25 50 34 40" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="16" cy="62" r="1.5" fill="#fff" />
          <circle cx="21" cy="56" r="1.5" fill="#fff" />
          <circle cx="27" cy="48" r="1.5" fill="#fff" />

          <path d="M 88 70 Q 75 50 66 40" fill="none" stroke="#0369a1" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 88 70 Q 75 50 66 40" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="84" cy="62" r="1.5" fill="#fff" />
          <circle cx="79" cy="56" r="1.5" fill="#fff" />
          <circle cx="73" cy="48" r="1.5" fill="#fff" />
        </svg>
      );
    case 'fallen_titan':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="titanGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="55%" stopColor="#292524" />
              <stop offset="90%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
            <linearGradient id="crackLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="titanGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#titanGrad)" stroke="#eab308" strokeWidth="2.5" />
          <polygon points="10,50 35,42 42,28 65,15 90,45 80,75 55,85 20,80" fill="none" stroke="#1c1917" strokeWidth="3" />
          <path d="M 12 52 L 35 45 L 48 48 L 52 75 L 56 86" fill="none" stroke="url(#crackLight)" strokeWidth="2" filter="url(#titanGlow)" className="animate-pulse" />
          <path d="M 35 45 L 62 38 L 88 44" fill="none" stroke="url(#crackLight)" strokeWidth="2" filter="url(#titanGlow)" className="animate-pulse" />
          <path d="M 62 38 L 52 14" fill="none" stroke="url(#crackLight)" strokeWidth="1.5" filter="url(#titanGlow)" />
          <circle cx="50" cy="45" r="11" fill="#fef08a" filter="url(#titanGlow)" />
          <circle cx="50" cy="45" r="6" fill="#fff" />
          <circle cx="28" cy="28" r="1.5" fill="#fef08a" />
          <circle cx="76" cy="28" r="2" fill="#fef08a" />
          <circle cx="72" cy="68" r="1.5" fill="#fbbf24" stroke="#fff" strokeWidth="0.5" />
        </svg>
      );
    case 'ancient_dragon':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="dragonGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="50%" stopColor="#450a0a" />
              <stop offset="85%" stopColor="#1e0202" />
              <stop offset="100%" stopColor="#030000" />
            </radialGradient>
            <filter id="dragonEyeGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#dragonGrad)" stroke="#ef4444" strokeWidth="2" />
          <path d="M25,40 C35,32 45,40 55,40 C65,40 75,32 85,40 Q50,75 25,40 Z" fill="#450a0a" opacity="0.4" />
          <g transform="translate(50, 48)">
            <ellipse cx="0" cy="0" rx="14" ry="14" fill="#fc8181" opacity="0.2" />
            <ellipse cx="0" cy="0" rx="10" ry="6" fill="#ea580c" stroke="#facc15" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="6" ry="4" fill="#facc15" filter="url(#dragonEyeGlow)" />
            <polygon points="-1,5 -0.5,-5 0.5,-5 1,5" fill="#000" />
            <circle cx="2" cy="-2" r="1.5" fill="#fff" />
          </g>
          <path d="M38 18 L25 10 L30 25 Z" fill="#3f0712" stroke="#ea580c" strokeWidth="0.75" />
          <path d="M62 18 L75 10 L70 25 Z" fill="#3f0712" stroke="#ea580c" strokeWidth="0.75" />
          <circle cx="25" cy="72" r="1.5" fill="#f97316" className="animate-pulse" />
          <circle cx="75" cy="72" r="1.5" fill="#facc15" className="animate-pulse" />
          <circle cx="48" cy="84" r="1" fill="#ef4444" />
        </svg>
      );
  }
}

