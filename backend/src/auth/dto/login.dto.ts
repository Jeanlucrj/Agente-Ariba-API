import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaSegura@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false, example: '123456' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  mfaCode?: string;
}
