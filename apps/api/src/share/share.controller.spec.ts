import { sharePage } from './share.controller';

describe('sharePage', () => {
  it('başlık ve açıklamayı meta etiketlerine kaçışlı yazar', () => {
    const html = sharePage({
      title: 'Dengeli <Yapı> & "Uyum"',
      description: 'Açıklama',
      target: 'https://struvamap.com/result/x',
    });
    expect(html).toContain(
      '<meta property="og:title" content="Dengeli &lt;Yapı&gt; &amp; &quot;Uyum&quot;" />',
    );
    expect(html).not.toContain('<Yapı>');
  });

  it('tarayıcıyı asıl sayfaya yönlendirir', () => {
    const html = sharePage({
      title: 't',
      description: 'd',
      target: 'https://struvamap.com/result/abc',
    });
    expect(html).toContain('url=https://struvamap.com/result/abc');
    expect(html).toContain(
      'location.replace("https://struvamap.com/result/abc")',
    );
  });
});
