/**
 * Smart matcher to map AI custom token names/prompts to native game vector assets
 */
export function matchPromptToFigurine(prompt: string, name: string, defaultType: 'hero' | 'enemy'): { figurineId: string, modelType: 'hero' | 'enemy' | 'boss' } {
  const text = `${name} ${prompt}`.toLowerCase();
  
  // 1. Check for Bosses
  if (text.includes('lich') || text.includes('supreme lich') || text.includes('necromante') || text.includes('morto-vivo supremo')) {
    return { figurineId: 'supreme_lich', modelType: 'boss' };
  }
  if (text.includes('flayer') || text.includes('devorador de mentes') || text.includes('cthulhu') || text.includes('mind flayer') || text.includes('devorador')) {
    return { figurineId: 'mind_flayer', modelType: 'boss' };
  }
  if (text.includes('elemental') || text.includes('magma') || text.includes('fogo supremo') || text.includes('chamas supremas') || text.includes('fire elemental') || text.includes('lava')) {
    return { figurineId: 'fire_elemental', modelType: 'boss' };
  }
  if (text.includes('kraken') || text.includes('monstro marinho') || text.includes('lula gigante') || text.includes('polvo gigante')) {
    return { figurineId: 'kraken', modelType: 'boss' };
  }

  // 2. Check for Enemies
  if (text.includes('beholder') || text.includes('observador') || text.includes('olho flutuante') || text.includes('multiolhos')) {
    return { figurineId: 'beholder', modelType: 'enemy' };
  }
  if (text.includes('mimic') || text.includes('mímico') || text.includes('mimico') || text.includes('baú com dentes') || text.includes('bau com dentes')) {
    return { figurineId: 'mimic', modelType: 'enemy' };
  }
  if (text.includes('owlbear') || text.includes('urso-coruja') || text.includes('urso coruja')) {
    return { figurineId: 'owlbear', modelType: 'enemy' };
  }
  if (text.includes('gelatinous') || text.includes('cubo') || text.includes('geléia') || text.includes('gelatina') || text.includes('cubo gelatinoso')) {
    return { figurineId: 'gelatinous_cube', modelType: 'enemy' };
  }
  if (text.includes('vampiro') || text.includes('vampira') || text.includes('vampire') || text.includes('dracula') || text.includes('alucard')) {
    return { figurineId: 'vampiro', modelType: 'enemy' };
  }
  if (text.includes('succubus') || text.includes('súcubo') || text.includes('sucubo') || text.includes('incubus') || text.includes('incubo') || text.includes('demônio sexy') || text.includes('demonio sexy')) {
    return { figurineId: 'succubus', modelType: 'enemy' };
  }
  if (text.includes('goblin') || text.includes('goblom') || text.includes('trasgo') || text.includes('duende')) {
    return { figurineId: 'goblin', modelType: 'enemy' };
  }
  if (text.includes('orc') || text.includes('orque') || text.includes('ogro') || text.includes('ogre') || text.includes('troll') || text.includes('bruto')) {
    return { figurineId: 'orc', modelType: 'enemy' };
  }
  if (text.includes('skeleton') || text.includes('esqueleto') || text.includes('caveira') || text.includes('skull') || text.includes('zumbi') || text.includes('zombie') || text.includes('morto-vivo') || text.includes('necromancia')) {
    return { figurineId: 'skeleton', modelType: 'enemy' };
  }
  if (text.includes('spider') || text.includes('aranha') || text.includes('aranhão') || text.includes('peçonhenta') || text.includes('inseto')) {
    return { figurineId: 'spider', modelType: 'enemy' };
  }
  if (text.includes('dragon') || text.includes('dragão') || text.includes('wyvern') || text.includes('dragao') || text.includes('serpente') || text.includes('réptil')) {
    return { figurineId: 'dragon', modelType: 'enemy' };
  }

  // 3. Check for Heroes
  if (text.includes('elfo negro') || text.includes('elfo-negro') || text.includes('drow') || text.includes('elfa negra')) {
    return { figurineId: 'elfo_negro', modelType: 'hero' };
  }
  if (text.includes('elfo') || text.includes('elfa')) {
    return { figurineId: 'elfo', modelType: 'hero' };
  }
  if (text.includes('ancião') || text.includes('anciao') || text.includes('anciã') || text.includes('ancian') || text.includes('elder') || text.includes('cajado')) {
    return { figurineId: 'anciao', modelType: 'hero' };
  }
  if (text.includes('titã') || text.includes('tita') || text.includes('titan')) {
    return { figurineId: 'tita', modelType: 'hero' };
  }
  if (text.includes('feiticeiro') || text.includes('feiticeira') || text.includes('sorceress') || text.includes('sorcerer')) {
    return { figurineId: 'feiticeiro', modelType: 'hero' };
  }
  if (text.includes('aldeão') || text.includes('aldeao') || text.includes('camponês') || text.includes('campones') || text.includes('peasant') || text.includes('humano comun') || text.includes('genérico') || text.includes('generico')) {
    return { figurineId: 'aldeao', modelType: 'hero' };
  }
  if (text.includes('guerreiro') || text.includes('warrior') || text.includes('cavaleiro') || text.includes('knight') || text.includes('paladino') || text.includes('paladin') || text.includes('soldado') || text.includes('bárbaro') || text.includes('barbarian')) {
    return { figurineId: 'guerreiro', modelType: 'hero' };
  }
  if (text.includes('mago') || text.includes('wizard') || text.includes('mage') || text.includes('bruxo') || text.includes('conjurador') || text.includes('arcano')) {
    return { figurineId: 'mago', modelType: 'hero' };
  }
  if (text.includes('arqueiro') || text.includes('hunter') || text.includes('archer') || text.includes('caçador') || text.includes('ranger')) {
    return { figurineId: 'arqueiro', modelType: 'hero' };
  }
  if (text.includes('ladino') || text.includes('rogue') || text.includes('assassino') || text.includes('assassin') || text.includes('sombra') || text.includes('ladrão') || text.includes('ninja') || text.includes('thief')) {
    return { figurineId: 'ladino', modelType: 'hero' };
  }

  // 4. Fallback based on default expected type
  if (defaultType === 'enemy') {
    return { figurineId: 'orc', modelType: 'enemy' };
  }
  return { figurineId: 'guerreiro', modelType: 'hero' };
}
