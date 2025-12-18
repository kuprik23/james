cmake_minimum_required(VERSION 3.15)
project(james_network_scanner VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization flags
if(CMAKE_BUILD_TYPE MATCHES Release)
    if(MSVC)
        add_compile_options(/O2 /GL /arch:AVX2)
        add_link_options(/LTCG)
    else()
        add_compile_options(-O3 -march=native -flto)
        add_link_options(-flto)
    endif()
endif()

# Main library
add_library(james_scanner SHARED
    src/network_scanner.cpp
)

target_include_directories(james_scanner
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Platform-specific libraries
if(WIN32)
    target_link_libraries(james_scanner ws2_32 iphlpapi)
elseif(UNIX)
    find_package(Threads REQUIRED)
    target_link_libraries(james_scanner Threads::Threads)
endif()

# Install targets
install(TARGETS james_scanner
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)