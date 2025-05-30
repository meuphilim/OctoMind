# 🔧 Guia de Solução de Problemas - OctoMind

## Problemas Identificados e Soluções

### 1. Badge "REPO OR WORKFLOW NOT FOUND"

**Problema**: O badge do GitHub Actions está mostrando erro.

**Causa**: O arquivo de workflow não está no caminho correto ou o nome está incorreto.

**Solução**:
\`\`\`bash
# Verificar se o arquivo existe
ls -la .github/workflows/update.yml

# Se não existir, criar a estrutura
mkdir -p .github/workflows
\`\`\`

### 2. Placeholders {{ REPO_COUNT }} Não Substituídos

**Problema**: Os badges mostram `{{ REPO_COUNT }}` em vez dos números reais.

**Causa**: O script ainda não foi executado ou falhou.

**Solução**:
\`\`\`bash
# Executar o script manualmente
node scripts/update_catalog.js

# Verificar se há erros
echo $?
\`\`\`

### 3. Token GH_TOKEN Não Configurado

**Problema**: Script falha com erro de autenticação.

**Solução**:
1. Acesse: https://github.com/settings/tokens
2. Crie um novo token com permissões: `repo`, `workflow`
3. Vá para: https://github.com/meuphilim/OctoMind/settings/secrets/actions
4. Adicione secret `GH_TOKEN` com o token criado

### 4. Dependências Não Instaladas

**Problema**: Erro "Cannot find module".

**Solução**:
\`\`\`bash
# Instalar dependências
npm install

# Verificar se foi instalado corretamente
npm list
\`\`\`

### 5. GitHub Actions Não Executa

**Problema**: Workflow não aparece na aba Actions.

**Solução**:
1. Verificar se o arquivo `.github/workflows/update.yml` existe
2. Verificar se o token `GH_TOKEN` está nos secrets
3. Executar manualmente: Actions → "Atualizar Portfólio OctoMind" → "Run workflow"

### 6. Erro de Permissões no Git

**Problema**: `Permission denied` ao fazer push.

**Solução**:
\`\`\`bash
# Verificar remote
git remote -v

# Reconfigurar com token
git remote set-url origin https://TOKEN@github.com/meuphilim/OctoMind.git
\`\`\`

## Comandos de Diagnóstico

\`\`\`bash
# Verificar status do Git
git status

# Verificar configuração do Git
git config --list

# Testar script
node scripts/update_catalog.js

# Verificar dependências
npm list

# Verificar estrutura de arquivos
find . -name "*.yml" -o -name "*.js" -o -name "*.json" | head -20
\`\`\`

## Logs Úteis

### GitHub Actions
- Acesse: https://github.com/meuphilim/OctoMind/actions
- Clique no workflow que falhou
- Verifique os logs de cada step

### Script Local
\`\`\`bash
# Executar com logs detalhados
DEBUG=* node scripts/update_catalog.js
\`\`\`

## Contato para Suporte

Se os problemas persistirem:
1. Abra uma issue em: https://github.com/meuphilim/OctoMind/issues
2. Inclua os logs de erro
3. Descreva os passos que levaram ao problema
