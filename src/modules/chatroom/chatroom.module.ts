import { Module } from '@nestjs/common';
import { ChatroomService } from 'src/modules/chatroom/services/chatroom.service';
import { ChatroomResolver } from 'src/modules/chatroom/resolvers/chatroom.resolver';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ClientsModule,
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
    ChatroomService,
    ChatroomResolver,
    PrismaService,
    JwtService,
  ],
})
export class ChatroomModule {}