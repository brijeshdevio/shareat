import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['accessToken'] as string;

    try {
      const payload = (await this.jwtService.verifyAsync(token)) as unknown;
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
    return true;
  }
}
