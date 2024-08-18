import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisClient } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: redisClient,
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
    RedisService,
  ],
  exports: [redisClient],
})
export class RedisModule {}
