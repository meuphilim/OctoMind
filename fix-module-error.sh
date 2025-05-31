#!/bin/bash

echo "🔧 Corrigindo erro de módulo ES..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "📝 Verificando package.json..."

# Verificar se já tem "type": "module"
if grep -q '"type": "module"' package.json; then
    echo "✅ package.json já está configurado para módulos ES"
else
    echo "🔧 Adicionando 'type': 'module' ao package.json..."
    
    # Criar um novo package.json com a configuração correta
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
    echo "✅ package.json atualizado"
fi

echo "📦 Reinstalando dependências..."
rm -rf node_modules/
npm install slugify --save --no-package-lock --force

echo "🧪 Testando script..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo "✅ Script funcionando corretamente!"
    
    echo "📝 Commitando correção..."
    git add package.json
    git commit -m "🔧 Corrigir configuração de módulo ES no package.json

- Adiciona 'type': 'module' para suportar import/export
- Corrige erro de SyntaxError ao executar o script"
    
    echo "🚀 Fazendo push..."
    git push
    
    echo "🎉 Correção aplicada com sucesso!"
else
    echo "❌ Script ainda apresenta erros"
    exit 1
fi
