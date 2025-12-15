@echo off
REM CyberCAT Scanner Launcher
REM Run the vulnerability scanner

setlocal

REM Find the JAR file
set JAR_FILE=target\cybercat-scanner-1.0.0.jar

if not exist "%JAR_FILE%" (
    echo CyberCAT Scanner not built yet.
    echo Running build first...
    call build.bat
)

if exist "%JAR_FILE%" (
    java -jar "%JAR_FILE%" %*
) else (
    echo ERROR: Could not find or build CyberCAT Scanner
    echo Please ensure Java is installed and run build.bat
    pause
)

endlocal