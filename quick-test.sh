#!/bin/bash

echo "🧪 Teste rápido do OctoMind..."

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install slugify --save --no-package-lock --force
fi

# Executar versão debug
echo "🔍 Executando versão debug..."
node scripts/update_catalog_debug.js

echo ""
echo "📋 Resultado do teste:"
if [ $? -eq 0 ]; then
    echo "✅ Script executou com sucesso"
    
    # Verificar se arquivos foram modificados
    if [[ -n "$(git status --porcelain)" ]]; then
        echo "✅ Arquivos foram modificados:"
        git status --short
    else
        echo "⚠️ Nenhum arquivo foi modificado"
    fi
else
    echo "❌ Script falhou"
fi
