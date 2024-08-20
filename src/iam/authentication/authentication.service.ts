import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/users/entities/user.entity';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';
import { randomUUID } from 'crypto';
import { RefreshTokenPayload } from '../interfaces/refresh-token-payload.interface';
import { InvalidateRefreshTokenError } from 'src/common/error/invalidate-refresh-token.error';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
  ) {}
  async signUp({ email, password }: SignUpDto) {
    try {
      const user = new this.userModel();
      user.email = email;
      user.password = await this.hashingService.hash(password);
      await this.userModel.create(user);
      return this.signIn({ email, password });
    } catch (err) {
      // If the error is related to a duplicate key (like email), throw a ConflictException
      if (err.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }
    const isPasswordValid = await this.hashingService.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return await this.generateTokens(user);
  }

  public async generateTokens(user: UserDocument) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenExpiresIn,
        {
          email: user.email,
          role: user.role,
        },
      ),
      this.signToken<RefreshTokenPayload>(
        user.id,
        this.jwtConfiguration.refreshTokenExpiresIn,
        {
          refreshTokenId,
        },
      ),
    ]);
    /*
    // inserting in redis so that we can validate the refresh token later
    // or else we can also invalidate if the user is suspicious
    */
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & RefreshTokenPayload
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.userModel.findById(sub).exec();
      if (!user) {
        throw new UnauthorizedException('User does not exists');
      }
      /**
       * we are using Rotating Refresh Tokens strategy here
       * so we need to validate the refresh token id
       * if it is valid then we will generate new tokens and invalidate the refresh token id
       * else we will throw an error
       */
      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      } else {
        await this.refreshTokenIdsStorage.invalidate(user.id);
      }

      return await this.generateTokens(user);
    } catch (error) {
      if (error instanceof InvalidateRefreshTokenError) {
        // notify the user that their login might be compromised
        throw new UnauthorizedException('Access Denied');
      }
      throw new UnauthorizedException();
    }
  }
  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
