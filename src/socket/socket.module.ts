import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  providers: [SocketGateway],
  exports: [SocketGateway]
})
export class SocketModule {}
