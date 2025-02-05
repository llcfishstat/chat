import { Args, Context, Int, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ChatroomService } from 'src/modules/chatroom/services/chatroom.service';
import { GraphQLErrorFilter } from 'src/common/filters/exception.filter';
import { UseFilters, UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/common/guards/graphql-auth.guard';
import { Chatroom, Message, UserTyping } from 'src/modules/chatroom/types/chatroom.types';
import { Request } from 'express';
import { PubSub } from 'graphql-subscriptions';
import { EventEmitter } from 'events';
import { ChatroomType, Media, MessageStatus } from '@prisma/client';
import { CreateMediaDto } from '../dtos/create-media.dto';

@Resolver()
export class ChatroomResolver {
    public pubSub: PubSub;

    constructor(private readonly chatroomService: ChatroomService) {
        const emitter = new EventEmitter();

        emitter.setMaxListeners(999);

        this.pubSub = new PubSub({ eventEmitter: emitter });
    }

    @Subscription(() => Message, {
        nullable: true,
        filter: (payload, variables) => {
            return variables.userId !== payload.newMessage.userId;
        },
        resolve: value => value.newMessage,
    })
    newMessage(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`newMessageForUser.${userId}`);
    }

    @Subscription(() => UserTyping, {
        nullable: true,
        resolve: value => value,
        filter: (payload, variables) => {
            return variables.userId !== payload.userId;
        },
    })
    userStartedTyping(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`userStartedTypingForUser.${userId}`);
    }

    @Subscription(() => UserTyping, {
        nullable: true,
        resolve: value => value,
        filter: (payload, variables) => {
            return variables.userId !== payload.userId;
        },
    })
    userStoppedTyping(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`userStoppedTypingForUser.${userId}`);
    }

    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => UserTyping)
    async userStartedTypingMutation(
        @Args('chatroomId', { type: () => String }) chatroomId: string,
        @Context() context: { req: Request },
    ) {
        const userId = context.req.user?.id;

        const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

        await Promise.all(
            userIds.map(uid =>
                this.pubSub.publish(`userStartedTypingForUser.${uid}`, {
                    userId,
                    chatroomId,
                }),
            ),
        );

        return {
            userId,
            chatroomId,
        };
    }

    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => UserTyping)
    async userStoppedTypingMutation(
        @Args('chatroomId', { type: () => String }) chatroomId: string,
        @Context() context: { req: Request },
    ) {
        const userId = context.req.user?.id;

        const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

        await Promise.all(
            userIds.map(uid =>
                this.pubSub.publish(`userStoppedTypingForUser.${uid}`, {
                    userId,
                    chatroomId,
                }),
            ),
        );

        return {
            userId,
            chatroomId,
        };
    }

    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => Message)
    async sendMessage(
        @Args('chatroomId', { type: () => String }) chatroomId: string,
        @Args('content', { type: () => String }) content: string,
        @Args('status', { type: () => String }) status: MessageStatus,
        @Args('messageId', { type: () => String }) messageId: string,
        @Args('media', { type: () => [CreateMediaDto] }) media: CreateMediaDto[],
        @Context()
        context: { req: Request },
    ) {
        const userId = context.req.user.id;

        let dbMedia: Media[];

        if (!!media.length) {
            dbMedia = await this.chatroomService.createMedia(media, userId);
        }

        const newMessage = await this.chatroomService.sendMessage(
            chatroomId,
            content,
            context.req.user.id,
            status,
            messageId,
            dbMedia,
        );

        const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

        await Promise.all(
            userIds.map(uid => this.pubSub.publish(`newMessageForUser.${uid}`, { newMessage })),
        );
        return newMessage;
    }

    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => [Message])
    async updateMessagesStatus(
        @Args('messageIds', { type: () => [String] }) messageIds: string[],
        @Args('status', { type: () => String }) status: MessageStatus,
    ): Promise<Message[]> {
        const updatedMessages = await this.chatroomService.updateMessagesStatus(messageIds, status);

        const userIds = await this.chatroomService.getUserIdsForChatroom(
            updatedMessages[0].chatroomId,
        ); // TODO: добавить поддрержку комннат на несколько пользователей

        await Promise.all(
            userIds.map(uid =>
                this.pubSub.publish(`messageStatusUpdatedForUser.${uid}`, {
                    messages: updatedMessages,
                }),
            ),
        );

        return updatedMessages;
    }

    @Subscription(() => [Message], {
        filter: (payload, variables) => {
            return payload.messages[0].userId === variables.userId;
        },
        resolve: payload => payload.messages, // payload.message придёт из pubSub
    })
    messageStatusUpdated(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`messageStatusUpdatedForUser.${userId}`);
    }

    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => Chatroom)
    async createChatroom(
        @Args('name', { type: () => String }) name: string,
        @Args('type', { type: () => ChatroomType }) type: ChatroomType,
        @Args('chatroomId', { type: () => String, nullable: true }) chatroomId: string,

        @Context() context: { req: Request },
    ) {
        return this.chatroomService.createChatroom(name, type, context.req.user.id, chatroomId);
    }

    @Mutation(() => Chatroom)
    async addUsersToChatroom(
        @Args('chatroomId', { type: () => String }) chatroomId: string,
        @Args('userIds', { type: () => [String] }) userIds: string[],
    ) {
        return this.chatroomService.addUsersToChatroom(chatroomId, userIds);
    }

    @Query(() => [Chatroom])
    async getChatroomsForUser(@Args('userId', { type: () => String }) userId: string) {
        return this.chatroomService.getChatroomsForUser(userId);
    }

    @Query(() => [Message])
    async getMessagesForChatroom(@Args('chatroomId', { type: () => String }) chatroomId: string) {
        return this.chatroomService.getMessagesForChatroom(chatroomId);
    }

    @Query(() => Chatroom)
    async getChatroomById(@Args('chatroomId', { type: () => String }) chatroomId: string) {
        return this.chatroomService.getChatroomById(chatroomId);
    }

    @Mutation(() => String)
    async deleteChatroom(@Args('chatroomId', { type: () => String }) chatroomId: string) {
        await this.chatroomService.deleteChatroom(chatroomId);
        return 'Chatroom deleted successfully';
    }
}
