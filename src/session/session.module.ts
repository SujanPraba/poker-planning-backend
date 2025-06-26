import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { Session } from './entities/session.entity';
import { Story } from './entities/story.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Story, User])
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [TypeOrmModule, SessionService]
})
export class SessionModule {}
