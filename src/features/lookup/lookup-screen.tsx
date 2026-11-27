import type { WordSuggestionResponse } from './types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { BackButton, Button, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import {
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  MicIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { getItem, setItem } from '@/lib/storage';
import { useWordSuggestions } from './api';

const RECENT_SEARCHES_STORAGE_KEY = 'lookup_recent_searches';
const MAX_RECENT_SEARCHES = 10;
// A new learner has searched nothing yet: no made-up "recent" words (UX audit #7).
const DEFAULT_RECENT_SEARCHES: string[] = [];

export function LookupScreen() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  // 1. Debounce query 250ms
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // 2. Load recent searches from MMKV (max 10)
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    const saved = getItem<string[]>(RECENT_SEARCHES_STORAGE_KEY);
    return saved ?? DEFAULT_RECENT_SEARCHES;
  });

  const saveRecentSearches = React.useCallback((searches: string[]) => {
    const limited = searches.slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(limited);
    setItem(RECENT_SEARCHES_STORAGE_KEY, limited);
  }, []);

  const addToRecentSearches = React.useCallback((word: string) => {
    const trimmed = word.trim();
    if (!trimmed)
      return;

    const nextSearches = [
      trimmed,
      ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    saveRecentSearches(nextSearches);
  }, [recentSearches, saveRecentSearches]);

  // 3. Query word suggestions from API
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useWordSuggestions({
    q: debouncedQuery,
    size: 10,
  });

  const suggestions: WordSuggestionResponse[] = suggestionsData?.data ?? [];
  const isSearching = query.trim().length > 0;

  const handleSearchSubmit = React.useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed)
      return;

    addToRecentSearches(trimmed);
    Keyboard.dismiss();
    router.push({
      pathname: '/word-detail',
      params: { word: trimmed },
    });
  }, [addToRecentSearches, query, router]);

  const handleSelectWord = React.useCallback((word: string, id?: string | number) => {
    addToRecentSearches(word);
    Keyboard.dismiss();
    router.push({
      pathname: '/word-detail',
      params: {
        ...(id !== undefined && id !== null ? { id: String(id) } : {}),
        word,
      },
    });
  }, [addToRecentSearches, router]);

  const handleClearRecent = React.useCallback(() => {
    saveRecentSearches([]);
  }, [saveRecentSearches]);

  const handleClearQuery = React.useCallback(() => {
    setQuery('');
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Screen Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-surface px-4 py-3">
        <BackButton onPress={() => router.back()} hitSlop={12} />

        <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
          {translate('lookup.title')}
        </Text>

        <View className="size-10" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Button tx="my_words.title" variant="white" className="mb-4" onPress={() => router.push('/my-words')} />
          {/* Search Input Bar */}
          <View className="flex-row items-center rounded-2xl border-2 border-line bg-white px-4 py-2.5 shadow-sm dark:bg-neutral-800">
            {isSuggestionsLoading ? (
              <ActivityIndicator size="small" color="#65A30D" />
            ) : (
              <SearchIcon color="#94A3B8" width={20} height={20} />
            )}

            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholder={translate('lookup.search_placeholder')}
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              className="mx-3 flex-1 py-1 font-inter text-sm font-medium text-slate-900 dark:text-white"
            />

            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClearQuery}
                activeOpacity={0.7}
                hitSlop={8}
                className="mr-2 size-6 items-center justify-center rounded-full bg-neutral-200/80 dark:bg-neutral-700"
              >
                <CloseIcon color="#64748B" width={14} height={14} />
              </TouchableOpacity>
            )}

            {/* Microphone Icon Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              className="size-9 items-center justify-center rounded-xl bg-lime-100/70 active:bg-lime-200/70 dark:bg-lime-950/50 dark:active:bg-lime-900/60"
            >
              <MicIcon color="#65A30D" width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Body Content: Autocomplete Suggestions OR Recent Searches */}
          {isSearching ? (
            <View className="mt-5">
              <View className="mb-3 px-1">
                <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
                  {translate('lookup.suggestions')}
                </Text>
              </View>

              {suggestions.length > 0 ? (
                <View className="gap-2">
                  {suggestions.map(item => (
                    <TouchableOpacity
                      key={String(item.id)}
                      onPress={() => handleSelectWord(item.word, item.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 shadow-xs active:bg-pressed dark:bg-neutral-800"
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="size-7 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-700">
                          <SearchIcon color="#64748B" width={14} height={14} />
                        </View>
                        <Text className="font-inter text-sm font-bold text-slate-800 dark:text-neutral-100">
                          {item.word}
                        </Text>
                      </View>
                      <ChevronRightIcon color="#CBD5E1" width={16} height={16} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                !isSuggestionsLoading && (
                  <View className="mt-4 items-center justify-center rounded-2xl border border-line bg-white py-8 dark:bg-neutral-800/60">
                    <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-400">
                      {translate('lookup.no_suggestions')}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : (
            /* Recent Searches Section */
            <View className="mt-6">
              {/* Section Header */}
              <View className="flex-row items-center justify-between">
                <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
                  {translate('lookup.recent_searches')}
                </Text>

                {recentSearches.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClearRecent}
                    activeOpacity={0.7}
                    hitSlop={8}
                    className="flex-row items-center gap-1 active:opacity-60"
                  >
                    <TrashIcon color="#94A3B8" width={15} height={15} />
                    <Text className="font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {translate('lookup.clear')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Chips (Max 10) */}
              {recentSearches.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2.5">
                  {recentSearches.map(item => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => handleSelectWord(item)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 active:bg-pressed dark:bg-neutral-800"
                    >
                      <ClockIcon color="#94A3B8" width={15} height={15} />
                      <Text className="font-inter text-sm font-semibold text-slate-700 dark:text-neutral-200">
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="mt-6 items-center justify-center py-6">
                  <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-400">
                    {translate('lookup.no_recent')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LookupScreen;
