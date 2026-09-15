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
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.struva.map.ui.auth.AuthScreen
import com.struva.map.ui.auth.AuthViewModel
import com.struva.map.ui.comparison.ComparisonScreen
import com.struva.map.ui.home.HomeScreen
import com.struva.map.ui.myresults.MyResultsScreen
import com.struva.map.ui.profile.ProfileScreen
import com.struva.map.ui.resultdetail.ResultDetailScreen
import com.struva.map.ui.solve.SolveScreen
import com.struva.map.ui.testdetail.TestDetailScreen
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

@Composable
private fun AppNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onProfileClick = { navController.navigate("profile") },
                onTestClick = { testId -> navController.navigate("testDetail/$testId") },
            )
        }
        composable("profile") {
            ProfileScreen(onBack = { navController.popBackStack() })
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
            ComparisonScreen(onBack = { navController.popBackStack() })
        }
    }
}
