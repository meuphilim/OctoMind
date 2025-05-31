#!/bin/bash

echo "📄 Configurando GitHub Pages para o OctoMind..."

echo "🌐 Para ativar o GitHub Pages:"
echo "1. Acesse: https://github.com/meuphilim/OctoMind/settings/pages"
echo "2. Em 'Source', selecione 'Deploy from a branch'"
echo "3. Em 'Branch', selecione 'main' e '/ (root)'"
echo "4. Clique em 'Save'"
echo ""

# Verificar se gh CLI está disponível
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    echo "🤖 Tentando configurar automaticamente via GitHub CLI..."
    
    # Tentar habilitar GitHub Pages
    gh api repos/meuphilim/OctoMind/pages \
        --method POST \
        --field source.branch=main \
        --field source.path=/ \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ GitHub Pages configurado automaticamente!"
    else
        echo "ℹ️ GitHub Pages pode já estar configurado ou precisa ser feito manualmente"
    fi
    
    # Verificar status atual
    echo "📊 Status atual do GitHub Pages:"
    gh api repos/meuphilim/OctoMind/pages 2>/dev/null | grep -E '"status"|"html_url"' || echo "Ainda não configurado"
else
    echo "ℹ️ Configure manualmente seguindo os passos acima"
fi

echo ""
echo "📝 Após configurar, seu portfólio estará disponível em:"
echo "   https://meuphilim.github.io/OctoMind"
echo ""
echo "⏱️ Pode levar alguns minutos para ficar disponível após a primeira configuração"
