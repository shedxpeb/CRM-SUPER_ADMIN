import { isOriginAllowed, normalizeOrigin, parseAllowedOrigins } from './allowed-origins';

describe('normalizeOrigin', () => {
  it('strips trailing slashes', () => {
    expect(normalizeOrigin('https://crm-super-admin-delta.vercel.app/')).toBe(
      'https://crm-super-admin-delta.vercel.app',
    );
  });

  it('lowercases and trims', () => {
    expect(normalizeOrigin('  HTTPS://EXAMPLE.COM  ')).toBe('https://example.com');
  });
});

describe('parseAllowedOrigins', () => {
  it('splits on commas, trims, and drops empties', () => {
    expect(
      parseAllowedOrigins('http://localhost:3001,  https://a.vercel.app/ ,,'),
    ).toEqual(['http://localhost:3001', 'https://a.vercel.app']);
  });

  it('de-duplicates normalized origins', () => {
    expect(
      parseAllowedOrigins('https://x.vercel.app,https://x.vercel.app/'),
    ).toEqual(['https://x.vercel.app']);
  });
});

describe('isOriginAllowed', () => {
  const allowed = ['http://localhost:3001', 'https://crm-super-admin-delta.vercel.app'];

  it('allows requests without an origin header', () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(true);
  });

  it('allows exact matches', () => {
    expect(isOriginAllowed('http://localhost:3001', allowed)).toBe(true);
  });

  it('allows exact matches with a trailing slash (broken env values)', () => {
    expect(isOriginAllowed('https://crm-super-admin-delta.vercel.app/', allowed)).toBe(true);
  });

  it('allows case-insensitive matches', () => {
    expect(isOriginAllowed('HTTP://LOCALHOST:3001', allowed)).toBe(true);
  });

  it('rejects unknown origins', () => {
    expect(isOriginAllowed('https://evil.example.com', allowed)).toBe(false);
  });

  it('rejects a different vercel.app subdomain when the wildcard is off', () => {
    expect(
      isOriginAllowed('https://crm-super-admin-bhkyf2980-shedx.vercel.app', allowed, {
        allowVercelApp: false,
      }),
    ).toBe(false);
  });

  it('allows any *.vercel.app subdomain when the wildcard is on', () => {
    expect(
      isOriginAllowed('https://crm-super-admin-bhkyf2980-shedx.vercel.app', allowed, {
        allowVercelApp: true,
      }),
    ).toBe(true);
  });

  it('does not allow http vercel.app or non-vercel hosts when the wildcard is on', () => {
    expect(
      isOriginAllowed('http://crm-super-admin-bhkyf2980-shedx.vercel.app', allowed, {
        allowVercelApp: true,
      }),
    ).toBe(false);
    expect(
      isOriginAllowed('https://evil-vercel.app', allowed, { allowVercelApp: true }),
    ).toBe(false);
  });
});
