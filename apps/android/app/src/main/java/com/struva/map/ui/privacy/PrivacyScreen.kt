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
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

private const val CONTACT_EMAIL = "struvamap@gmail.com"

// Web'deki PrivacyPage.tsx'in mobil karşılığı — aynı KVKK metni, mobilde tek
// sütun akış olarak. Statik içerik olduğu için ViewModel gerekmiyor.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacyScreen(onBack: () -> Unit) {
    val uriHandler = LocalUriHandler.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gizlilik & KVKK") },
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
                "Son güncelleme · 30 Ağustos 2026 · Veri sorumlusu · $CONTACT_EMAIL",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(24.dp))

            PrivacyFact("Üyelik yok.", "Kayıt olmazsın. Cihazında tutulan oturum kimliği adına, e-postana bağlı değildir.")
            Spacer(Modifier.height(16.dp))
            PrivacyFact("Çerez / izleme yok.", "Üçüncü taraf analiz aracı, IP kaydı veya cihaz parmak izi kullanmıyoruz.")
            Spacer(Modifier.height(16.dp))
            PrivacyFact("Yapay zekâ skor hesaplamaz.", "Sonucun sabit, tekrarlanabilir kurallarla üretilir. Yanıtların bir modele gönderilmez.")
            Spacer(Modifier.height(16.dp))
            PrivacyFact("Silme senin elinde.", "Hesabını profil ekranından silebilirsin; geçmiş sonuçların kime ait olduğu bilgisi bu işlemde ayrıca kaldırılır.")

            Spacer(Modifier.height(28.dp))
            HorizontalDivider(color = StruvaColors.Border)
            Spacer(Modifier.height(20.dp))

            PrivacySection(
                title = "Ne topluyoruz",
                body = "Test yanıtların ve bunlardan hesaplanan skorlar · hesap oturumun · hangi test başladı, hangi soruda bırakıldı, davet bağlantısı kullanıldı mı gibi kullanım olayları (kendi sunucumuza, üçüncü tarafa gitmez) · uygulama hata verirse teknik detay (kişisel veri olmadan) hata izleme aracına gider.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Nerede saklanır",
                body = "Veriler barındırma sağlayıcımız Supabase'de tutulur. Şu an otomatik bir silme süresi yok; sen ya da biz talep edip sildirene kadar kayıt kalır. Kıyaslama özelliğini kullanırsan, davet bağlantısını paylaştığın kişi yanıtlarını boyut boyut karşılaştırmalı görür.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Hassas veri uyarısı",
                body = "İlişki ve aile dinamiklerine dair yanıtların dolaylı olarak hassas konulara değinebilir. Vermek tamamen gönüllü, hiçbir soruyu yanıtlamak zorunda değilsin.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Hakların neler",
                body = "6698 sayılı KVKK'nın 11. maddesi kapsamında verinin işlenip işlenmediğini öğrenme, ne amaçla işlendiğini öğrenme, düzeltme ve silme hakkına sahipsin. Sunucu tarafındaki kaydının silinmesini istersen elindeki sonuç ya da davet bağlantısıyla bize ulaş.",
            )

            Spacer(Modifier.height(20.dp))
            PrivacySection(
                title = "Teşhis değil",
                body = "StruvaMap sosyolojik bir haritalama aracı. Psikometrik doğrulama (Cronbach's alpha, faktör analizi, pilot çalışma) yapılmadı. Klinik teşhis, terapi ya da profesyonel danışmanlık yerine geçmez.",
            )

            Spacer(Modifier.height(28.dp))
            Text("Verinle ilgili bir talebin mi var?", style = MaterialTheme.typography.bodyMedium)
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
