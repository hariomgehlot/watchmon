// This file will be moved to room/room.service.ts
import { Injectable } from '@nestjs/common';

interface Room {
  id: string;
  users: string[];
}

@Injectable()
export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private userSockets: Map<string, string> = new Map();

  createRoom(roomId: string, userId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { id: roomId, users: [userId] });
    }
  }

  joinRoom(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (room && !room.users.includes(userId)) {
      room.users.push(userId);
    }
  }

  getUsers(roomId: string): string[] {
    return this.rooms.get(roomId)?.users || [];
  }

  getHostId(roomId: string): string | undefined {
    const users = this.getUsers(roomId);
    return users.length > 0 ? users[0] : undefined;
  }

  setUserSocket(userId: string, socketId: string) {
    this.userSockets.set(userId, socketId);
  }

  getSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
} 