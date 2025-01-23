import { Module } from '@nestjs/common';
import { ChatroomService } from 'src/modules/chatroom/services/chatroom.service';
import { ChatroomResolver } from 'src/modules/chatroom/resolvers/chatroom.resolver';
import { PrismaService } from 'src/common/services/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    CommonModule,
  ],
  providers: [
    ChatroomService,
    ChatroomResolver,
    PrismaService,
    JwtService,
  ],
})
export class ChatroomModule {}