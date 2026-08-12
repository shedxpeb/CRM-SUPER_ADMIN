export interface JwtPayload {
  sub: string;
  email: string;
  sessionId: string;
  passwordVersion: number;
  permissionVersion: number;
}

export interface PasswordResetPayload {
  sub: string;
  email: string;
  purpose: 'password-reset';
}
