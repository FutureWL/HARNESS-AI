import { Module } from '@nestjs/common'

import { AdminService } from './admin.service'
import { AppController } from './app.controller'
import { AuthGuard } from './auth.guard'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AdminService, AuthGuard],
})
export class AppModule {}
