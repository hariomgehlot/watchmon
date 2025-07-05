// This file will be moved to signaling/signaling.module.ts
import { Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { RoomModule } from '../room/room.module';
import { BufferModule } from '../buffer/buffer.module';

@Module({
  imports: [RoomModule, BufferModule],
  providers: [SignalingGateway],
})
export class SignalingModule {} 