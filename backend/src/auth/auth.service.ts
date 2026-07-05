import {
  Injectable, UnauthorizedException, ForbiddenException,
  ConflictException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { User, UserStatus } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já cadastrado');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({ ...dto, password: hash });
    const saved = await this.userRepo.save(user);

    return this.generateTokens(saved);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    if (user.status === UserStatus.LOCKED) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new ForbiddenException('Conta bloqueada temporariamente');
      }
      await this.userRepo.update(user.id, {
        status: UserStatus.ACTIVE,
        loginAttempts: 0,
        lockedUntil: null,
      });
    }

    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.LOCKED) {
      throw new ForbiddenException('Conta inativa');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const update: Partial<User> = { loginAttempts: attempts };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
        update.status = UserStatus.LOCKED;
        update.lockedUntil = lockedUntil;
      }

      await this.userRepo.update(user.id, update);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.userRepo.update(user.id, {
      loginAttempts: 0,
      lastLoginAt: new Date(),
    });

    return user;
  }

  async login(user: User, mfaCode?: string) {
    if (user.mfaEnabled) {
      if (!mfaCode) throw new BadRequestException('Código MFA obrigatório');
      const userWithSecret = await this.userRepo.findOne({
        where: { id: user.id },
        select: ['id', 'mfaSecret'],
      });
      const valid = authenticator.verify({ token: mfaCode, secret: userWithSecret.mfaSecret });
      if (!valid) throw new UnauthorizedException('Código MFA inválido');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'status', 'refreshToken'],
    });

    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException('Refresh token inválido');

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshToken: null });
  }

  async enableMfa(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    const appName = this.configService.get('MFA_ISSUER', 'AribaEnterpriseAI');
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);
    const qrDataUrl = await qrcode.toDataURL(otpAuthUrl);

    await this.userRepo.update(userId, { mfaSecret: secret });

    return { secret, qrDataUrl };
  }

  async verifyAndActivateMfa(userId: string, code: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'mfaSecret'],
    });
    const valid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!valid) throw new BadRequestException('Código MFA inválido');
    await this.userRepo.update(userId, { mfaEnabled: true });
    return { message: 'MFA ativado com sucesso' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshToken: hash });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }
}
