import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  audience: process.env.JWT_AUDIENCE,
  issuer: process.env.JWT_ISSUER,
  accessTokenExpiresIn: Number(process.env.JWT_EXPIRES_IN),
  refreshTokenExpiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN),
}));
