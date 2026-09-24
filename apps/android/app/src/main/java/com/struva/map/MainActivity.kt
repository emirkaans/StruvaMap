package com.struva.map

import android.Manifest
import android.content.ClipboardManager
import android.content.Context
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
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.struva.map.ui.auth.AuthMode
import com.struva.map.ui.auth.AuthScreen
import com.struva.map.ui.auth.AuthViewModel
import com.struva.map.ui.auth.CompleteProfileScreen
import com.struva.map.ui.comparison.ComparisonScreen
import com.struva.map.ui.history.HistoryScreen
import com.struva.map.ui.home.HomeScreen
import com.struva.map.ui.labour.LabourScreen
import com.struva.map.ui.myresults.MyResultsScreen
import com.struva.map.ui.prediction.PredictionScreen
import com.struva.map.ui.privacy.PrivacyScreen
import com.struva.map.ui.relationships.MapScreen
import com.struva.map.ui.relationships.RelationshipDetailScreen
import com.struva.map.ui.profile.ProfileScreen
import com.struva.map.ui.pulse.PulseHistoryScreen
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
    // çağrı yeri) — anonim giriş de authlı sayıldığı için deep link'ler artık
    // form beklemeden çalışır, yalnızca anonim giriş denemesi bitene kadar
    // (aşağıdaki anonymousSignInAttempted) bekler.
    private var pendingDeepLink by mutableStateOf<String?>(null)

    // NotAuthenticated dalında bir kez sessiz signInAnonymously() denenir;
    // başarısız olursa AuthScreen'e düşülür. Activity-seviyesinde tutuluyor
    // (Compose remember değil) çünkü splash'in setKeepOnScreenCondition'ı da
    // aynı bilgiye ihtiyaç duyuyor (bkz. altta) — ikisi ayrı yerlerde aynı
    // duruma bakıp senkron kalmalı.
    private var anonymousSignInAttempted by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        // Oturum durumu netleşene kadar splash'i ekranda tut — NotAuthenticated
        // artık bir "son durum" değil, anonim giriş denemesi bitene kadar geçici
        // bir ara durum (bkz. AuthViewModel.signInAnonymously). Çıplak spinner
        // ya da Home/Auth arasında ani geçiş flaşı olmadan tek bir açılış.
        splashScreen.setKeepOnScreenCondition {
            when (authViewModel.sessionStatus.value) {
                is SessionStatus.Authenticated -> false
                is SessionStatus.NotAuthenticated -> !anonymousSignInAttempted
                else -> true
            }
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
                        // Web → app sonuç taşıma: kullanıcı web'de "İndir"e basınca
                        // panoya bir claim token'ı kopyalanmış olabilir (bkz.
                        // AppCta.tsx). Her açılışta (ve tab geçişinde) kontrol etmek
                        // zararsız — token zaten sunucu tarafında tek kullanımlık.
                        val context = LocalContext.current
                        LaunchedEffect(Unit) { checkClipboardForClaim(context, authViewModel) }
                        AppNavHost(
                            pendingDeepLink = pendingDeepLink,
                            onDeepLinkConsumed = { pendingDeepLink = null },
                        )
                    }
                    is SessionStatus.NotAuthenticated -> {
                        if (anonymousSignInAttempted) {
                            AuthScreen()
                        } else {
                            LaunchedEffect(Unit) {
                                authViewModel.signInAnonymously()
                                anonymousSignInAttempted = true
                            }
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                    }
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

// Web'in navigator.clipboard.writeText'i ile aynı önek (bkz.
// apps/web/src/components/AppCta.tsx CLAIM_CLIPBOARD_PREFIX) — rastgele bir
// pano içeriğini yanlışlıkla token zannetmeyelim diye.
private const val CLAIM_CLIPBOARD_PREFIX = "struvamap-claim:"

private suspend fun checkClipboardForClaim(context: Context, authViewModel: AuthViewModel) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
    val text = clipboard.primaryClip
        ?.takeIf { it.itemCount > 0 }
        ?.getItemAt(0)
        ?.text
        ?.toString()
        ?: return
    if (!text.startsWith(CLAIM_CLIPBOARD_PREFIX)) return
    authViewModel.redeemClaim(text.removePrefix(CLAIM_CLIPBOARD_PREFIX))
}

private data class TabItem(val route: String, val label: String, @DrawableRes val icon: Int)

private val TAB_ITEMS = listOf(
    TabItem("home", "Anasayfa", R.drawable.ic_tab_home),
    TabItem("map", "Harita", R.drawable.ic_tab_map),
    TabItem("history", "Geçmiş", R.drawable.ic_tab_history),
    TabItem("profile", "Profil", R.drawable.ic_tab_profile),
)

// Sekme çubuğu bu odak akışları dışında her ekranda görünür: test çözerken
// ya da tahmin yaparken yanlışlıkla bir sekmeye dokunmak ilerlemeyi kaybettirir.
private val FOCUS_ROUTE_PREFIXES = listOf("solve/", "predict/")

