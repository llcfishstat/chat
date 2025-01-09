import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { Public } from 'src/common/decorators/public.decorator';
import { PrismaService } from 'src/common/services/prisma.service';

@Controller({
    version: VERSION_NEUTRAL,
    path: '/',
})
export class AppController {
    constructor(
        private readonly healthCheckService: HealthCheckService,
        private readonly prismaService: PrismaService,
    ) {}

    @Get('/health')
    @HealthCheck()
    @Public()
    public async getHealth() {
        return this.healthCheckService.check([() => this.prismaService.isHealthy()]);
    }
}
