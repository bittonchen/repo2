import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CryptoService } from '../common/services/crypto.service';

// Fields to encrypt per model
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Client: ['idNumber', 'phone', 'email'],
  User: ['phone', 'email'],
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private cryptoService: CryptoService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.setupEncryptionMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private setupEncryptionMiddleware() {
    // Encrypt on write
    this.$use(async (params, next) => {
      const fields = ENCRYPTED_FIELDS[params.model || ''];
      if (fields && params.args?.data) {
        this.encryptFields(params.args.data, fields);
      }
      // Handle createMany
      if (fields && params.args?.data && Array.isArray(params.args.data)) {
        for (const item of params.args.data) {
          this.encryptFields(item, fields);
        }
      }

      const result = await next(params);

      // Decrypt on read
      if (fields && result) {
        if (Array.isArray(result)) {
          for (const item of result) {
            this.decryptFields(item, fields);
          }
        } else if (typeof result === 'object') {
          this.decryptFields(result, fields);
        }
      }

      return result;
    });
  }

  private encryptFields(data: any, fields: string[]) {
    if (!data || typeof data !== 'object') return;
    for (const field of fields) {
      if (data[field] && typeof data[field] === 'string') {
        data[field] = this.cryptoService.encrypt(data[field]);
      }
    }
  }

  private decryptFields(data: any, fields: string[]) {
    if (!data || typeof data !== 'object') return;
    for (const field of fields) {
      if (data[field] && typeof data[field] === 'string') {
        data[field] = this.cryptoService.decrypt(data[field]);
      }
    }
  }
}
