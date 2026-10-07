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

  // Kıyaslama hazır bildirimi bu token'a gider; başkası kendi token'ını
  // yazıp bildirimi üstlenemesin diye yalnızca sonucun sahibi kaydedebilir.
  @Post('register')
  @UseGuards(UserGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  register(@Body() dto: RegisterDeviceDto, @Req() req: AuthedRequest) {
    return this.devicesService.register(req.user.id, dto);
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
