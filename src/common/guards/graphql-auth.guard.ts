import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';

import { GqlExecutionContext } from '@nestjs/graphql';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GraphqlAuthGuard implements CanActivate {
    constructor(
        // private readonly jwtService: JwtService,
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,

        private readonly configService: ConfigService,
    ) {
        this.authClient.connect();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gqlContext = GqlExecutionContext.create(context);
        const { req, connection } = gqlContext.getContext();

        console.log({ req });

        const token = this.extractTokenFromHeader(req.headers);

        console.log({ token });

        if (!token) {
            throw new UnauthorizedException('Token not provided');
        }
        console.log(this.configService.get<string>('auth.accessToken.secret'));

        try {
            const secret = this.configService.get<string>('auth.accessToken.secret');

            console.log({ secret });

            // const payload = await this.jwtService.verifyAsync(token, { secret });

            const response = await firstValueFrom(
                this.authClient.send('validateToken', JSON.stringify({ token })),
            );

            console.log({ response });

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
