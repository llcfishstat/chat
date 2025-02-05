import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { GqlExecutionContext } from '@nestjs/graphql';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GraphqlAuthGuard implements CanActivate {
    constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {
        this.authClient.connect();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gqlContext = GqlExecutionContext.create(context);
        const { req, connection } = gqlContext.getContext();

        const token = this.extractTokenFromHeader(req.headers);

        if (!token) {
            throw new UnauthorizedException('Token not provided');
        }

        try {
            const response = await firstValueFrom(
                this.authClient.send('validateToken', JSON.stringify({ token })),
            );

            if (!response) {
                throw new UnauthorizedException('auth.accessTokenUnauthorized');
            }

            if (req) {
                req.user = response;
            } else if (connection) {
                connection.context.user = response;
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
