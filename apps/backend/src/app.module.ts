import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalingModule } from './signaling/signaling.module';
import { RoomModule } from './room/room.module';
import { BufferModule } from './buffer/buffer.module';

@Module({
  imports: [SignalingModule, RoomModule, BufferModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
