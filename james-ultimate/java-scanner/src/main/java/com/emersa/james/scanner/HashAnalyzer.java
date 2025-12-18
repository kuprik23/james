package com.emersa.james.scanner;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.commons.codec.digest.DigestUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * High-Performance File Hash Analyzer
 * 
 * Features:
 * - Multi-threaded hash calculation
 * - Multiple hash algorithms (MD5, SHA-1, SHA-256, SHA-512)
 * - Directory scanning with parallel processing
 * - File integrity monitoring
 * - Malware signature detection
 * 
 * Copyright © 2025 Emersa Ltd.
 */
public class HashAnalyzer {
    private static final Logger logger = LoggerFactory.getLogger(HashAnalyzer.class);
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    
    private final int threadPoolSize;
    private final Set<String> knownMalwareHashes;
    
    public HashAnalyzer(int threadPoolSize) {
        this.threadPoolSize = threadPoolSize;
        this.knownMalwareHashes = loadMalwareSignatures();
    }
    
    /**
     * Load known malware signatures
     * In production, this would load from a threat intelligence database
     */
    private Set<String> loadMalwareSignatures() {
        Set<String> signatures = new HashSet<>();
        // Example malware hashes - in production, integrate with threat feeds
        // These are placeholder hashes for testing
        signatures.add("44d88612fea8a8f36de82e1278abb02f"); // test hash
        return signatures;
    }
    
    /**
     * Calculate all hashes for a single file
     */
    public FileHashResult analyzeFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        
        if (!Files.exists(path)) {
            throw new FileNotFoundException("File not found: " + filePath);
        }
        
        if (!Files.isRegularFile(path)) {
            throw new IOException("Not a regular file: " + filePath);
        }
        
        long startTime = System.currentTimeMillis();
        long fileSize = Files.size(path);
        
        // Calculate multiple hashes in parallel
        ExecutorService executor = Executors.newFixedThreadPool(4);
        
