import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const { id } = payload;

      if (!id) {
        console.error('JWT payload missing user id');
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.usersService.findById(id);
      if (!user) {
        console.error(`User with id ${id} not found`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        console.error(`User ${id} is inactive`);
        throw new UnauthorizedException('User account is inactive');
      }

      return user;
    } catch (error) {
      console.error('JWT validation error:', error.message);
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }
}
