/**
 * OctoMind - Script de Atualização de Catálogo
 * Versão: 2.1.0
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
  "User-Agent": "OctoMind-Portfolio-Bot/2.1.0",
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

    const tableContent = generateRepositoryTable(repos)

    readmeContent = readmeContent.replace(
      /<!-- OCTOMIND_PROJECTS_START -->[\s\S]*?<!-- OCTOMIND_PROJECTS_END -->/,
      `<!-- OCTOMIND_PROJECTS_START -->\n${tableContent}\n<!-- OCTOMIND_PROJECTS_END -->`,
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
 * Gera a seção de repositórios em formato de cards
 */
function generateRepositoryTable(repos) {
  if (repos.length === 0) {
    return `
<div align="center">
  <h3>🔍 Nenhum projeto encontrado</h3>
  <p><em>Os projetos aparecerão aqui assim que forem detectados pelo script.</em></p>
</div>`
  }

  // Agrupar repositórios por linguagem para melhor organização
  const reposByLanguage = repos.reduce((acc, repo) => {
    const lang = repo.language || "Outros"
    if (!acc[lang]) acc[lang] = []
    acc[lang].push(repo)
    return acc
  }, {})

  let content = `
<div align="center">
  <h3>📊 Estatísticas dos Projetos</h3>
  <p>
    <img src="https://img.shields.io/badge/Total_de_Projetos-${repos.length}-blue?style=for-the-badge" alt="Total de Projetos">
    <img src="https://img.shields.io/badge/Linguagens-${Object.keys(reposByLanguage).length}-orange?style=for-the-badge" alt="Linguagens">
  </p>
</div>

---
`

  // Gerar cards para cada repositório
  content += `
<div align="center">
  <h3>🗂️ Projetos por Categoria</h3>
</div>

<table>
  <tr>
    <th width="50%">📋 Projeto</th>
    <th width="25%">🛠️ Tecnologia</th>
    <th width="25%">📅 Atualização</th>
  </tr>`

  for (const repo of repos) {
    const name = sanitizeMarkdown(repo.name)
    const description = repo.description ? sanitizeMarkdown(repo.description) : "*Sem descrição disponível*"
    const lang = repo.language || "N/A"
    const languageDisplay = `${languageEmojis[lang] || languageEmojis.default} ${sanitizeMarkdown(lang)}`

    // Formatar data no formato brasileiro
    const updatedAt = new Date(repo.updated_at).toLocaleDateString("pt-BR")

    // Criar slug para documentação
    const docFileName = `${slugify(name, { lower: true, strict: true })}.md`

    // Gerar badges para tópicos
    const topicsBadges =
      repo.topics && repo.topics.length > 0
        ? repo.topics
            .map(
              (topic) =>
                `<img src="https://img.shields.io/badge/${encodeURIComponent(topic)}-gray?style=flat-square" alt="${topic}">`,
            )
            .join(" ")
        : ""

    // Links adicionais
    const demoLink = repo.homepage ? `<br><a href="${repo.homepage}">🌐 Demo</a>` : ""

    content += `
  <tr>
    <td>
      <div align="left">
        <h4><a href="${repo.html_url}">${name}</a> <a href="./docs/${docFileName}">📄</a></h4>
        <p><em>${description}</em></p>
        ${topicsBadges ? `<p>${topicsBadges}</p>` : ""}
        ${demoLink}
      </div>
    </td>
    <td align="center">
      <strong>${languageDisplay}</strong>
    </td>
    <td align="center">
      <code>${updatedAt}</code>
    </td>
  </tr>`
  }

  content += `
</table>

---

<div align="center">
  <h3>📈 Linguagens Mais Utilizadas</h3>
</div>

<div align="center">
`

  // Gerar estatísticas de linguagens
  const languageStats = Object.entries(reposByLanguage)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5) // Top 5 linguagens

  for (const [language, repoList] of languageStats) {
    const emoji = languageEmojis[language] || languageEmojis.default
    const percentage = Math.round((repoList.length / repos.length) * 100)
    content += `  <img src="https://img.shields.io/badge/${encodeURIComponent(language)}-${repoList.length}_projetos_(${percentage}%25)-${getLanguageColor(language)}?style=for-the-badge&logo=${getLanguageLogo(language)}" alt="${language}">
`
  }

  content += `
</div>

---

<div align="center">
  <h3>🔗 Links Rápidos</h3>
  <p>
    <a href="#sobre-mim">👋 Sobre Mim</a> •
    <a href="#como-funciona">⚙️ Como Funciona</a> •
    <a href="#tecnologias">🛠️ Tecnologias</a> •
    <a href="#contato">📬 Contato</a>
  </p>
</div>`

  return content
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
  return text.replace(/\|/g, "\\|").replace(/\[/g, "\\[").replace(/\]/g, "\\]")
}

/**
 * Gera documentação para cada repositório
 */
async function generateDocumentation(repos) {
  try {
    console.log("📋 Gerando documentação...")

    const modelContent = await fs.readFile(MODEL_PATH, "utf8")

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
