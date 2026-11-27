import { apiErrorMessage } from '../error-message';

jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));

it('never shows the server text, whatever it says', () => {
  const error = { response: { status: 400, data: { error: 'Only administrators can add topics to system collections' } } };
  expect(apiErrorMessage(error, 'learn.create_topic.create_error')).toBe('learn.create_topic.create_error');
});

it('names network, permission and missing-content failures, and lets a screen word its own statuses', () => {
  expect(apiErrorMessage(new Error('Network Error'), 'learn.create_topic.create_error')).toBe('errors.network');
  expect(apiErrorMessage({ response: { status: 403 } }, 'learn.create_topic.create_error')).toBe('errors.forbidden');
  expect(apiErrorMessage({ response: { status: 404 } }, 'learn.create_topic.create_error')).toBe('errors.not_found');
  expect(apiErrorMessage({ response: { status: 409 } }, 'learn.collections.create_error', { 409: 'learn.collections.name_taken' }))
    .toBe('learn.collections.name_taken');
});
