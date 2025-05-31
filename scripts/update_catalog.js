/**
 * OctoMind - Script de Atualização de Catálogo
 * Versão: 2.2.0 (Aprimoramentos de Portfólio - Correção de Duplicação)
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import slugify from "slugify"

// Configurações
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, "..")
const README_PATH = path.join(ROOT_DIR, "README.md")
const DOCS_DIR = path.join(ROOT_DIR, "docs")
const MODEL_PATH = path.join(DOCS_DIR, "modelo.md")
const CACHE_DIR = path.join(ROOT_DIR, ".cache")
const CACHE_FILE = path.join(CACHE_DIR, "repo-cache.json")

// Configuração da API do GitHub
const GITHUB_API = "https://api.github.com"
const GITHUB_TOKEN = process.env.GH_TOKEN
const GITHUB_USERNAME = process.env.GITHUB_REPOSITORY?.split("/")[0] || "meuphilim"
const CURRENT_REPO_NAME = process.env.GITHUB_REPOSITORY?.split("/")[1] || "OctoMind"

// Headers para requisições à API do GitHub
const headers = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "OctoMind-Portfolio-Bot/2.2.0",
  ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
}

// Emojis para linguagens de programação
const languageEmojis = {
  JavaScript: "🟨",
  TypeScript: "🔷",
  Python: "🐍",
  Java: "☕",
  "C#": "🟪",
  PHP: "🐘",
  Ruby: "💎",
  Go: "🔵",
  Rust: "🦀",
  Swift: "🔶",
  Kotlin: "🟠",
  HTML: "🌐",
  CSS: "🎨",
  Shell: "🐚",
  "C++": "🔴",
  C: "⚪",
  Dart: "🎯",
  Vue: "🟢",
  React: "⚛️",
  Angular: "🅰️",
  default: "📄",
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log(`🚀 Iniciando OctoMind para @${GITHUB_USERNAME}...`)

    // Verificar se o Node.js suporta fetch nativo
    if (typeof fetch === "undefined") {
      console.error("❌ Este script requer Node.js 18+ com fetch nativo")
      process.exit(1)
    }

    // Criar diretórios necessários
    await createDirectories()

    // Verificar cache e buscar repositórios
    const repos = await fetchRepositories()
    console.log(`📚 Encontrados ${repos.length} repositórios.`)

    // Filtrar repositórios
    const filteredRepos = filterRepositories(repos)
    console.log(`🔍 Processando ${filteredRepos.length} repositórios.`)

    // Atualizar README e gerar documentação em paralelo
    await Promise.all([updateReadme(filteredRepos), generateDocumentation(filteredRepos)])

    console.log("✅ OctoMind concluído com sucesso!")
  } catch (error) {
    console.error("❌ Erro:", error.message)
    console.error("Stack trace:", error.stack)
    process.exit(1)
  }
}

/**
 * Cria os diretórios necessários
 */
async function createDirectories() {
  try {
    await Promise.all([fs.mkdir(DOCS_DIR, { recursive: true }), fs.mkdir(CACHE_DIR, { recursive: true })])
    console.log("📁 Diretórios criados com sucesso")
  } catch (error) {
    console.error("❌ Erro ao criar diretórios:", error.message)
    throw error
  }
}

/**
 * Filtra repositórios
 */
function filterRepositories(repos) {
  return repos.filter(
    (repo) => repo.name.toLowerCase() !== CURRENT_REPO_NAME.toLowerCase() && !repo.archived && !repo.fork,
  )
}

/**
 * Busca repositórios com suporte a cache
 */
