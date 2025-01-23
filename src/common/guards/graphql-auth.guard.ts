import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
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

    const token = this.extractTokenFromHeader(req.headers);

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }
    console.log(this.configService.get<string>('auth.accessToken.secret'));

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

  private extractTokenFromHeader(headers: { [key: string]: string }): string | undefined {
    if (headers['authorization'] && headers['authorization'].startsWith('Bearer ')) {
      return headers['authorization'].replace('Bearer ', '').trim();
    }

    if (headers['cookie']) {
      const cookies = headers['cookie'].split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key.trim()] = value;
        return acc;
      }, {});

      if (cookies['accessToken']) {
        return cookies['accessToken'];
      }
    }
  }
}
