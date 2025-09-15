import { Body, Controller, Get, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

class PostBodyDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Post('/post')
  createSomething(@Body() body: PostBodyDto): string {
    console.log(body)
    return this.appService.getHello()
  }
}
