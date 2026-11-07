import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CollectionStudySettingsScreen } from '../collection-study-settings-screen';

const mockMutate = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ collectionId: '3', name: 'Shared collection' }),
  useRouter: () => ({ back: mockBack }),
}));
jest.mock('uniwind', () => ({ withUniwind: (component: unknown) => component }));
jest.mock('../api', () => ({
  useCollectionStudySettings: () => ({
    data: { newCardsPerDay: 20, reviewCardsPerDay: 200, customized: true },
  }),
  useSaveCollectionStudySettings: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    View: RN.View,
    Text: RN.Text,
    BackButton: () => null,
    FocusAwareStatusBar: () => null,
    showSuccessMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    Input: ({ error, ...props }: { error?: string }) => (
      <RN.View>
        <RN.TextInput {...props} />
        <RN.Text>{error}</RN.Text>
      </RN.View>
    ),
    Button: ({ tx, ...props }: { tx: string }) => <RN.Pressable {...props}><RN.Text>{tx}</RN.Text></RN.Pressable>,
  };
});

describe('collection limit form', () => {
  beforeEach(() => jest.clearAllMocks());

  it('accepts zero independently and submits numbers to the selected collection', async () => {
    render(<CollectionStudySettingsScreen />);
    fireEvent.changeText(screen.getByTestId('collection-new-limit'), '0');
    fireEvent.press(screen.getByTestId('collection-limits-save'));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledWith(
      { newCardsPerDay: 0, reviewCardsPerDay: 200 },
      expect.anything(),
    ));
    expect(screen.getByTestId('collection-review-limit').props.accessibilityLabel).toBe('study_limits.review_limit');
  });

  it('keeps invalid input visible and prevents a request', async () => {
    render(<CollectionStudySettingsScreen />);
    fireEvent.changeText(screen.getByTestId('collection-new-limit'), '-1');
    fireEvent.press(screen.getByTestId('collection-limits-save'));
    expect(await screen.findByText('study_limits.whole_number')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByTestId('collection-new-limit').props.value).toBe('-1');
  });

  it('resets only this collection preference through DELETE', () => {
    render(<CollectionStudySettingsScreen />);
    fireEvent.press(screen.getByTestId('collection-limits-reset'));
    expect(mockMutate).toHaveBeenCalledWith(null, expect.anything());
  });
});
