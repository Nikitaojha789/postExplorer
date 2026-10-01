import { mockFetch, registerMockRoute } from './mockServer';

describe('mockServer', () => {
  beforeAll(() => {
    registerMockRoute('GET', '/things/:id', ({ params, query }) => ({
      body: { id: params.id, expand: query.get('expand') },
      delay: 0,
    }));
  });

  it('matches path params and query strings relative to API_URL', async () => {
    const response = await mockFetch('https://api.test.local/things/42?expand=true');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: '42', expand: 'true' });
  });

  it('returns 404 for unregistered routes', async () => {
    const response = await mockFetch('https://api.test.local/nope', { method: 'POST' });
    expect(response.status).toBe(404);
  });
});
