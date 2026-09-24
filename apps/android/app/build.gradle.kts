import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
    alias(libs.plugins.google.services)
}

// keystore.properties repo'ya girmez (bkz. keystore.properties.example).
// Dosya yoksa (CI, yeni checkout) release imzasız derlenir — assemble
// çalışır ama yüklenebilir bir paket üretmez; yayın için dosyayı doldur.
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use { load(it) }
    }
}

android {
    namespace = "com.struva.map"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.struva.map"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        // Render'daki NestJS API. debug/release aynı adresi kullanıyor —
        // yerelde çalıştırmak istersen debug buildType'ta override et
        // (emulator'dan makineye erişim: http://10.0.2.2:3000).
        buildConfigField("String", "API_BASE_URL", "\"https://struvamap.onrender.com/\"")
        buildConfigField("String", "SUPABASE_URL", "\"https://sdkkcxbonfjchfygezfh.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"sb_publishable_y0_bB2607Z5TKRGdia9diA_CawSCouj\"")
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            // 127.0.0.1 + adb reverse: emulator VE gerçek cihazda aynı adres
            // çalışır (adb reverse ikisinde de desteklenir). Bu sayede
            // emulator'a özel 10.0.2.2'ye geçmeye gerek yok — aşağıdaki
            // adbReverse task'ı her installDebug'da otomatik kurar.
            buildConfigField("String", "API_BASE_URL", "\"http://127.0.0.1:3000/\"")
        }
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

// Debug API_BASE_URL 127.0.0.1'i hedefliyor; bu, çalışan tek bir emulator ya
// da USB'ye takılı tek bir gerçek cihazın adb port'unu makinenin 3000
// portuna forward eder (adb reverse ikisinde de aynı şekilde çalışır).
// installDebug'a bağlı olduğu için Android Studio'dan Run/Debug bastığında
// elle çalıştırmaya gerek kalmadan otomatik kurulur. Birden fazla cihaz/
// emulator aynı anda bağlıysa adb hedef seçemez, komut sessizce atlanır —
// o durumda `adb -s <serial> reverse tcp:3000 tcp:3000` elle gerekir.
val localPropertiesFile = rootProject.file("local.properties")
val localProperties = Properties().apply {
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use { load(it) }
    }
}
val sdkDir = localProperties.getProperty("sdk.dir") ?: System.getenv("ANDROID_HOME")

tasks.register("adbReverse") {
    onlyIf { sdkDir != null }
    doLast {
        val adbExe = if (System.getProperty("os.name").lowercase().contains("win")) "adb.exe" else "adb"
        val adb = File(sdkDir!!, "platform-tools/$adbExe")
        if (adb.exists()) {
            exec {
                commandLine(adb.absolutePath, "reverse", "tcp:3000", "tcp:3000")
                isIgnoreExitValue = true
            }
        }
    }
}

tasks.matching { it.name == "installDebug" }.configureEach {
    dependsOn("adbReverse")
}

dependencies {
    implementation(libs.core.ktx)
    implementation(libs.core.splashscreen)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.activity.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.navigation.compose)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    implementation(libs.retrofit.core)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)

    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.auth)
    implementation(libs.ktor.client.okhttp)

    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.messaging)
    implementation(libs.kotlinx.coroutines.play.services)

    // Ana ekran "bugünün nabzı" widget'ı (bkz. pulse/widget/PulseWidget.kt).
    implementation(libs.glance.appwidget)

    testImplementation(libs.junit)
}
