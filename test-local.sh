#!/bin/bash

echo "🧪 Teste local simplificado do OctoMind..."

# Verificar Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ necessário. Atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) OK"

# Verificar fetch nativo
node -e "console.log(typeof fetch !== 'undefined' ? '✅ Fetch nativo disponível' : '❌ Fetch não disponível')"

# Limpar e instalar apenas slugify
echo "🧹 Limpando e instalando dependências..."
rm -rf node_modules/
npm install slugify --save --no-package-lock --force

# Testar script
echo "🚀 Testando script..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo "✅ Teste local passou!"
    echo "📊 Dependências instaladas:"
    npm list --depth=0
else
    echo "❌ Teste local falhou"
    exit 1
fi
