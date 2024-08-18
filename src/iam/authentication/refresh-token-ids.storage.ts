import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import { InvalidateRefreshTokenError } from 'src/common/error/invalidate-refresh-token.error';
import { redisClient } from 'src/redis/redis.constants';

@Injectable()
export class RefreshTokenIdsStorage {
  constructor(@Inject(redisClient) private readonly redisClient: Redis) {}

  async insert(userId: string, tokenId: string): Promise<void> {
    await this.redisClient.set(userId, tokenId);
  }

  async validate(userId: string, tokenId: string): Promise<boolean> {
    const storedTokenId = await this.redisClient.get(userId);
    if (storedTokenId !== tokenId) {
      throw new InvalidateRefreshTokenError();
    }
    return storedTokenId === tokenId;
  }

  async invalidate(userId: string): Promise<void> {
    await this.redisClient.del(this.getKey(userId));
  }

  private getKey(userId: string): string {
    return `user-${userId}`;
  }
}
