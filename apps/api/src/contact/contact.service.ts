import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Platform } from '../events/track-event.dto';
import type {
  AdminContactListDto,
  ContactTopic,
  CreateContactMessageDto,
} from './contact.dto';

export interface ContactMessageRow {
  id: string;
  topic: ContactTopic;
  message: string;
  reply_email: string | null;
  reference: string | null;
  platform: Platform;
  handled_at: string | null;
  created_at: string;
}

/* İletişim formu mesajları. E-posta gönderim servisi yok; mesajlar
   veritabanına yazılır ve admin panelindeki "Mesajlar" sayfasından okunur. */
@Injectable()
export class ContactService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(
    dto: CreateContactMessageDto,
    platform: Platform,
  ): Promise<void> {
    if (dto.website) return; // bot tuzağı doluysa kaydetme, hata da verme
    const { error } = await this.supabase.client
      .from('contact_messages')
      .insert({
        topic: dto.topic,
        message: dto.message.trim(),
        reply_email: dto.replyEmail?.trim() || null,
        reference: dto.reference?.trim() || null,
        platform,
      });
    if (error) throw new InternalServerErrorException(error.message);
  }

  async list(
    query: AdminContactListDto,
  ): Promise<{ rows: ContactMessageRow[]; total: number }> {
    const start = (query.page - 1) * query.pageSize;
    let q = this.supabase.client
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + query.pageSize - 1);
    if (query.status === 'open' || !query.status) q = q.is('handled_at', null);
    if (query.status === 'handled') q = q.not('handled_at', 'is', null);

    const { data, count, error } = await q;
    if (error) throw new InternalServerErrorException(error.message);
    return { rows: (data ?? []) as ContactMessageRow[], total: count ?? 0 };
  }

  async setHandled(id: string, handled: boolean): Promise<ContactMessageRow> {
    const res = await this.supabase.client
      .from('contact_messages')
      .update({ handled_at: handled ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .maybeSingle<ContactMessageRow>();
    if (res.error) throw new InternalServerErrorException(res.error.message);
    if (!res.data) throw new NotFoundException('Mesaj bulunamadı.');
    return res.data;
  }
}
