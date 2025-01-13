import { Int, Resolver } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { LiveChatroomService } from 'src/modules/live-chatroom/services/live-chatroom.service';
import { Subscription, Args, Context, Mutation } from '@nestjs/graphql';
import { Request } from 'express';
import { UseFilters, UseGuards, Inject } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/common/guards/graphql-auth.guard';
import { GraphQLErrorFilter } from 'src/common/filters/exception.filter';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/modules/chatroom/types/chatroom.types';

@Resolver()
export class LiveChatroomResolver {
  private pubSub: PubSub;
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly liveChatroomService: LiveChatroomService,
  ) {
    this.pubSub = new PubSub();
    this.authClient.connect().catch((error) => {
      console.error('Error connecting to authClient:', error);
    });
  }

  @Subscription(() => [User], {
    nullable: true,
    resolve: (value) => value.liveUsers,
    filter: (payload, variables) => {
      return payload.chatroomId === variables.chatroomId;
    },
  })
  liveUsersInChatroom(@Args('chatroomId', { type: () => Int }) chatroomId: number) {
    return this.pubSub.asyncIterableIterator(`liveUsersInChatroom.${chatroomId}`);
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Boolean)
  async enterChatroom(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.id || context.req.user?.id;
    if (!userId) {
      throw new Error('No user id found in request context');
    }

    const user = await firstValueFrom(
      this.authClient.send<User>('getUserById', JSON.stringify({ userId })),
    );
    await this.liveChatroomService.addLiveUserToChatroom(chatroomId, user);

    const liveUsers = await this.liveChatroomService.getLiveUsersForChatroom(chatroomId);

    await this.pubSub.publish(`liveUsersInChatroom.${chatroomId}`, {
      liveUsers,
      chatroomId,
    });

    return true;
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Boolean)
  async leaveChatroom(
    @Args('chatroomId', { type: () => Int }) chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.id || context.req.user?.id;
    if (!userId) {
      throw new Error('No user id found in request context');
    }

    const user = await firstValueFrom(
      this.authClient.send<User>('getUserById', JSON.stringify({ userId })),
    );

    await this.liveChatroomService.removeLiveUserFromChatroom(chatroomId, user);

    const liveUsers = await this.liveChatroomService.getLiveUsersForChatroom(chatroomId);

    await this.pubSub.publish(`liveUsersInChatroom.${chatroomId}`, {
      liveUsers,
      chatroomId,
    });

    return true;
  }
}