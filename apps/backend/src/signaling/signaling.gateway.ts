import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import { randomBytes } from 'crypto';

@WebSocketGateway({ cors: true })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  private roomTimes: Record<string, number> = {};

  constructor(
    private readonly roomService: RoomService,
  ) {}

  @SubscribeMessage('createRoom')
  async handleCreateRoom(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    const roomId = randomBytes(3).toString('hex').toUpperCase(); // 6-char room ID
    this.roomService.createRoom(roomId, data.userId);
    client.join(roomId);
    client.emit('roomCreated', { roomId });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    this.roomService.joinRoom(data.roomId, data.userId);
    this.roomService.setUserSocket(data.userId, client.id);
    client.join(data.roomId);
    // Notify host
    console.log('hostId', this.roomService.getHostId(data.roomId));
    const hostId = this.roomService.getHostId(data.roomId);
    const hostSocketId = this.roomService.getSocketId(hostId);
    console.log('hostSocketId', hostSocketId);
    if (hostId && hostId !== data.userId && hostSocketId) {
      this.server.to(hostSocketId).emit('viewerJoined', { roomId: data.roomId, viewerId: data.userId, viewerSocketId: client.id });
    }
  }

  @SubscribeMessage('signal')
  handleSignal(@MessageBody() data: { roomId: string; from: string; to: string; signal: any }, @ConnectedSocket() client: Socket) {
    const toSocketId = this.roomService.getSocketId(data.to);
    if (toSocketId) {
      this.server.to(toSocketId).emit('signal', { from: data.from, signal: data.signal });
    }
  }

  @SubscribeMessage('sync')
  handleSync(@MessageBody() data: { roomId: string; currentTime: number }, @ConnectedSocket() client: Socket) {
    this.roomTimes[data.roomId] = data.currentTime;
    client.to(data.roomId).emit('sync', { currentTime: data.currentTime });
  }
} 