import type { ScanItem } from '../types';
import { act, renderHook } from '@testing-library/react-native';
import { forgetSaveDestination, resolveSaveDestination } from '@/features/learn/save-destination';
import { useScanSave } from '../use-scan-save';

const mockQuickSave = jest.fn();
const mockError = jest.fn();
let mockFormWords: string[] = [];
const remembered = { collectionId: 1, collectionName: 'Old', topicId: 9, topicName: 'Deleted' };
const fallback = { collectionId: 2, collectionName: 'My vocabulary', topicId: 51, topicName: 'New words' };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
jest.mock('@/features/learn/api', () => ({ invalidateAfterTopicItemAdded: jest.fn() }));
jest.mock('@/features/learn/quick-save', () => ({ useQuickSaveWord: () => mockQuickSave }));
jest.mock('@/features/learn/save-destination', () => ({
  useSaveDestination: () => remembered,
  forgetSaveDestination: jest.fn(),
  isDestinationGone: (error: { response?: { status?: number } }) => error?.response?.status === 404,
  resolveSaveDestination: jest.fn(async (current: unknown) => current ?? fallback),
  useSavedThroughForm: (select: (state: { words: string[] }) => unknown) => select({ words: mockFormWords }),
}));
jest.mock('@/components/ui', () => ({ showErrorMessage: (m: string) => mockError(m), showSuccessMessage: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));

function item(label: string, reliability: ScanItem['reliability'] = 'HIGH') {
  return ({ label, reliability, word: { wordId: label.length, word: label } }) as unknown as ScanItem;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFormWords = [];
});

it('a card completed in the add-word form shows as saved when the learner comes back', () => {
  mockFormWords = ['mouse'];
  const { result } = renderHook(() => useScanSave('scan-1', [item('cup'), item('Mouse')]));
  expect(result.current.saveStates).toEqual({ 1: 'saved' });
  // Not offered again in "Lưu N từ".
  expect(result.current.bulkIndexes).toEqual([0]);
});

it('a deleted remembered topic is forgotten and the word goes to the default topic', async () => {
  mockQuickSave
    .mockRejectedValueOnce({ response: { status: 404 } })
    .mockResolvedValueOnce('saved');
  const { result } = renderHook(() => useScanSave('scan-1', [item('cup')]));

  await act(async () => {
    await result.current.saveOne(0, item('cup'));
  });

  expect(forgetSaveDestination).toHaveBeenCalled();
  expect(resolveSaveDestination).toHaveBeenLastCalledWith(null);
  expect(mockQuickSave).toHaveBeenLastCalledWith(expect.objectContaining({ destination: fallback }));
  expect(mockError).toHaveBeenCalledWith('scan.result.destination_gone');
  expect(result.current.saveStates[0]).toBe('saved');
});

it('saving all skips low-reliability guesses and keeps the rest of the batch on the fallback topic', async () => {
  mockQuickSave
    .mockRejectedValueOnce({ response: { status: 404 } })
    .mockResolvedValue('saved');
  const items = [item('cup'), item('blob', 'LOW'), item('mug')];
  const { result } = renderHook(() => useScanSave('scan-1', items));
  expect(result.current.bulkIndexes).toEqual([0, 2]);

  await act(async () => {
    await result.current.saveAll();
  });

  // cup: refused on the old topic, then saved on the default; mug: straight to the default.
  expect(mockQuickSave).toHaveBeenCalledTimes(3);
  expect(mockQuickSave.mock.calls[2][0]).toMatchObject({ destination: fallback, skipInvalidate: true });
  expect(result.current.saveStates).toEqual({ 0: 'saved', 2: 'saved' });
});
