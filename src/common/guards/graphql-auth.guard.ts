import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GraphqlAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const { req, connection } = gqlContext.getContext();

    console.log(req, connection)

    let token: string | undefined;

    if (req) {
      console.log('HTTP Request:', req.headers);
      token = this.extractTokenFromHeader(req.headers['authorization']);
    } else if (connection) {
      console.log('WebSocket Connection Context:', connection.context);
      token = connection.context?.Authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '').trim();
      }
    }

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const secret = this.configService.get<string>('auth.accessToken.secret');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      if (req) {
        req.user = payload;
      } else if (connection) {
        connection.context.user = payload;
      }
    } catch (err) {
      console.error('JWT verification failed:', err);
      throw new UnauthorizedException('Token verification failed');
    }

    return true;
  }

  private extractTokenFromHeader(authorization?: string): string | undefined {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return undefined;
    }
    return authorization.replace('Bearer ', '').trim();
  }
}