export const NATIONALITY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Spain': '🇪🇸', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Italy': '🇮🇹',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷',
  'Argentina': '🇦🇷', 'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Mexico': '🇲🇽',
  'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Sweden': '🇸🇪', 'Finland': '🇫🇮',
  'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 'Slovakia': '🇸🇰', 'Croatia': '🇭🇷',
  'Serbia': '🇷🇸', 'Austria': '🇦🇹', 'Switzerland': '🇨🇭', 'Greece': '🇬🇷',
  'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'Ghana': '🇬🇭', 'Nigeria': '🇳🇬',
  'Senegal': '🇸🇳', 'Ivory Coast': '🇨🇮', 'Cameroon': '🇨🇲', 'Morocco': '🇲🇦',
  'Egypt': '🇪🇬', 'Algeria': '🇩🇿', 'South Korea': '🇰🇷', 'Japan': '🇯🇵',
  'Australia': '🇦🇺', 'United States': '🇺🇸', 'Canada': '🇨🇦', 'Republic of Ireland': '🇮🇪',
  'Northern Ireland': '🇬🇧', 'Kosovo': '🇽🇰', 'Albania': '🇦🇱', 'Slovenia': '🇸🇮',
  'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Bulgaria': '🇧🇬', 'Russia': '🇷🇺',
  'Jamaica': '🇯🇲', 'Trinidad and Tobago': '🇹🇹', 'Ecuador': '🇪🇨', 'Chile': '🇨🇱',
  'Venezuela': '🇻🇪', 'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Bolivia': '🇧🇴',
  'Sweden': '🇸🇪', 'Iceland': '🇮🇸', 'Montenegro': '🇲🇪', 'North Macedonia': '🇲🇰',
  'Bosnia and Herzegovina': '🇧🇦', 'Luxembourg': '🇱🇺', 'Cyprus': '🇨🇾',
  'Israel': '🇮🇱', 'Lebanon': '🇱🇧', 'Iran': '🇮🇷', 'Saudi Arabia': '🇸🇦',
  'Zambia': '🇿🇲', 'Zimbabwe': '🇿🇼', 'Mali': '🇲🇱', 'Guinea': '🇬🇳',
  'Congo DR': '🇨🇩', 'Tanzania': '🇹🇿', 'Kenya': '🇰🇪', 'Tunisia': '🇹🇳',
}

export function nationalityFlag(nat) {
  return NATIONALITY_FLAGS[nat] || '🌍'
}

// Broad category → CSS class (used for colours)
export function posClass(pos) {
  if (!pos) return 'unknown'
  const p = pos.toLowerCase()
  if (p === 'goalkeeper') return 'gk'
  if (p === 'defender')   return 'def'
  if (p === 'midfielder') return 'mid'
  if (p === 'forward')    return 'fwd'
  return 'unknown'
}

// Detailed position → badge abbreviation
const DETAIL_ABBR = {
  'goalkeeper':       'GK',
  'centre-back':      'CB',
  'left-back':        'LB',
  'right-back':       'RB',
  'wing-back':        'WB',
  'defensive mid':    'DM',
  'central mid':      'CM',
  'attacking mid':    'AM',
  'left winger':      'LW',
  'right winger':     'RW',
  'centre-forward':   'CF',
  'striker':          'ST',
  // broad fallbacks
  'defender':         'DEF',
  'midfielder':       'MID',
  'forward':          'FWD',
}

export function posAbbr(detailed) {
  if (!detailed) return '?'
  return DETAIL_ABBR[detailed.toLowerCase()] || detailed
}
