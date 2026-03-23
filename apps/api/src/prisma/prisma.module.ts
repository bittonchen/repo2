import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CryptoService } from '../common/services/crypto.service';

@Global()
@Module({
  providers: [CryptoService, PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
