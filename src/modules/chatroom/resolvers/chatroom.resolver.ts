import {
  Args,
  Context, Int,
  Mutation,
  Query,
  Resolver, Subscription,
} from '@nestjs/graphql';
import { ChatroomService } from 'src/modules/chatroom/services/chatroom.service';
import { GraphQLErrorFilter } from 'src/common/filters/exception.filter';
import { UseFilters, UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/common/guards/graphql-auth.guard';
import { Chatroom, Message } from 'src/modules/chatroom/types/chatroom.types';
import { Request } from 'express';
import { PubSub } from 'graphql-subscriptions';

@Resolver()
export class ChatroomResolver {
  public pubSub: PubSub;
  constructor(
    private readonly chatroomService: ChatroomService,
  ) {
    this.pubSub = new PubSub();
  }

  @Subscription((returns) => Message, {
    nullable: true,
    resolve: (value) => value.newMessage,
  })
  newMessage(@Args('chatroomId', { type: () => Int }) chatroomId: number) {
    return this.pubSub.asyncIterableIterator(`newMessage.${chatroomId}`);
  }

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Message)
  async sendMessage(
    @Args('chatroomId') chatroomId: number,
    @Args('content') content: string,
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
    @Args('name') name: string,
    @Context() context: { req: Request },
  ) {
    return this.chatroomService.createChatroom(name, context.req.user.id);
  }

  @Mutation(() => Chatroom)
  async addUsersToChatroom(
    @Args('chatroomId') chatroomId: number,
    @Args('userIds', { type: () => [String] }) userIds: string[],
  ) {
    return this.chatroomService.addUsersToChatroom(chatroomId, userIds);
  }

  @Query(() => [Chatroom])
  async getChatroomsForUser(@Args('userId') userId: string) {
    return this.chatroomService.getChatroomsForUser(userId);
  }

  @Query(() => [Message])
  async getMessagesForChatroom(@Args('chatroomId') chatroomId: number) {
    return this.chatroomService.getMessagesForChatroom(chatroomId);
  }
  @Mutation(() => String)
  async deleteChatroom(@Args('chatroomId') chatroomId: number) {
    await this.chatroomService.deleteChatroom(chatroomId);
    return 'Chatroom deleted successfully';
  }
}