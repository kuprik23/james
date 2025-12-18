package com.emersa.james.scanner;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * James Ultimate Security Scanner - Main Coordinator
 * 
 * High-performance security scanning engine that coordinates:
 * - Port scanning (network reconnaissance)
 * - File hash analysis (integrity verification)
 * - Vulnerability scanning (code analysis)
 * 
 * This Java implementation provides 10-100x faster scanning
 * compared to pure JavaScript implementations.
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 * Made in California, USA 🇺🇸
 */
public class SecurityScanner {
    private static final Logger logger = LoggerFactory.getLogger(SecurityScanner.class);
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    
    private final PortScanner portScanner;
    private final HashAnalyzer hashAnalyzer;
    private final VulnerabilityScanner vulnerabilityScanner;
    
    public SecurityScanner() {
        int cpuCount = Runtime.getRuntime().availableProcessors();
        logger.info("Initializing Security Scanner with {} CPU cores", cpuCount);
        
        this.portScanner = new PortScanner(Math.max(50, cpuCount * 10), 2000);
        this.hashAnalyzer = new HashAnalyzer(cpuCount);
        this.vulnerabilityScanner = new VulnerabilityScanner(cpuCount);
    }
    
    /**
     * Execute scan based on command
     */
    public String execute(String command, Map<String, String> params) {
        try {
            logger.info("Executing command: {} with params: {}", command, params);
            
            switch (command) {
                case "port_scan":
                    return executePortScan(params);
                    
                case "port_scan_fast":
                    return executePortScanFast(params);
                    
                case "hash_file":
                    return executeHashFile(params);
                    
                case "hash_directory":
                    return executeHashDirectory(params);
                    
                case "vuln_scan_file":
                    return executeVulnScanFile(params);
                    
                case "vuln_scan_directory":
                    return executeVulnScanDirectory(params);
                    
                case "full_scan":
                    return executeFullScan(params);
                    
                default:
                    return errorResponse("Unknown command: " + command);
            }
            
        } catch (Exception e) {
            logger.error("Error executing command: {}", command, e);
            return errorResponse(e.getMessage());
        }
    }
    
    /**
     * Port scan
     */
    private String executePortScan(Map<String, String> params) {
        String host = params.getOrDefault("host", "localhost");
        int startPort = Integer.parseInt(params.getOrDefault("startPort", "1"));
        int endPort = Integer.parseInt(params.getOrDefault("endPort", "1024"));
        
        PortScanner.ScanResult result = portScanner.scanPorts(host, startPort, endPort);
        return result.toJson();
    }
    
    /**
     * Fast port scan (common ports only)
     */
    private String executePortScanFast(Map<String, String> params) {
        String host = params.getOrDefault("host", "localhost");
        
        PortScanner.ScanResult result = portScanner.fastScan(host);
        return result.toJson();
    }
    
    /**
     * Hash single file
     */
    private String executeHashFile(Map<String, String> params) throws IOException {
        String filePath = params.get("filePath");
        
        if (filePath == null) {
            return errorResponse("filePath parameter is required");
        }
        
        HashAnalyzer.FileHashResult result = hashAnalyzer.analyzeFile(filePath);
        return result.toJson();
    }
    
    /**
     * Hash directory
     */
    private String executeHashDirectory(Map<String, String> params) throws IOException {
        String directory = params.get("directory");
        boolean recursive = Boolean.parseBoolean(params.getOrDefault("recursive", "true"));
        int maxDepth = Integer.parseInt(params.getOrDefault("maxDepth", "10"));
        
        if (directory == null) {
            return errorResponse("directory parameter is required");
        }
        
        HashAnalyzer.DirectoryScanResult result = hashAnalyzer.scanDirectory(directory, recursive, maxDepth);
        return result.toJson();
    }
    
    /**
     * Vulnerability scan file
     */
    private String executeVulnScanFile(Map<String, String> params) throws IOException {
        String filePath = params.get("filePath");
        
        if (filePath == null) {
            return errorResponse("filePath parameter is required");
        }
        
        VulnerabilityScanner.FileScanResult result = vulnerabilityScanner.scanFile(filePath);
        return result.toJson();
    }
    
    /**
     * Vulnerability scan directory
     */
    private String executeVulnScanDirectory(Map<String, String> params) throws IOException {
        String directory = params.get("directory");
        boolean recursive = Boolean.parseBoolean(params.getOrDefault("recursive", "true"));
        
        if (directory == null) {
            return errorResponse("directory parameter is required");
        }
        
        VulnerabilityScanner.DirectoryVulnScanResult result = vulnerabilityScanner.scanDirectory(directory, recursive);
        return result.toJson();
    }
    
