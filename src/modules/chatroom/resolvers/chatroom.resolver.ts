import { Args, Context, Int, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ChatroomService } from 'src/modules/chatroom/services/chatroom.service';
import { GraphQLErrorFilter } from 'src/common/filters/exception.filter';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/common/guards/graphql-auth.guard';
import {
    Chatroom,
    Message,
    UserTyping,
} from 'src/modules/chatroom/types/chatroom.types';
import { Request } from 'express';
import { PubSub } from 'graphql-subscriptions';
import { ClientProxy } from '@nestjs/microservices';
import { EventEmitter } from 'events';
import { MessageStatus } from '@prisma/client';

@Resolver()
export class ChatroomResolver {
    public pubSub: PubSub;
    constructor(
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
        private readonly chatroomService: ChatroomService,
    ) {
        const emitter = new EventEmitter();

        emitter.setMaxListeners(999);

        this.pubSub = new PubSub({ eventEmitter: emitter });

        this.authClient.connect().catch(error => {
            console.error('Error connecting to authClient:', error);
        });
    }

    @Subscription(() => Message, {
        nullable: true,
        resolve: value => value.newMessage,
    })
    newMessage(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`newMessageForUser.${userId}`);
    }

    @Subscription(() => UserTyping, {
        nullable: true,
        resolve: value => value.user,
        filter: (payload, variables) => {
            return variables.userId !== payload.typingUserId;
        },
    })
    userStartedTyping(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`userStartedTypingForUser.${userId}`);
    }

    @Subscription(() => UserTyping, {
        nullable: true,
        resolve: value => value.user,
        filter: (payload, variables) => {
            return variables.userId !== payload.typingUserId;
        },
    })
    userStoppedTyping(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`userStoppedTypingForUser.${userId}`);
    }

    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => UserTyping)
    async userStartedTypingMutation(
        @Args('chatroomId', { type: () => Int }) chatroomId: number,
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
        @Args('chatroomId', { type: () => Int }) chatroomId: number,
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
        @Args('chatroomId', { type: () => Int }) chatroomId: number,
        @Args('content', { type: () => String }) content: string,
        @Args('status', { type: () => String }) status: MessageStatus,
        @Context() context: { req: Request },
    ) {
        const newMessage = await this.chatroomService.sendMessage(
            chatroomId,
            content,
            context.req.user.id,
            status,
        );

        const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

        await Promise.all(
            userIds.map(uid => this.pubSub.publish(`newMessageForUser.${uid}`, { newMessage })),
        );
        return newMessage;
    }

    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => Message)
    async updateMessageStatus(
        @Args('messageId', { type: () => Int }) messageId: number,
        @Args('status', { type: () => String }) status: MessageStatus,
        @Context() context: { req: Request },
    ): Promise<Message> {
        const updatedMessage = await this.chatroomService.updateMessageStatus(messageId, status);

        const userIds = await this.chatroomService.getUserIdsForChatroom(updatedMessage.chatroomId);

        await Promise.all(
            userIds.map(uid =>
                this.pubSub.publish(`messageStatusUpdatedForUser.${uid}`, {
                    message: updatedMessage,
                }),
            ),
        );

        return updatedMessage;
    }

    @Subscription(() => Message, {
        filter: (payload, variables) => {
            return payload.message.userId !== variables.userId;
        },
        resolve: payload => payload.message, // payload.message придёт из pubSub
    })
    messageStatusUpdated(@Args('userId', { type: () => String }) userId: string) {
        return this.pubSub.asyncIterableIterator(`messageStatusUpdatedForUser.${userId}`);
    }

    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => Chatroom)
    async createChatroom(
        @Args('name', { type: () => String }) name: string,
        @Context() context: { req: Request },
    ) {
        return this.chatroomService.createChatroom(name, context.req.user.id);
    }

    @Mutation(() => Chatroom)
    async addUsersToChatroom(
        @Args('chatroomId', { type: () => Int }) chatroomId: number,
        @Args('userIds', { type: () => [String] }) userIds: string[],
    ) {
        return this.chatroomService.addUsersToChatroom(chatroomId, userIds);
    }

    @Query(() => [Chatroom])
    async getChatroomsForUser(@Args('userId', { type: () => String }) userId: string) {
        return this.chatroomService.getChatroomsForUser(userId);
    }

    @Query(() => [Message])
    async getMessagesForChatroom(@Args('chatroomId', { type: () => Int }) chatroomId: number) {
        return this.chatroomService.getMessagesForChatroom(chatroomId);
    }
    @Mutation(() => String)
    async deleteChatroom(@Args('chatroomId', { type: () => Int }) chatroomId: number) {
        await this.chatroomService.deleteChatroom(chatroomId);
        return 'Chatroom deleted successfully';
    }
}
