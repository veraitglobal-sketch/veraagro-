import { stripSecrets } from './strip-secrets.interceptor';

describe('stripSecrets', () => {
  it('removes password hashes from nested relations and arrays', () => {
    const created = new Date();
    const out = stripSecrets([
      { id: 'm1', createdAt: created, users_missions_growerIdTousers: { id: 'u1', firstName: 'A', passwordHash: 'x' } },
      { id: 'm2', grower: null, list: [{ passwordHash: 'y', email: 'e' }] },
    ]) as any[];
    expect(out[0].users_missions_growerIdTousers).toEqual({ id: 'u1', firstName: 'A' });
    expect(out[0].createdAt).toBe(created);
    expect(out[1].list[0]).toEqual({ email: 'e' });
  });

  it('passes primitives and buffers through', () => {
    const buf = Buffer.from('pdf');
    expect(stripSecrets('ok')).toBe('ok');
    expect(stripSecrets(buf)).toBe(buf);
    expect(stripSecrets(null)).toBeNull();
  });
});
