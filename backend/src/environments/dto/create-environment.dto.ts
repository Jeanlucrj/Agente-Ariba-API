import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnvironmentType } from '../environment.entity';

export class CreateEnvironmentDto {
  @ApiProperty({ example: 'Ariba Production' })
  @IsString()
  name: string;

  @ApiProperty({ enum: EnvironmentType })
  @IsEnum(EnvironmentType)
  type: EnvironmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://openapi.ariba.com' })
  @IsString()
  baseUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oauthUrl?: string;

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
  @IsString()
  clientId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  sslVerify?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  defaultHeaders?: Record<string, string>;
}
