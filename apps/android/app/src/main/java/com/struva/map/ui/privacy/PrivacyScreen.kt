package com.struva.map.ui.privacy

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

private const val CONTACT_EMAIL = "struvamap@gmail.com"
const val PRIVACY_URL = "https://struvamap.com/gizlilik"
private const val CONTROLLER = "Emir Kaan Sarıçam, Çankaya/Ankara"

// Tam metin tek yerde, web'deki /gizlilik sayfasında (PrivacyPage.tsx); burada
// uygulamaya özel kısa bir özet var. İki metin kopyalanıp ayrı ayrı
// güncellenince birbirinden kopuyordu; tam metin değişirse bu özet de
// gözden geçirilmeli.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacyScreen(onBack: () -> Unit) {
    val uriHandler = LocalUriHandler.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gizlilik") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(16.dp),
        ) {
            Text(
                "Son güncelleme · 5 Ekim 2026 · Veri sorumlusu · $CONTROLLER",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(24.dp))

            PrivacyFact(
                "Hesap isteğe bağlı.",
                "Uygulama seni otomatik bir misafir hesabıyla başlatır. Kalıcı hesapta yalnızca kullanıcı adı, şifre ve isteğe bağlı bir güvenlik sorusu tutulur; şifre ve cevap şifrelenmiş saklanır. E-posta ya da gerçek ad istenmez.",
            )
            Spacer(Modifier.height(16.dp))
            PrivacyFact(
                "Reklam ve izleme aracı yok.",
                "Üçüncü taraf analiz ya da reklam aracı kullanmıyoruz. Verilerini satmayız, reklam için kullanmayız.",
            )
            Spacer(Modifier.height(16.dp))
            PrivacyFact(
                "18 yaş ve üzeri içindir.",
                "18 yaşından küçüksen uygulamayı kullanmamanı rica ediyoruz.",
            )
            Spacer(Modifier.height(16.dp))
            PrivacyFact(
                "Silme senin elinde.",
                "Hesabını profil ekranından silebilirsin; sonuçların ve bütün kayıtların kalıcı olarak silinir.",
            )

            Spacer(Modifier.height(28.dp))
            HorizontalDivider(color = StruvaColors.Border)
            Spacer(Modifier.height(20.dp))

            PrivacySection(
                title = "Ne topluyoruz",
                body = "Test yanıtların ve sonuçların, kıyaslamaların, günlük nabız cevapların, ilişkilerine verdiğin isimler ve notlar, emek defteri kayıtların, tahminlerin, bildirim gönderebilmek için cihazına ait bildirim kimliği ve kullanım olayları. Web'de çözdüğün sonucu uygulamaya taşımak için uygulama açılışta panoda yalnızca tek kullanımlık bir kod arar.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Kim neyi görür",
                body = "Günlük nabızda eşleştiğin kişi günlük cevaplarını ve emek defterini görür. Kıyaslama davetini kabul eden kişi yanıtlarını boyut boyut karşılaştırmalı görür. İlişki adların ve notların yalnızca sana görünür; biz de içeriklerini görmeyiz.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Nerede saklanır",
                body = "Veriler Supabase, Render, Google Firebase ve Sentry gibi altyapı sağlayıcılarında tutulur; sunucuları yurt dışında bulunabilir. Sonlandırılan nabız eşleşmeleri 30 gün sonra otomatik silinir.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Hakların",
                body = "6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesindeki haklarına (bilgi isteme, düzeltme, silme, itiraz ve diğerleri) ilişkin taleplerin için bize yazabilirsin.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Teşhis değil",
                body = "StruvaMap sosyolojik bir haritalama aracı. Klinik teşhis, terapi ya da profesyonel danışmanlık yerine geçmez.",
            )

            Spacer(Modifier.height(28.dp))
            StruvaButton(
                onClick = { uriHandler.openUri(PRIVACY_URL) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Tam metni oku") }
            Spacer(Modifier.height(12.dp))
            StruvaOutlinedButton(
                onClick = { uriHandler.openUri("mailto:$CONTACT_EMAIL") },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Bize yaz") }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PrivacyFact(title: String, body: String) {
    Text(title, style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(4.dp))
    Text(body, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
}

@Composable
private fun PrivacySection(title: String, body: String) {
    Text(title, style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(8.dp))
    Text(body, style = MaterialTheme.typography.bodyMedium)
}
