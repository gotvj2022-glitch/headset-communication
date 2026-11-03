/**
 * Aviation Phonetics & Vietnamese ESL Normalization Engine
 * Victoria Aviation Academy (VIAA)
 * 
 * Provides domain-specific phonetic tolerance for Vietnamese speakers
 * who may omit final plosives (/t/, /k/, /s/), substitute initial consonant clusters
 * (/gr/ -> /r/, /fl/ -> /l/), or approximate English vowels.
 * 
 * CRITICAL RULE: This normalizer is ONLY used to adjust the scoring match.
 * It must NEVER change the verbatim transcribedText that is displayed to the student.
 */

// Common phonetic replacements for Vietnamese speakers in aviation context
// Strictly single-word phonetic errors; all correct English words and multi-word keys removed.
export const VIETNAMESE_ESL_SUBSTITUTIONS: Record<string, string> = {
  // Ground / Cockpit callouts
  'raon': 'ground',
  'graon': 'ground',
  'graun': 'ground',
  'cokpit': 'cockpit',
  'cockpi': 'cockpit',
  'cookpit': 'cockpit',
  'copit': 'cockpit',
  
  // Chocks & Pins
  'choc': 'chocks',
  'trock': 'chocks',
  'posison': 'position',
  'posision': 'position',
  'posisen': 'position',
  'remov': 'removed',
  'rimuv': 'removed',
  'inspec': 'inspected',

  // Brakes
  'brak': 'brakes',
  'brek': 'brakes',
  'brayk': 'brakes',
  'paking': 'parking',
  'pakin': 'parking',
  'releas': 'released',
  'rilis': 'released',
  'sed': 'set',

  // Pushback & Directions
  'pus': 'pushback',
  'puss': 'pushback',
  'pút': 'pushback',
  'puck': 'pushback',
  'pussback': 'pushback',
  'towba': 'towbar',
  'toba': 'towbar',
  'connec': 'connected',
  'disconec': 'disconnect',
  'disconnec': 'disconnect',
  'fasin': 'facing',
  'fasing': 'facing',
  'feising': 'facing',
  'feiting': 'facing',
  'noc': 'north',
  'notz': 'north',
  'nót': 'north',
  'sout': 'south',
  'soud': 'south',
  'eaz': 'east',
  'ixt': 'east',
  'wes': 'west',
  'uet': 'west',

  // Engines
  'engin': 'engine',
  'enjin': 'engine',
  'engins': 'engines',
  'clea': 'clear',
  'klia': 'clear',
  'stac': 'start',
  'rotasion': 'rotation',
  'rotasen': 'rotation',
  'rotat': 'rotation',

  // Ground Equipment & Signals
  'heaset': 'headset',
  'hedset': 'headset',
  'gudbai': 'goodbye',
  'signan': 'signal',
  'signanl': 'signal',
  'signao': 'signal',
  'rait': 'right',
  'lep': 'left',
  'lef': 'left',
  'salut': 'salute',
  'selut': 'salute',

  // Standard Prowords
  'affim': 'affirm',
  'afim': 'affirm',
  'negativ': 'negative',
  'roge': 'roger',
  'roja': 'roger',
};

// Calculate Levenshtein Distance
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = [];
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[m][n];
}

/**
 * Normalizes text for matching ONLY.
 * Removes punctuation, lowercases, applies contextual rules ("round to" -> "ground to"),
 * and maps ESL substitutions.
 */
export function normalizeForAviationMatching(text: string): string {
  if (!text) return '';
  let s = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Contextual rule: "round to" or "raon to" -> "ground to"
  s = s.replace(/\b(round|raon)\s+to\b/g, 'ground to');
  const words = s.split(' ').map((w) => VIETNAMESE_ESL_SUBSTITUTIONS[w] || w);
  return words.join(' ');
}

/**
 * Computes Levenshtein-based similarity score (0 to 100) between two phrases
 * after phonetic normalization.
 */
export function computeAviationPhoneticSimilarity(actual: string, expected: string): number {
  const normActual = normalizeForAviationMatching(actual);
  const normExpected = normalizeForAviationMatching(expected);
  if (!normActual && !normExpected) return 100;
  if (!normActual || !normExpected) return 0;
  if (normActual === normExpected) return 100;

  const dist = levenshteinDistance(normActual, normExpected);
  const maxLen = Math.max(normActual.length, normExpected.length);
  const rawRatio = maxLen > 0 ? 1 - dist / maxLen : 0;
  return Math.max(0, Math.min(100, Math.round(rawRatio * 100)));
}

/**
 * Normalizes speech text according to Vietnamese ESL aviation phonetic patterns.
 * NOTE: Output is used ONLY to compute/adjust scoring similarity.
 */
export function normalizeVietnameseAviationSpeech(
  rawTranscript: string,
  expectedStandardText?: string
): {
  normalizedText: string;
  appliedRules: string[];
  semanticMatchRatio: number;
} {
  if (!rawTranscript) {
    return {
      normalizedText: expectedStandardText || '',
      appliedRules: [],
      semanticMatchRatio: 0,
    };
  }

  let text = rawTranscript.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim();
  const appliedRules: string[] = [];

  // Contextual rule 3: "round to" -> "ground to"
  if (/\b(round|raon)\s+to\b/i.test(text)) {
    text = text.replace(/\b(round|raon)\s+to\b/gi, 'ground to');
    appliedRules.push('"round to" ➔ "ground to"');
  }

  const words = text.split(/\s+/).filter(Boolean);
  const normalizedWords = words.map((w) => {
    if (VIETNAMESE_ESL_SUBSTITUTIONS[w]) {
      const replacement = VIETNAMESE_ESL_SUBSTITUTIONS[w];
      appliedRules.push(`"${w}" ➔ "${replacement}"`);
      return replacement;
    }
    return w;
  });

  const normalizedSentence = normalizedWords.join(' ');

  let semanticMatchRatio = 0;
  if (expectedStandardText) {
    const sim = computeAviationPhoneticSimilarity(rawTranscript, expectedStandardText);
    semanticMatchRatio = sim / 100;
  }

  return {
    normalizedText: normalizedSentence,
    appliedRules,
    semanticMatchRatio,
  };
}
