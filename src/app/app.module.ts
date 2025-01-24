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
import { TokenService } from 'src/common/services/token.service';
import { JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        GraphQLModule.forRootAsync({
            imports: [ConfigModule, CommonModule],
            inject: [ConfigService, TokenService],
            driver: ApolloDriver,
            useFactory: (configService: ConfigService, tokenService: TokenService) => {
                const redisOptions = {
                    host: configService.get<string>('redis.host'),
                    port: configService.get<number>('redis.port'),
                    username: configService.get<string>('redis.username'),
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
                        'graphql-ws': true,
                    },
                    onConnect: connectionParams => {
                        const token = tokenService.extractToken(connectionParams);

                        if (!token) {
                            throw new Error('Token not provided');
                        }
                        const user = tokenService.validateToken(token);
                        if (!user) {
                            throw new Error('Invalid token');
                        }
                        return { user };
                    },
                    context: ({ req, res, connection }) => {
                        if (connection) {
                            return { req, res, user: connection.context.user, pubSub };
                        }
                        return { req, res };
                    },
                };
            },
        }),
        TerminusModule,
        CommonModule,
        ChatroomModule,
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
    ],
    controllers: [AppController],
    providers: [JwtService, TokenService],
})
export class AppModule {}
