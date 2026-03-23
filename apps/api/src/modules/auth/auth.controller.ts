import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.ip || req.headers['x-forwarded-for'] as string,
      req.headers['user-agent'],
    );
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.vetflow_refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return { message: 'Refresh token required' };
    }
    const result = await this.authService.refresh(refreshToken);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async logout(
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.vetflow_refresh_token;
    const result = await this.authService.logout(
      userId,
      refreshToken,
      req.ip || req.headers['x-forwarded-for'] as string,
      req.headers['user-agent'],
    );
    res.clearCookie('vetflow_access_token', COOKIE_OPTIONS);
    res.clearCookie('vetflow_refresh_token', COOKIE_OPTIONS);
    return result;
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('vetflow_refresh_token', COOKIE_OPTIONS);
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('vetflow_access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('vetflow_refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}
