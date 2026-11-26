export type StoryGenre = 'DAILY' | 'FUNNY' | 'OFFICE' | 'TRAVEL';
export type StorySource = 'MY_WORDS' | 'TOPIC' | 'SCAN';

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
  blanks: StoryBlankDTO[];
};

export type StoryDTO = {
  id: number;
  topicId?: number | null;
  title: string;
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

export type StoryTopicSummaryDTO = {
  id: number;
  name: string;
  translation?: string | null;
  collectionId: number;
  collectionName: string;
  parentId?: number | null;
  parentName?: string | null;
  wordCount: number;
};

export type StoryTopicWordItem = {
  itemId: number;
  word: string;
  translation: string;
};

export type StoryTopicWordsResponse = {
  topicId: number;
  topicName: string;
  topicTranslation?: string | null;
  words: StoryTopicWordItem[];
};

export type GenerateStoryRequest = {
  source: StorySource;
  topicId?: number;
  wordCount?: number;
  words?: string[];
  genre?: StoryGenre;
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
