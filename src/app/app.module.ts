import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CommonModule } from 'src/common/common.module';

import { AppController } from './app.controller';

@Module({
    imports: [TerminusModule, CommonModule],
    controllers: [AppController],
})
export class AppModule {}
