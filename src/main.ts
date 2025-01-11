import { BadRequestException, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const logger = new Logger();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(express()));

    app.enableCors({
        origin: 'http://localhost:8000',
        credentials: true,
        allowedHeaders: [
            'Accept',
            'Authorization',
            'Content-Type',
            'X-Requested-With',
            'apollo-require-preflight',
        ],
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    });

    const configService = app.get(ConfigService);
    const expressApp = app.getHttpAdapter().getInstance();

    expressApp.get('/', (_req: Request, res: Response) => {
        res.status(200).json({
            status: 200,
            message: `Hello from ${configService.get('app.name')}`,
            timestamp: new Date().toISOString(),
        });
    });

    const port: number = configService.get<number>('app.http.port');
    const host: string = configService.get<string>('app.http.host');
    const globalPrefix: string = configService.get<string>('app.globalPrefix');
    const versioningPrefix: string = configService.get<string>('app.versioning.prefix');
    const version: string = configService.get<string>('app.versioning.version');
    const versionEnable: string = configService.get<string>('app.versioning.enable');
    app.useGlobalPipes(
      new ValidationPipe({
          whitelist: true,
          transform: true,
          exceptionFactory: (errors) => {
              const formattedErrors = errors.reduce((accumulator, error) => {
                  accumulator[error.property] = Object.values(error.constraints).join(
                    ', ',
                  );
                  return accumulator;
              }, {});

              throw new BadRequestException(formattedErrors);
          },
      }),
    );
    app.setGlobalPrefix(globalPrefix);
    if (versionEnable) {
        app.enableVersioning({
            type: VersioningType.URI,
            defaultVersion: version,
            prefix: versioningPrefix,
        });
    }
    app.use(cookieParser());
    await app.listen(port, host);
    logger.log(`🚀 ${configService.get('app.name')} service started successfully on port ${port}`);
}
bootstrap();
