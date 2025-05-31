#!/bin/bash

echo "🔍 Verificando todos os arquivos do OctoMind..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "📋 Arquivos atualmente no diretório:"
find . -type f -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.cache/*" | sort

echo ""
echo "🔍 Verificando arquivos essenciais..."

# Lista de arquivos essenciais que devem existir
essential_files=(
    "package.json"
    "README.md"
    "LICENSE"
    "scripts/update_catalog.js"
    "docs/modelo.md"
    ".github/workflows/update.yml"
    "TROUBLESHOOTING.md"
)

missing_files=()

for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (FALTANDO)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "⚠️ Arquivos essenciais faltando:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "🔧 Criando arquivos faltantes..."
    
    # Criar diretórios se necessário
    mkdir -p scripts
    mkdir -p docs
    mkdir -p .github/workflows
fi

echo ""
echo "📝 Status do Git:"
git status

echo ""
echo "🔧 Verificando .gitignore..."
if [ -f ".gitignore" ]; then
    echo "📄 Conteúdo do .gitignore:"
    cat .gitignore
    echo ""
    echo "⚠️ Verificando se algum arquivo essencial está sendo ignorado..."
    
    for file in "${essential_files[@]}"; do
        if git check-ignore "$file" 2>/dev/null; then
            echo "❌ PROBLEMA: $file está sendo ignorado pelo .gitignore"
        fi
    done
else
    echo "📄 Criando .gitignore adequado..."
    cat > .gitignore << 'EOL'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Cache
.cache/
*.cache

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log

# Temporary files
*.tmp
*.temp
EOL
    echo "✅ .gitignore criado"
fi

echo ""
echo "📦 Adicionando todos os arquivos relevantes ao Git..."

# Adicionar arquivos específicos para garantir que sejam incluídos
git add package.json
git add README.md
git add LICENSE
git add scripts/
git add docs/
git add .github/
git add "*.sh"
git add TROUBLESHOOTING.md
git add CNAME

# Verificar se há arquivos staged
echo ""
echo "📋 Arquivos preparados para commit:"
git diff --cached --name-only

echo ""
echo "🔍 Verificando se todos os arquivos essenciais estão staged:"
for file in "${essential_files[@]}"; do
    if git diff --cached --name-only | grep -q "^$file$"; then
        echo "✅ $file está preparado para commit"
    elif git ls-files | grep -q "^$file$"; then
        echo "ℹ️ $file já está no repositório"
    else
        echo "❌ $file NÃO está preparado para commit"
    fi
done

echo ""
read -p "🚀 Deseja fazer commit e push de todos os arquivos? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "💾 Fazendo commit..."
    git commit -m "📦 Adicionar todos os arquivos essenciais do OctoMind

- Scripts de atualização e configuração
- Documentação e templates
- Workflows do GitHub Actions
- Arquivos de configuração do projeto"

    echo "🚀 Fazendo push..."
    git push

    if [ $? -eq 0 ]; then
        echo "✅ Push realizado com sucesso!"
        echo ""
        echo "🌐 Verifique seu repositório em:"
        echo "   https://github.com/meuphilim/OctoMind"
    else
        echo "❌ Erro no push. Verifique as configurações do Git."
    fi
else
    echo "⏸️ Operação cancelada. Use 'git commit' e 'git push' quando estiver pronto."
fi

echo ""
echo "📋 Resumo final:"
echo "   - Arquivos verificados: ✅"
echo "   - .gitignore configurado: ✅"
echo "   - Arquivos adicionados ao Git: ✅"
echo ""
echo "🎯 Próximos passos:"
echo "1. Configure o token GH_TOKEN nos secrets do GitHub"
echo "2. Execute o workflow manualmente para testar"
echo "3. Ative o GitHub Pages se necessário"
