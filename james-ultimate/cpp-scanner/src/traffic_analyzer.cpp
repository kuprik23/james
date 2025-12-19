/**
 * James Ultimate - C++ Traffic Analyzer
 * Real-time network traffic monitoring and analysis
 *
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <string>
#include <cstring>
#include <atomic>
#include <chrono>
#include <thread>
#include <mutex>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #include <iphlpapi.h>
    #pragma comment(lib, "ws2_32.lib")
    #pragma comment(lib, "iphlpapi.lib")
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <netinet/ip.h>
    #include <netinet/tcp.h>
    #include <netinet/udp.h>
    #include <arpa/inet.h>
    #include <unistd.h>
#endif

namespace james {

struct PacketInfo {
    std::string source_ip;
    std::string dest_ip;
    int source_port;
    int dest_port;
    std::string protocol;
    size_t size;
    std::chrono::system_clock::time_point timestamp;
};

struct TrafficStats {
    uint64_t total_packets;
    uint64_t total_bytes;
    uint64_t tcp_packets;
    uint64_t udp_packets;
    uint64_t other_packets;
    std::map<std::string, uint64_t> top_sources;
    std::map<std::string, uint64_t> top_destinations;
    std::map<int, uint64_t> port_distribution;
};

class TrafficAnalyzer {
private:
    std::atomic<bool> running{false};
    std::atomic<uint64_t> packet_count{0};
    std::atomic<uint64_t> byte_count{0};
    std::vector<PacketInfo> captured_packets;
    std::mutex packets_mutex;
    TrafficStats stats;
    
public:
    TrafficAnalyzer() {
        stats.total_packets = 0;
        stats.total_bytes = 0;
        stats.tcp_packets = 0;
        stats.udp_packets = 0;
        stats.other_packets = 0;
    }
    
    /**
     * Start capturing traffic on interface
     */
    bool start_capture(const std::string& interface = "eth0", int duration_seconds = 60) {
        if (running.load()) {
            std::cerr << "Capture already running" << std::endl;
            return false;
        }
        
        running.store(true);
        captured_packets.clear();
        
        std::cout << "[Traffic Analyzer] Starting capture on " << interface 
                  << " for " << duration_seconds << " seconds..." << std::endl;
        
        auto start_time = std::chrono::system_clock::now();
        
        // Simulated packet capture (real implementation would use pcap/WinPcap)
        std::thread capture_thread([this, duration_seconds, start_time]() {
            while (running.load()) {
                auto now = std::chrono::system_clock::now();
                auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(
                    now - start_time).count();
                
                if (elapsed >= duration_seconds) {
                    running.store(false);
                    break;
                }
                
                // Simulate packet capture
                analyze_traffic_sample();
                
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        });
        
        capture_thread.join();
        
        std::cout << "[Traffic Analyzer] Capture complete. Captured " 
                  << packet_count.load() << " packets (" 
                  << byte_count.load() << " bytes)" << std::endl;
        
        return true;
    }
    
    /**
     * Stop traffic capture
     */
    void stop_capture() {
        running.store(false);
    }
    
    /**
     * Analyze traffic patterns
     */
    void analyze_traffic_sample() {
        // Simulate traffic analysis (real implementation would parse actual packets)
        PacketInfo packet;
        packet.source_ip = "192.168.1." + std::to_string(rand() % 255);
        packet.dest_ip = "10.0.0." + std::to_string(rand() % 255);
        packet.source_port = 1024 + (rand() % 64000);
        packet.dest_port = 80 + (rand() % 1000);
        packet.protocol = (rand() % 2 == 0) ? "TCP" : "UDP";
        packet.size = 64 + (rand() % 1500);
        packet.timestamp = std::chrono::system_clock::now();
        
        packet_count++;
        byte_count += packet.size;
        
        if (packet.protocol == "TCP") {
            stats.tcp_packets++;
        } else if (packet.protocol == "UDP") {
            stats.udp_packets++;
        } else {
            stats.other_packets++;
        }
        
        stats.top_sources[packet.source_ip]++;
        stats.top_destinations[packet.dest_ip]++;
        stats.port_distribution[packet.dest_port]++;
        
        std::lock_guard<std::mutex> lock(packets_mutex);
        captured_packets.push_back(packet);
        
        // Keep only last 10000 packets
        if (captured_packets.size() > 10000) {
            captured_packets.erase(captured_packets.begin());
        }
    }
    
    /**
     * Get traffic statistics
     */
    TrafficStats get_statistics() {
        stats.total_packets = packet_count.load();
        stats.total_bytes = byte_count.load();
        return stats;
    }
    
    /**
     * Detect anomalies in traffic
     */
    std::vector<std::string> detect_anomalies() {
        std::vector<std::string> anomalies;
        
        // Check for port scanning
        std::map<std::string, std::set<int>> source_ports;
        for (const auto& packet : captured_packets) {
            source_ports[packet.source_ip].insert(packet.dest_port);
        }
        
        for (const auto& [ip, ports] : source_ports) {
            if (ports.size() > 50) {
                anomalies.push_back("Port scan detected from " + ip + 
                                  " (" + std::to_string(ports.size()) + " ports)");
            }
        }
        
        // Check for unusual traffic volume
        for (const auto& [ip, count] : stats.top_sources) {
            if (count > packet_count.load() * 0.3) {
                anomalies.push_back("High traffic volume from " + ip + 
                                  " (" + std::to_string(count) + " packets)");
            }
        }
        
        return anomalies;
    }
    
    /**
     * Get bandwidth usage per second
     */
    double get_bandwidth_mbps() {
        return (byte_count.load() * 8.0) / (1024.0 * 1024.0);
    }
    
    /**
     * Get packet capture
     */
    std::vector<PacketInfo> get_captured_packets(size_t limit = 100) {
        std::lock_guard<std::mutex> lock(packets_mutex);
        
        if (captured_packets.size() <= limit) {
            return captured_packets;
        }
        
        return std::vector<PacketInfo>(
            captured_packets.end() - limit,
            captured_packets.end()
        );
    }
};

} // namespace james

// Export C interface
extern "C" {
    james::TrafficAnalyzer* traffic_analyzer_create() {
        return new james::TrafficAnalyzer();
    }
    
    void traffic_analyzer_destroy(james::TrafficAnalyzer* analyzer) {
        delete analyzer;
    }
    
    int traffic_analyzer_start(james::TrafficAnalyzer* analyzer, const char* interface, int duration) {
        return analyzer->start_capture(interface, duration) ? 1 : 0;
    }
    
    void traffic_analyzer_stop(james::TrafficAnalyzer* analyzer) {
        analyzer->stop_capture();
    }
    
    double traffic_analyzer_get_bandwidth(james::TrafficAnalyzer* analyzer) {
        return analyzer->get_bandwidth_mbps();
    }
}