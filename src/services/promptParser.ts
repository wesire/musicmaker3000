import type {
  CadenceStrength,
  ColorVocab,
  EditIntent,
  HarmonicComplexity,
  MoodTag,
  PromptConstraints,
  SectionType,
  StyleTag,
} from '../models/types';

const STYLE_KEYWORDS: Record<StyleTag, string[]> = {
  pop:       ['pop', 'popular', 'catchy', 'radio', 'mainstream'],
  rock:      ['rock', 'guitar', 'band', 'riff', 'heavy', 'distorted', 'grunge', 'metal'],
  jazz:      ['jazz', 'jazzy', 'swing', 'bebop', 'ii-v', 'seventh', '7th chord'],
  folk:      ['folk', 'acoustic', 'fingerpick', 'singer-songwriter', 'indie folk'],
  dreamy:    ['dreamy', 'dream', 'floating', 'hazy', 'ethereal', 'ambient'],
  cinematic: ['cinematic', 'film', 'movie', 'epic', 'score', 'orchestral'],
  funk:      ['funk', 'funky', 'groove', 'syncopated', 'rhythm and blues'],
  blues:     ['blues', 'bluesy', '12 bar', 'shuffle', 'pentatonic'],
  classical: ['classical', 'baroque', 'romantic', 'symphony', 'sonata'],
  country:   ['country', 'nashville', 'twang', 'southern', 'bluegrass'],
};

const MOOD_KEYWORDS: Record<MoodTag, string[]> = {
  happy:      ['happy', 'joyful', 'cheerful', 'upbeat', 'fun', 'positive', 'bubbly'],
  sad:        ['sad', 'melancholic', 'melancholy', 'somber', 'grief', 'sorrowful', 'wistful', 'tearful'],
  energetic:  ['energetic', 'driving', 'pumping', 'intense', 'powerful', 'high energy'],
  calm:       ['calm', 'gentle', 'soft', 'relaxed', 'peaceful', 'serene', 'chill', 'quiet', 'ambient', 'floating', 'ethereal', 'hazy'],
  tense:      ['tense', 'anxious', 'unsettled', 'nervous', 'uneasy', 'suspenseful', 'urgent'],
  uplifting:  ['uplifting', 'inspiring', 'soaring', 'hopeful', 'triumphant', 'euphoric'],
  dark:       ['dark', 'ominous', 'brooding', 'heavy', 'moody', 'sinister', 'gloomy'],
  mysterious: ['mysterious', 'enigmatic', 'haunting', 'eerie', 'creepy', 'otherworldly'],
  romantic:   ['romantic', 'love', 'tender', 'warm', 'intimate', 'longing', 'sentimental'],
};

const COMPLEXITY_KEYWORDS: Record<HarmonicComplexity, string[]> = {
  simple:   ['simple', 'basic', 'easy', 'beginner', 'plain', 'straightforward', 'stripped'],
  moderate: ['moderate', 'medium', 'standard', 'balanced'],
  complex:  ['complex', 'advanced', 'intricate', 'sophisticated', 'chromatic'],
  jazzy:    ['jazzy', 'jazz', 'extensions', 'ninths', 'ninth', 'seventh', 'lush', 'altered'],
};

const EDIT_INTENT_KEYWORDS: Record<EditIntent, string[]> = {
  add_tension:            ['add tension', 'more tension', 'tense it', 'edgier', 'suspense', 'build tension'],
  simplify:               ['simplify', 'simpler', 'make simple', 'strip down', 'less complex'],
  brighten:               ['brighten', 'brighter', 'happier', 'lighter', 'more major', 'make brighter'],
  darken:                 ['darken', 'darker', 'sadder', 'gloomier', 'heavier', 'more minor'],
  more_colorful:          ['more colorful', 'more colourful', 'more interesting', 'more exotic', 'add color', 'richer'],
  smoother_voice_leading: ['smoother', 'smooth voice', 'voice leading', 'stepwise', 'common tones', 'smoother transition'],
  stronger_lift:          ['stronger lift', 'bigger lift', 'lift into chorus', 'build into', 'stronger push', 'more momentum'],
  less_predictable:       ['less predictable', 'surprising', 'unexpected', 'unpredictable', 'avoid cliché', 'twist'],
};

