import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import { BufferService } from '../buffer/buffer.service';
import { Inject } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly bufferService: BufferService,
  ) {}

  @SubscribeMessage('createRoom')
  async handleCreateRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    this.roomService.createRoom(data.roomId, data.userId);
    client.join(data.roomId);
    this.server.to(data.roomId).emit('roomCreated', { roomId: data.roomId });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    this.roomService.joinRoom(data.roomId, data.userId);
    client.join(data.roomId);
    // Send buffer to new peer
    const buffer = await this.bufferService.getBuffer(data.roomId);
    client.emit('buffer', { roomId: data.roomId, buffer });
    this.server.to(data.roomId).emit('userJoined', { roomId: data.roomId, userId: data.userId });
  }

  @SubscribeMessage('signal')
  handleSignal(@MessageBody() data: { roomId: string; userId: string; signal: any }, @ConnectedSocket() client: Socket) {
    // Relay signaling data to all peers in the room except sender
    client.to(data.roomId).emit('signal', { userId: data.userId, signal: data.signal });
  }

  @SubscribeMessage('sendChunk')
  async handleSendChunk(@MessageBody() data: { roomId: string; chunk: string }, @ConnectedSocket() client: Socket) {
    await this.bufferService.pushChunk(data.roomId, data.chunk);
  }

  @SubscribeMessage('requestBuffer')
  async handleRequestBuffer(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const buffer = await this.bufferService.getBuffer(data.roomId);
    client.emit('buffer', { roomId: data.roomId, buffer });
  }
} 