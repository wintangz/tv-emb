import { Module } from '@nestjs/common';
import { EmbroideryController } from './embroidery.controller.js';
import { EmbroideryService } from './embroidery.service.js';

@Module({
  controllers: [EmbroideryController],
  providers: [EmbroideryService],
  exports: [EmbroideryService],
})
export class EmbroideryModule {}

