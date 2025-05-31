#!/bin/bash

echo "🔧 Corrigindo dependências do OctoMind..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária para usar fetch nativo. Versão atual: $(node -v)"
    echo "📥 Por favor, atualize o Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado (suporte a fetch nativo)"

# Limpar instalações anteriores
echo "🧹 Limpando instalações anteriores..."
rm -rf node_modules/
rm -f package-lock.json

# Instalar apenas as dependências necessárias
echo "📦 Instalando dependências com --legacy-peer-deps..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Falha ao instalar dependências"
    echo "🔄 Tentando com --force..."
    npm install --force
    
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao instalar dependências mesmo com --force"
        echo "🔄 Tentando instalar apenas slugify..."
        npm install --save slugify --no-package-lock
        
        if [ $? -ne 0 ]; then
            echo "❌ Não foi possível instalar as dependências"
            exit 1
        fi
    fi
fi

echo "🧪 Testando script..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo "✅ Script funcionando corretamente!"
    echo ""
    echo "📋 Dependências instaladas:"
    npm list --depth=0
    echo ""
    echo "🎉 Correção concluída com sucesso!"
else
    echo "❌ Script ainda apresenta erros. Verifique os logs acima."
    exit 1
fi
