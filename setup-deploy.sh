#!/bin/bash

echo "🚀 Configurando OctoMind para Deploy..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

# Personalizar arquivos com o nome de usuário
read -p "Digite seu nome de usuário do GitHub: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Nome de usuário não pode estar vazio"
    exit 1
fi

echo "🔧 Personalizando arquivos para @$GITHUB_USER..."

# Substituir SEU_USUARIO nos arquivos
find . -type f $$ -name "*.md" -o -name "*.json" -o -name "*.js" -o -name "*.yml" $$ -exec sed -i.bak "s/SEU_USUARIO/$GITHUB_USER/g" {} \;

# Remover arquivos de backup
find . -name "*.bak" -delete

echo "✅ Arquivos personalizados com sucesso!"
echo "📝 Próximos passos:"
echo "   1. Instale as dependências: npm install"
echo "   2. Inicialize o Git: git init"
echo "   3. Adicione os arquivos: git add ."
echo "   4. Faça o primeiro commit: git commit -m 'Initial commit'"
echo "   5. Adicione o remote: git remote add origin https://github.com/$GITHUB_USER/octomind.git"
echo "   6. Faça o push: git push -u origin main"
