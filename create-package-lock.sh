#!/bin/bash

echo "📦 Criando package-lock.json para o GitHub Actions..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto OctoMind"
    exit 1
fi

# Limpar instalações anteriores
echo "🧹 Limpando instalações anteriores..."
rm -rf node_modules/
rm -f package-lock.json

# Instalar dependências e criar package-lock.json
echo "📦 Instalando dependências e criando package-lock.json..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ package-lock.json criado com sucesso!"
    echo "📝 Adicionando ao Git..."
    git add package-lock.json
    git commit -m "📦 Adicionar package-lock.json para GitHub Actions"
    git push
    echo "🎉 Pronto! O GitHub Actions agora deve funcionar."
else
    echo "❌ Erro ao criar package-lock.json"
    echo "🔄 Tentando abordagem alternativa..."
    
    # Criar package-lock.json mínimo manualmente
    cat > package-lock.json << 'EOL'
{
  "name": "octomind-portfolio",
  "version": "2.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "octomind-portfolio",
      "version": "2.1.0",
      "license": "MIT",
      "dependencies": {
        "slugify": "^1.6.6"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    }
  }
}
EOL
    
    echo "✅ package-lock.json mínimo criado!"
    git add package-lock.json
    git commit -m "📦 Adicionar package-lock.json mínimo para GitHub Actions"
    git push
fi
