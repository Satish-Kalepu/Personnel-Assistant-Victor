import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val victorConfig = Properties().apply {
    val configFile = rootProject.file("victor.properties")
    if (configFile.exists()) configFile.inputStream().use { load(it) }
}
fun config(name: String): String = (victorConfig.getProperty(name) ?: "").replace("\\", "\\\\").replace("\"", "\\\"")

android {
    namespace = "com.victor.assistant"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.victor.assistant"
        minSdk = 28
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        manifestPlaceholders["appAuthRedirectScheme"] = "victor"
        buildConfigField("String", "API_URL", "\""+config("API_URL")+"\"")
        buildConfigField("String", "COGNITO_DOMAIN", "\""+config("COGNITO_DOMAIN")+"\"")
        buildConfigField("String", "CLIENT_ID", "\""+config("CLIENT_ID")+"\"")
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.12.4")
    implementation("net.openid:appauth:0.11.1")
    implementation("com.squareup.okhttp3:okhttp:5.5.1")
}
