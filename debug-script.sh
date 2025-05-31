#!/bin/bash

echo "🔍 Diagnosticando o script OctoMind..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "📋 Verificando configuração atual..."

# Verificar Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "✅ Node.js: $(node -v)"

# Verificar se fetch está disponível
echo "🔍 Testando fetch nativo..."
node -e "console.log('Fetch disponível:', typeof fetch !== 'undefined')"

# Verificar package.json
echo "📝 Verificando package.json..."
if grep -q '"type": "module"' package.json; then
    echo "✅ Módulos ES configurados"
else
    echo "❌ Módulos ES NÃO configurados"
fi

# Verificar dependências
echo "📦 Verificando dependências..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe"
    if [ -d "node_modules/slugify" ]; then
        echo "✅ slugify instalado"
    else
        echo "❌ slugify NÃO instalado"
    fi
else
    echo "❌ node_modules NÃO existe"
fi

# Verificar estrutura de arquivos
echo "📁 Verificando estrutura..."
echo "Scripts:"
ls -la scripts/ 2>/dev/null || echo "❌ Pasta scripts não encontrada"
echo "Docs:"
ls -la docs/ 2>/dev/null || echo "❌ Pasta docs não encontrada"

# Testar sintaxe do script
echo "🧪 Testando sintaxe do script..."
node --check scripts/update_catalog.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do script OK"
else
    echo "❌ Erro de sintaxe no script"
    exit 1
fi

# Executar com logs detalhados
echo "🚀 Executando script com logs detalhados..."
echo "Comando: node scripts/update_catalog.js"
echo "Saída:"
echo "----------------------------------------"

# Executar e capturar tanto stdout quanto stderr
node scripts/update_catalog.js 2>&1

EXIT_CODE=$?
echo "----------------------------------------"
echo "Código de saída: $EXIT_CODE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Script executou sem erros"
else
    echo "❌ Script falhou com código $EXIT_CODE"
fi

# Verificar se arquivos foram modificados
echo "📝 Verificando mudanças nos arquivos..."
if [[ -n "$(git status --porcelain)" ]]; then
    echo "✅ Arquivos foram modificados:"
    git status --short
else
    echo "⚠️ Nenhum arquivo foi modificado"
fi

# Verificar cache
if [ -f ".cache/repo-cache.json" ]; then
    echo "✅ Cache criado:"
    ls -la .cache/
else
    echo "⚠️ Cache não foi criado"
fi
