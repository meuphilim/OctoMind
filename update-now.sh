#!/bin/bash

echo "🚀 Atualizando páginas do OctoMind agora..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "🔧 Verificando configuração..."

# Verificar se o token está configurado localmente (opcional)
if [ -z "$GH_TOKEN" ]; then
    echo "⚠️ Token GH_TOKEN não encontrado nas variáveis de ambiente locais"
    echo "ℹ️ Isso é normal - o token será usado pelo GitHub Actions"
else
    echo "✅ Token GH_TOKEN encontrado"
fi

echo "📦 Instalando dependências..."
npm install slugify --save --no-package-lock --force

echo "🚀 Executando script de atualização..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo "✅ Script executado com sucesso!"
    
    # Verificar se houve mudanças
    if [[ -n "$(git status --porcelain)" ]]; then
        echo "📝 Mudanças detectadas, fazendo commit..."
        
        git add .
        git commit -m "📊 Atualizar portfólio OctoMind [$(date +'%Y-%m-%d %H:%M')]

- Atualização manual dos dados dos repositórios
- Regeneração da documentação
- Atualização dos badges e estatísticas"
        
        echo "🚀 Fazendo push..."
        git push
        
        if [ $? -eq 0 ]; then
            echo "✅ Atualização concluída com sucesso!"
            echo ""
            echo "🌐 Verifique as mudanças em:"
            echo "   - Repositório: https://github.com/meuphilim/OctoMind"
            echo "   - GitHub Pages: https://meuphilim.github.io/OctoMind"
        else
            echo "❌ Erro no push"
            exit 1
        fi
    else
        echo "ℹ️ Nenhuma mudança detectada - portfólio já está atualizado"
    fi
else
    echo "❌ Erro ao executar o script"
    exit 1
fi

echo ""
echo "📋 Próximos passos opcionais:"
echo "1. Execute o workflow do GitHub Actions para automação futura"
echo "2. Configure GitHub Pages se ainda não estiver ativo"
echo "3. Personalize o README.md com suas informações"
