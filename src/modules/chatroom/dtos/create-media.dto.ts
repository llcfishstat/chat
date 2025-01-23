import { Field, InputType } from '@nestjs/graphql';
import { MediaType } from '@prisma/client';

@InputType()
export class CreateMediaDto {
    @Field(() => Number)
    chatroomId: number;

    @Field(() => MediaType)
    type: MediaType;

    @Field(() => String)
    url: string;

    @Field(() => String)
    filename: string;
}
