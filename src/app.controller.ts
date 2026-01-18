import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health-check')
  healthCheck() {
    return { status: 'OK' };
  }

  @Get('test-time-out')
  test() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('test');
      }, 40000);
    });
  }
}
