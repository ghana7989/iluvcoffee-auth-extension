import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  async signUp({ email, password }: SignUpDto) {
    try {
      const user = new this.userModel();
      user.email = email;
      user.password = await this.hashingService.hash(password);
      await this.userModel.create(user);
      return user;
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
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user._id,
        email: user.email,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn: this.jwtConfiguration.expiresIn,
        secret: this.jwtConfiguration.secret,
      },
    );
    return {
      accessToken,
    };
  }
}
