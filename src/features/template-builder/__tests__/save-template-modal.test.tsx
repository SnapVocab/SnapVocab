import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { SaveTemplateModal } from '../components/save-template-modal';

jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    Text: ({ tx, children }: { tx?: string; children?: React.ReactNode }) => <RN.Text>{tx ?? children}</RN.Text>,
    Input: ({ value, onChangeText, testID }: { value: string; onChangeText: (v: string) => void; testID?: string }) => (
      <RN.TextInput testID={testID} value={value} onChangeText={onChangeText} />
    ),
    Button: ({ tx, onPress, disabled, testID }: { tx: string; onPress: () => void; disabled?: boolean; testID?: string }) => (
      <RN.Pressable testID={testID} onPress={onPress} disabled={disabled} accessibilityState={{ disabled }}><RN.Text>{tx}</RN.Text></RN.Pressable>
    ),
  };
});

const base = { visible: true, saving: null, onUpdate: jest.fn(), onSaveAsNew: jest.fn(), onClose: jest.fn() } as const;

beforeEach(() => jest.clearAllMocks());

it('a system or new layout can only be saved as new, and needs a name', () => {
  render(<SaveTemplateModal {...base} initialName="" />);
  expect(screen.queryByTestId('template-save-update')).toBeNull();
  expect(screen.getByTestId('template-save-new')).toBeDisabled();
  fireEvent.changeText(screen.getByTestId('template-name-input'), '  Thẻ ôn nhanh ');
  fireEvent.press(screen.getByTestId('template-save-new'));
  expect(base.onSaveAsNew).toHaveBeenCalledWith('Thẻ ôn nhanh');
});

it('the learner’s own layout offers updating in place and says how many topics change', () => {
  render(<SaveTemplateModal {...base} initialName="Mẫu của tôi" update={{ usageCount: 3 }} />);
  expect(screen.getByText('template_builder.save_sheet.update_hint')).toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('template-save-update'));
  expect(base.onUpdate).toHaveBeenCalledWith('Mẫu của tôi');
  fireEvent.press(screen.getByTestId('template-save-new'));
  expect(base.onSaveAsNew).toHaveBeenCalledWith('Mẫu của tôi');
});
