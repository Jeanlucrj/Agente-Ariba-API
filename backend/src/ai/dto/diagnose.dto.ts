import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DiagnoseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payload?: string;

  @ApiProperty({ required: false, description: 'OAuth | CIG | Ariba | SAP | XML | JSON' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  module?: string;
}
