import type { TopicSchemaDTO } from '@/features/template-builder/types';
import { act, renderHook } from '@testing-library/react-native';
import { client } from '@/lib/api';
import { useAddWordForm } from '../use-add-word-form';

jest.mock('@/lib/api', () => ({ client: { get: jest.fn() } }));
jest.mock('@/components/ui', () => ({ showErrorMessage: jest.fn(), showSuccessMessage: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));

const schema: TopicSchemaDTO = {
  topicId: 1,
  groups: [{ groupId: 1, name: 'main', label: 'Main', multiple: false, position: 0, attributes: [{ attributeId: 1, name: 'translation', label: 'Translation', dataType: 'TEXT', required: false, position: 0 }] }],
};

describe('quick Lookup native translation', () => {
  it('allows removing the last repeating row and clears shifted validation errors', () => {
    const repeated = { ...schema.groups[0], name: 'examples', multiple: true };
    const { result } = renderHook(() => useAddWordForm({ ...schema, groups: [repeated] }));
    act(() => result.current.handleAddInstance(repeated));
    act(() => result.current.setErrors({ examples: { 0: { translation: 'required' } } }));
    act(() => result.current.handleRemoveInstance('examples', 0));
    expect(result.current.formData.examples).toEqual([]);
    expect(result.current.errors.examples).toBeUndefined();
  });

  it('fills an empty main.translation from the first nonempty translation', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: { data: { translations: [{ translation: ' ' }, { translation: ' quả táo ' }] } } });
    const boundSchema = { ...schema, groups: schema.groups.map(group => ({ ...group, attributes: group.attributes.map(attr => ({ ...attr, semanticRole: 'NATIVE_TRANSLATION' as const })) })) };
    const { result } = renderHook(() => useAddWordForm(boundSchema));
    await act(async () => {
      await result.current.handleQuickLookup('apple');
    });
    expect(result.current.formData.main.translation).toBe('quả táo');
  });

  it('preserves a translation typed while lookup was in flight', async () => {
    let resolve!: (value: unknown) => void;
    (client.get as jest.Mock).mockReturnValue(new Promise((done) => {
      resolve = done;
    }));
    const boundSchema = { ...schema, groups: schema.groups.map(group => ({ ...group, attributes: group.attributes.map(attr => ({ ...attr, semanticRole: 'NATIVE_TRANSLATION' as const })) })) };
    const { result } = renderHook(() => useAddWordForm(boundSchema));
    let lookup!: Promise<void>;
    act(() => {
      lookup = result.current.handleQuickLookup('apple');
    });
    act(() => {
      result.current.handleSingleFieldChange('main', 'translation', 'bản dịch của tôi');
    });
    await act(async () => {
      resolve({ data: { data: { translations: [{ translation: 'quả táo' }] } } });
      await lookup;
    });
    expect(result.current.formData.main.translation).toBe('bản dịch của tôi');
  });
});
