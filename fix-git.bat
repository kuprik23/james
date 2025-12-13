@echo off  
cd /d "%~dp0"  
takeown /f .git /r /d y  
icacls .git /grant Everyone:F /t  
rmdir /s /q .git  
rmdir /s /q mcp-servers  
echo Done! Press any key...  
pause 
