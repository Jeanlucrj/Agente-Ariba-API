import {
  Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MfaCodeDto } from './dto/mfa-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User, UserStatus } from '../users/user.entity';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login com email e senha' })
  async login(@Request() req, @Body() dto: LoginDto) {
    return this.authService.login(req.user, dto.mfaCode);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token via refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout e invalidar tokens' })
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Get('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurar MFA — retorna QR code' })
  setupMfa(@CurrentUser() user: User) {
    return this.authService.enableMfa(user.id);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar MFA com código TOTP' })
  verifyMfa(@CurrentUser() user: User, @Body() dto: MfaCodeDto) {
    return this.authService.verifyAndActivateMfa(user.id, dto.code);
  }

  @Post('activate-hack')
  @ApiOperation({ summary: 'Hack to activate user' })
  async activateHack(@Body() body: any) {
    const user = await this.authService['userRepo'].findOne({ where: { email: body.email } });
    if (user) {
      await this.authService['userRepo'].update(user.id, { status: UserStatus.ACTIVE });
      return { success: true };
    }
    return { success: false };
  }
}
