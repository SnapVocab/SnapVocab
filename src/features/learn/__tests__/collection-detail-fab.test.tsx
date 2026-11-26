import { render } from '@testing-library/react-native';
import * as React from 'react';
import { CollectionDetailFAB } from '../components/collection-detail/collection-detail-fab';

const mockPush = jest.fn();
const mockMessage = jest.fn();
let mockActions: { id: string; onPress: () => void }[] = [];
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-flash-message', () => ({ showMessage: (m: unknown) => mockMessage(m) }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui/icons', () => ({ BookIcon: () => null, FolderIcon: () => null }));
jest.mock('@/components/ui', () => ({
  SpeedDialFAB: ({ actions }: { actions: { id: string; onPress: () => void }[] }) => {
    mockActions = actions;
    return null;
  },
}));

const addWord = () => mockActions.find(action => action.id === 'add-word')!.onPress();
const base = { collectionId: '7', collectionName: 'Mine', firstTopicName: 'Kitchen' };

beforeEach(() => jest.clearAllMocks());

it('at the collection root the learner picks the topic, instead of the word landing in the first one', () => {
  render(<CollectionDetailFAB {...base} currentParentId={null} firstTopicId={42} />);
  addWord();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/scan-save', params: { collectionId: '7', mode: 'add' } });
});

it('inside a topic it adds straight to that topic', () => {
  render(<CollectionDetailFAB {...base} currentParentId={5} currentParentName="Fruit" firstTopicId={42} />);
  addWord();
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(app)/collections/add-word',
    params: { topicId: '5', topicName: 'Fruit', collectionId: '7', collectionName: 'Mine' },
  });
});

it('a collection without topics explains that one is needed first', () => {
  render(<CollectionDetailFAB {...base} currentParentId={null} firstTopicId={null} />);
  addWord();
  expect(mockMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'learn.topic.create_topic_first' }));
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/(app)/collections/create-topic' }));
});
