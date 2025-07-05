// This file will be moved to buffer/buffer.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
@Injectable()
export class BufferService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  async pushChunk(roomId: string, chunk: string) {
    await this.redis.lpush(`room:${roomId}`, chunk);
    await this.redis.ltrim(`room:${roomId}`, 0, 29);
  }

  async getBuffer(roomId: string): Promise<string[]> {
    return await this.redis.lrange(`room:${roomId}`, 0, -1);
  }
} 