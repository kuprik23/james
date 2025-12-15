@echo off
echo.
echo Creating CyberCAT Scanner Executable...
echo.

REM First build the JAR
call build.bat

REM Create the dist directory
if not exist "dist" mkdir dist

REM Create a launcher executable using a VBS wrapper
echo Creating Windows executable wrapper...

REM Create VBS launcher that runs without console window
echo Set WshShell = CreateObject("WScript.Shell") > dist\cybercat-silent.vbs
echo WshShell.Run "cmd /c java -jar cybercat-scanner-1.0.0.jar", 0, False >> dist\cybercat-silent.vbs

REM Create batch file that can be converted to EXE
echo @echo off > dist\CyberCAT.bat
echo title CyberCAT Scanner >> dist\CyberCAT.bat
echo cd /d "%%~dp0" >> dist\CyberCAT.bat
echo java -jar cybercat-scanner-1.0.0.jar %%* >> dist\CyberCAT.bat

REM Copy JAR to dist
copy target\cybercat-scanner-1.0.0.jar dist\ >nul

REM Create a PowerShell script to create actual EXE
echo Creating PowerShell EXE generator...

(
echo # CyberCAT EXE Generator
echo # This creates a self-extracting executable
echo.
echo $source = @"
echo using System;
echo using System.Diagnostics;
echo using System.IO;
echo using System.Reflection;
echo.
echo namespace CyberCAT {
echo     class Program {
echo         static void Main^(string[] args^) {
echo             string exePath = Assembly.GetExecutingAssembly^(^).Location;
echo             string exeDir = Path.GetDirectoryName^(exePath^);
echo             string jarPath = Path.Combine^(exeDir, "cybercat-scanner-1.0.0.jar"^);
echo.
echo             if ^(!File.Exists^(jarPath^)^) {
echo                 Console.WriteLine^("ERROR: cybercat-scanner-1.0.0.jar not found"^);
echo                 Console.WriteLine^("Please ensure the JAR file is in the same directory as this executable"^);
echo                 Console.ReadKey^(^);
echo                 return;
echo             }
echo.
echo             ProcessStartInfo psi = new ProcessStartInfo^(^);
echo             psi.FileName = "java";
echo             psi.Arguments = "-jar \"" + jarPath + "\" " + String.Join^(" ", args^);
echo             psi.UseShellExecute = false;
echo             psi.CreateNoWindow = false;
echo.
echo             try {
echo                 Process p = Process.Start^(psi^);
echo                 p.WaitForExit^(^);
echo             } catch ^(Exception ex^) {
echo                 Console.WriteLine^("ERROR: " + ex.Message^);
echo                 Console.WriteLine^("Please ensure Java is installed and in your PATH"^);
echo                 Console.ReadKey^(^);
echo             }
echo         }
echo     }
echo }
echo "@
echo.
echo Add-Type -TypeDefinition $source -OutputAssembly "dist\CyberCAT.exe" -OutputType ConsoleApplication
echo Write-Host "CyberCAT.exe created successfully!"
) > create-exe.ps1

REM Try to create the EXE using PowerShell
echo.
echo Attempting to create EXE using PowerShell...
powershell -ExecutionPolicy Bypass -File create-exe.ps1

if exist "dist\CyberCAT.exe" (
    echo.
    echo ========================================
    echo SUCCESS! CyberCAT.exe created in dist\
    echo ========================================
    echo.
    echo Files in dist folder:
    dir dist /b
    echo.
    echo To use:
    echo   1. Copy the dist folder contents to your desired location
    echo   2. Run CyberCAT.exe or CyberCAT.bat
    echo   3. Ensure Java 11+ is installed
) else (
    echo.
    echo Note: PowerShell EXE creation requires .NET SDK
    echo You can still use CyberCAT.bat in the dist folder
    echo.
    echo Alternative: Use Launch4j or similar tool to wrap the JAR
)

echo.
pause