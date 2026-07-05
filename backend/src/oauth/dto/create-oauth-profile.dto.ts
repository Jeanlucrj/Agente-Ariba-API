import { IsString, IsUrl, IsOptional, IsEnum, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OAuthGrantType } from '../oauth-profile.entity';

export class CreateOAuthProfileDto {
  @ApiProperty({ example: 'Ariba PRD - Commerce Automation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://api.ariba.com/v2/oauth/token' })
  @IsString()
  tokenUrl: string;

  @ApiProperty({ enum: OAuthGrantType, default: OAuthGrantType.CLIENT_CREDENTIALS })
  @IsEnum(OAuthGrantType)
  grantType: OAuthGrantType;

  @ApiProperty({ example: 'your-client-id' })
  @IsString()
  clientId: string;

  @ApiProperty({ example: 'your-client-secret' })
  @IsString()
  clientSecret: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ required: false, example: 'mycompany-T' })
  @IsOptional()
  @IsString()
  realm?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  additionalParams?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  environmentId?: string;
}
