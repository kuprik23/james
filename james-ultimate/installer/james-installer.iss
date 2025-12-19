; James Ultimate - Windows Installer Script
; Inno Setup 6.x required to compile this into an EXE
; Download Inno Setup from: https://jrsoftware.org/isdl.php

#define MyAppName "James Ultimate"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "Emersa Ltd"
#define MyAppURL "https://github.com/kuprik23/james"
#define MyAppExeName "James.exe"

[Setup]
AppId={{A8F9C1B2-3D4E-5F6A-7B8C-9D0E1F2A3B4C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=output
OutputBaseFilename=James-Ultimate-Setup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "installprereqs"; Description: "Install prerequisites (Maven, Gradle, Rust, CMake)"; GroupDescription: "Prerequisites:"; Flags: checkablealone
Name: "addtopath"; Description: "Add James to system PATH"; GroupDescription: "System Integration:"; Flags: checkedonce

[Files]
Source: "..\dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "..\*.md"; DestDir: "{app}\docs"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Install Maven
Filename: "{tmp}\install-maven.bat"; Description: "Install Apache Maven"; Flags: postinstall skipifsilent runhidden; Tasks: installprereqs; Check: not MavenInstalled

; Install Gradle
Filename: "{tmp}\install-gradle.bat"; Description: "Install Gradle"; Flags: postinstall skipifsilent runhidden; Tasks: installprereqs; Check: not GradleInstalled

; Install Rust
Filename: "{tmp}\rustup-init.exe"; Parameters: "-y --default-toolchain stable"; Description: "Install Rust"; Flags: postinstall skipifsilent runhidden; Tasks: installprereqs; Check: not RustInstalled

; Install CMake
Filename: "{tmp}\install-cmake.bat"; Description: "Install CMake"; Flags: postinstall skipifsilent runhidden; Tasks: installprereqs; Check: not CMakeInstalled

; Open browser to VS Build Tools if needed
Filename: "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"; Description: "Install Visual Studio Build Tools (for C++)"; Flags: postinstall shellexec skipifsilent; Check: not CppCompilerInstalled

; Launch application
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
var
  DownloadPage: TDownloadWizardPage;
  
function OnDownloadProgress(const URL, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  if Progress = ProgressMax then
    Log(Format('Successfully downloaded %s to %s', [URL, FileName]));
  Result := True;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), @OnDownloadProgress);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  TempPath: String;
begin
  if CurPageID = wpReady then begin
    TempPath := ExpandConstant('{tmp}');
    
    DownloadPage.Clear;
    
    // Download Maven installer script if needed
    if not MavenInstalled then
      DownloadPage.Add('https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip', 'maven.zip', '');
    
    // Download Gradle if needed
    if not GradleInstalled then
      DownloadPage.Add('https://services.gradle.org/distributions/gradle-8.5-bin.zip', 'gradle.zip', '');
    
    // Download Rust installer if needed
    if not RustInstalled then
      DownloadPage.Add('https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe', 'rustup-init.exe', '');
    
    // Download CMake if needed
    if not CMakeInstalled then
      DownloadPage.Add('https://github.com/Kitware/CMake/releases/download/v3.28.1/cmake-3.28.1-windows-x86_64.zip', 'cmake.zip', '');
    
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
        Result := True;
      except
        if DownloadPage.AbortedByUser then
          Log('Aborted by user.')
        else
          SuppressibleMsgBox(AddPeriod(GetExceptionMessage), mbCriticalError, MB_OK, IDOK);
        Result := False;
      end;
    finally
      DownloadPage.Hide;
    end;
  end else
    Result := True;
end;

function MavenInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c mvn --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function GradleInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c gradle --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function RustInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c rustc --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function CMakeInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c cmake --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function CppCompilerInstalled: Boolean;
var
  ResultCode: Integer;
begin
  // Check for MSVC
  Result := Exec('cmd.exe', '/c cl 2>nul', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
  // Check for MinGW
  if not Result then
    Result := Exec('cmd.exe', '/c g++ --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

[UninstallDelete]
Type: filesandordirs; Name: "{app}\node_modules"
Type: filesandordirs; Name: "{app}\dist"
Type: filesandordirs; Name: "{app}\logs"