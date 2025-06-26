import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroSession } from './entities/retro-session.entity';
import { RetroUser } from './entities/retro-user.entity';
import { RetroItem } from './entities/retro-item.entity';
import { RetroService } from './retro.service';
import { RetroGateway } from './retro.gateway';
import { RetroController } from './retro.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RetroSession, RetroUser, RetroItem]),
  ],
  providers: [RetroService, RetroGateway],
  controllers: [RetroController],
})
export class RetroModule {}