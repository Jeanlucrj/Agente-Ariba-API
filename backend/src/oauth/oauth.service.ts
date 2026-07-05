import {
  Injectable, NotFoundException, UnauthorizedException, Logger, Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { OAuthProfile } from './oauth-profile.entity';
import { CreateOAuthProfileDto } from './dto/create-oauth-profile.dto';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
  scope: string;
  tokenType: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @InjectRepository(OAuthProfile) private profileRepo: Repository<OAuthProfile>,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createProfile(dto: CreateOAuthProfileDto, createdById: string) {
    const profile = this.profileRepo.create(dto);
    return this.profileRepo.save(profile);
  }

  async listProfiles(environmentId?: string) {
    const where: any = { isActive: true };
    if (environmentId) where.environmentId = environmentId;
    return this.profileRepo.find({ where });
  }

  async getProfile(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Perfil OAuth não encontrado');
    return profile;
  }

  async getToken(profileId: string): Promise<{ token: string; expiresIn: number; scope: string; masked: string }> {
    const cacheKey = `oauth_token:${profileId}`;
    const cached = await this.cacheManager.get<CachedToken>(cacheKey);

    if (cached && cached.expiresAt > Date.now() + 60000) {
      this.logger.log(`Token cache hit for profile ${profileId}`);
      return {
        token: cached.token,
        expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000),
        scope: cached.scope,
        masked: this.maskToken(cached.token),
      };
    }

    const profile = await this.profileRepo.findOne({
      where: { id: profileId },
      select: ['id', 'tokenUrl', 'grantType', 'clientId', 'clientSecret', 'scope', 'additionalParams', 'appKey', 'realm'],
    });

    if (!profile) throw new NotFoundException('Perfil OAuth não encontrado');

    try {
      const params = new URLSearchParams({
        grant_type: profile.grantType,
        client_id: profile.clientId,
        client_secret: profile.clientSecret,
        ...(profile.scope ? { scope: profile.scope } : {}),
        ...(profile.additionalParams || {}),
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      if (profile.appKey) headers['apikey'] = profile.appKey;

      const url = profile.realm
        ? `${profile.tokenUrl}?realm=${profile.realm}`
        : profile.tokenUrl;

      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(url, params.toString(), { headers }),
      );

      const { access_token, expires_in, scope, token_type } = response.data;

      const tokenData: CachedToken = {
        token: access_token,
        expiresAt: Date.now() + (expires_in - 30) * 1000,
        scope: scope || '',
        tokenType: token_type,
      };

      await this.cacheManager.set(cacheKey, tokenData, (expires_in - 30) * 1000);

      this.logger.log(`Token obtained for profile ${profileId}, expires in ${expires_in}s`);

      return {
        token: access_token,
        expiresIn: expires_in,
        scope: scope || '',
        masked: this.maskToken(access_token),
      };
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      this.logger.error(`OAuth token error for profile ${profileId}: ${status} — ${JSON.stringify(data)}`);
      throw new UnauthorizedException(`Falha ao obter token OAuth: ${data?.error_description || data?.error || 'Erro desconhecido'}`);
    }
  }

  async invalidateToken(profileId: string) {
    await this.cacheManager.del(`oauth_token:${profileId}`);
    return { message: 'Token invalidado com sucesso' };
  }

  async testToken(profileId: string) {
    const result = await this.getToken(profileId);
    return {
      valid: true,
      expiresIn: result.expiresIn,
      scope: result.scope,
      masked: result.masked,
    };
  }

  private maskToken(token: string): string {
    if (token.length <= 20) return '***';
    return token.substring(0, 8) + '...' + token.substring(token.length - 4);
  }
}
