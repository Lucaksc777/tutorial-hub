Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Iniciando o Sistema TutorialHub (Backend e Frontend)  " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Verifica se o Node.js está instalado. Se não, usa o Winget para instalar.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "`n[1/4] Node.js nao detectado. Baixando e instalando agora... (Pode aparecer um aviso pedindo Permissao de Administrador)" -ForegroundColor Yellow
    winget install OpenJS.NodeJS -e --accept-package-agreements --accept-source-agreements
    
    # Atualiza o PATH da sessão atual para que os comandos npm e node funcionem imediatamente
    $env:Path += ";C:\Program Files\nodejs"
} else {
    Write-Host "`n[1/4] Node.js detectado com sucesso." -ForegroundColor Green
}

# 2. Instala as dependências do projeto contidas no package.json
Write-Host "`n[2/4] Preparando bibliotecas no projeto..." -ForegroundColor Yellow
npm install

# 3. Cria o usuário administrador no Banco de Dados (Email: admin@email.com / Senha: 8090)
Write-Host "`n[3/4] Verificando e criando o usuario Administrador no Banco..." -ForegroundColor Yellow
node createAdmin.js

# 4. Inicia o Servidor Node.js
Write-Host "`n[4/4] Tudo pronto! Iniciando o Servidor..." -ForegroundColor Green
Write-Host "=> O painel pode ser acessado em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "(Para parar o servidor depois, basta fechar esta janela ou apertar CTRL+C)`n" -ForegroundColor Gray

node server.js
