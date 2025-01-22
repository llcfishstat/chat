import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { MessageStatus } from '@prisma/client';

@ObjectType()
export class Chatroom {
    @Field(() => Number)
    id: number;

    @Field(() => String)
    name: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => [String], { nullable: true })
    userIds: string[];

    @Field(() => [Message], { nullable: true })
    messages: Message[];
}

@ObjectType()
export class Message {
    @Field(() => Number)
    id: number;

    @Field(() => String, { nullable: true })
    imageUrl: string;

    @Field(() => String)
    content: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => Chatroom, { nullable: true })
    chatroom?: Chatroom;

    @Field(() => String)
    userId: string;

    @Field(() => MessageStatusEnum)
    status: TMessageStatus;
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

export const MessageStatusEnum = {
    Pending: MessageStatus.Pending,
    Sent: MessageStatus.Sent,
    DeliveredToCloud: MessageStatus.DeliveredToCloud,
    DeliveredToDevice: MessageStatus.DeliveredToDevice,
    Seen: MessageStatus.Seen,
} as const;

export type TMessageStatus = MessageStatus;

registerEnumType(MessageStatusEnum, {
    name: 'MessageStatus', // Это имя пойдёт в схему GraphQL
});
