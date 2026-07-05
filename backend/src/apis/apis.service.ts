import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ApiCatalog, AribaModule, HttpMethod } from './api-catalog.entity';
import { CreateApiDto } from './dto/create-api.dto';

@Injectable()
export class ApisService {
  constructor(@InjectRepository(ApiCatalog) private repo: Repository<ApiCatalog>) {}

  create(dto: CreateApiDto, userId: string) {
    const api = this.repo.create({ ...dto, createdBy: { id: userId } as any });
    return this.repo.save(api);
  }

  async findAll(filters?: { module?: AribaModule; method?: HttpMethod; search?: string }, page = 1, limit = 20) {
    const where: any = { isActive: true };
    if (filters?.module) where.module = filters.module;
    if (filters?.method) where.method = filters.method;
    if (filters?.search) where.name = ILike(`%${filters.search}%`);

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const api = await this.repo.findOne({ where: { id } });
    if (!api) throw new NotFoundException('API não encontrada');
    return api;
  }

  async update(id: string, dto: Partial<CreateApiDto>) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { isActive: false });
    return { message: 'API desativada' };
  }

  async getStats() {
    const total = await this.repo.count({ where: { isActive: true } });
    const byModule = await this.repo
      .createQueryBuilder('a')
      .select('a.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .where('a.isActive = true')
      .groupBy('a.module')
      .getRawMany();

    return { total, byModule };
  }
}
