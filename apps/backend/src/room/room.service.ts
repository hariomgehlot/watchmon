// This file will be moved to room/room.service.ts
import { Injectable } from '@nestjs/common';

interface Room {
  id: string;
  users: string[];
  videoName?: string;
}

@Injectable()
export class RoomService {
  private rooms: Map<string, Room> = new Map();
  public userSockets: Map<string, string> = new Map();

  createRoom(roomId: string, userId: string, videoName?: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { id: roomId, users: [userId], videoName });
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

  removeUser(userId: string) {
    // Remove user from all rooms
    for (const room of this.rooms.values()) {
      const idx = room.users.indexOf(userId);
      if (idx !== -1) {
        room.users.splice(idx, 1);
      }
    }
    // Remove socket mapping
    this.userSockets.delete(userId);
  }

  getVideoName(roomId: string): string | undefined {
    return this.rooms.get(roomId)?.videoName;
  }
} 