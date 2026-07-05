import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from './environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(@InjectRepository(Environment) private repo: Repository<Environment>) {}

  create(dto: CreateEnvironmentDto, userId: string) {
    const env = this.repo.create({ ...dto, createdBy: { id: userId } as any });
    return this.repo.save(env);
  }

  findAll() {
    return this.repo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const env = await this.repo.findOne({ where: { id } });
    if (!env) throw new NotFoundException('Ambiente não encontrado');
    return env;
  }

  async update(id: string, dto: Partial<CreateEnvironmentDto>) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { isActive: false });
    return { message: 'Ambiente desativado' };
  }
}
