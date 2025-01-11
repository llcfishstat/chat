import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Chatroom {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => [String], { nullable: true })
  userIds?: string[];

  @Field(() => [Message], { nullable: true })
  messages?: Message[];
}

@ObjectType()
export class Message {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => Chatroom, { nullable: true })
  chatroom?: Chatroom;

  @Field({ nullable: true })
  userId?: string;
}

@ObjectType()
export class UserTyping {
  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  chatroomId?: number;
}

@ObjectType()
export class UserStoppedTyping extends UserTyping {}