import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../auth/admin.guard';
import { platformFromUserAgent } from '../events/track-event.dto';
import { ContactService } from './contact.service';
import {
  AdminContactListDto,
  CreateContactMessageDto,
  SetHandledDto,
} from './contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // Kimliksiz; spam'e karşı IP başına dakikada 3 mesaj ve formdaki bot tuzağı.
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async create(
    @Body() dto: CreateContactMessageDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.contact.create(dto, platformFromUserAgent(userAgent));
  }
}

@Controller('admin/contact')
@UseGuards(AdminGuard)
export class AdminContactController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  list(@Query() query: AdminContactListDto) {
    return this.contact.list(query);
  }

  @Patch(':id')
  setHandled(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetHandledDto,
  ) {
    return this.contact.setHandled(id, dto.handled);
  }
}
