import { PartialType } from '@nestjs/swagger';
import { CreateApiDto } from './create-api.dto';

// Update parcial: todos os campos de CreateApiDto tornam-se opcionais.
export class UpdateApiDto extends PartialType(CreateApiDto) {}