async function fetchRepositories() {
  try {
    // Verificar se existe cache e se está atualizado (menos de 1 hora)
    let useCache = false
    try {
      const cacheStats = await fs.stat(CACHE_FILE)
      const cacheAge = Date.now() - cacheStats.mtimeMs
      useCache = cacheAge < 3600000 // 1 hora em milissegundos

      if (useCache) {
        console.log("📋 Cache encontrado e ainda válido")
      }
    } catch (error) {
      console.log("📋 Cache não encontrado ou inválido, buscando dados frescos...")
    }

    // Usar cache se disponível e recente
    if (useCache) {
      console.log("📋 Usando dados em cache...")
      const cacheData = await fs.readFile(CACHE_FILE, "utf8")
      return JSON.parse(cacheData)
    }

    // Buscar dados da API
    const repos = await fetchAllRepositories()

    // Salvar no cache
    await fs.writeFile(CACHE_FILE, JSON.stringify(repos, null, 2))
    console.log("💾 Dados salvos no cache")

    return repos
  } catch (error) {
    console.error("⚠️ Erro ao buscar repositórios:", error.message)

    // Tentar usar cache mesmo que esteja desatualizado em caso de erro
    try {
      const cacheData = await fs.readFile(CACHE_FILE, "utf8")
      console.log("🔄 Usando cache de backup devido a erro na API.")
      return JSON.parse(cacheData)
    } catch (cacheError) {
      console.error("❌ Não foi possível usar cache de backup:", cacheError.message)
      // Se não houver cache, propaga o erro original
      throw error
    }
  }
}

/**
 * Busca todos os repositórios do usuário com paginação
 */