const COLOR_VOCAB_KEYWORDS: Record<ColorVocab, string[]> = {
  diatonic:      ['diatonic', 'in key', 'clean', 'pure', 'no accidentals'],
  modal_mixture: ['modal mixture', 'modal', 'borrowed', 'parallel minor', 'parallel major', 'mixture'],
  lush:          ['lush', 'rich', 'dense', 'full sound', 'thick'],
  jazzy:         ['jazzy', 'jazz voicing', 'bebop'],
  colorful:      ['colorful', 'colourful', 'chromatic', 'interesting chords'],
  sparse:        ['sparse', 'minimal', 'bare', 'stripped back', 'few chords'],
};

function matchKeywords<T extends string>(text: string, map: Record<T, string[]>): T[] {
  const lower = text.toLowerCase();
  return (Object.keys(map) as T[]).filter((key) =>
    map[key].some((kw) => lower.includes(kw)),
  );
}

/** Parse a free-text prompt into structured generation constraints. */
export function parsePrompt(text: string): PromptConstraints {
  const lower = text.toLowerCase();

  const styles = matchKeywords<StyleTag>(text, STYLE_KEYWORDS);
  const moods  = matchKeywords<MoodTag>(text, MOOD_KEYWORDS);

  // Complexity
  const complexityMatches = matchKeywords<HarmonicComplexity>(text, COMPLEXITY_KEYWORDS);
  let complexity: HarmonicComplexity = complexityMatches[0] ?? 'moderate';
  if (complexityMatches.length === 0) {
    if (styles.includes('jazz') || styles.includes('funk') || styles.includes('dreamy')) {
      complexity = 'jazzy';
    } else if (styles.includes('pop') || styles.includes('folk') || styles.includes('country')) {
      complexity = 'simple';
    } else if (styles.includes('classical') || styles.includes('cinematic')) {
      complexity = 'moderate';
    }
  }

  // Brightness: -1 (dark) to 1 (bright)
  let brightness = 0;
  if (moods.includes('happy') || moods.includes('uplifting')) brightness += 0.5;
  if (moods.includes('sad') || moods.includes('dark'))        brightness -= 0.5;
  if (lower.includes('bright'))  brightness += 0.3;
  if (lower.includes('major'))   brightness += 0.2;
  if (lower.includes('minor'))   brightness -= 0.2;
  if (lower.includes('dark'))    brightness -= 0.3;
  brightness = Math.max(-1, Math.min(1, brightness));

  // Tension: 0 to 1
  let tension = 0.3;
  if (moods.includes('tense'))    tension = 0.8;
  if (moods.includes('energetic')) tension = 0.6;
  if (moods.includes('uplifting')) tension = 0.5;
  if (moods.includes('calm'))     tension = 0.1;
  if (moods.includes('romantic')) tension = 0.2;
  tension = Math.max(0, Math.min(1, tension));

  // Cadence strength
  let cadenceStrength: CadenceStrength = 'moderate';
  if (lower.includes('strong cadence') || lower.includes('strong resolution') || lower.includes('clear resolution')) {
    cadenceStrength = 'strong';
  } else if (lower.includes('open') || lower.includes('suspended') || lower.includes('ambiguous cadence')) {
    cadenceStrength = 'weak';
  } else if (moods.includes('tense') || lower.includes('half cadence')) {
    cadenceStrength = 'weak';
  }

  const colorVocab = matchKeywords<ColorVocab>(text, COLOR_VOCAB_KEYWORDS);

  // Edit intent (first match wins)
  const editIntentMatches = matchKeywords<EditIntent>(text, EDIT_INTENT_KEYWORDS);
  const editIntent: EditIntent | undefined = editIntentMatches[0];

  // Beginner friendly
  const beginnerFriendly =
    lower.includes('beginner') || lower.includes('beginner-friendly') ||
    lower.includes('easy to play') || complexity === 'simple';

  // Section-specific hints
  const sectionHints: Partial<Record<SectionType, string>> = {};
  const sectionTypeList: SectionType[] = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'prechorus', 'solo'];
  for (const st of sectionTypeList) {
    const idx = lower.indexOf(st);
    if (idx >= 0) {
      sectionHints[st] = text.slice(Math.max(0, idx - 15), idx + st.length + 40).trim();
    }
  }

  return {
    raw: text,
    styles,
    moods,
    complexity,
    brightness,
    tension,
    cadenceStrength,
    colorVocab,
    editIntent,
    sectionHints: Object.keys(sectionHints).length > 0 ? sectionHints : undefined,
    beginnerFriendly,
  };
}
