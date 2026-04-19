import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ACCESS_COOKIE } from 'src/constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[ACCESS_COOKIE] as string;

    try {
      const payload = (await this.jwtService.verifyAsync(token)) as unknown as {
        sub: string;
        role: string;
      };

      request['user'] = {
        id: payload.sub,
        role: payload.role,
        ...request['user'],
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
    return true;
  }
}
