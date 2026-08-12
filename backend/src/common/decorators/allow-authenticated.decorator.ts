import { SetMetadata } from '@nestjs/common';

export const ALLOW_AUTHENTICATED_KEY = 'allowAuthenticated';

/**
 * Marks a route as accessible to any authenticated user without requiring a
 * specific permission (self-service endpoints: /auth/me, /auth/logout, ...).
 */
export const AllowAuthenticated = () => SetMetadata(ALLOW_AUTHENTICATED_KEY, true);
