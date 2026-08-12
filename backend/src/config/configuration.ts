export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '8101', 10),
  globalPrefix: process.env.API_PREFIX || 'api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'peb-super-admin-jwt-secret-dev-only-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    lockThreshold: parseInt(process.env.LOCK_THRESHOLD || '7', 10),
    lockDurationMinutes: parseInt(process.env.LOCK_DURATION_MINUTES || '15', 10),
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxOtpAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10),
    passwordHistorySize: parseInt(process.env.PASSWORD_HISTORY_SIZE || '10', 10),
  },
  rateLimit: {
    ttlSeconds: parseInt(process.env.RATE_LIMIT_TTL_SECONDS || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '300', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'no-reply@pebplatform.io',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'LOCAL',
    localPath: process.env.LOCAL_STORAGE_PATH || 'storage',
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
  },
  crypto: {
    masterKey: process.env.ENCRYPTION_MASTER_KEY,
    algorithm: 'aes-256-gcm',
  },
});
