import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/services/prisma.service';
import { Chatroom, Message } from '@prisma/client';

@Injectable()
export class ChatroomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async sendMessage(
    chatroomId: number,
    content: string,
    userId: string,
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        content,
        chatroomId,
        userId,
      },
    });
  }

  async createChatroom(name: string, userId: string): Promise<Chatroom> {
    console.log(name, userId)
    return this.prisma.chatroom.create({
      data: {
        name,
        ChatroomUsers: {
          create: {
            userId,
          },
        },
      },
    });
  }

  async getUserIdsForChatroom(chatroomId: number): Promise<string[]> {
    const chatroomUsers = await this.prisma.chatroomUsers.findMany({
      where: { chatroomId },
      select: { userId: true },
    });
    return chatroomUsers.map((u) => u.userId);
  }

  async addUsersToChatroom(chatroomId: number, userIds: string[]): Promise<Chatroom> {
    const data = userIds.map(userId => ({
      chatroomId,
      userId,
    }));
    await this.prisma.chatroomUsers.createMany({
      data,
      skipDuplicates: true,
    });
    return this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
      include: {
        ChatroomUsers: true,
        messages: true,
      },
    });
  }

  async getChatroomsForUser(userId: string): Promise<Chatroom[]> {
    return this.prisma.chatroom.findMany({
      where: {
        ChatroomUsers: {
          some: { userId },
        },
      },
      include: {
        ChatroomUsers: true,
        messages: true,
      },
    });
  }

  async getMessagesForChatroom(chatroomId: number): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { chatroomId },
    });
  }

  async deleteChatroom(chatroomId: number): Promise<Chatroom> {
    return this.prisma.chatroom.delete({
      where: { id: chatroomId },
    });
  }
}