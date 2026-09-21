package com.struva.map

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.struva.map.ui.auth.AuthScreen
import com.struva.map.ui.auth.AuthViewModel
import com.struva.map.ui.comparison.ComparisonScreen
import com.struva.map.ui.history.HistoryScreen
import com.struva.map.ui.home.HomeScreen
import com.struva.map.ui.myresults.MyResultsScreen
import com.struva.map.ui.privacy.PrivacyScreen
import com.struva.map.ui.profile.ProfileScreen
import com.struva.map.ui.pulse.PulsePairingScreen
import com.struva.map.ui.resultdetail.ResultDetailScreen
import com.struva.map.ui.solve.SolveScreen
import com.struva.map.ui.testdetail.TestDetailScreen
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.StruvaMapTheme
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.auth.status.SessionStatus

// Push bildirimi (FcmService) veya https://struvamap.com deep link'i belirli
// bir ekrana yönlendirmek istediğinde bu extra'ya NavHost route string'i
// ("comparison/{id}" gibi) konur.
const val EXTRA_ROUTE = "route"

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()
    private val requestNotificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    // Sadece authlı kullanıcı için honoring ediyoruz (bkz. routeFromIntent
    // çağrı yeri) — mobilde giriş zorunlu, deep link auth ekranını atlamıyor,
    // kullanıcı login olduktan sonra normal akışla Home'a düşer.
    private var pendingDeepLink by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        // Oturum durumu netleşene kadar (Loading) splash'i ekranda tut —
        // çıplak spinner yerine marka açılışı, HomeScreen/AuthScreen arasında
        // ani geçiş flaşı olmadan.
        splashScreen.setKeepOnScreenCondition {
            val status = authViewModel.sessionStatus.value
            status !is SessionStatus.Authenticated && status !is SessionStatus.NotAuthenticated
        }
        enableEdgeToEdge()
        // Android 13'ten (API 33) önce bu izin gerekmiyor, çağırmaya gerek yok.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        pendingDeepLink = routeFromIntent(intent)
        setContent {
            StruvaMapTheme {
                val sessionStatus by authViewModel.sessionStatus.collectAsState()
                when (sessionStatus) {
                    is SessionStatus.Authenticated -> {
                        // Taze login VE "oturum açıkken app'i yeniden açma" senaryosunu
                        // kapsar — nabız check-in push'ları kalıcı, kullanıcı bazlı
                        // token'a ihtiyaç duyar (bkz. AuthViewModel.registerPushTokenIfNeeded).
                        LaunchedEffect(Unit) { authViewModel.registerPushTokenIfNeeded() }
                        AppNavHost(
                            pendingDeepLink = pendingDeepLink,
                            onDeepLinkConsumed = { pendingDeepLink = null },
                        )
                    }
                    is SessionStatus.NotAuthenticated -> AuthScreen()
                    else -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
    }

    // FLAG_ACTIVITY_CLEAR_TOP (push bildirimi) app zaten açıkken mevcut
    // instance'a bu callback ile düşer — önceden hiç override edilmiyordu,
    // yani bildirime tıklamak app'i öne getirmekten öteye gitmiyordu.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLink = routeFromIntent(intent)
    }
}

// https://struvamap.com/test/{id} | /result/{id} | /comparisons/{id} (web ile
// aynı path'ler, bkz. apps/web/src/App.tsx) ve push'un EXTRA_ROUTE'unu
// AppNavHost'un anlayacağı route string'ine çevirir.
private fun routeFromIntent(intent: Intent?): String? {
    intent?.getStringExtra(EXTRA_ROUTE)?.let { return it }

    val data: Uri = intent?.data ?: return null
    val segments = data.pathSegments
    return when (segments.getOrNull(0)) {
        "test" -> segments.getOrNull(1)?.let { "testDetail/$it" }
        "result" -> segments.getOrNull(1)?.let { "resultDetail/$it" }
        "comparisons" -> segments.getOrNull(1)?.let { "comparison/$it" }
        else -> null
    }
}

private data class TabItem(val route: String, val label: String)

private val TAB_ITEMS = listOf(
    TabItem("home", "Anasayfa"),
    TabItem("history", "Geçmiş"),
    TabItem("profile", "Profil"),
)

