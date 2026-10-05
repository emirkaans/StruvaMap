import { Controller, Get, Header, Param } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { computeProfileLabel } from '@struva/shared';
import { ResultsService } from '../results/results.service';
import { TestsService } from '../tests/tests.service';

/* Paylaşım önizlemesi. Site tek sayfalık bir uygulama olduğu için WhatsApp,
   X gibi servislerin bot'ları sonuç linkinde yalnızca genel başlığı görüyor.
   Netlify, struvamap.com/r/:id ve /d/:id isteklerini buraya vekil olarak
   iletir (bkz. apps/web/public/_redirects): bot'lar sonuca özel başlık ve
   açıklamayı okur, tarayıcılar asıl sayfaya yönlendirilir.

   Netlify'ın vekil istekleri az sayıda IP'den geldiği için genel istek
   sınırına takılmasın diye throttle dışı; yalnızca okuma yapıyor. */

const SITE_URL = 'https://struvamap.com';
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sharePage(meta: {
  title: string;
  description: string;
  target: string;
}): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const target = escapeHtml(meta.target);
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="StruvaMap" />
<meta property="og:url" content="${target}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="tr_TR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<link rel="canonical" href="${target}" />
<meta http-equiv="refresh" content="0; url=${target}" />
</head>
<body style="background:#0b0c10;color:#ecedef;font-family:sans-serif">
<p><a href="${target}" style="color:#5470ff">StruvaMap'e devam et</a></p>
<script>location.replace(${JSON.stringify(meta.target)});</script>
</body>
</html>`;
}

const FALLBACK = {
  title: 'StruvaMap · İlişkilerin görünmeyen yapısını haritalayın',
  description:
    'İlişkilerinizin emek, karar, güç ve özerklik dengesini haritalayan ücretsiz test.',
};

@Controller('share')
@SkipThrottle()
export class ShareController {
  constructor(
    private readonly results: ResultsService,
    private readonly tests: TestsService,
  ) {}

  @Get('r/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async result(@Param('id') id: string): Promise<string> {
    const target = `${SITE_URL}/result/${encodeURIComponent(id)}`;
    const loaded = await this.load(id);
    if (!loaded) return sharePage({ ...FALLBACK, target: SITE_URL });
    const { profile, testName } = loaded;
    return sharePage({
      title: `${profile.title} · StruvaMap`,
      description: `${testName}: ${profile.description} Kendi ilişkinin yapısını da gör.`,
      target,
    });
  }

  @Get('d/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async invite(@Param('id') id: string): Promise<string> {
    const loaded = await this.load(id);
    if (!loaded) return sharePage({ ...FALLBACK, target: SITE_URL });
    return sharePage({
      title: 'Birlikte haritalayalım · StruvaMap',
      description: `${loaded.testName} testini çöz; sonuçlarınız yan yana kıyaslansın ve aynı ilişkiyi nasıl farklı yaşadığınız görünür olsun.`,
      target: `${SITE_URL}/test/${encodeURIComponent(loaded.testId)}?compareWith=${encodeURIComponent(id)}`,
    });
  }

  private async load(id: string) {
    if (!UUID.test(id)) return null;
    try {
      const result = await this.results.findById(id);
      const test = await this.tests.getById(result.test_id);
      return {
        testId: test.id,
        testName: test.name,
        profile: computeProfileLabel(test.indices, result.score.indices),
      };
    } catch {
      return null;
    }
  }
}
