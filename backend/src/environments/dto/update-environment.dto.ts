import { PartialType } from '@nestjs/swagger';
import { CreateEnvironmentDto } from './create-environment.dto';

// Update parcial: todos os campos de CreateEnvironmentDto tornam-se opcionais.
export class UpdateEnvironmentDto extends PartialType(CreateEnvironmentDto) {}
