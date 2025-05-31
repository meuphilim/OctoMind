#!/bin/bash

echo "📊 Verificando status do OctoMind..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

echo "📋 Status do repositório local:"
git status --short

echo ""
echo "📊 Últimos commits:"
git log --oneline -5

echo ""
echo "🔍 Verificando arquivos gerados:"

if [ -f "README.md" ]; then
    echo "✅ README.md existe"
    if grep -q "{{ REPO_COUNT }}" README.md; then
        echo "⚠️ README.md ainda contém placeholders - precisa ser atualizado"
    else
        echo "✅ README.md foi processado pelo script"
    fi
else
    echo "❌ README.md não encontrado"
fi

if [ -d "docs" ]; then
    DOC_COUNT=$(find docs -name "*.md" | wc -l)
    echo "✅ Pasta docs existe com $DOC_COUNT arquivos"
else
    echo "❌ Pasta docs não encontrada"
fi

if [ -d ".cache" ]; then
    echo "✅ Cache existe"
    if [ -f ".cache/repo-cache.json" ]; then
        CACHE_SIZE=$(wc -l < .cache/repo-cache.json)
        echo "   Cache contém $CACHE_SIZE linhas"
    fi
else
    echo "⚠️ Cache não existe"
fi

echo ""
echo "🌐 Links importantes:"
echo "   - Repositório: https://github.com/meuphilim/OctoMind"
echo "   - Actions: https://github.com/meuphilim/OctoMind/actions"
echo "   - Settings: https://github.com/meuphilim/OctoMind/settings"
echo "   - GitHub Pages: https://meuphilim.github.io/OctoMind"

echo ""
echo "🔧 Para atualizar as páginas:"
echo "   1. Execute: ./update-now.sh (atualização local + push)"
echo "   2. Execute: ./trigger-github-actions.sh (via GitHub Actions)"
echo "   3. Ou acesse: https://github.com/meuphilim/OctoMind/actions e execute manualmente"
