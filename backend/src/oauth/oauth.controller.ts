import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OAuthService } from './oauth.service';
import { CreateOAuthProfileDto } from './dto/create-oauth-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('oauth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'oauth', version: '1' })
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Post('profiles')
  @ApiOperation({ summary: 'Criar perfil OAuth SAP Ariba' })
  createProfile(@Body() dto: CreateOAuthProfileDto, @CurrentUser() user: User) {
    return this.oauthService.createProfile(dto, user.id);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Listar perfis OAuth' })
  listProfiles(@Query('environmentId') environmentId?: string) {
    return this.oauthService.listProfiles(environmentId);
  }

  @Get('profiles/:id')
  @ApiOperation({ summary: 'Obter perfil OAuth' })
  getProfile(@Param('id') id: string) {
    return this.oauthService.getProfile(id);
  }

  @Post('profiles/:id/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter/renovar token OAuth (com cache)' })
  getToken(@Param('id') id: string) {
    return this.oauthService.getToken(id);
  }

  @Post('profiles/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Testar credenciais OAuth' })
  testToken(@Param('id') id: string) {
    return this.oauthService.testToken(id);
  }

  @Delete('profiles/:id/token')
  @ApiOperation({ summary: 'Invalidar token em cache' })
  invalidateToken(@Param('id') id: string) {
    return this.oauthService.invalidateToken(id);
  }
}
