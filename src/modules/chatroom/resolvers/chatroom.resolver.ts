import {
  Args,
  Context, Int,
  Mutation,
  Query,
  Resolver, Subscription,
} from '@nestjs/graphql';
import { ChatroomService } from 'src/modules/chatroom/services/chatroom.service';
import { GraphQLErrorFilter } from 'src/common/filters/exception.filter';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/common/guards/graphql-auth.guard';
import { Chatroom, Message, User, UserTyping } from 'src/modules/chatroom/types/chatroom.types';
import { Request } from 'express';
import { PubSub } from 'graphql-subscriptions';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Resolver()
export class ChatroomResolver {
  public pubSub: PubSub;
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly chatroomService: ChatroomService,
  ) {
    this.pubSub = new PubSub();

    this.authClient.connect().catch((error) => {
      console.error('Error connecting to authClient:', error);
    });
  }

  @Subscription(() => Message, {
    nullable: true,
    resolve: (value) => value.newMessage,
  })
  newMessage(@Args('userId', { type: () => String }) userId: string) {
    return this.pubSub.asyncIterableIterator(`newMessageForUser.${userId}`);
  }

  @Subscription(() => UserTyping, {
    nullable: true,
    resolve: (value) => value.user,
    filter: (payload, variables) => {
      return variables.userId !== payload.typingUserId;
    },
  })
  userStartedTyping(@Args('userId', { type: () => String }) userId: string) {
    return this.pubSub.asyncIterableIterator(`userStartedTypingForUser.${userId}`);
  }

  @Subscription(() => UserTyping, {
    nullable: true,
    resolve: (value) => value.user,
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
    const user = await firstValueFrom(
      this.authClient.send('getUserById', JSON.stringify({ userId })),
    );

    const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

    await Promise.all(
      userIds.map((uid) =>
        this.pubSub.publish(`userStartedTypingForUser.${uid}`, {
          user,
          chatroomId
        }),
      ),
    );

    return user;
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => UserTyping)
  async userStoppedTypingMutation(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.id;
    const user = await firstValueFrom(
      this.authClient.send('getUserById', JSON.stringify({ userId })),
    );

    const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

    await Promise.all(
      userIds.map((uid) =>
        this.pubSub.publish(`userStoppedTypingForUser.${uid}`, {
          user,
          chatroomId
        }),
      ),
    );

    return user;
  }

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Message)
  async sendMessage(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Args('content', { type: () => String }) content: string,
    @Context() context: { req: Request },
  ) {
    const newMessage = await this.chatroomService.sendMessage(
      chatroomId,
      content,
      context.req.user.id,
    );

    const userIds = await this.chatroomService.getUserIdsForChatroom(chatroomId);

    await Promise.all(
      userIds.map((uid) =>
        this.pubSub.publish(`newMessageForUser.${uid}`, { newMessage }),
      ),
    );

    return newMessage;
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