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
import { Chatroom, Message, User } from 'src/modules/chatroom/types/chatroom.types';
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

  @Subscription((returns) => Message, {
    nullable: true,
    resolve: (value) => value.newMessage,
  })
  newMessage(@Args('chatroomId', { type: () => Int }) chatroomId: number) {
    return this.pubSub.asyncIterableIterator(`newMessage.${chatroomId}`);
  }

  @Subscription(() => User, {
    nullable: true,
    resolve: (value) => value.user,
    filter: (payload, variables) => {
      console.log('payload1', variables, payload.typingUserId);
      return variables.userId !== payload.typingUserId;
    },
  })
  userStartedTyping(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Args('userId', { type: () => String }) userId: string,
  ) {
    return this.pubSub.asyncIterableIterator(`userStartedTyping.${chatroomId}`);
  }

  @Subscription(() => User, {
    nullable: true,
    resolve: (value) => value.user,
    filter: (payload, variables) => {
      return variables.userId !== payload.typingUserId;
    },
  })
  userStoppedTyping(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Args('userId', { type: () => String }) userId: string,
  ) {
    return this.pubSub.asyncIterableIterator(`userStoppedTyping.${chatroomId}`);
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => User)
  async userStartedTypingMutation(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.id;
    const user = await firstValueFrom(
      this.authClient.send('getUserById', JSON.stringify({ userId })),
    );
    await this.pubSub.publish(`userStartedTyping.${chatroomId}`, {
      user,
      typingUserId: user.id,
    });
    return user;
  }
  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => User, {})
  async userStoppedTypingMutation(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.id;
    const user = await firstValueFrom(
      this.authClient.send('getUserById', JSON.stringify({ userId })),
    );

    await this.pubSub.publish(`userStoppedTyping.${chatroomId}`, {
      user,
      typingUserId: user.id,
    });

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
    await this.pubSub
      .publish(`newMessage.${chatroomId}`, { newMessage })
      .then((res) => {
        console.log('published', res);
      })
      .catch((err) => {
        console.log('err', err);
      });

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