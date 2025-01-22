import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/services/prisma.service';
import { Chatroom, Message, MessageStatus } from '@prisma/client';
import { Chatroom as ChatroomDto } from '../types/chatroom.types';

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
        status: MessageStatus,
        messageId: string,
    ): Promise<Message> {
        return this.prisma.message.create({
            data: { chatroomId, content, userId, status, id: messageId },
            include: {
                chatroom: true,
            },
        });
    }

    async updateMessagesStatus(messageIds: string[], status: MessageStatus): Promise<Message[]> {
        console.log({ messageIds });

        await this.prisma.message.updateMany({
            where: {
                id: {
                    in: messageIds,
                },
            },
            data: { status },
        });

        return this.prisma.message.findMany({
            where: {
                id: {
                    in: messageIds,
                },
            },
        });
    }

    async createChatroom(name: string, userId: string): Promise<Chatroom> {
        console.log(name, userId);
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
        return chatroomUsers.map(u => u.userId);
    }

    async addUsersToChatroom(chatroomId: number, userIds: string[]): Promise<ChatroomDto> {
        const data = userIds.map(userId => ({
            chatroomId,
            userId,
        }));

        await this.prisma.chatroomUsers.createMany({
            data,
            skipDuplicates: true,
        });

        const chatroom = await this.prisma.chatroom.findUnique({
            where: { id: chatroomId },
            include: {
                ChatroomUsers: true,
                messages: true,
            },
        });

        return {
            ...chatroom,
            userIds: chatroom.ChatroomUsers.map(u => u.userId),
        };
    }

    async getChatroomsForUser(userId: string): Promise<ChatroomDto[]> {
        const chatrooms = await this.prisma.chatroom.findMany({
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

        return chatrooms.map(chatroom => ({
            ...chatroom,
            userIds: chatroom.ChatroomUsers.map(u => u.userId),
        }));
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
