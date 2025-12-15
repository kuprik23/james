package com.cybercat.scanner;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;
import javax.net.ssl.*;
import java.security.cert.*;

/**
 * CyberCAT Vulnerability Scanner
 * 
 *     /\_____/\
 *    /  o   o  \
 *   ( ==  ^  == )
 *    )         (
 *   (           )
 *  ( (  )   (  ) )
 * (__(__)___(__)__)
 *    CYBERCAT v1.0
 * 
 * Military-grade security scanning tool
 */
public class CyberCATScanner {
    
    private static final String VERSION = "1.0.0";
    private static final int THREAD_POOL_SIZE = 50;
    private static final int SOCKET_TIMEOUT = 2000;
    
    // Common ports to scan
    private static final int[] COMMON_PORTS = {
        21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445,
        993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379,
        8080, 8443, 27017
    };
    
    // Risky ports that indicate potential vulnerabilities
    private static final Set<Integer> RISKY_PORTS = new HashSet<>(Arrays.asList(
        21, 23, 135, 139, 445, 3389, 5900
    ));
    
    private ExecutorService executor;
    private List<ScanResult> results;
    
    public CyberCATScanner() {
        this.executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        this.results = Collections.synchronizedList(new ArrayList<>());
    }
    
    public static void main(String[] args) {
        printBanner();
        
        CyberCATScanner scanner = new CyberCATScanner();
        
        if (args.length == 0) {
            scanner.runInteractiveMode();
        } else {
            scanner.parseArgs(args);
        }
    }
    
    private static void printBanner() {
        System.out.println();
        System.out.println("╔═══════════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                                                                           ║");
        System.out.println("║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗      ║");
        System.out.println("║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝      ║");
        System.out.println("║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║         ║");
        System.out.println("║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║         ║");
        System.out.println("║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║         ║");
        System.out.println("║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝         ║");
        System.out.println("║                                                                           ║");
        System.out.println("║   Cyber Analysis & Threat Detection - Military Grade Security Scanner    ║");
        System.out.println("║                                                                           ║");
        System.out.println("╚═══════════════════════════════════════════════════════════════════════════╝");
        System.out.println();
        System.out.println("    /\\_____/\\");
        System.out.println("   /  o   o  \\      CyberCAT Vulnerability Scanner");
        System.out.println("  ( ==  ^  == )     Version " + VERSION);
        System.out.println("   )         (      Military-Grade Security Tool");
        System.out.println("  (           )");
        System.out.println(" ( (  )   (  ) )");
        System.out.println("(__(__)___(__)__)");
        System.out.println();
    }
    
    private void runInteractiveMode() {
        Scanner input = new Scanner(System.in);
        
        while (true) {
            System.out.print("\n🐱 CyberCAT> ");
            String command = input.nextLine().trim();
            
            if (command.isEmpty()) continue;
            
            String[] parts = command.split("\\s+");
            String cmd = parts[0].toLowerCase();
            
            switch (cmd) {
                case "help":
                    printHelp();
                    break;
                case "scan":
                    if (parts.length < 2) {
                        System.out.println("Usage: scan <host>");
                    } else {
                        fullScan(parts[1]);
                    }
                    break;
                case "ports":
                    if (parts.length < 2) {
                        System.out.println("Usage: ports <host>");
                    } else {
                        portScan(parts[1]);
                    }
                    break;
                case "ssl":
                    if (parts.length < 2) {
                        System.out.println("Usage: ssl <host>");
                    } else {
                        sslCheck(parts[1]);
                    }
                    break;
                case "sweep":
                    localSweep();
                    break;
                case "exit":
                case "quit":
                    printGoodbyeCat();
                    executor.shutdown();
                    return;
                default:
                    System.out.println("Unknown command. Type 'help' for available commands.");
            }
        }
    }
    
    private void parseArgs(String[] args) {
        String command = args[0].toLowerCase();
        
        switch (command) {
            case "--scan":
            case "-s":
                if (args.length < 2) {
                    System.out.println("Usage: --scan <host>");
                    return;
                }
                fullScan(args[1]);
                break;
            case "--ports":
            case "-p":
                if (args.length < 2) {
                    System.out.println("Usage: --ports <host>");
                    return;
                }
                portScan(args[1]);
                break;
            case "--ssl":
                if (args.length < 2) {
                    System.out.println("Usage: --ssl <host>");
                    return;
                }
                sslCheck(args[1]);
                break;
            case "--sweep":
                localSweep();
                break;
            case "--help":
            case "-h":
                printHelp();
                break;
            default:
                System.out.println("Unknown option: " + command);
                printHelp();
        }
        
        executor.shutdown();
    }
    
