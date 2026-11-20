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
        versionCode = 2
        versionName = "0.2.0"
        buildConfigField("String", "API_URL", "\""+config("API_URL")+"\"")
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
    implementation("com.squareup.okhttp3:okhttp:5.5.1")
}

gradle.taskGraph.whenReady {
    if (allTasks.any { it.name.contains("Release") } && (!config("API_URL").startsWith("https://") || !config("API_URL").trimEnd('/').endsWith("/api"))) {
        throw GradleException("Release builds require an HTTPS API_URL ending in /api; configure your production domain first.")
    }
}
