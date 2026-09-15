import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserGuard } from './user.guard';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AdminGuard, UserGuard],
  exports: [AdminGuard, UserGuard],
})
export class AuthModule {}
