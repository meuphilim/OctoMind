#!/bin/bash

echo "🧹 Realizando instalação limpa do OctoMind..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

# Remover arquivos Next.js desnecessários
echo "🗑️ Removendo arquivos Next.js desnecessários..."
rm -rf app/
rm -rf .next/
rm -rf public/
rm -rf node_modules/
rm -f package-lock.json
rm -f yarn.lock

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    echo "📥 Por favor, atualize: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar apenas slugify
echo "📦 Instalando apenas a dependência slugify..."
npm install --save slugify --no-package-lock

if [ $? -ne 0 ]; then
    echo "❌ Falha ao instalar slugify"
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p docs
mkdir -p .cache
mkdir -p .github/workflows

# Verificar se modelo.md existe
if [ ! -f "docs/modelo.md" ]; then
    echo "⚠️ Arquivo modelo.md não encontrado, criando um básico..."
    cat > docs/modelo.md << 'EOL'
# {{ PROJECT_NAME }}

---

## 📋 Visão Geral

{{ PROJECT_DESCRIPTION }}

---

## 🛠️ Tecnologias Utilizadas

**Linguagem Principal:** {{ PROJECT_LANGUAGE }}  
**Tópicos/Skills:** {{ PROJECT_TOPICS }}

---

## 🔗 Links

- [📂 Repositório GitHub]({{ PROJECT_URL }})
{{ PROJECT_DEMO_LINK_PLACEHOLDER }}

---

[⬅️ Voltar ao Portfólio Principal](../README.md)
EOL
fi

echo "🧪 Testando script..."
node scripts/update_catalog.js

if [ $? -eq 0 ]; then
    echo "✅ Script executado com sucesso!"
    echo ""
    echo "📋 Dependências instaladas:"
    npm list --depth=0
    echo ""
    echo "🎉 Instalação limpa concluída com sucesso!"
else
    echo "❌ Erro ao executar o script. Verifique os logs acima."
    exit 1
fi
