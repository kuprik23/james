@echo off
echo.
echo     /\_____/\
echo    /  o   o  \
echo   ( ==  ^  == )
echo    )         (
echo   (           )
echo  ( (  )   (  ) )
echo (__(__)___(__)__)
echo.
echo Building CyberCAT Scanner...
echo.

REM Check if Java is installed
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 11 or higher
    pause
    exit /b 1
)

REM Check if Maven is installed
mvn -version >nul 2>&1
if errorlevel 1 (
    echo Maven not found, using javac directly...
    
    REM Create output directories
    if not exist "target\classes" mkdir target\classes
    
    REM Compile
    echo Compiling Java source...
    javac -d target\classes src\main\java\com\cybercat\scanner\CyberCATScanner.java
    
    if errorlevel 1 (
        echo ERROR: Compilation failed
        pause
        exit /b 1
    )
    
    REM Create JAR
    echo Creating JAR file...
    cd target\classes
    jar cfe ..\cybercat-scanner-1.0.0.jar com.cybercat.scanner.CyberCATScanner com\cybercat\scanner\*.class
    cd ..\..
    
    echo.
    echo Build complete! JAR file: target\cybercat-scanner-1.0.0.jar
) else (
    echo Building with Maven...
    mvn clean package -q
    
    if errorlevel 1 (
        echo ERROR: Maven build failed
        pause
        exit /b 1
    )
    
    echo.
    echo Build complete! JAR file: target\cybercat-scanner-1.0.0.jar
)

echo.
echo To run: java -jar target\cybercat-scanner-1.0.0.jar
echo Or use: cybercat.bat
echo.
pause