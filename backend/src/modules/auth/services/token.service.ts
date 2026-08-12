import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { JwtPayload, PasswordResetPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign({ ...payload });
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  signPasswordResetToken(payload: PasswordResetPayload): string {
    const secret = `${this.configService.get<string>('jwt.secret')}-password-reset`;
    return this.jwtService.sign(payload, { secret, expiresIn: '10m' });
  }

  verifyPasswordResetToken(token: string): PasswordResetPayload {
    const secret = `${this.configService.get<string>('jwt.secret')}-password-reset`;
    return this.jwtService.verify<PasswordResetPayload>(token, { secret });
  }

  generateRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(48).toString('base64url');
    return { token, hash: this.hashToken(token) };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
