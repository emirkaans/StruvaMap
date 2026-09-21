import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './register-device.dto';
import { RegisterUserDeviceDto } from './register-user-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  register(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.register(dto);
  }

  // Kalıcı, kullanıcı bazlı token kaydı — nabız check-in bildirimleri için.
  // Login sonrası / app her açılışta çağrılır (bkz. Android AuthViewModel).
  @Post('register-user')
  @UseGuards(UserGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  registerForUser(@Body() dto: RegisterUserDeviceDto, @Req() req: AuthedRequest) {
    return this.devicesService.registerForUser(req.user.id, dto.fcmToken);
  }
}
