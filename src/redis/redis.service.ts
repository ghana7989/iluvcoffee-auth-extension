import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  getClient() {
    return this.redisClient;
  }

  onApplicationShutdown(signal?: string) {
    throw new Error('Method not implemented.');
  }
}
