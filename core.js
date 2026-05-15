# Serialize Installer - Version 0.1
$installPath = "$env:APPDATA\Serialize"
if (!(Test-Path $installPath)) { New-Item -Path $installPath -ItemType Directory }

# 1. Localiza o Chrome e injeta a Flag no Atalho da Área de Trabalho
$shell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$chromeLnk = Get-ChildItem -Path $desktopPath -Filter "*Chrome*.lnk" | Select-Object -First 1

if ($chromeLnk) {
    $shortcut = $shell.CreateShortcut($chromeLnk.FullName)
    $shortcut.Arguments = "--remote-debugging-port=9222"
    $shortcut.Save()
    Write-Host "Serialize: Flag injetada no atalho do Desktop!" -ForegroundColor Green
}

# 2. Baixa o 'core.js' (Futuro Adblock/Marketplace)
# Invoke-WebRequest -Uri "https://raw.githubusercontent.com/denishark333/serialize.10/main/core.js" -OutFile "$installPath\core.js"

Write-Host "Instalação concluída. Reinicie o Chrome pelo atalho modificado."
