plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.fuzzy.christmas"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.fuzzy.christmas"
        minSdk = 35
        targetSdk = 35
        versionCode = 13
        versionName = "0.3.8"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        ndk { abiFilters.add("arm64-v8a") }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(platform(libs.spatial.bom))
    implementation(libs.spatial.core)
    implementation(libs.spatial.ui.platform)
    implementation(libs.spatial.ui.foundation)
    implementation(libs.spatial.ui.design)
    implementation(libs.spatial.ui.sense)
    implementation(libs.spatial.ui.tracking)
    implementation(libs.androidx.ui.tooling)
    implementation(libs.androidx.annotation)
    implementation(libs.androidx.appcompat)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    debugImplementation(libs.androidx.ui.tooling.preview)
}

configurations.all {
    resolutionStrategy {
        exclude("androidx.compose.ui", "ui")
        exclude("androidx.compose.ui", "ui-graphics")
        exclude("androidx.compose.ui", "ui-text")
        exclude("androidx.compose.foundation", "foundation")
    }
}

val nativeSceneAssets = layout.buildDirectory.dir("generated/fuzzyWorldAssets")
val bakeNativeScenes by tasks.registering(Exec::class) {
    val exporter = rootProject.file("scripts/bake-native-scenes.mjs")
    val webAssets = rootProject.file("prototype/web/assets")
    inputs.files(exporter, rootProject.file("app/src/main/assets/village-effects.glb"), webAssets.resolve("decorations.js"), webAssets.resolve("presets/bicycle.glb"), webAssets.resolve("world-gift-stations.mjs"),
        webAssets.resolve("place-village-gift.mjs"), webAssets.resolve("worlds/funky-candy-land.gltf"),
        webAssets.resolve("worlds/owl-post-academy.gltf"), webAssets.resolve("gingerbread-village.mjs"),
        webAssets.resolve("north-pole-props.mjs"), webAssets.resolve("santa-flight.mjs"),
        webAssets.resolve("toymakers-workshop.mp3"), webAssets.resolve("worlds/aurora-lit.glb"))
    inputs.dir(rootProject.file("art/wrapping"))
    inputs.file(rootProject.file("app/src/main/assets/christmas-gift.glb"))
    outputs.dir(nativeSceneAssets)
    commandLine("node", exporter.absolutePath, nativeSceneAssets.get().asFile.absolutePath)
}
android.sourceSets.getByName("main").assets.srcDir(nativeSceneAssets)
tasks.named("preBuild").configure { dependsOn(bakeNativeScenes) }