    /**
     * Full comprehensive scan
     */
    private String executeFullScan(Map<String, String> params) throws IOException {
        String target = params.getOrDefault("target", ".");
        
        Map<String, Object> results = new HashMap<>();
        results.put("timestamp", Instant.now().toString());
        results.put("target", target);
        
        Path path = Paths.get(target);
        
        // Determine if target is file or directory
        if (Files.isDirectory(path)) {
            // Directory scan
            results.put("type", "directory");
            
            // Hash analysis
            HashAnalyzer.DirectoryScanResult hashResult = hashAnalyzer.scanDirectory(target, true, 5);
            results.put("hashAnalysis", hashResult);
            
            // Vulnerability analysis
            VulnerabilityScanner.DirectoryVulnScanResult vulnResult = vulnerabilityScanner.scanDirectory(target, true);
            results.put("vulnerabilityAnalysis", vulnResult);
            
        } else if (Files.isRegularFile(path)) {
            // File scan
            results.put("type", "file");
            
            // Hash analysis
            HashAnalyzer.FileHashResult hashResult = hashAnalyzer.analyzeFile(target);
            results.put("hashAnalysis", hashResult);
            
            // Vulnerability analysis (if source file)
            try {
                VulnerabilityScanner.FileScanResult vulnResult = vulnerabilityScanner.scanFile(target);
                results.put("vulnerabilityAnalysis", vulnResult);
            } catch (Exception e) {
                results.put("vulnerabilityAnalysis", "Not a source code file");
            }
        } else {
            return errorResponse("Target not found or invalid: " + target);
        }
        
        return gson.toJson(results);
    }
    
    /**
     * Create error response
     */
    private String errorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        error.put("timestamp", Instant.now().toString());
        return gson.toJson(error);
    }
    
    /**
     * Get scanner information
     */
    public String getInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "James Ultimate Security Scanner");
        info.put("version", "2.0.0");
        info.put("language", "Java");
        info.put("cpuCores", Runtime.getRuntime().availableProcessors());
        info.put("availableCommands", new String[]{
            "port_scan", "port_scan_fast", "hash_file", "hash_directory",
            "vuln_scan_file", "vuln_scan_directory", "full_scan"
        });
        return gson.toJson(info);
    }
    
    /**
     * Main method for CLI usage and testing
     */
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("James Ultimate Security Scanner v2.0.0");
            System.out.println("Copyright © 2025 Emersa Ltd. All Rights Reserved.");
            System.out.println();
            System.out.println("Usage:");
            System.out.println("  java SecurityScanner <command> <params>");
            System.out.println();
            System.out.println("Commands:");
            System.out.println("  port_scan <host> <startPort> <endPort>");
            System.out.println("  port_scan_fast <host>");
            System.out.println("  hash_file <filePath>");
            System.out.println("  hash_directory <directory> [recursive]");
            System.out.println("  vuln_scan_file <filePath>");
            System.out.println("  vuln_scan_directory <directory> [recursive]");
            System.out.println("  full_scan <target>");
            System.out.println("  info");
            System.exit(0);
        }
        
        SecurityScanner scanner = new SecurityScanner();
        String command = args[0];
        
        if ("info".equals(command)) {
            System.out.println(scanner.getInfo());
            return;
        }
        
        // Build params map
        Map<String, String> params = new HashMap<>();
        
        // Parse command-specific arguments
        switch (command) {
            case "port_scan":
                if (args.length < 4) {
                    System.err.println("Usage: port_scan <host> <startPort> <endPort>");
                    System.exit(1);
                }
                params.put("host", args[1]);
                params.put("startPort", args[2]);
                params.put("endPort", args[3]);
                break;
                
            case "port_scan_fast":
                if (args.length < 2) {
                    System.err.println("Usage: port_scan_fast <host>");
                    System.exit(1);
                }
                params.put("host", args[1]);
                break;
                
            case "hash_file":
            case "vuln_scan_file":
                if (args.length < 2) {
                    System.err.println("Usage: " + command + " <filePath>");
                    System.exit(1);
                }
                params.put("filePath", args[1]);
                break;
                
            case "hash_directory":
            case "vuln_scan_directory":
                if (args.length < 2) {
                    System.err.println("Usage: " + command + " <directory> [recursive]");
                    System.exit(1);
                }
                params.put("directory", args[1]);
                if (args.length > 2) {
                    params.put("recursive", args[2]);
                }
                break;
                
            case "full_scan":
                if (args.length < 2) {
                    System.err.println("Usage: full_scan <target>");
                    System.exit(1);
                }
                params.put("target", args[1]);
                break;
                
            default:
                System.err.println("Unknown command: " + command);
                System.exit(1);
        }
        
        // Execute and print result
        String result = scanner.execute(command, params);
        System.out.println(result);
    }
}