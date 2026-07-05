import {
  IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsArray, IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AribaModule, HttpMethod } from '../api-catalog.entity';

export class CreateApiDto {
  @ApiProperty({ example: 'Get Sourcing Projects' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AribaModule })
  @IsEnum(AribaModule)
  module: AribaModule;

  @ApiProperty({ example: '/api/sourcing-projects/v1/{realm}' })
  @IsString()
  endpoint: string;

  @ApiProperty({ enum: HttpMethod })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  queryParams?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payloadTemplate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responseTemplate?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  requiresOAuth?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oauthProfileId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
