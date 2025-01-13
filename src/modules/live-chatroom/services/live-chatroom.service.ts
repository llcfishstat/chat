import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { User } from 'src/modules/chatroom/types/chatroom.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LiveChatroomService {
  private redisClient: Redis;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
      username: configService.get<string>('redis.username'),
      password: configService.get<string>('redis.password'),
    });
  }

  async addLiveUserToChatroom(chatroomId: number, user: User): Promise<void> {
    const existingLiveUsers = await this.getLiveUsersForChatroom(chatroomId);

    const existingUser = existingLiveUsers.find(
      (liveUser) => liveUser.id === user.id,
    );
    if (existingUser) {
      return;
    }

    await this.redisClient.sadd(
      `liveUsers:chatroom:${chatroomId}`,
      JSON.stringify(user),
    );
  }

  async removeLiveUserFromChatroom(chatroomId: number, user: User): Promise<void> {
    await this.redisClient
      .srem(`liveUsers:chatroom:${chatroomId}`, JSON.stringify(user))
      .catch((err) => {
        console.log('removeLiveUserFromChatroom error', err);
      })
      .then((res) => {
        console.log('removeLiveUserFromChatroom res', res);
      });
  }

  async getLiveUsersForChatroom(chatroomId: number): Promise<User[]> {
    const users = await this.redisClient.smembers(
      `liveUsers:chatroom:${chatroomId}`,
    );

    return users.map((user) => JSON.parse(user));
  }
}