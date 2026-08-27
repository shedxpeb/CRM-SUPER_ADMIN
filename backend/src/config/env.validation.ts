export function applyConfigToProcessEnv(config: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      process.env[key] = String(value);
    }
  }
}

export function validateEnv(config?: Record<string, unknown>): void {
  const isProd = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  const requireVar = (name: string) => {
    const value = process.env[name];
    if (!value || (typeof value === 'string' && !value.trim())) missing.push(name);
  };

  // Only require these in production
  if (isProd) {
    requireVar('DATABASE_URL');
    requireVar('JWT_SECRET');
    requireVar('COOKIE_SECRET');
    requireVar('PORT');
  }

  // In development, skip validation - use defaults
  if (!isProd) {
    return;
  }

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
    const jwtSecret = process.env.JWT_SECRET;
    if (
      !jwtSecret ||
      jwtSecret.length < 32 ||
      weakSecrets.includes(jwtSecret)
    ) {
      throw new Error('JWT_SECRET must be a strong secret of at least 32 characters in production');
    }

    // COOKIE_SECRET must be a dedicated strong secret — not a fallback to JWT_SECRET
    const cookieSecret = process.env.COOKIE_SECRET;
    if (
      !cookieSecret ||
      cookieSecret.length < 32 ||
      weakSecrets.includes(cookieSecret)
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
