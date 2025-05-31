#!/bin/bash

echo "🔧 Corrigindo configurações do repositório OctoMind..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🔧 Verificando configuração do Git..."
git config user.name || git config user.name "meuphilim"
git config user.email || git config user.email "meuphilim@users.noreply.github.com"

echo "🧪 Testando script de atualização..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo "✅ Script executado com sucesso!"
    
    echo "📝 Commitando correções..."
    git add .
    git commit -m "🔧 Corrigir configurações e dependências do OctoMind"
    
    echo "🚀 Fazendo push das correções..."
    git push
    
    echo "✅ Correções aplicadas com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Verifique se o token GH_TOKEN está configurado nos Secrets do repositório"
    echo "2. Acesse: https://github.com/meuphilim/OctoMind/settings/secrets/actions"
    echo "3. Adicione um novo secret chamado 'GH_TOKEN' com seu Personal Access Token"
    echo "4. Execute manualmente o workflow em: https://github.com/meuphilim/OctoMind/actions"
else
    echo "❌ Erro ao executar o script. Verifique os logs acima."
    exit 1
fi
