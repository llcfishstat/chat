import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ChatroomType, MediaType, MessageStatus } from '@prisma/client';

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

    @Field(() => [MediaEntity], { nullable: true })
    media?: MediaEntity[];

    @Field(() => ChatroomType)
    type: ChatroomType;
}

@ObjectType()
export class Message {
    @Field(() => String)
    id: string;

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

    @Field(() => [MediaEntity], { nullable: true })
    media?: MediaEntity[];
}

@ObjectType()
export class MediaEntity {
    @Field(() => String)
    id: string;

    @Field(() => String)
    userId: string;

    @Field(() => String)
    url: string;

    @Field(() => String)
    filename: string;

    @Field(() => MediaType)
    type: MediaType;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Chatroom, { nullable: true })
    chatroom?: Chatroom;

    @Field(() => Message, { nullable: true })
    message?: Message;
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
    name: 'MessageStatus',
});

registerEnumType(MediaType, {
    name: 'MediaType',
});

registerEnumType(ChatroomType, {
    name: 'ChatroomType',
});
