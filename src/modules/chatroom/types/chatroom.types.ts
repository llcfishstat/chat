import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Chatroom {

  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [String])
  userIds: string[];

  @Field(() => [Message])
  messages: Message[];
}

@ObjectType()
export class Message {
  @Field(() => String)
  id: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => String)
  content: string;

  @Field(() => Date)
  createdAt?: Date;

  @Field(() => Date)
  updatedAt?: Date;

  @Field(() => Chatroom, { nullable: true })
  chatroom?: Chatroom;

  @Field(() => String)
  userId: string;
}

@ObjectType()
export class User {
  @Field(() => String)
  id: string;
}

@ObjectType()
export class UserTyping {
  @Field(() => String)
  userId: string;

  @Field(() => Number)
  chatroomId: number;
}

@ObjectType()
export class UserStoppedTyping extends UserTyping {}