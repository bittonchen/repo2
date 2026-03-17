import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryCategory } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, category?: InventoryCategory) {
    const where: any = { tenantId };
    if (category) where.category = category;

    return this.prisma.inventoryItem.findMany({
      where,
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: { supplier: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async create(tenantId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({
      data: { ...dto, tenantId },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInventoryItemDto) {
    await this.findById(tenantId, id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.inventoryItem.delete({ where: { id } });
  }

  async getLowStock(tenantId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM inventory_items
      WHERE "tenantId" = ${tenantId}
      AND quantity <= "minQuantity"
      ORDER BY quantity ASC
    `;
  }
}
