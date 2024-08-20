import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ApiKeysService } from '../api-keys.service';
import { Model } from 'mongoose';
import { ApiKey } from 'src/users/api-keys/entities/api-key.entity';
import { InjectModel } from '@nestjs/mongoose';
import { REQUEST_USER_KEY } from 'src/iam/iam.constants';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeysService,
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKey>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromHeader(request);
    if (!apiKey) {
      throw new UnauthorizedException('No API key provided');
    }
    const apiKeyEntityId = this.apiKeyService.extractIdFromApiKey(apiKey);
    try {
      const apiKeyEntity = await this.apiKeyModel.findOne({
        _id: apiKeyEntityId,
      });
      if (!apiKeyEntity) {
        throw new UnauthorizedException('Invalid API key');
      }
      await this.apiKeyService.validate(apiKey, apiKeyEntity.key);

      request[REQUEST_USER_KEY] = {
        sub: apiKeyEntity.user.id,
        email: apiKeyEntity.user.email,
        role: apiKeyEntity.user.role,
        permissions: apiKeyEntity.user.permissions,
      } as ActiveUserData;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }

  private extractApiKeyFromHeader(req: Request): string | undefined {
    const [type, key] = req.headers.authorization.split(' ') || [];
    return type === 'ApiKey' ? key : undefined;
  }
}
