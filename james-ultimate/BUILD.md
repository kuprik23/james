# James Ultimate - Build Guide

## Quick Start

### Prerequisites

```bash
# Check versions
node --version    # Should be 18+
npm --version     # Should be 8+
java -version     # Should be 17+
mvn --version     # Should be 3.8+
```

### Install Dependencies

```bash
cd james-ultimate
npm install
```

### Build Everything

```bash
npm run build
```

This command will:
1. Compile TypeScript to JavaScript (`dist/` folder)
2. Build Java security scanners (`java-scanner/target/security-scanner.jar`)

## Build Steps Explained

### 1. TypeScript Build

```bash
npm run build:ts
```

Output: Compiled JavaScript in `dist/` folder

### 2. Java Build

```bash
npm run build:java
```

Or manually with Maven:
```bash
cd java-scanner
mvn clean package
```

Output: `java-scanner/target/security-scanner.jar`

## Development Mode

```bash
# Watch TypeScript files and recompile on changes
npm run watch

# Run with auto-reload
npm run dev
```

## Testing Java Scanners

### Port Scanner
```bash
java -jar java-scanner/target/security-scanner.jar port_scan localhost 1 1024
java -jar java-scanner/target/security-scanner.jar port_scan_fast localhost
```

### Hash Analyzer
```bash
java -jar java-scanner/target/security-scanner.jar hash_file package.json
java -jar java-scanner/target/security-scanner.jar hash_directory src/ recursive
```

### Vulnerability Scanner
```bash
java -jar java-scanner/target/security-scanner.jar vuln_scan_file src/main.js
java -jar java-scanner/target/security-scanner.jar vuln_scan_directory src/ recursive
```

### Full Scan
```bash
java -jar java-scanner/target/security-scanner.jar full_scan .
```

## Running James Ultimate

### With TypeScript (after build)
```bash
node dist/main.js start
```

### With JavaScript (legacy)
```bash
node src/main.js start
```

### Development Mode
```bash
npm run dev
```

## Creating Executable

```bash
npm run build:exe
```

Output: `dist/James.exe` (Windows)

## Troubleshooting

### "Cannot find module" errors

```bash
npm install
```

### Java compilation fails

Check Maven installation:
```bash
mvn --version
```

Ensure Java 17+ is installed:
```bash
java -version
```

### TypeScript compilation fails

```bash
npm install -D typescript @types/node
npm run build:ts
```

### Java bridge not working

```bash
# Install Java bridge
npm install java

# Verify Java scanner is built
ls -la java-scanner/target/security-scanner.jar
```

## Performance Testing

Compare JavaScript vs Java performance:

```bash
# JavaScript port scan (slow)
time node src/main.js scan --type ports --host localhost

# Java port scan (fast)
time java -jar java-scanner/target/security-scanner.jar port_scan localhost 1 1024
```

## Clean Build

```bash
npm run clean
npm run build
```

This removes all build artifacts and rebuilds from scratch.