        try {
            Future<String> md5Future = executor.submit(() -> calculateHash(path, "MD5"));
            Future<String> sha1Future = executor.submit(() -> calculateHash(path, "SHA-1"));
            Future<String> sha256Future = executor.submit(() -> calculateHash(path, "SHA-256"));
            Future<String> sha512Future = executor.submit(() -> calculateHash(path, "SHA-512"));
            
            String md5 = md5Future.get();
            String sha1 = sha1Future.get();
            String sha256 = sha256Future.get();
            String sha512 = sha512Future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            
            // Check against malware signatures
            boolean isMalware = knownMalwareHashes.contains(md5) || 
                               knownMalwareHashes.contains(sha1) ||
                               knownMalwareHashes.contains(sha256);
            
            return new FileHashResult(
                filePath,
                fileSize,
                md5,
                sha1,
                sha256,
                sha512,
                isMalware,
                duration
            );
            
        } catch (InterruptedException | ExecutionException e) {
            throw new IOException("Hash calculation failed", e);
        } finally {
            executor.shutdown();
        }
    }
    
    /**
     * Calculate hash using specified algorithm
     */
    private String calculateHash(Path path, String algorithm) throws IOException {
        try (InputStream input = Files.newInputStream(path)) {
            MessageDigest digest = MessageDigest.getInstance(algorithm);
            byte[] buffer = new byte[8192];
            int bytesRead;
            
            while ((bytesRead = input.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            
            byte[] hashBytes = digest.digest();
            return bytesToHex(hashBytes);
            
        } catch (NoSuchAlgorithmException e) {
            throw new IOException("Algorithm not supported: " + algorithm, e);
        }
    }
    
    /**
     * Fast MD5 hash calculation
     */
    public String fastMD5(String filePath) throws IOException {
        try (InputStream input = Files.newInputStream(Paths.get(filePath))) {
            return DigestUtils.md5Hex(input);
        }
    }
    
    /**
     * Fast SHA-256 hash calculation
     */
    public String fastSHA256(String filePath) throws IOException {
        try (InputStream input = Files.newInputStream(Paths.get(filePath))) {
            return DigestUtils.sha256Hex(input);
        }
    }
    
    /**
     * Scan directory and calculate hashes for all files
     */
    public DirectoryScanResult scanDirectory(String directoryPath, boolean recursive, int maxDepth) throws IOException {
        Path dir = Paths.get(directoryPath);
        
        if (!Files.exists(dir)) {
            throw new FileNotFoundException("Directory not found: " + directoryPath);
        }
        
        if (!Files.isDirectory(dir)) {
            throw new IOException("Not a directory: " + directoryPath);
        }
        
        logger.info("Scanning directory: {} (recursive: {})", directoryPath, recursive);
        long startTime = System.currentTimeMillis();
        
        // Collect all files
        List<Path> files;
        if (recursive) {
            try (var stream = Files.walk(dir, maxDepth)) {
                files = stream
                    .filter(Files::isRegularFile)
                    .collect(Collectors.toList());
            }
        } else {
            try (var stream = Files.list(dir)) {
                files = stream
                    .filter(Files::isRegularFile)
                    .collect(Collectors.toList());
            }
        }
        
        logger.info("Found {} files to scan", files.size());
        
        // Process files in parallel
        List<FileHashResult> results = new CopyOnWriteArrayList<>();
        List<FileHashResult> threats = new CopyOnWriteArrayList<>();
        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
        
        try {
            List<Future<?>> futures = files.stream()
                .map(file -> executor.submit(() -> {
                    try {
                        FileHashResult result = analyzeFile(file.toString());
                        results.add(result);
                        
                        if (result.isMalware) {
                            threats.add(result);
                            logger.warn("Malware detected: {}", file);
                        }
                    } catch (IOException e) {
                        logger.error("Error scanning file {}: {}", file, e.getMessage());
                    }
                }))
                .toList();
            
            // Wait for all tasks
            for (Future<?> future : futures) {
                try {
                    future.get();
                } catch (InterruptedException | ExecutionException e) {
                    logger.error("Scan error", e);
                }
            }
            
        } finally {
            executor.shutdown();
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        logger.info("Scan complete: {} files scanned, {} threats found in {}ms", 
                   results.size(), threats.size(), duration);
        
        return new DirectoryScanResult(
            directoryPath,
            results.size(),
            threats.size(),
            results,
            threats,
            duration
        );
    }
    
    /**
     * Compare two files by hash
     */
    public boolean compareFiles(String file1Path, String file2Path) throws IOException {
        String hash1 = fastSHA256(file1Path);
        String hash2 = fastSHA256(file2Path);
        return hash1.equals(hash2);
    }
    
    /**
     * Verify file integrity against known hash
     */
    public boolean verifyIntegrity(String filePath, String expectedHash, String algorithm) throws IOException {
        Path path = Paths.get(filePath);
        String actualHash = calculateHash(path, algorithm);
        return actualHash.equalsIgnoreCase(expectedHash);
    }
    
    /**
     * Convert bytes to hex string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
    
    /**
     * File hash result
     */
    public static class FileHashResult {
        public final String filePath;
        public final long sizeBytes;
        public final String md5;
        public final String sha1;
        public final String sha256;
        public final String sha512;
        public final boolean isMalware;
        public final long calculationTimeMs;
        public final String timestamp;
        
        public FileHashResult(String filePath, long sizeBytes, String md5, String sha1, 
                            String sha256, String sha512, boolean isMalware, long calculationTimeMs) {
            this.filePath = filePath;
            this.sizeBytes = sizeBytes;
            this.md5 = md5;
            this.sha1 = sha1;
            this.sha256 = sha256;
            this.sha512 = sha512;
            this.isMalware = isMalware;
            this.calculationTimeMs = calculationTimeMs;
            this.timestamp = Instant.now().toString();
        }
        
        public String toJson() {
            return gson.toJson(this);
        }
    }
    
    /**
     * Directory scan result
     */
    public static class DirectoryScanResult {
        public final String directory;
        public final int filesScanned;
        public final int threatsFound;
        public final List<FileHashResult> results;
        public final List<FileHashResult> threats;
        public final long durationMs;
        public final String timestamp;
        
        public DirectoryScanResult(String directory, int filesScanned, int threatsFound,
                                 List<FileHashResult> results, List<FileHashResult> threats, long durationMs) {
            this.directory = directory;
            this.filesScanned = filesScanned;
            this.threatsFound = threatsFound;
            this.results = results;
            this.threats = threats;
            this.durationMs = durationMs;
            this.timestamp = Instant.now().toString();
        }
        
        public String toJson() {
            return gson.toJson(this);
        }
    }
    
    /**
     * Main method for standalone execution
     */
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java HashAnalyzer <file|directory> [recursive]");
            System.exit(1);
        }
        
        String path = args[0];
        HashAnalyzer analyzer = new HashAnalyzer(Runtime.getRuntime().availableProcessors());
        
        try {
            Path p = Paths.get(path);
            
            if (Files.isDirectory(p)) {
                boolean recursive = args.length > 1 && "recursive".equals(args[1]);
                DirectoryScanResult result = analyzer.scanDirectory(path, recursive, 10);
                System.out.println(result.toJson());
            } else {
                FileHashResult result = analyzer.analyzeFile(path);
                System.out.println(result.toJson());
            }
            
        } catch (IOException e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}