async function fetchAllRepositories() {
  let page = 1
  let allRepos = []
  let hasMorePages = true
  const perPage = 100 // Máximo permitido pela API

  while (hasMorePages) {
    const url = `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?per_page=${perPage}&page=${page}&sort=updated&type=owner`
    console.log(`📥 Buscando página ${page}...`)

    try {
      const response = await fetch(url, { headers })

      // Verificar limites de rate da API
      const rateLimit = response.headers.get("x-ratelimit-remaining")
      const rateLimitReset = response.headers.get("x-ratelimit-reset")

      if (rateLimit) {
        console.log(`📊 Rate limit restante: ${rateLimit}`)
        if (Number.parseInt(rateLimit) < 5) {
          const resetTime = new Date(Number.parseInt(rateLimitReset) * 1000)
          console.warn(`⚠️ Atenção: Apenas ${rateLimit} requisições restantes. Reset em: ${resetTime.toLocaleString()}`)
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Falha ao buscar repositórios: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const repos = await response.json()

      if (repos.length === 0) {
        hasMorePages = false
        console.log("📄 Nenhum repositório adicional encontrado")
      } else {
        allRepos = [...allRepos, ...repos]
        console.log(`📚 Encontrados ${repos.length} repositórios na página ${page}`)
        page++

        // Verificar se provavelmente há mais páginas
        hasMorePages = repos.length === perPage
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${page}:`, error.message)
      // Interromper a paginação em caso de erro
      hasMorePages = false
    }
  }

  console.log(`📊 Total de repositórios encontrados: ${allRepos.length}`)
  return allRepos
}

/**
 * Atualiza o README.md
 */
async function updateReadme(repos) {
  try {
    console.log("📝 Atualizando README.md...")

    let readmeContent = await fs.readFile(README_PATH, "utf8")
    const oldContent = readmeContent

    // Chamar a função que gera o HTML dos cards
    const projectsSectionHtml = generateProjectsSection(repos)

    // Substitui apenas o conteúdo entre as marcações
    readmeContent = readmeContent.replace(
      /<!-- OCTOMIND_PROJECTS_START -->([\s\S]*?)<!-- OCTOMIND_PROJECTS_END -->/g,
      `<!-- OCTOMIND_PROJECTS_START -->\n${projectsSectionHtml}\n<!-- OCTOMIND_PROJECTS_END -->`
    )

    const repoCount = repos.length
    const languages = new Set(repos.map((repo) => repo.language).filter(Boolean))
    const languageCount = languages.size

    readmeContent = readmeContent
      .replace(/\{\{ REPO_COUNT \}\}/g, repoCount.toString())
      .replace(/\{\{ LANGUAGE_COUNT \}\}/g, languageCount.toString())

    // Só escrever se houver mudanças
    if (readmeContent !== oldContent) {
      await fs.writeFile(README_PATH, readmeContent)
      console.log("✅ README.md atualizado com sucesso.")
    } else {
      console.log("📝 README.md sem alterações.")
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar README:", error.message)
    throw error
  }
}

/**
 * Gera a seção de projetos em formato de cards para o README.md
 */
function generateProjectsSection(repos) {
  if (repos.length === 0) {
    return `
<div align="center">
  <h3>🔍 Nenhum projeto encontrado</h3>
  <p><em>Os projetos aparecerão aqui assim que forem detectados pelo script.</em></p>
</div>`;
  }

  // Agrupar repositórios por linguagem para melhor organização
  const reposByLanguage = repos.reduce((acc, repo) => {
    const lang = repo.language || "Outros";
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(repo);
    return acc;
  }, {});

  let content = `
<div align="center">
  <h2>🚀 Meus Projetos</h2>
  <p>Explore alguns dos meus trabalhos e contribuições.</p>
  <p>
    <img src="https://img.shields.io/badge/Total_de_Projetos-${repos.length}-blue?style=for-the-badge" alt="Total de Projetos">
    <img src="https://img.shields.io/badge/Linguagens-${Object.keys(reposByLanguage).length}-orange?style=for-the-badge" alt="Linguagens">
  </p>
</div>

<div class="portfolio-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-top: 30px;">
`;

  // Gerar cards para cada repositório
  for (const repo of repos) {
    const name = sanitizeMarkdown(repo.name);
    const description = repo.description ? sanitizeMarkdown(repo.description) : "Sem descrição disponível.";
    const lang = repo.language || "N/A";
    const languageDisplay = `${languageEmojis[lang] || languageEmojis.default} ${sanitizeMarkdown(lang)}`;
    const updatedAt = new Date(repo.updated_at).toLocaleDateString("pt-BR");
    const docFileName = `${slugify(name, { lower: true, strict: true })}.md`;

    // Gerar badges para tópicos com um pouco de estilo inline
    const topicsBadges =
      repo.topics && repo.topics.length > 0
        ? repo.topics
            .map(
              (topic) =>
                `<span style="display: inline-block; background-color: #e2e6ea; color: #495057; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 5px; margin-bottom: 5px;">${topic}</span>`,
            )
            .join(" ")
        : "";

    // Links adicionais como botões com estilo inline
    const demoLink = repo.homepage
      ? `<a href="${repo.homepage}" style="display: inline-block; background-color: #28a745; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; margin-left: 10px; font-weight: bold;">🌐 Demo</a>`
      : "";

    content += `
  <div class="project-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease-in-out; background-color: #fff;">
    <div style="flex-grow: 1;">
      <h3 style="margin-top: 0; margin-bottom: 10px;"><a href="${repo.html_url}" style="text-decoration: none; color: #007bff;">${name}</a> <a href="./docs/${docFileName}" style="text-decoration: none; color: #6c757d; font-size: 0.9em; margin-left: 5px;">📄 Docs</a></h3>
      <p style="font-size: 0.9em; color: #555; margin-bottom: 15px;">${description}</p>
      ${topicsBadges ? `<div style="margin-bottom: 15px;">${topicsBadges}</div>` : ""}
    </div>
    <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
      <p style="font-weight: bold; color: #333; margin-bottom: 5px;">Tecnologia: ${languageDisplay}</p>
      <p style="font-size: 0.85em; color: #777; margin-bottom: 15px;">Última Atualização: <code>${updatedAt}</code></p>
      <div class="card-actions">
        <a href="${repo.html_url}" style="display: inline-block; background-color: #007bff; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-weight: bold;">View Code</a>
        ${demoLink}
      </div>
    </div>
  </div>`;
  }

  content += `
</div>

<div align="center" style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee;">
  <h3>📈 Linguagens Mais Utilizadas</h3>
  <p>Um panorama das principais tecnologias usadas em meus projetos.</p>
</div>

<div align="center" style="margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
`;

  // Gerar estatísticas de linguagens
  const languageStats = Object.entries(reposByLanguage)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5); // Top 5 linguagens

  for (const [language, repoList] of languageStats) {
    const emoji = languageEmojis[language] || languageEmojis.default;
    const percentage = Math.round((repoList.length / repos.length) * 100);
    content += `  <img src="https://img.shields.io/badge/${encodeURIComponent(language)}-${repoList.length}_projetos_(${percentage}%25)-${getLanguageColor(language)}?style=for-the-badge&logo=${getLanguageLogo(language)}" alt="${language}" style="margin: 5px;">
`;
  }

  content += `
</div>

<div align="center" style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee;">
  <h3>🔗 Links Rápidos</h3>
  <p>
    <a href="#sobre-mim" style="text-decoration: none; color: #007bff; margin: 0 15px; font-weight: bold;">👋 Sobre Mim</a> •
    <a href="#como-funciona" style="text-decoration: none; color: #007bff; margin: 0 15px; font-weight: bold;">⚙️ Como Funciona</a> •
    <a href="#tecnologias" style="text-decoration: none; color: #007bff; margin: 0 15px; font-weight: bold;">🛠️ Tecnologias</a> •
    <a href="#contato" style="text-decoration: none; color: #007bff; margin: 0 15px; font-weight: bold;">📬 Contato</a>
  </p>
</div>`;

  return content;
}

/**
 * Retorna a cor hexadecimal para uma linguagem
 */
function getLanguageColor(language) {
  const colors = {
    JavaScript: "F7DF1E",
    TypeScript: "3178C6",
    Python: "3776AB",
    Java: "ED8B00",
    "C#": "239120",
    PHP: "777BB4",
    Ruby: "CC342D",
    Go: "00ADD8",
    Rust: "000000",
    Swift: "FA7343",
    Kotlin: "0095D5",
    HTML: "E34F26",
    CSS: "1572B6",
    Shell: "89E051",
    "C++": "00599C",
    C: "A8B9CC",
    Dart: "0175C2",
    Vue: "4FC08D",
    React: "61DAFB",
    Angular: "DD0031",
    default: "6C757D",
  }
  return colors[language] || colors.default
}

/**
 * Retorna o logo para uma linguagem
 */
function getLanguageLogo(language) {
  const logos = {
    JavaScript: "javascript",
    TypeScript: "typescript",
    Python: "python",
    Java: "java",
    "C#": "csharp",
    PHP: "php",
    Ruby: "ruby",
    Go: "go",
    Rust: "rust",
    Swift: "swift",
    Kotlin: "kotlin",
    HTML: "html5",
    CSS: "css3",
    Shell: "gnubash",
    "C++": "cplusplus",
    C: "c",
    Dart: "dart",
    Vue: "vue.js",
    React: "react",
    Angular: "angular",
    default: "code",
  }
  return logos[language] || logos.default
}

/**
 * Sanitiza strings para evitar injeção de markdown
 */
function sanitizeMarkdown(text) {
  if (!text) return ""
  // Escape markdown characters that could break inline HTML or markdown parsing
  return text.replace(/\|/g, "\\|").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
}

/**
 * Gera documentação para cada repositório
 */
async function generateDocumentation(repos) {
  try {
    console.log("📋 Gerando documentação...")

    let modelContent = "";
    try {
        modelContent = await fs.readFile(MODEL_PATH, "utf8");
    } catch (readError) {
        console.warn(`⚠️ Aviso: O arquivo de modelo "${MODEL_PATH}" não foi encontrado. A documentação será gerada com um template padrão. Crie este arquivo para personalizar a documentação.`);
        // Fallback para um template padrão se o modelo não existir, usando a estrutura do seu modelo.md atual
        modelContent = `
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

## 📝 Detalhes Técnicos e Aprendizados

_Esta seção pode ser expandida com informações mais detalhadas sobre o projeto:_

### 🎯 Objetivos do Projeto
- _Descreva os principais objetivos e motivações para criar este projeto_
- _Explique qual problema ele resolve ou que necessidade atende_

### 🚧 Desafios Enfrentados
- _Relate os principais desafios técnicos encontrados durante o desenvolvimento_
- _Explique como esses desafios foram superados_

### 🏗️ Arquitetura e Design
- _Descreva as principais decisões de arquitetura_
- _Explique a estrutura do projeto e organização do código_
- _Mencione padrões de design utilizados_

### 📚 Aprendizados
- _Liste as principais tecnologias aprendidas ou aprimoradas_
- _Descreva como este projeto contribuiu para seu crescimento profissional_
- _Mencione boas práticas implementadas_

### 🔮 Próximos Passos
- _Liste melhorias planejadas para o futuro_
- _Mencione funcionalidades que podem ser adicionadas_

---

### 📸 Screenshots e Demonstrações

_Adicione aqui screenshots, GIFs ou diagramas que demonstrem o projeto em funcionamento:_

---

### 🤝 Como Contribuir

Se você tem interesse em contribuir para este projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

---

[⬅️ Voltar ao Portfólio Principal](../README.md)
        `;
    }

    // Processar repositórios em paralelo para melhor performance
    const results = await Promise.allSettled(
      repos.map(async (repo) => {
        const repoSlug = slugify(repo.name, { lower: true, strict: true })
        const docPath = path.join(DOCS_DIR, `${repoSlug}.md`)

        // Verificar se o arquivo já existe e se precisa ser atualizado
        let existingContent = ""
        try {
          existingContent = await fs.readFile(docPath, "utf8")
        } catch (error) {
          // Arquivo não existe, será criado
        }

        let docContent = modelContent
          .replace(/\{\{ PROJECT_NAME \}\}/g, sanitizeMarkdown(repo.name))
          .replace(
            /\{\{ PROJECT_DESCRIPTION \}\}/g,
            repo.description ? sanitizeMarkdown(repo.description) : "*Sem descrição disponível.*",
          )
          .replace(
            /\{\{ PROJECT_LANGUAGE \}\}/g,
            repo.language ? sanitizeMarkdown(repo.language) : "*Não especificado*",
          )
          .replace(/\{\{ PROJECT_URL \}\}/g, repo.html_url)
          .replace(
            /\{\{ PROJECT_TOPICS \}\}/g,
            repo.topics && repo.topics.length > 0
              ? repo.topics.map((topic) => `\`${sanitizeMarkdown(topic)}\``).join(", ")
              : "*Nenhum tópico definido*",
          )

        docContent = docContent.replace(
          /\{\{ PROJECT_DEMO_LINK_PLACEHOLDER \}\}/g,
          repo.homepage ? `- [🌐 Demo](${repo.homepage})` : "",
        )

        // Só escrever se o conteúdo for diferente
        if (docContent !== existingContent) {
          await fs.writeFile(docPath, docContent)
          console.log(`📄 Documentação atualizada para ${repo.name}`)
          return { status: "updated", repo: repo.name }
        } else {
          return { status: "unchanged", repo: repo.name }
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    console.log(`✅ Documentação processada: ${successful} sucessos, ${failed} falhas`)

    if (failed > 0) {
      console.log("❌ Falhas na documentação:")
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.log(`  - ${repos[index].name}: ${result.reason.message}`)
        }
      })
    }
  } catch (error) {
    console.error("❌ Erro ao gerar documentação:", error.message)
    throw error
  }
}

// Executar o script
main()

// Mantenha a função updateCatalog para compatibilidade:
async function updateCatalog() {
  await main()
  return null
}

export default updateCatalog