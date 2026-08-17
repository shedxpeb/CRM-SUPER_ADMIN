import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthCookieInterceptor } from './cookie.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { AllowAuthenticated } from '../../common/decorators/allow-authenticated.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

type AuthRequest = FastifyRequest & {
  user?: { id: string; email: string; sessionId: string };
  cookies?: Record<string, string>;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseInterceptors(AuthCookieInterceptor)
  @ApiOperation({ summary: 'Log in a platform user' })
  login(@Body() dto: LoginDto, @Req() req: AuthRequest) {
    return this.authService.login(dto, req.ip, req.headers['user-agent'] as string);
  }

  @Public()
  @Post('refresh')
  @UseInterceptors(AuthCookieInterceptor)
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: AuthRequest) {
    const refreshToken = dto.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token not found');
    return this.authService.refresh(refreshToken, req.ip, req.headers['user-agent'] as string);
  }

  @AllowAuthenticated()
  @Post('logout')
  @UseInterceptors(AuthCookieInterceptor)
  @ApiOperation({ summary: 'Log out and revoke the current session' })
  async logout(@CurrentUser() user: { id: string; sessionId: string }, @Req() req: AuthRequest) {
    await this.authService.logout(
      user.id,
      user.sessionId,
      req.ip,
      req.headers['user-agent'] as string,
    );
    return { message: 'Logged out successfully.', clearRefreshCookie: true };
  }

  @AllowAuthenticated()
  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  me(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @AllowAuthenticated()
  @Post('change-password')
  @ApiOperation({ summary: 'Change the current password' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthRequest,
  ) {
    return this.authService.changePassword(
      userId,
      dto,
      req.ip,
      req.headers['user-agent'] as string,
    );
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: AuthRequest) {
    return this.authService.forgotPassword(dto, req.ip);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset the password using a reset token' })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: AuthRequest) {
    return this.authService.resetPassword(dto, req.ip);
  }
}
