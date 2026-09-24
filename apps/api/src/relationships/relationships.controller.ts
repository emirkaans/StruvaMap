import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserGuard } from '../auth/user.guard';
import type { AuthedRequest } from '../auth/user.guard';
import { RelationshipsService } from './relationships.service';
import {
  AddNoteDto,
  AssignResultDto,
  CreateRelationshipDto,
  LinkPulseDto,
  RenameRelationshipDto,
} from './relationship.dto';

// Yalnızca mobil (oturumlu) kullanıcı — web anonim akışı ilişki kavramını kullanmıyor.
@Controller('relationships')
@UseGuards(UserGuard)
export class RelationshipsController {
  constructor(private readonly relationships: RelationshipsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.relationships.list(req.user.id);
  }

  // "map" ve "assign", ':id' rotalarından önce tanımlı; ayrıca HTTP metodları
  // da farklı olduğu için çakışmıyorlar.
  @Get('map')
  map(@Req() req: AuthedRequest) {
    return this.relationships.map(req.user.id);
  }

  @Post('assign')
  assign(@Body() dto: AssignResultDto, @Req() req: AuthedRequest) {
    return this.relationships.assign(req.user.id, dto);
  }

  @Post()
  create(@Body() dto: CreateRelationshipDto, @Req() req: AuthedRequest) {
    return this.relationships.create(req.user.id, dto);
  }

  @Get(':id')
  detail(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.relationships.detail(req.user.id, id);
  }

  @Patch(':id')
  rename(
    @Param('id') id: string,
    @Body() dto: RenameRelationshipDto,
    @Req() req: AuthedRequest,
  ) {
    return this.relationships.rename(req.user.id, id, dto.label);
  }

  @Patch(':id/pulse-pair')
  linkPulse(
    @Param('id') id: string,
    @Body() dto: LinkPulseDto,
    @Req() req: AuthedRequest,
  ) {
    return this.relationships.linkPulse(req.user.id, id, dto.pairId ?? null);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @Req() req: AuthedRequest,
  ) {
    return this.relationships.addNote(req.user.id, id, dto.body);
  }

  @Delete(':id/notes/:noteId')
  deleteNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Req() req: AuthedRequest,
  ) {
    return this.relationships.deleteNote(req.user.id, id, noteId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.relationships.remove(req.user.id, id);
  }
}