    private void printHelp() {
        System.out.println("🐱 CyberCAT Scanner Commands:");
        System.out.println();
        System.out.println("  scan <host>    - Full vulnerability scan of target");
        System.out.println("  ports <host>   - Port scan target host");
        System.out.println("  ssl <host>     - Check SSL/TLS configuration");
        System.out.println("  sweep          - Local system security sweep");
        System.out.println("  help           - Show this help message");
        System.out.println("  exit           - Exit the scanner");
        System.out.println();
        System.out.println("Command line options:");
        System.out.println("  --scan, -s <host>   Full scan");
        System.out.println("  --ports, -p <host>  Port scan");
        System.out.println("  --ssl <host>        SSL check");
        System.out.println("  --sweep             Local sweep");
        System.out.println("  --help, -h          Show help");
    }
    
    // ==================== PORT SCANNING ====================
    
    public void portScan(String host) {
        System.out.println("\n🔌 Starting port scan on " + host + "...\n");
        
        results.clear();
        List<Future<ScanResult>> futures = new ArrayList<>();
        
        for (int port : COMMON_PORTS) {
            futures.add(executor.submit(() -> scanPort(host, port)));
        }
        
        // Wait for all scans to complete
        for (Future<ScanResult> future : futures) {
            try {
                ScanResult result = future.get(SOCKET_TIMEOUT + 1000, TimeUnit.MILLISECONDS);
                if (result != null && result.isOpen) {
                    results.add(result);
                }
            } catch (Exception e) {
                // Timeout or error - port is closed
            }
        }
        
        // Print results
        printPortScanResults(host);
    }
    
