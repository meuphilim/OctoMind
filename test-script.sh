#!/bin/bash

echo "🧪 Testando o OctoMind..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale Node.js 18+ primeiro."
    echo "📥 Download: https://nodejs.org/"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    echo "📥 Por favor, atualize: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

# Verificar se fetch está disponível
node -e "console.log(typeof fetch !== 'undefined' ? '✅ Fetch nativo disponível' : '❌ Fetch não disponível')"

echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Falha ao instalar dependências"
    exit 1
fi

echo "🚀 Executando script de atualização..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script executado com sucesso!"
    echo "📝 Verificando arquivos gerados..."
    
    if [ -f "README.md" ]; then
        echo "✅ README.md encontrado"
        # Verificar se os placeholders foram substituídos
        if grep -q "{{ REPO_COUNT }}" README.md; then
            echo "⚠️ Placeholders ainda presentes no README.md"
        else
            echo "✅ Placeholders substituídos no README.md"
        fi
    else
        echo "❌ README.md não encontrado"
    fi
    
    if [ -d "docs" ]; then
        echo "✅ Pasta docs encontrada"
        DOC_COUNT=$(find docs -name "*.md" | wc -l)
        echo "📄 Arquivos de documentação criados: $DOC_COUNT"
    else
        echo "❌ Pasta docs não encontrada"
    fi
    
    if [ -d ".cache" ]; then
        echo "✅ Cache criado"
    else
        echo "⚠️ Cache não criado"
    fi
    
    echo ""
    echo "🎉 Teste concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure o token GH_TOKEN nos secrets do GitHub:"
    echo "   https://github.com/meuphilim/OctoMind/settings/secrets/actions"
    echo "2. Execute o workflow manualmente no GitHub Actions:"
    echo "   https://github.com/meuphilim/OctoMind/actions"
    echo "3. Ative o GitHub Pages nas configurações do repositório:"
    echo "   https://github.com/meuphilim/OctoMind/settings/pages"
    
else
    echo "❌ Erro ao executar o script. Verifique os logs acima."
    echo ""
    echo "🔧 Possíveis soluções:"
    echo "1. Verifique se você tem Node.js 18+ instalado"
    echo "2. Execute: chmod +x fix-dependencies.sh && ./fix-dependencies.sh"
    echo "3. Verifique se há problemas de conectividade com a API do GitHub"
    exit 1
fi
