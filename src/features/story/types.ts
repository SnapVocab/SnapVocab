export type StoryMode = 'BLENDED' | 'ENGLISH';
export type StoryLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type StoryGenre = 'DAILY' | 'FUNNY' | 'OFFICE' | 'TRAVEL';
export type StorySource = 'MY_WORDS' | 'TOPIC' | 'SCAN' | 'CUSTOM';

export type TargetWordDTO = {
  word: string;
  meaning: string;
  phonetic: string;
  partOfSpeech: string;
};

export type StoryBlankDTO = {
  blankIndex: number;
  answer: string;
  displayWord: string;
};

export type StorySentenceDTO = {
  index: number;
  paragraph: number;
  text: string;
  translation: string;
  blanks: StoryBlankDTO[];
};

export type StoryDTO = {
  id: number;
  topicId?: number | null;
  title: string;
  mode: StoryMode;
  level: StoryLevel;
  genre: StoryGenre;
  providerName?: string | null;
  modelName?: string | null;
  targetWords: TargetWordDTO[];
  sentences: StorySentenceDTO[];
  totalBlanks: number;
  bestScore?: number | null;
  xpAwarded: number;
  completedAt?: string | null;
  createdAt: string;
};

export type StoryQuotaDTO = {
  usedToday: number;
  dailyLimit: number;
  remaining: number;
  minWords: number;
  maxWords: number;
};

export type StoryListResponse = {
  items: StoryDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  quota: StoryQuotaDTO;
};

export type GenerateStoryRequest = {
  source: StorySource;
  topicId?: number;
  wordCount?: number;
  words?: string[];
  mode: StoryMode;
  level: StoryLevel;
  genre: StoryGenre;
};

export type SubmitStoryClozeRequest = {
  answers: { blankIndex: number; value: string }[];
};

export type SubmitStoryClozeResponse = {
  storyId: number;
  correctCount: number;
  totalBlanks: number;
  accuracyPercent: number;
  xpAwardedNow: number;
  totalXpAwarded: number;
  bestScore: number;
  results: {
    blankIndex: number;
    submitted: string;
    expected: string;
    correct: boolean;
  }[];
};
