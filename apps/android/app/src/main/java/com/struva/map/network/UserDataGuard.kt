package com.struva.map.network

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/* Kullanıcıya ait yerel önbelleklerin (Room'daki sonuçlar, bellekteki geçmiş
   bağlamı) yalnızca o kullanıcıya ait olmasını sağlar. Oturum başka bir
   hesaba geçtiğinde (çıkış yapıp başka hesapla giriş, misafirken var olan bir
   hesaba giriş) önbellek temizlenir; yoksa ekranlar önceki hesabın sonuçlarını
   gösterip yeni hesabınkileri hiç göstermeyebiliyordu. Son kullanıcı diske
   yazılır ki uygulama kapanıp açıldığında da aynı kontrol yapılsın.
   Misafirin kalıcı hesaba yükseltilmesi aynı kullanıcı kimliğini korur;
   o durumda hiçbir şey silinmez. */
@Singleton
class UserDataGuard @Inject constructor(
    @ApplicationContext context: Context,
    private val results: ResultsRepository,
    private val archiveContext: ArchiveContextRepository,
) {
    private val prefs = context.getSharedPreferences("struva_prefs", Context.MODE_PRIVATE)

    suspend fun prepareFor(userId: String) {
        val previous = prefs.getString(KEY, null)
        if (previous != userId) {
            results.clearCache()
            archiveContext.clear()
            prefs.edit().putString(KEY, userId).apply()
        }
    }

    private companion object {
        const val KEY = "cache_user_id"
    }
}