    private ScanResult scanPort(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), SOCKET_TIMEOUT);
            String service = getServiceName(port);
            boolean isRisky = RISKY_PORTS.contains(port);
            return new ScanResult(port, true, service, isRisky);
        } catch (Exception e) {
            return new ScanResult(port, false, null, false);
        }
    }
    
    private String getServiceName(int port) {
        switch (port) {
            case 21: return "FTP";
            case 22: return "SSH";
            case 23: return "Telnet";
            case 25: return "SMTP";
            case 53: return "DNS";
            case 80: return "HTTP";
            case 110: return "POP3";
            case 135: return "RPC";
            case 139: return "NetBIOS";
            case 143: return "IMAP";
            case 443: return "HTTPS";
            case 445: return "SMB";
            case 993: return "IMAPS";
            case 995: return "POP3S";
            case 1433: return "MSSQL";
            case 1521: return "Oracle";
            case 3306: return "MySQL";
            case 3389: return "RDP";
            case 5432: return "PostgreSQL";
            case 5900: return "VNC";
            case 6379: return "Redis";
            case 8080: return "HTTP-Alt";
            case 8443: return "HTTPS-Alt";
            case 27017: return "MongoDB";
            default: return "Unknown";
        }
    }
    
    private void printPortScanResults(String host) {
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║                    PORT SCAN RESULTS                       ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.printf("║  Target: %-49s ║%n", host);
        System.out.printf("║  Open Ports: %-45d ║%n", results.size());
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        
        if (results.isEmpty()) {
            System.out.println("║  No open ports found                                       ║");
        } else {
            System.out.println("║  PORT      SERVICE          STATUS                         ║");
            System.out.println("║  ────      ───────          ──────                         ║");
            
            int riskyCount = 0;
            for (ScanResult result : results) {
                String status = result.isRisky ? "⚠️  RISKY" : "✓  OK";
                System.out.printf("║  %-8d %-16s %-30s ║%n", 
                    result.port, result.service, status);
                if (result.isRisky) riskyCount++;
            }
            
            System.out.println("╠════════════════════════════════════════════════════════════╣");
            
            String riskLevel;
            if (riskyCount > 2) {
                riskLevel = "🔴 HIGH RISK";
            } else if (riskyCount > 0) {
                riskLevel = "🟡 MEDIUM RISK";
            } else {
                riskLevel = "🟢 LOW RISK";
            }
            
            System.out.printf("║  Risk Assessment: %-40s ║%n", riskLevel);
        }
        
        System.out.println("╚════════════════════════════════════════════════════════════╝");
    }
    
    // ==================== SSL/TLS CHECK ====================
    
    public void sslCheck(String host) {
        System.out.println("\n🔒 Checking SSL/TLS configuration for " + host + "...\n");
        
        try {
            // Create SSL context that accepts all certificates for testing
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }}, new java.security.SecureRandom());
            
            SSLSocketFactory factory = sslContext.getSocketFactory();
            
            int port = 443;
            if (host.contains(":")) {
                String[] parts = host.split(":");
                host = parts[0];
                port = Integer.parseInt(parts[1]);
            }
            
            try (SSLSocket socket = (SSLSocket) factory.createSocket(host, port)) {
                socket.setSoTimeout(5000);
                socket.startHandshake();
                
                SSLSession session = socket.getSession();
                Certificate[] certs = session.getPeerCertificates();
                
                System.out.println("╔════════════════════════════════════════════════════════════╗");
                System.out.println("║                    SSL/TLS ANALYSIS                        ║");
                System.out.println("╠════════════════════════════════════════════════════════════╣");
                System.out.printf("║  Host: %-51s ║%n", host);
                System.out.printf("║  Protocol: %-47s ║%n", session.getProtocol());
                System.out.printf("║  Cipher Suite: %-43s ║%n", 
                    truncate(session.getCipherSuite(), 43));
                
                if (certs.length > 0 && certs[0] instanceof X509Certificate) {
                    X509Certificate cert = (X509Certificate) certs[0];
                    
                    System.out.println("╠════════════════════════════════════════════════════════════╣");
                    System.out.println("║  CERTIFICATE DETAILS                                       ║");
                    System.out.println("║  ────────────────────                                      ║");
                    
                    String subject = cert.getSubjectX500Principal().getName();
                    System.out.printf("║  Subject: %-48s ║%n", truncate(subject, 48));
                    
                    String issuer = cert.getIssuerX500Principal().getName();
                    System.out.printf("║  Issuer: %-49s ║%n", truncate(issuer, 49));
                    
                    Date notAfter = cert.getNotAfter();
                    long daysUntilExpiry = (notAfter.getTime() - System.currentTimeMillis()) 
                        / (1000 * 60 * 60 * 24);
                    
                    String expiryStatus;
                    if (daysUntilExpiry < 0) {
                        expiryStatus = "🔴 EXPIRED";
                    } else if (daysUntilExpiry < 30) {
                        expiryStatus = "🟡 Expires in " + daysUntilExpiry + " days";
                    } else {
                        expiryStatus = "🟢 Valid (" + daysUntilExpiry + " days)";
                    }
                    
                    System.out.printf("║  Expiry: %-49s ║%n", expiryStatus);
                }
                
                // Check for vulnerabilities
                System.out.println("╠════════════════════════════════════════════════════════════╣");
                System.out.println("║  SECURITY ASSESSMENT                                       ║");
                System.out.println("║  ───────────────────                                       ║");
                
                List<String> issues = new ArrayList<>();
                
                String protocol = session.getProtocol();
                if (protocol.equals("TLSv1") || protocol.equals("TLSv1.1")) {
                    issues.add("Outdated TLS version: " + protocol);
                }
                
                String cipher = session.getCipherSuite();
                if (cipher.contains("RC4") || cipher.contains("DES") || cipher.contains("MD5")) {
                    issues.add("Weak cipher suite detected");
                }
                
                if (issues.isEmpty()) {
                    System.out.println("║  ✅ No critical issues found                               ║");
                    System.out.printf("║  Rating: %-49s ║%n", "🟢 A (Secure)");
                } else {
                    for (String issue : issues) {
                        System.out.printf("║  ⚠️  %-53s ║%n", issue);
                    }
                    System.out.printf("║  Rating: %-49s ║%n", "🟡 C (Needs Improvement)");
                }
                
                System.out.println("╚════════════════════════════════════════════════════════════╝");
            }
            
        } catch (Exception e) {
            System.out.println("╔════════════════════════════════════════════════════════════╗");
            System.out.println("║  ❌ SSL/TLS Check Failed                                   ║");
            System.out.printf("║  Error: %-50s ║%n", truncate(e.getMessage(), 50));
            System.out.println("╚════════════════════════════════════════════════════════════╝");
        }
    }
    
    // ==================== FULL SCAN ====================
    
    public void fullScan(String host) {
        System.out.println("\n🔍 Starting full vulnerability scan on " + host + "...\n");
        
        // Port scan
        portScan(host);
        
        // SSL check if port 443 is open
        boolean hasHttps = results.stream().anyMatch(r -> r.port == 443);
        if (hasHttps) {
            sslCheck(host);
        }
        
        // Generate recommendations
        printRecommendations();
    }
    
    private void printRecommendations() {
        System.out.println("\n╔════════════════════════════════════════════════════════════╗");
        System.out.println("║                    RECOMMENDATIONS                         ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        
        boolean hasRisky = results.stream().anyMatch(r -> r.isRisky);
        
        if (hasRisky) {
            System.out.println("║  🔴 Close or secure risky ports:                          ║");
            for (ScanResult r : results) {
                if (r.isRisky) {
                    System.out.printf("║     - Port %d (%s)%n", r.port, r.service);
                }
            }
        }
        
        System.out.println("║                                                            ║");
        System.out.println("║  General Security Recommendations:                         ║");
        System.out.println("║  • Enable firewall and restrict unnecessary ports          ║");
        System.out.println("║  • Use TLS 1.2 or higher for all connections               ║");
        System.out.println("║  • Implement network segmentation                          ║");
        System.out.println("║  • Regular security audits and penetration testing         ║");
        System.out.println("║  • Keep all software and systems updated                   ║");
        System.out.println("╚════════════════════════════════════════════════════════════╝");
    }
    
    // ==================== LOCAL SWEEP ====================
    
    public void localSweep() {
        System.out.println("\n🔍 Starting local security sweep...\n");
        
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║                  LOCAL SECURITY SWEEP                      ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        
        // System info
        System.out.printf("║  OS: %-53s ║%n", System.getProperty("os.name"));
        System.out.printf("║  Version: %-48s ║%n", System.getProperty("os.version"));
        System.out.printf("║  Architecture: %-43s ║%n", System.getProperty("os.arch"));
        System.out.printf("║  Java Version: %-43s ║%n", System.getProperty("java.version"));
        
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║  NETWORK INTERFACES                                        ║");
        System.out.println("║  ──────────────────                                        ║");
        
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (ni.isUp() && !ni.isLoopback()) {
                    System.out.printf("║  • %-55s ║%n", ni.getDisplayName());
                    Enumeration<InetAddress> addresses = ni.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        InetAddress addr = addresses.nextElement();
                        if (addr instanceof Inet4Address) {
                            System.out.printf("║    IP: %-51s ║%n", addr.getHostAddress());
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("║  Could not enumerate network interfaces                    ║");
        }
        
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║  SECURITY CHECKS                                           ║");
        System.out.println("║  ───────────────                                           ║");
        
        // Check Java security
        String securityManager = System.getSecurityManager() != null ? "Enabled" : "Disabled";
        System.out.printf("║  Security Manager: %-39s ║%n", securityManager);
        
        // Check temp directory permissions
        File tempDir = new File(System.getProperty("java.io.tmpdir"));
        String tempPerms = tempDir.canWrite() ? "Writable (Normal)" : "Read-only";
        System.out.printf("║  Temp Directory: %-41s ║%n", tempPerms);
        
        // Memory info
        Runtime runtime = Runtime.getRuntime();
        long maxMem = runtime.maxMemory() / (1024 * 1024);
        long totalMem = runtime.totalMemory() / (1024 * 1024);
        long freeMem = runtime.freeMemory() / (1024 * 1024);
        
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║  MEMORY STATUS                                             ║");
        System.out.println("║  ─────────────                                             ║");
        System.out.printf("║  Max Memory: %-45s ║%n", maxMem + " MB");
        System.out.printf("║  Total Memory: %-43s ║%n", totalMem + " MB");
        System.out.printf("║  Free Memory: %-44s ║%n", freeMem + " MB");
        
        // Scan localhost
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║  Scanning localhost ports...                               ║");
        
        portScan("127.0.0.1");
        
        System.out.println("\n🐱 Local sweep complete!");
    }
    
    // ==================== UTILITY METHODS ====================
    
    private static void printGoodbyeCat() {
        System.out.println();
        System.out.println("    /\\_____/\\");
        System.out.println("   /  -   -  \\     Zzz...");
        System.out.println("  ( ==  ^  == )");
        System.out.println("   )  ~~~~~  (     Stay secure!");
        System.out.println("  (           )    Goodbye from CyberCAT");
        System.out.println(" ( (  )   (  ) )");
        System.out.println("(__(__)___(__)__)");
        System.out.println();
        System.out.println("╔═══════════════════════════════════════════════════════════════╗");
        System.out.println("║  🐱 CyberCAT - Keeping your systems safe, one scan at a time  ║");
        System.out.println("╚═══════════════════════════════════════════════════════════════╝");
        System.out.println();
    }
    
    private String truncate(String str, int maxLen) {
        if (str == null) return "";
        if (str.length() <= maxLen) return str;
        return str.substring(0, maxLen - 3) + "...";
    }
    
    // ==================== INNER CLASSES ====================
    
    private static class ScanResult {
        int port;
        boolean isOpen;
        String service;
        boolean isRisky;
        
        ScanResult(int port, boolean isOpen, String service, boolean isRisky) {
            this.port = port;
            this.isOpen = isOpen;
            this.service = service;
            this.isRisky = isRisky;
        }
    }
}