export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  const requireVar = (name: string) => {
    if (!process.env[name]?.trim()) missing.push(name);
  };

  requireVar('DATABASE_URL');
  requireVar('JWT_SECRET');
  requireVar('COOKIE_SECRET');
  requireVar('PORT');

  if (isProd) {
    const weakSecrets = [
      'change-this-to-a-random-secret',
      'change-this-to-a-random-secret-at-least-32-chars',
      'peb-super-admin-jwt-secret-dev-only-min-32-chars',
      'dev-cookie-secret',
      'dev-secret',
      'secret',
      'change-me',
    ];

    // JWT_SECRET must be strong in production
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      weakSecrets.includes(process.env.JWT_SECRET)
    ) {
      throw new Error('JWT_SECRET must be a strong secret of at least 32 characters in production');
    }

    // COOKIE_SECRET must be a dedicated strong secret — not a fallback to JWT_SECRET
    if (
      !process.env.COOKIE_SECRET ||
      process.env.COOKIE_SECRET.length < 32 ||
      weakSecrets.includes(process.env.COOKIE_SECRET)
    ) {
      throw new Error(
        'COOKIE_SECRET must be a dedicated strong secret of at least 32 characters in production. ' +
          'Do not reuse JWT_SECRET.',
      );
    }

    // FRONTEND_URL must not point to localhost in production
    const frontendUrl = process.env.FRONTEND_URL || '';
    if (/localhost|127\.0\.0\.1/i.test(frontendUrl)) {
      throw new Error('FRONTEND_URL must not point to localhost in production');
    }

    // SMTP should be configured in production for auth emails
    ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].forEach(requireVar);
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env and set valid values.',
    );
  }
}
