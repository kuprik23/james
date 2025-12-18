package com.emersa.james.scanner;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

/**
 * High-Performance Concurrent Port Scanner
 * 
 * Features:
 * - Multi-threaded scanning using ExecutorService
 * - Configurable timeout and thread pool size
 * - Service detection for common ports
 * - Risk assessment for discovered ports
 * - JSON output for Node.js integration
 * 
 * Copyright © 2025 Emersa Ltd.
 */
public class PortScanner {
    private static final Logger logger = LoggerFactory.getLogger(PortScanner.class);
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    
    private final int threadPoolSize;
    private final int timeout;
    
    // Common service mappings
    private static final Map<Integer, ServiceInfo> SERVICES = new HashMap<>();
    
    static {
        // Network services
        SERVICES.put(21, new ServiceInfo("FTP", "high"));
        SERVICES.put(22, new ServiceInfo("SSH", "medium"));
        SERVICES.put(23, new ServiceInfo("Telnet", "high"));
        SERVICES.put(25, new ServiceInfo("SMTP", "medium"));
        SERVICES.put(53, new ServiceInfo("DNS", "low"));
        SERVICES.put(80, new ServiceInfo("HTTP", "low"));
        SERVICES.put(110, new ServiceInfo("POP3", "medium"));
        SERVICES.put(135, new ServiceInfo("RPC", "high"));
        SERVICES.put(139, new ServiceInfo("NetBIOS", "high"));
        SERVICES.put(143, new ServiceInfo("IMAP", "medium"));
        SERVICES.put(443, new ServiceInfo("HTTPS", "low"));
        SERVICES.put(445, new ServiceInfo("SMB", "high"));
        SERVICES.put(993, new ServiceInfo("IMAPS", "low"));
        SERVICES.put(995, new ServiceInfo("POP3S", "low"));
        
        // Database services
        SERVICES.put(1433, new ServiceInfo("MSSQL", "high"));
        SERVICES.put(1521, new ServiceInfo("Oracle", "high"));
        SERVICES.put(3306, new ServiceInfo("MySQL", "high"));
        SERVICES.put(5432, new ServiceInfo("PostgreSQL", "high"));
        SERVICES.put(27017, new ServiceInfo("MongoDB", "medium"));
        SERVICES.put(6379, new ServiceInfo("Redis", "high"));
        
        // Remote access
        SERVICES.put(3389, new ServiceInfo("RDP", "high"));
        SERVICES.put(5900, new ServiceInfo("VNC", "high"));
        
        // Web services
        SERVICES.put(8080, new ServiceInfo("HTTP-Proxy", "low"));
        SERVICES.put(8443, new ServiceInfo("HTTPS-Alt", "low"));
        
        // Other services
        SERVICES.put(9200, new ServiceInfo("Elasticsearch", "medium"));
        SERVICES.put(11211, new ServiceInfo("Memcached", "high"));
    }
    
    public PortScanner(int threadPoolSize, int timeout) {
        this.threadPoolSize = threadPoolSize;
        this.timeout = timeout;
    }
    
    /**
     * Scan a range of ports on a target host
     */
    public ScanResult scanPorts(String host, int startPort, int endPort) {
        logger.info("Starting port scan: {} ports {}-{}", host, startPort, endPort);
        
        long startTime = System.currentTimeMillis();
        List<OpenPort> openPorts = new ArrayList<>();
        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
        
        try {
            // Create scan tasks for each port
            List<Future<OpenPort>> futures = new ArrayList<>();
            
            for (int port = startPort; port <= endPort; port++) {
                final int portToScan = port;
                Future<OpenPort> future = executor.submit(() -> scanPort(host, portToScan));
                futures.add(future);
            }
            
            // Collect results
            for (Future<OpenPort> future : futures) {
                try {
                    OpenPort result = future.get(timeout + 1000, TimeUnit.MILLISECONDS);
                    if (result != null) {
                        openPorts.add(result);
                    }
                } catch (TimeoutException e) {
                    logger.warn("Port scan timeout");
                } catch (ExecutionException | InterruptedException e) {
                    logger.debug("Scan error: {}", e.getMessage());
                }
            }
            
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        // Sort by port number
        openPorts.sort(Comparator.comparingInt(p -> p.port));
        
        logger.info("Scan complete: {} open ports found in {}ms", openPorts.size(), duration);
        
        return new ScanResult(host, startPort, endPort, openPorts, duration);
    }
    
    /**
     * Scan a single port
     */
    private OpenPort scanPort(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeout);
            
            ServiceInfo service = SERVICES.getOrDefault(port, new ServiceInfo("Unknown", "low"));
            
            logger.debug("Port {} open - {}", port, service.name);
            return new OpenPort(port, service.name, service.risk);
            
        } catch (IOException e) {
            // Port closed or filtered
            return null;
        }
    }
    
    /**
     * Fast scan of common ports
     */
    public ScanResult fastScan(String host) {
        int[] commonPorts = {
            21, 22, 23, 25, 53, 80, 110, 143, 443, 445,
            1433, 3306, 3389, 5432, 5900, 8080, 8443
        };
        
        logger.info("Starting fast scan on {} ({} common ports)", host, commonPorts.length);
        
        long startTime = System.currentTimeMillis();
        List<OpenPort> openPorts = new CopyOnWriteArrayList<>();
        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
        
        try {
            List<Future<?>> futures = Arrays.stream(commonPorts)
                .mapToObj(port -> executor.submit(() -> {
                    OpenPort result = scanPort(host, port);
                    if (result != null) {
                        openPorts.add(result);
                    }
                }))
                .toList();
            
            // Wait for all tasks
            for (Future<?> future : futures) {
                try {
                    future.get(timeout + 1000, TimeUnit.MILLISECONDS);
                } catch (Exception e) {
                    logger.debug("Fast scan error: {}", e.getMessage());
                }
            }
            
        } finally {
            executor.shutdown();
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        openPorts.sort(Comparator.comparingInt(p -> p.port));
        
        return new ScanResult(host, 0, 0, openPorts, duration);
    }
    
    /**
     * Service information
     */
    private static class ServiceInfo {
        final String name;
        final String risk;
        
        ServiceInfo(String name, String risk) {
            this.name = name;
            this.risk = risk;
        }
    }
    
    /**
     * Open port information
     */
    public static class OpenPort {
        public final int port;
        public final String service;
        public final String risk;
        
        public OpenPort(int port, String service, String risk) {
            this.port = port;
            this.service = service;
            this.risk = risk;
        }
    }
    
    /**
     * Scan result
     */
    public static class ScanResult {
        public final String host;
        public final int startPort;
        public final int endPort;
        public final List<OpenPort> openPorts;
        public final long durationMs;
        public final String timestamp;
        
        public ScanResult(String host, int startPort, int endPort, List<OpenPort> openPorts, long durationMs) {
            this.host = host;
            this.startPort = startPort;
            this.endPort = endPort;
            this.openPorts = openPorts;
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
            System.err.println("Usage: java PortScanner <host> [startPort] [endPort]");
            System.err.println("       java PortScanner <host> fast");
            System.exit(1);
        }
        
        String host = args[0];
        PortScanner scanner = new PortScanner(50, 2000);
        
        ScanResult result;
        
        if (args.length == 2 && "fast".equals(args[1])) {
            result = scanner.fastScan(host);
        } else {
            int startPort = args.length > 1 ? Integer.parseInt(args[1]) : 1;
            int endPort = args.length > 2 ? Integer.parseInt(args[2]) : 1024;
            result = scanner.scanPorts(host, startPort, endPort);
        }
        
        System.out.println(result.toJson());
    }
}