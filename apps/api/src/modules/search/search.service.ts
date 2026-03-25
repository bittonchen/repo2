import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(tenantId: string, query: string) {
    const q = query.trim();
    if (!q) {
      return { clients: [], animals: [], inventory: [] };
    }

    const [clients, animals, inventory] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          tenantId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { idNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
        take: 5,
      }),
      this.prisma.animal.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { microchipNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          species: true,
          client: {
            select: { firstName: true, lastName: true },
          },
        },
        take: 5,
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          tenantId,
          name: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          category: true,
          quantity: true,
        },
        take: 5,
      }),
    ]);

    return {
      clients,
      animals: animals.map((a) => ({
        id: a.id,
        name: a.name,
        species: a.species,
        clientName: a.client
          ? `${a.client.firstName} ${a.client.lastName}`
          : null,
      })),
      inventory,
    };
  }
}
