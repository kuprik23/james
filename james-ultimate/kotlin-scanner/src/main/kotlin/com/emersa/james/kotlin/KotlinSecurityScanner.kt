package com.emersa.james.kotlin

import com.google.gson.Gson
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.InetSocketAddress
import java.net.Socket
import java.security.MessageDigest
import java.io.File
import java.time.Instant
import java.util.concurrent.TimeUnit

/**
 * Kotlin Security Scanner
 * Modern, coroutine-based security scanning with Kotlin features
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

// Sealed class for scan results
sealed class ScanResult {
    data class Success<T>(val data: T, val duration: Long) : ScanResult()
    data class Failure(val error: String, val code: Int = -1) : ScanResult()
}

// Data classes for results
data class PortScanResult(
    val host: String,
    val port: Int,
    val isOpen: Boolean,
    val service: String?,
    val risk: String,
    val responseTime: Long
)

data class HashResult(
    val filePath: String,
    val md5: String,
    val sha1: String,
    val sha256: String,
    val sizeBytes: Long,
    val calculationTime: Long,
    val timestamp: String
)

data class ApiSecurityResult(
    val url: String,
    val method: String,
    val statusCode: Int,
    val headers: Map<String, String>,
    val vulnerabilities: List<String>,
    val riskScore: Int,
    val recommendations: List<String>
)

// Service detection map
object ServiceDetector {
    private val commonPorts = mapOf(
        21 to Pair("FTP", "high"),
        22 to Pair("SSH", "medium"),
        23 to Pair("Telnet", "critical"),
        25 to Pair("SMTP", "medium"),
        53 to Pair("DNS", "low"),
        80 to Pair("HTTP", "low"),
        110 to Pair("POP3", "medium"),
        143 to Pair("IMAP", "medium"),
        443 to Pair("HTTPS", "low"),
        445 to Pair("SMB", "high"),
        3306 to Pair("MySQL", "high"),
        3389 to Pair("RDP", "critical"),
        5432 to Pair("PostgreSQL", "high"),
        6379 to Pair("Redis", "high"),
        8080 to Pair("HTTP-Alt", "low"),
        27017 to Pair("MongoDB", "medium")
    )
    
    fun detectService(port: Int): Pair<String, String> {
        return commonPorts[port] ?: Pair("Unknown", "low")
    }
}

class KotlinSecurityScanner {
    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    
    /**
     * Scan single port with coroutines (non-blocking)
     */
    suspend fun scanPort(host: String, port: Int, timeout: Int = 1000): PortScanResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        var isOpen = false
        
        try {
            Socket().use { socket ->
                socket.connect(InetSocketAddress(host, port), timeout)
                isOpen = true
            }
        } catch (e: Exception) {
            // Port closed or timeout
        }
        
        val responseTime = System.currentTimeMillis() - startTime
        val (service, risk) = ServiceDetector.detectService(port)
        
        PortScanResult(
            host = host,
            port = port,
            isOpen = isOpen,
            service = if (isOpen) service else null,
            risk = risk,
            responseTime = responseTime
        )
    }
    
    /**
     * Parallel port scanning using coroutines
     */
    suspend fun scanPortRange(
        host: String,
        startPort: Int,
        endPort: Int,
        timeout: Int = 1000
    ): List<PortScanResult> = coroutineScope {
        val jobs = (startPort..endPort).map { port ->
            async {
                scanPort(host, port, timeout)
            }
        }
        
        jobs.awaitAll().filter { it.isOpen }
    }
    
    /**
     * Fast port scan (common ports only)
     */
    suspend fun scanCommonPorts(host: String): List<PortScanResult> = coroutineScope {
        val commonPorts = listOf(21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080)
        
        val jobs = commonPorts.map { port ->
            async {
                scanPort(host, port, 500)
            }
        }
        
        jobs.awaitAll().filter { it.isOpen }
    }
    
    /**
     * Calculate file hashes (MD5, SHA-1, SHA-256)
     */
    fun calculateHash(filePath: String): ScanResult {
        val startTime = System.currentTimeMillis()
        
        return try {
            val file = File(filePath)
            if (!file.exists() || !file.isFile) {
                return ScanResult.Failure("File not found or not a file: $filePath")
            }
            
            val bytes = file.readBytes()
            
            val md5 = MessageDigest.getInstance("MD5")
                .digest(bytes)
                .joinToString("") { "%02x".format(it) }
            
            val sha1 = MessageDigest.getInstance("SHA-1")
                .digest(bytes)
                .joinToString("") { "%02x".format(it) }
            
            val sha256 = MessageDigest.getInstance("SHA-256")
                .digest(bytes)
                .joinToString("") { "%02x".format(it) }
            
            val duration = System.currentTimeMillis() - startTime
            
            val result = HashResult(
                filePath = filePath,
                md5 = md5,
                sha1 = sha1,
                sha256 = sha256,
                sizeBytes = file.length(),
                calculationTime = duration,
                timestamp = Instant.now().toString()
            )
            
            ScanResult.Success(result, duration)
        } catch (e: Exception) {
            ScanResult.Failure("Hash calculation failed: ${e.message}")
        }
    }
    
    /**
     * API Security Scanner
     */
    suspend fun scanApiSecurity(url: String, method: String = "GET"): ScanResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        
        try {
            val request = Request.Builder()
                .url(url)
                .method(method, null)
                .build()
            
            val response = client.newCall(request).execute()
            
            val headers = response.headers.toMultimap()
                .mapValues { it.value.joinToString(", ") }
            
            val vulnerabilities = mutableListOf<String>()
            val recommendations = mutableListOf<String>()
            
            // Check security headers
            if (!headers.containsKey("Strict-Transport-Security")) {
                vulnerabilities.add("Missing HSTS header")
                recommendations.add("Add Strict-Transport-Security header")
            }
            
            if (!headers.containsKey("X-Content-Type-Options")) {
                vulnerabilities.add("Missing X-Content-Type-Options header")
                recommendations.add("Add X-Content-Type-Options: nosniff")
            }
            
            if (!headers.containsKey("X-Frame-Options")) {
                vulnerabilities.add("Missing X-Frame-Options header")
                recommendations.add("Add X-Frame-Options: DENY or SAMEORIGIN")
            }
            
            if (!headers.containsKey("Content-Security-Policy")) {
                vulnerabilities.add("Missing Content-Security-Policy")
                recommendations.add("Implement Content Security Policy")
            }
            
            if (headers["Server"]?.isNotEmpty() == true) {
                vulnerabilities.add("Server header exposes version information")
                recommendations.add("Remove or obfuscate Server header")
            }
            
            val riskScore = when (vulnerabilities.size) {
                0 -> 0
                1 -> 25
                2 -> 50
                3 -> 75
                else -> 100
            }
            
            val result = ApiSecurityResult(
                url = url,
                method = method,
                statusCode = response.code,
                headers = headers,
                vulnerabilities = vulnerabilities,
                riskScore = riskScore,
                recommendations = recommendations
            )
            
            val duration = System.currentTimeMillis() - startTime
            response.close()
            
            ScanResult.Success(result, duration)
        } catch (e: Exception) {
            ScanResult.Failure("API scan failed: ${e.message}")
        }
    }
    
    /**
     * Execute command from TypeScript bridge
     */
    fun execute(command: String, params: Map<String, String>): String {
        return runBlocking {
            when (command) {
                "port_scan" -> {
                    val host = params["host"] ?: return@runBlocking gson.toJson(mapOf("error" to "Missing host"))
                    val startPort = params["startPort"]?.toIntOrNull() ?: 1
                    val endPort = params["endPort"]?.toIntOrNull() ?: 1024
                    
                    val results = scanPortRange(host, startPort, endPort)
                    gson.toJson(mapOf(
                        "host" to host,
                        "startPort" to startPort,
                        "endPort" to endPort,
                        "openPorts" to results,
                        "timestamp" to Instant.now().toString()
                    ))
                }
                
                "port_scan_fast" -> {
                    val host = params["host"] ?: return@runBlocking gson.toJson(mapOf("error" to "Missing host"))
                    
                    val results = scanCommonPorts(host)
                    gson.toJson(mapOf(
                        "host" to host,
                        "openPorts" to results,
                        "timestamp" to Instant.now().toString()
                    ))
                }
                
                "hash_file" -> {
                    val filePath = params["filePath"] ?: return@runBlocking gson.toJson(mapOf("error" to "Missing filePath"))
                    
                    when (val result = calculateHash(filePath)) {
                        is ScanResult.Success<*> -> gson.toJson(result.data)
                        is ScanResult.Failure -> gson.toJson(mapOf("error" to result.error))
                    }
                }
                
                "api_scan" -> {
                    val url = params["url"] ?: return@runBlocking gson.toJson(mapOf("error" to "Missing url"))
                    val method = params["method"] ?: "GET"
                    
                    when (val result = scanApiSecurity(url, method)) {
                        is ScanResult.Success<*> -> gson.toJson(result.data)
                        is ScanResult.Failure -> gson.toJson(mapOf("error" to result.error))
                    }
                }
                
                else -> gson.toJson(mapOf("error" to "Unknown command: $command"))
            }
        }
    }
    
    /**
     * Get scanner information
     */
    fun getInfo(): String {
        return gson.toJson(mapOf(
            "name" to "Kotlin Security Scanner",
            "version" to "2.0.0",
            "language" to "Kotlin",
            "features" to listOf(
                "Coroutine-based parallel scanning",
                "Port scanning",
                "File hashing",
                "API security analysis",
                "Modern Kotlin features"
            ),
            "capabilities" to mapOf(
                "async" to true,
                "coroutines" to true,
                "parallel" to true
            )
        ))
    }
}

