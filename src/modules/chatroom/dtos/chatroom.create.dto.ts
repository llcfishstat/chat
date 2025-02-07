import { InputType, Field } from '@nestjs/graphql';
import { ChatroomType } from '@prisma/client';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateChatroomDto {
    @Field(() => String)
    @IsString()
    name: string;

    @Field(() => ChatroomType)
    type: ChatroomType;

    @Field(() => String, { nullable: true })
    @IsUUID()
    @IsOptional()
    chatroomId?: string;

    @Field(() => String, { nullable: true })
    @IsUUID()
    @IsOptional()
    companyId: string;
}
