import { ContactService } from './contact.service';
import type { SupabaseService } from '../supabase/supabase.service';

function serviceWithInsert() {
  const insert = jest.fn().mockResolvedValue({ error: null });
  const supabase = {
    client: { from: jest.fn().mockReturnValue({ insert }) },
  } as unknown as SupabaseService;
  return { service: new ContactService(supabase), insert };
}

describe('ContactService.create', () => {
  it('mesajı kırpılmış alanlarla kaydeder, boş e-postayı null yazar', async () => {
    const { service, insert } = serviceWithInsert();
    await service.create(
      {
        topic: 'feedback',
        message: '  Çok güzel olmuş, teşekkürler.  ',
        replyEmail: '',
      },
      'web',
    );
    expect(insert).toHaveBeenCalledWith({
      topic: 'feedback',
      message: 'Çok güzel olmuş, teşekkürler.',
      reply_email: null,
      reference: null,
      platform: 'web',
    });
  });

  it('bot tuzağı doluysa hiçbir şey kaydetmez', async () => {
    const { service, insert } = serviceWithInsert();
    await service.create(
      { topic: 'other', message: 'spam spam spam spam', website: 'http://x' },
      'web',
    );
    expect(insert).not.toHaveBeenCalled();
  });
});
