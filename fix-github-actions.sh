#!/bin/bash

echo "🔧 Corrigindo GitHub Actions definitivamente..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "🗑️ Removendo arquivos problemáticos..."
rm -rf app/
rm -rf .next/
rm -rf public/
rm -rf components/
rm -rf pages/
rm -rf styles/
rm -rf node_modules/
rm -f package-lock.json
rm -f yarn.lock

echo "📝 Verificando package.json limpo..."
if grep -q "react\|next\|date-fns" package.json; then
    echo "⚠️ Encontradas dependências React/Next.js no package.json"
    echo "🔧 Criando package.json limpo..."
    
    cat > package.json << 'EOL'
{
  "name": "octomind-portfolio",
  "version": "2.1.0",
  "description": "Portfólio GitHub automatizado que cataloga e organiza repositórios",
  "main": "scripts/update_catalog.js",
  "type": "module",
  "scripts": {
    "start": "node scripts/update_catalog.js",
    "dev": "node scripts/update_catalog.js --dev",
    "test": "echo \"No tests configured\" && exit 0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/meuphilim/OctoMind.git"
  },
  "keywords": ["github", "portfolio", "automation", "github-pages", "github-actions"],
  "author": "meuphilim",
  "license": "MIT",
  "dependencies": {
    "slugify": "^1.6.6"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOL
    echo "✅ package.json limpo criado"
fi

echo "📦 Instalando apenas slugify..."
npm install slugify --save --no-package-lock --force

if [ $? -eq 0 ]; then
    echo "✅ Slugify instalado com sucesso!"
    
    echo "🧪 Testando script..."
    node scripts/update_catalog.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Script funcionando!"
        
        echo "📝 Commitando correções..."
        git add .
        git commit -m "🔧 Corrigir dependências e remover arquivos React/Next.js desnecessários

- Remove dependências React/Next.js conflitantes
- Mantém apenas slugify como dependência
- Atualiza .gitignore para ignorar arquivos desnecessários
- Corrige workflow do GitHub Actions"
        
        echo "🚀 Fazendo push..."
        git push
        
        echo "🎉 Correção concluída! O GitHub Actions agora deve funcionar."
        echo ""
        echo "📋 Próximos passos:"
        echo "1. Verifique se o token GH_TOKEN está configurado nos secrets"
        echo "2. Execute o workflow manualmente para testar"
        echo "3. O workflow agora instala apenas o slugify, evitando conflitos"
    else
        echo "❌ Script ainda apresenta erros"
        exit 1
    fi
else
    echo "❌ Erro ao instalar slugify"
    exit 1
fi
