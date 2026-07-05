import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      select: ['id', 'name', 'email', 'role', 'status', 'mfaEnabled', 'lastLoginAt', 'createdAt'],
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'status', 'mfaEnabled', 'lastLoginAt', 'createdAt'],
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateRole(id: string, role: UserRole) {
    await this.findOne(id);
    await this.repo.update(id, { role });
    return this.findOne(id);
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.findOne(id);
    await this.repo.update(id, { status, loginAttempts: 0, lockedUntil: null });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: 'Usuário removido' };
  }
}
