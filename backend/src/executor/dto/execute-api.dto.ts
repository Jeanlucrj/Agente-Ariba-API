import {
  IsString, IsUrl, IsOptional, IsObject, IsEnum, IsUUID, IsNumber, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HttpMethod } from '../../apis/api-catalog.entity';

export class ExecuteApiDto {
  @ApiProperty({ enum: HttpMethod })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty({ example: 'https://openapi.ariba.com/api/sourcing-projects/v1/prod' })
  @IsString()
  url: string;

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
  body?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  oauthProfileId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  apiCatalogId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @ApiProperty({ required: false, default: 30000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(120000)
  timeoutMs?: number;
}
