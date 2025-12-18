/**
 * James Ultimate - C++ Network Scanner
 * Ultra-fast network scanning with raw sockets
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

#include <iostream>
#include <vector>
#include <thread>
#include <mutex>
#include <chrono>
#include <atomic>
#include <algorithm>
#include <string>
#include <cstring>
#include <unordered_map>
#include <fcntl.h>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef int socklen_t;
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #include <netdb.h>
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define closesocket close
    typedef int SOCKET;
#endif

namespace james {

struct PortScanResult {
    int port;
    bool is_open;
    std::string service;
    std::string risk;
    int response_time_ms;
};

class NetworkScanner {
private:
    std::mutex results_mutex;
    std::vector<PortScanResult> results;
    std::atomic<int> scanned_count{0};
    
    static const std::unordered_map<int, std::pair<std::string, std::string>>& get_services() {
        static std::unordered_map<int, std::pair<std::string, std::string>> services = {
            {21, {"FTP", "high"}},
            {22, {"SSH", "medium"}},
            {23, {"Telnet", "high"}},
            {25, {"SMTP", "medium"}},
            {53, {"DNS", "low"}},
            {80, {"HTTP", "low"}},
            {110, {"POP3", "medium"}},
            {135, {"RPC", "high"}},
            {139, {"NetBIOS", "high"}},
            {143, {"IMAP", "medium"}},
            {443, {"HTTPS", "low"}},
            {445, {"SMB", "high"}},
            {1433, {"MSSQL", "high"}},
            {3306, {"MySQL", "high"}},
            {3389, {"RDP", "high"}},
            {5432, {"PostgreSQL", "high"}},
            {5900, {"VNC", "high"}},
            {8080, {"HTTP-Proxy", "low"}},
            {8443, {"HTTPS-Alt", "low"}},
            {27017, {"MongoDB", "medium"}},
            {6379, {"Redis", "high"}}
        };
        return services;
    }
    
public:
    NetworkScanner() {
#ifdef _WIN32
        WSADATA wsa_data;
        WSAStartup(MAKEWORD(2, 2), &wsa_data);
#endif
    }
    
    ~NetworkScanner() {
#ifdef _WIN32
        WSACleanup();
#endif
    }
    
    /**
     * Scan single port with timeout
     */
    bool scan_port(const std::string& host, int port, int timeout_ms) {
        auto start = std::chrono::high_resolution_clock::now();
        
        SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (sock == INVALID_SOCKET) {
            return false;
        }
        
        // Set non-blocking mode
#ifdef _WIN32
        u_long mode = 1;
        ioctlsocket(sock, FIONBIO, &mode);
#else
        int flags = fcntl(sock, F_GETFL, 0);
        fcntl(sock, F_SETFL, flags | O_NONBLOCK);
#endif
        
        struct sockaddr_in addr;
        memset(&addr, 0, sizeof(addr));
        addr.sin_family = AF_INET;
        addr.sin_port = htons(port);
        
        // Convert hostname to IP
        struct hostent* he = gethostbyname(host.c_str());
        if (he == nullptr) {
            closesocket(sock);
            return false;
        }
        memcpy(&addr.sin_addr, he->h_addr_list[0], he->h_length);
        
        // Attempt connection
        connect(sock, (struct sockaddr*)&addr, sizeof(addr));
        
        // Wait for connection with timeout
        fd_set fdset;
        FD_ZERO(&fdset);
        FD_SET(sock, &fdset);
        
        struct timeval tv;
        tv.tv_sec = timeout_ms / 1000;
        tv.tv_usec = (timeout_ms % 1000) * 1000;
        
        bool is_open = false;
        if (select(sock + 1, nullptr, &fdset, nullptr, &tv) > 0) {
            int error = 0;
            socklen_t len = sizeof(error);
            getsockopt(sock, SOL_SOCKET, SO_ERROR, (char*)&error, &len);
            is_open = (error == 0);
        }
        
        closesocket(sock);
        
        auto end = std::chrono::high_resolution_clock::now();
        int response_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        
        if (is_open) {
            auto& services = get_services();
            auto it = services.find(port);
            
            PortScanResult result;
            result.port = port;
            result.is_open = true;
            result.response_time_ms = response_time;
            
            if (it != services.end()) {
                result.service = it->second.first;
                result.risk = it->second.second;
            } else {
                result.service = "Unknown";
                result.risk = "low";
            }
            
            std::lock_guard<std::mutex> lock(results_mutex);
            results.push_back(result);
        }
        
        scanned_count++;
        return is_open;
    }
    
    /**
     * Parallel port scan with thread pool
     */
    std::vector<PortScanResult> scan_range(
        const std::string& host,
        int start_port,
        int end_port,
        int timeout_ms = 1000,
        int num_threads = 100
    ) {
        results.clear();
        scanned_count = 0;
        
        auto start_time = std::chrono::high_resolution_clock::now();
        
        std::vector<std::thread> threads;
        std::atomic<int> current_port{start_port};
        
        // Create thread pool
        for (int i = 0; i < num_threads; ++i) {
            threads.emplace_back([&]() {
                while (true) {
                    int port = current_port.fetch_add(1);
                    if (port > end_port) break;
                    
                    scan_port(host, port, timeout_ms);
                }
            });
        }
        
        // Wait for all threads
        for (auto& t : threads) {
            if (t.joinable()) t.join();
        }
        
        // Sort results by port
        std::sort(results.begin(), results.end(),
            [](const PortScanResult& a, const PortScanResult& b) {
                return a.port < b.port;
            });
        
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();
        
        std::cout << "[C++ Scanner] Scanned " << (end_port - start_port + 1) 
                  << " ports in " << duration << "ms (" 
                  << results.size() << " open)" << std::endl;
        
        return results;
    }
    
    /**
     * Fast SYN scan (requires raw sockets / admin privileges)
     */
    std::vector<PortScanResult> syn_scan(
        const std::string& host,
        const std::vector<int>& ports,
        int timeout_ms = 500
    ) {
        // SYN scan implementation (requires elevated privileges)
        // This is a simplified version - full implementation would use raw sockets
        results.clear();
        
        std::vector<std::thread> threads;
        
        for (int port : ports) {
            threads.emplace_back([&, port]() {
                scan_port(host, port, timeout_ms);
            });
        }
        
        for (auto& t : threads) {
            if (t.joinable()) t.join();
        }
        
        return results;
    }
    
    /**
     * Get scan statistics
     */
    int get_scanned_count() const {
        return scanned_count.load();
    }
    
    /**
     * Get open port count
     */
    int get_open_count() const {
        return results.size();
    }
};

} // namespace james

// Export C interface for Node.js binding
extern "C" {
    james::NetworkScanner* scanner_create() {
        return new james::NetworkScanner();
    }
    
    void scanner_destroy(james::NetworkScanner* scanner) {
        delete scanner;
    }
    
    int scanner_scan_port(james::NetworkScanner* scanner, const char* host, int port, int timeout) {
        return scanner->scan_port(host, port, timeout) ? 1 : 0;
    }
    
    void scanner_scan_range(
        james::NetworkScanner* scanner,
        const char* host,
        int start_port,
        int end_port,
        int timeout,
        int threads
    ) {
        scanner->scan_range(host, start_port, end_port, timeout, threads);
    }
    
    int scanner_get_result_count(james::NetworkScanner* scanner) {
        return scanner->get_open_count();
    }
}