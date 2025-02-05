import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/services/prisma.service';
import { Chatroom, ChatroomType, Media, Message, MessageStatus } from '@prisma/client';
import { Chatroom as ChatroomDto } from '../types/chatroom.types';
import { CreateMediaDto } from '../dtos/create-media.dto';

@Injectable()
export class ChatroomService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    async sendMessage(
        chatroomId: string,
        content: string,
        userId: string,
        status: MessageStatus,
        messageId: string,
        media: Media[],
    ): Promise<Message> {
        return this.prisma.message.create({
            data: { chatroomId, content, userId, status, id: messageId, media: { connect: media } },
            include: {
                chatroom: true,
                media: true,
            },
        });
    }

    async updateMessagesStatus(messageIds: string[], status: MessageStatus): Promise<Message[]> {
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
            include: { media: true },
        });
    }

    async createChatroom(
        name: string,
        type: ChatroomType,
        userId: string,
        chatroomId?: string,
    ): Promise<Chatroom> {
        return this.prisma.chatroom.create({
            data: {
                id: chatroomId,
                name,
                type,
                chatroomUsers: {
                    create: {
                        userId,
                    },
                },
            },
        });
    }

    async createMedia(data: CreateMediaDto[], userId: string): Promise<Media[]> {
        return this.prisma.media.createManyAndReturn({
            data: data.map(item => ({ ...item, userId: userId })),
            skipDuplicates: true,
            include: { chatroom: true, message: true },
        });
    }

    async getUserIdsForChatroom(chatroomId: string): Promise<string[]> {
        const chatroomUsers = await this.prisma.chatroomUsers.findMany({
            where: { chatroomId },
            select: { userId: true },
        });
        return chatroomUsers.map(u => u.userId);
    }

    async addUsersToChatroom(chatroomId: string, userIds: string[]): Promise<ChatroomDto> {
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
                chatroomUsers: true,
                messages: true,
            },
        });

        return {
            ...chatroom,
            userIds: chatroom.chatroomUsers.map(u => u.userId),
        };
    }

    async getChatroomById(chatroomId: string) {
        return this.prisma.chatroom.findUnique({
            where: { id: chatroomId },
            include: {
                chatroomUsers: true,
                // media: true,
                messages: {
                    include: {
                        media: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }

    async getChatroomsForUser(userId: string): Promise<ChatroomDto[]> {
        const chatrooms = await this.prisma.chatroom.findMany({
            where: {
                chatroomUsers: {
                    some: { userId },
                },
            },
            include: {
                chatroomUsers: true,
                messages: {
                    include: {
                        media: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        return chatrooms.map(chatroom => ({
            ...chatroom,
            userIds: chatroom.chatroomUsers.map(u => u.userId),
        }));
    }

    async getMessagesForChatroom(chatroomId: string): Promise<Message[]> {
        return this.prisma.message.findMany({
            where: { chatroomId },
            include: {
                media: true,
            },
        });
    }

    async deleteChatroom(chatroomId: string): Promise<Chatroom> {
        return this.prisma.chatroom.delete({
            where: { id: chatroomId },
        });
    }
}
