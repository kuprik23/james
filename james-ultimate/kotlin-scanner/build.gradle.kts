plugins {
    kotlin("jvm") version "1.9.21"
    application
}

group = "com.emersa.james"
version = "2.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin standard library
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // JSON processing
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("org.json:json:20231013")
    
    // HTTP client for API scanning
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    
    // Security libraries
    implementation("org.bouncycastle:bcprov-jdk18on:1.77")
    
    // Logging
    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("org.slf4j:slf4j-simple:2.0.9")
    
    // Testing
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("io.mockk:mockk:1.13.8")
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(17)
}

application {
    mainClass.set("com.emersa.james.kotlin.KotlinSecurityScannerKt")
}

tasks.jar {
    manifest {
        attributes["Main-Class"] = "com.emersa.james.kotlin.KotlinSecurityScannerKt"
    }
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}