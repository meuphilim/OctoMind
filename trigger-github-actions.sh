#!/bin/bash

echo "🤖 Disparando GitHub Actions para atualizar o portfólio..."

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não está instalado"
    echo "📥 Instale em: https://cli.github.com/"
    echo ""
    echo "🔄 Alternativa: Execute manualmente em:"
    echo "   https://github.com/meuphilim/OctoMind/actions/workflows/update.yml"
    echo "   Clique em 'Run workflow' → 'Run workflow'"
    exit 1
fi

echo "🔐 Verificando autenticação..."
if ! gh auth status &> /dev/null; then
    echo "❌ Não autenticado no GitHub CLI"
    echo "🔑 Execute: gh auth login"
    exit 1
fi

echo "✅ Autenticado no GitHub CLI"

echo "🚀 Disparando workflow..."
gh workflow run update.yml

if [ $? -eq 0 ]; then
    echo "✅ Workflow disparado com sucesso!"
    echo ""
    echo "📊 Acompanhe o progresso em:"
    echo "   https://github.com/meuphilim/OctoMind/actions"
    echo ""
    echo "⏱️ O workflow deve completar em 1-2 minutos"
    
    # Aguardar um pouco e mostrar status
    echo "⏳ Aguardando início do workflow..."
    sleep 10
    
    echo "📋 Status atual dos workflows:"
    gh run list --limit 3
else
    echo "❌ Erro ao disparar o workflow"
    echo "🔄 Tente executar manualmente em:"
    echo "   https://github.com/meuphilim/OctoMind/actions/workflows/update.yml"
fi
