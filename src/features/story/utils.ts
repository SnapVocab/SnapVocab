import type { StoryBlankDTO, StorySentenceDTO } from './types';

export const MIN_STORY_WORDS = 3;
export const MAX_STORY_WORDS = 20;
export const DEFAULT_SMART_PICK_COUNT = 6;
export const WORD_TOKEN_REGEX = /^[a-z][a-z\s'.-]{0,59}$/i;

export type StoryTextSegment =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'blank'; text: string; blank: StoryBlankDTO };

const TOKEN_PATTERN = /\[\[([^[\]]+)\]\]|\*\*([^*]+)\*\*/g;

/**
 * Parses a sentence containing `[[word]]` (or `**word**`) markers into text + blank segments.
 * Ensures raw brackets never leak and pairs every marker with a valid 1-based blankIndex.
 */
export function parseSentenceSegments(
  sentence: StorySentenceDTO,
  fallbackStartIndex = 1,
): StoryTextSegment[] {
  const raw = sentence.text ?? '';
  const segments: StoryTextSegment[] = [];
  TOKEN_PATTERN.lastIndex = 0;

  let lastIndex = 0;
  let blankCursor = 0;
  let segCursor = 0;
  let match: RegExpExecArray | null = TOKEN_PATTERN.exec(raw);

  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        id: `s${sentence.index}-t${segCursor++}`,
        type: 'text',
        text: raw.slice(lastIndex, match.index),
      });
    }
    const tokenText = (match[1] ?? match[2] ?? '').trim();
    if (tokenText) {
      const providedBlank = sentence.blanks?.[blankCursor];
      const blank: StoryBlankDTO = providedBlank ?? {
        blankIndex: fallbackStartIndex + blankCursor,
        answer: tokenText,
        displayWord: tokenText,
      };
      blankCursor += 1;
      segments.push({
        id: `s${sentence.index}-b${blank.blankIndex}-${segCursor++}`,
        type: 'blank',
        text: tokenText,
        blank,
      });
    }
    lastIndex = match.index + match[0].length;
    match = TOKEN_PATTERN.exec(raw);
  }

  if (lastIndex < raw.length) {
    segments.push({
      id: `s${sentence.index}-t${segCursor++}`,
      type: 'text',
      text: raw.slice(lastIndex),
    });
  }

  return segments;
}

export type ParsedParagraph = {
  paragraph: number;
  sentences: {
    sentence: StorySentenceDTO;
    segments: StoryTextSegment[];
  }[];
};

/**
 * Groups story sentences into paragraphs and resolves sequential blank indices cleanly.
 */
export function buildStoryParagraphs(sentences: StorySentenceDTO[]): {
  paragraphs: ParsedParagraph[];
  allBlanks: StoryBlankDTO[];
} {
  const paragraphMap = new Map<number, ParsedParagraph>();
  const allBlanks: StoryBlankDTO[] = [];
  let runningBlankIndex = 1;

  for (const sentence of sentences) {
    const pNum = sentence.paragraph || 1;
    const segments = parseSentenceSegments(sentence, runningBlankIndex);
    for (const seg of segments) {
      if (seg.type === 'blank') {
        allBlanks.push(seg.blank);
        runningBlankIndex = Math.max(runningBlankIndex, seg.blank.blankIndex + 1);
      }
    }
    const existing = paragraphMap.get(pNum);
    if (existing) {
      existing.sentences.push({ sentence, segments });
    }
    else {
      paragraphMap.set(pNum, {
        paragraph: pNum,
        sentences: [{ sentence, segments }],
      });
    }
  }

  return {
    paragraphs: Array.from(paragraphMap.values()),
    allBlanks,
  };
}

export function sanitizeWordList(rawWords: string[]): string[] {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const raw of rawWords) {
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    if (!trimmed || !WORD_TOKEN_REGEX.test(trimmed))
      continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key))
      continue;
    seen.add(key);
    clean.push(trimmed);
    if (clean.length >= MAX_STORY_WORDS)
      break;
  }
  return clean;
}

export function pickRandomFromPool(pool: string[], count: number, prevWords?: string[]): string[] {
  if (pool.length <= count)
    return [...pool];
  const prevSet = new Set((prevWords ?? []).map(w => w.toLowerCase()));
  const fresh = pool.filter(w => !prevSet.has(w.toLowerCase()));
  const candidates = fresh.length >= count ? [...fresh] : [...pool];
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }
  return candidates.slice(0, count);
}
