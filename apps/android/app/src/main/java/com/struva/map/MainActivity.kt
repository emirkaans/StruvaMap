package com.struva.map

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.struva.map.ui.profile.ProfileScreen
import com.struva.map.ui.resultdetail.ResultDetailScreen
import com.struva.map.ui.solve.SolveScreen
import com.struva.map.ui.testdetail.TestDetailScreen
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.StruvaMapTheme
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.auth.status.SessionStatus

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()
    private val requestNotificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        // Android 13'ten (API 33) önce bu izin gerekmiyor, çağırmaya gerek yok.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        setContent {
            StruvaMapTheme {
                val sessionStatus by authViewModel.sessionStatus.collectAsState()
                when (sessionStatus) {
                    is SessionStatus.Authenticated -> AppNavHost()
                    is SessionStatus.NotAuthenticated -> AuthScreen()
                    else -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
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
private fun AppNavHost() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showTabBar = TAB_ITEMS.any { it.route == currentRoute }

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
                HomeScreen(onTestClick = { testId -> navController.navigate("testDetail/$testId") })
            }
            composable("history") {
                HistoryScreen(onResultClick = { resultId -> navController.navigate("resultDetail/$resultId") })
            }
            composable("profile") {
                ProfileScreen()
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
