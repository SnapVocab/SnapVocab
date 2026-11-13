import type { InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';
import { store } from '@/features/auth/use-auth-store';
import { client } from '../client';

jest.mock('@/lib/auth/utils', () => ({ setToken: jest.fn(), removeToken: jest.fn() }));

/** Answers 401 to any token but the current one, like the backend once an access token expired. */
function fakeServer(config: InternalAxiosRequestConfig) {
  const valid = config.headers.Authorization === `Bearer ${store.getState().accessToken}`
    && store.getState().accessToken !== 'expired';
  const status = valid ? 200 : 401;
  const response = { data: { ok: valid }, status, statusText: '', headers: {}, config };
  return valid
    ? Promise.resolve(response)
    : Promise.reject(new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response));
}

describe('api client refresh', () => {
  beforeEach(() => {
    client.defaults.adapter = fakeServer;
    store.setState({ accessToken: 'expired', refreshToken: 'r1', status: 'signIn' });
  });

  afterEach(() => jest.restoreAllMocks());

  it('refreshes once for concurrent 401s and retries every request with the new token', async () => {
    const tokens = { data: { data: { access_token: 'a2', refresh_token: 'r2' } } };
    const post = jest.spyOn(axios, 'post')
      .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(tokens), 10)));

    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);

    expect(post).toHaveBeenCalledTimes(1);
    expect(results.map(r => r.data.ok)).toEqual([true, true, true]);
    expect(store.getState()).toMatchObject({ accessToken: 'a2', refreshToken: 'r2', status: 'signIn' });
  });

  it('signs out when the refresh is refused (expired token or USER_BANNED)', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new AxiosError('403'));

    await expect(client.get('/a')).rejects.toBeInstanceOf(AxiosError);

    expect(store.getState().status).toBe('signOut');
  });
});
