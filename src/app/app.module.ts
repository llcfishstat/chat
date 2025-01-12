import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CommonModule } from 'src/common/common.module';

import { AppController } from './app.controller';
import { join } from 'path';
import { GraphQLModule } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { ChatroomModule } from 'src/modules/chatroom/chatroom.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver } from '@nestjs/apollo';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TokenService } from 'src/common/services/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [
        GraphQLModule.forRootAsync({
            imports: [ConfigModule, CommonModule],
            inject: [ConfigService, TokenService],
            driver: ApolloDriver,
            useFactory: (configService: ConfigService, tokenService: TokenService,) => {
                const redisOptions = {
                    host: configService.get<string>('redis.host'),
                    port: configService.get<number>('redis.port'),
                    user: configService.get<number>('redis.user'),
                    password: configService.get<string>('redis.password'),
                    retryStrategy: (times: number) => Math.min(times * 50, 2000),
                };
                const pubSub = new RedisPubSub({
                    connection: redisOptions,
                });

                return {
                    installSubscriptionHandlers: true,
                    playground: true,
                    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
                    sortSchema: true,
                    subscriptions: {
                        'subscriptions-transport-ws': true,
                        'graphql-ws': {
                            onConnect: (connectionParams: any, websocket: any) => {
                                const token = connectionParams?.Authorization || connectionParams?.authorization;

                                if (!token || !token.startsWith('Bearer ')) {
                                    throw new Error('Token not provided or invalid format');
                                }

                                const parsedToken = token.replace('Bearer ', '').trim();
                                const user = tokenService.validateToken(parsedToken);
                                if (!user) {
                                    throw new Error('Invalid token');
                                }

                                return { user };
                            },
                        },
                    },
                    context: ({ req, connection }) => {
                        if (connection) {
                            return {
                                ...connection.context,
                                pubSub,
                            };
                        }
                        return { req, pubSub };
                    },
                };
            },
        }),
        ClientsModule.registerAsync([
            {
                name: 'AUTH_SERVICE',
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [`${configService.get('rmq.uri')}`],
                        queue: `${configService.get('rmq.auth')}`,
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
        TerminusModule,
        CommonModule,
        ChatroomModule,
    ],
    controllers: [AppController],
    providers: [
        JwtService,
        TokenService,
    ],
})
export class AppModule {}