// Sekme çubuğu yalnız 3 üst-seviye ekranda görünür — testDetail/solve/
// myResults/resultDetail/comparison gibi akış (task) ekranları tam ekran
// kalır, web'de olmayan mobile özel bir gezinme kavramı olduğu için burada
// kasıtlı sade tutuldu (ikon yok, yalnız etiket — app genelindeki "←" gibi
// metin tabanlı gezinme diliyle tutarlı).
@Composable
private fun AppNavHost(
    pendingDeepLink: String? = null,
    onDeepLinkConsumed: () -> Unit = {},
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showTabBar = TAB_ITEMS.any { it.route == currentRoute }

    // Graph "home" ile kurulduktan sonra bekleyen deep link'e (varsa) tek
    // seferlik navigate eder — hem soğuk başlangıç hem app açıkken gelen
    // push/link (onNewIntent → pendingDeepLink değişince yeniden tetiklenir).
    LaunchedEffect(pendingDeepLink) {
        if (pendingDeepLink != null) {
            navController.navigate(pendingDeepLink)
            onDeepLinkConsumed()
        }
    }

    Scaffold(
        bottomBar = {
            if (showTabBar) {
                NavigationBar(containerColor = StruvaColors.Surface) {
                    TAB_ITEMS.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {},
                            label = {
                                Text(
                                    tab.label,
                                    fontWeight = if (currentRoute == tab.route) FontWeight.SemiBold else FontWeight.Normal,
                                )
                            },
                            alwaysShowLabel = true,
                            colors = NavigationBarItemDefaults.colors(
                                selectedTextColor = StruvaColors.Accent,
                                unselectedTextColor = StruvaColors.Muted,
                                indicatorColor = StruvaColors.AccentSoft,
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(padding),
        ) {
            composable("home") {
                HomeScreen(
                    onTestClick = { testId -> navController.navigate("testDetail/$testId") },
                    onOpenPulsePairing = { navController.navigate("pulsePairing") },
                )
            }
            composable("history") {
                HistoryScreen(onResultClick = { resultId -> navController.navigate("resultDetail/$resultId") })
            }
            composable("profile") {
                ProfileScreen(
                    onOpenPrivacy = { navController.navigate("privacy") },
                    onOpenPulsePairing = { navController.navigate("pulsePairing") },
                )
            }
            composable("privacy") {
                PrivacyScreen(onBack = { navController.popBackStack() })
            }
            composable("pulsePairing") {
                PulsePairingScreen(onBack = { navController.popBackStack() })
            }
            composable(
                "testDetail/{testId}",
                arguments = listOf(navArgument("testId") { type = NavType.StringType }),
            ) {
                TestDetailScreen(
                    onBack = { navController.popBackStack() },
                    onStart = { testId -> navController.navigate("solve/$testId") },
                    onMyResults = { testId -> navController.navigate("myResults/$testId") },
                )
            }
            composable(
                "solve/{testId}",
                arguments = listOf(navArgument("testId") { type = NavType.StringType }),
            ) {
                SolveScreen(
                    onFinished = { navController.popBackStack("home", inclusive = false) },
                    onOpenComparison = { comparisonId -> navController.navigate("comparison/$comparisonId") },
                )
            }
            composable(
                "myResults/{testId}",
                arguments = listOf(navArgument("testId") { type = NavType.StringType }),
            ) {
                MyResultsScreen(
                    onBack = { navController.popBackStack() },
                    onResultClick = { resultId -> navController.navigate("resultDetail/$resultId") },
                )
            }
            composable(
                "resultDetail/{resultId}",
                arguments = listOf(navArgument("resultId") { type = NavType.StringType }),
            ) {
                ResultDetailScreen(
                    onBack = { navController.popBackStack() },
                    onOpenComparison = { comparisonId -> navController.navigate("comparison/$comparisonId") },
                )
            }
            composable(
                "comparison/{comparisonId}",
                arguments = listOf(navArgument("comparisonId") { type = NavType.StringType }),
            ) {
                ComparisonScreen(
                    onBack = { navController.popBackStack() },
                    onHome = {
                        navController.navigate("home") {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        }
    }
}
