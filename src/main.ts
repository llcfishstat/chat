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
    const configService = app.get(ConfigService);

    const corsOrigin = configService.get<string>('app.corsOrigin') || '*';
    const allowedOrigins = [corsOrigin, 'http://localhost:8888'];

    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,POST,PUT,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true,
    });

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