// CLI entry point
fun main(args: Array<String>) {
    val scanner = KotlinSecurityScanner()
    
    when {
        args.isEmpty() -> {
            println("Kotlin Security Scanner v2.0.0")
            println("Usage:")
            println("  kotlin-scanner scan <host> [start-port] [end-port]")
            println("  kotlin-scanner hash <file-path>")
            println("  kotlin-scanner api <url> [method]")
            println("  kotlin-scanner info")
        }
        
        args[0] == "info" -> {
            println(scanner.getInfo())
        }
        
        args[0] == "scan" && args.size >= 2 -> {
            val host = args[1]
            val startPort = args.getOrNull(2)?.toIntOrNull() ?: 1
            val endPort = args.getOrNull(3)?.toIntOrNull() ?: 1024
            
            runBlocking {
                println("Scanning $host ports $startPort-$endPort...")
                val results = scanner.scanPortRange(host, startPort, endPort)
                println("Found ${results.size} open ports:")
                results.forEach { result ->
                    println("  Port ${result.port}: ${result.service} (${result.risk} risk) - ${result.responseTime}ms")
                }
            }
        }
        
        args[0] == "hash" && args.size >= 2 -> {
            val filePath = args[1]
            when (val result = scanner.calculateHash(filePath)) {
                is ScanResult.Success<*> -> {
                    val hashResult = result.data as HashResult
                    println("Hash calculation for: ${hashResult.filePath}")
                    println("  MD5:    ${hashResult.md5}")
                    println("  SHA-1:  ${hashResult.sha1}")
                    println("  SHA-256: ${hashResult.sha256}")
                    println("  Size:   ${hashResult.sizeBytes} bytes")
                    println("  Time:   ${hashResult.calculationTime}ms")
                }
                is ScanResult.Failure -> println("Error: ${result.error}")
            }
        }
        
        args[0] == "api" && args.size >= 2 -> {
            val url = args[1]
            val method = args.getOrNull(2) ?: "GET"
            
            runBlocking {
                println("Scanning API: $url")
                when (val result = scanner.scanApiSecurity(url, method)) {
                    is ScanResult.Success<*> -> {
                        val apiResult = result.data as ApiSecurityResult
                        println("Status Code: ${apiResult.statusCode}")
                        println("Risk Score: ${apiResult.riskScore}/100")
                        println("\nVulnerabilities:")
                        apiResult.vulnerabilities.forEach { println("  - $it") }
                        println("\nRecommendations:")
                        apiResult.recommendations.forEach { println("  - $it") }
                    }
                    is ScanResult.Failure -> println("Error: ${result.error}")
                }
            }
        }
        
        else -> {
            println("Unknown command. Use 'kotlin-scanner' without arguments for help.")
        }
    }
}