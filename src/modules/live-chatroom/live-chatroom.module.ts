import { Module } from '@nestjs/common';
import { LiveChatroomResolver } from './resolvers/live-chatroom.resolver';
import { LiveChatroomService } from './services/live-chatroom.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/services/prisma.service';
import { CommonModule } from 'src/common/common.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CommonModule,
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
  providers: [
    LiveChatroomResolver,
    LiveChatroomService,
    PrismaService,
    JwtService,
  ],
})
export class LiveChatroomModule {}