// Sekme çubuğu: ince çizgili ikon + küçük etiket. Her sekme kendi gezinme
// geçmişini saveState/restoreState ile korur (ör. Harita → ilişki → sonuç
// ekranındayken Geçmiş'e geçip dönünce kalınan ekrana dönülür).
@Composable
private fun AppNavHost(
    pendingDeepLink: String? = null,
    onDeepLinkConsumed: () -> Unit = {},
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showTabBar = currentRoute != null && FOCUS_ROUTE_PREFIXES.none { currentRoute.startsWith(it) }

    // Graf düz (tek seviye) olduğu için iç ekranlarda hangi sekmede
    // olunduğunu rotadan çıkaramıyoruz; son girilen sekme kökünü tutuyoruz.
    var selectedTab by rememberSaveable { mutableStateOf(TAB_ITEMS.first().route) }
    LaunchedEffect(currentRoute) {
        TAB_ITEMS.firstOrNull { it.route == currentRoute }?.let { selectedTab = it.route }
    }

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
                        val selected = selectedTab == tab.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                selectedTab = tab.route
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(painterResource(tab.icon), contentDescription = null) },
                            label = {
                                Text(
                                    tab.label,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                )
                            },
                            alwaysShowLabel = true,
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = StruvaColors.Accent,
                                unselectedIconColor = StruvaColors.Muted,
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
                    onOpenPulseHistory = { navController.navigate("pulseHistory") },
                    onOpenLabour = { navController.navigate("labour") },
                    onOpenComparison = { comparisonId -> navController.navigate("comparison/$comparisonId") },
                    onOpenPrediction = { resultId -> navController.navigate("predict/$resultId") },
                )
            }
            composable("map") {
                MapScreen(
                    onOpenRelationship = { id -> navController.navigate("relationship/$id") },
                    onOpenHistory = {
                        navController.navigate("history") {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
            composable("history") {
                HistoryScreen(onResultClick = { resultId -> navController.navigate("resultDetail/$resultId") })
            }
            composable("profile") {
                ProfileScreen(
                    onOpenPrivacy = { navController.navigate("privacy") },
                    onOpenPulsePairing = { navController.navigate("pulsePairing") },
                    onOpenLogin = { navController.navigate("completeProfile/login") },
                    onOpenRegister = { navController.navigate("completeProfile/register") },
                )
            }
            composable("privacy") {
                PrivacyScreen(onBack = { navController.popBackStack() })
            }
            composable("pulsePairing") {
                PulsePairingScreen(
                    onBack = { navController.popBackStack() },
                    onOpenLogin = { navController.navigate("completeProfile/login") },
                    onOpenRegister = { navController.navigate("completeProfile/register") },
                )
            }
            // Haftalık özet push'u da buraya düşer (bkz. FcmService, EXTRA_ROUTE).
            composable("pulseHistory") {
                PulseHistoryScreen(
                    onBack = { navController.popBackStack() },
                    onOpenPairing = { navController.navigate("pulsePairing") },
                )
            }
            composable("labour") {
                LabourScreen(
                    onBack = { navController.popBackStack() },
                    onOpenPairing = { navController.navigate("pulsePairing") },
                )
            }
            composable(
                "completeProfile/{mode}",
                arguments = listOf(navArgument("mode") { type = NavType.StringType }),
            ) { backStackEntry ->
                val initialMode = if (backStackEntry.arguments?.getString("mode") == "login") {
                    AuthMode.LOGIN
                } else {
                    AuthMode.REGISTER
                }
                CompleteProfileScreen(
                    initialMode = initialMode,
                    onDone = { navController.popBackStack() },
                    onBack = { navController.popBackStack() },
                )
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
                "relationship/{relationshipId}",
                arguments = listOf(navArgument("relationshipId") { type = NavType.StringType }),
            ) {
                RelationshipDetailScreen(
                    onBack = { navController.popBackStack() },
                    onOpenResult = { resultId -> navController.navigate("resultDetail/$resultId") },
                    onRetake = { testId, relationshipId ->
                        navController.navigate("solve/$testId?relationshipId=$relationshipId")
                    },
                )
            }
            // relationshipId isteğe bağlı: verilirse sonuç o ilişkiye otomatik bağlanır.
            composable(
                "solve/{testId}?relationshipId={relationshipId}",
                arguments = listOf(
                    navArgument("testId") { type = NavType.StringType },
                    navArgument("relationshipId") {
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    },
                ),
            ) {
                SolveScreen(
                    // İlişki detayından "Yeniden çöz" ile gelindiyse oraya (yeni sonuç
                    // grafikte görünsün), yoksa eskisi gibi anasayfaya dön.
                    onFinished = {
                        if (!navController.popBackStack("relationship/{relationshipId}", inclusive = false)) {
                            navController.popBackStack("home", inclusive = false)
                        }
                    },
                    onOpenComparison = { comparisonId -> navController.navigate("comparison/$comparisonId") },
                    onOpenPrediction = { resultId -> navController.navigate("predict/$resultId") },
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
                    onOpenPrediction = { resultId -> navController.navigate("predict/$resultId") },
                )
            }
            composable(
                "predict/{resultId}",
                arguments = listOf(navArgument("resultId") { type = NavType.StringType }),
            ) {
                PredictionScreen(
                    onBack = { navController.popBackStack() },
                    onOpenComparison = { comparisonId ->
                        navController.navigate("comparison/$comparisonId") {
                            popUpTo("predict/{resultId}") { inclusive = true }
                        }
                    },
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
