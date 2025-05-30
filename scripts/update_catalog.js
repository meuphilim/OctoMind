/**
 * OctoMind - Script de Atualização de Catálogo
 * Versão: 2.1.0
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import fetch from "node-fetch"
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
const GITHUB_USERNAME = process.env.GITHUB_REPOSITORY?.split("/")[0] || "SEU_USUARIO"
const CURRENT_REPO_NAME = process.env.GITHUB_REPOSITORY?.split("/")[1] || "octomind"

// Headers para requisições à API do GitHub
const headers = {
  Accept: "application/vnd.github.v3+json",
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
    process.exit(1)
  }
}

/**
 * Cria os diretórios necessários
 */
async function createDirectories() {
  await Promise.all([fs.mkdir(DOCS_DIR, { recursive: true }), fs.mkdir(CACHE_DIR, { recursive: true })])
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
    } catch (error) {
      // Cache não existe ou não pode ser lido
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

    return repos
  } catch (error) {
    console.error("⚠️ Erro ao buscar repositórios:", error.message)

    // Tentar usar cache mesmo que esteja desatualizado em caso de erro
    try {
      const cacheData = await fs.readFile(CACHE_FILE, "utf8")
      console.log("🔄 Usando cache de backup devido a erro na API.")
      return JSON.parse(cacheData)
    } catch (cacheError) {
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
      if (rateLimit && Number.parseInt(rateLimit) < 5) {
        console.warn(`⚠️ Atenção: Apenas ${rateLimit} requisições restantes para a API do GitHub.`)
      }

      if (!response.ok) {
        throw new Error(`Falha ao buscar repositórios: ${response.status} ${response.statusText}`)
      }

      const repos = await response.json()

      if (repos.length === 0) {
        hasMorePages = false
      } else {
        allRepos = [...allRepos, ...repos]
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

  return allRepos
}

/**
 * Atualiza o README.md
 */
async function updateReadme(repos) {
  try {
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
      .replace(/{{ REPO_COUNT }}/g, repoCount.toString())
      .replace(/{{ LANGUAGE_COUNT }}/g, languageCount.toString())

    // Só escrever se houver mudanças
    if (readmeContent !== oldContent) {
      await fs.writeFile(README_PATH, readmeContent)
      console.log("📝 README.md atualizado.")
    } else {
      console.log("📝 README.md sem alterações.")
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar README:", error.message)
    throw error
  }
}

/**
 * Gera a tabela de repositórios
 */
function generateRepositoryTable(repos) {
  if (repos.length === 0) {
    return "*Nenhum projeto encontrado.*"
  }

  const table = [
    "| Projeto | Descrição | Linguagem | Última Atualização | Tópicos |",
    "|:--------|:----------|:----------|:-------------------|:--------|",
  ]

  for (const repo of repos) {
    // Sanitizar dados para evitar injeção de markdown
    const name = sanitizeMarkdown(repo.name)
    const description = repo.description ? sanitizeMarkdown(repo.description) : "*Sem descrição*"

    const lang = repo.language || "N/A"
    const languageDisplay = `${languageEmojis[lang] || languageEmojis.default} ${sanitizeMarkdown(lang)}`

    // Formatar data no formato brasileiro
    const updatedAt = new Date(repo.updated_at).toLocaleDateString("pt-BR")

    const topics =
      repo.topics && repo.topics.length > 0
        ? repo.topics.map((topic) => `\`${sanitizeMarkdown(topic)}\``).join(" ")
        : "*Nenhum*"

    const docFileName = `${slugify(name, { lower: true, strict: true })}.md`
    const docLink = `[📄](./docs/${docFileName})`

    table.push(
      `| [${name}](${repo.html_url}) ${docLink} | ${description} | ${languageDisplay} | ${updatedAt} | ${topics} |`,
    )
  }

  return table.join("\n")
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
    const modelContent = await fs.readFile(MODEL_PATH, "utf8")

    // Processar repositórios em paralelo para melhor performance
    await Promise.all(
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
          .replace(/{{ PROJECT_NAME }}/g, sanitizeMarkdown(repo.name))
          .replace(
            /{{ PROJECT_DESCRIPTION }}/g,
            repo.description ? sanitizeMarkdown(repo.description) : "*Sem descrição disponível.*",
          )
          .replace(/{{ PROJECT_LANGUAGE }}/g, repo.language ? sanitizeMarkdown(repo.language) : "*Não especificado*")
          .replace(/{{ PROJECT_URL }}/g, repo.html_url)
          .replace(
            /{{ PROJECT_TOPICS }}/g,
            repo.topics && repo.topics.length > 0
              ? repo.topics.map((topic) => `\`${sanitizeMarkdown(topic)}\``).join(", ")
              : "*Nenhum tópico definido*",
          )

        docContent = docContent.replace(
          /{{ PROJECT_DEMO_LINK_PLACEHOLDER }}/g,
          repo.homepage ? `- [🌐 Demo](${repo.homepage})` : "",
        )

        // Só escrever se o conteúdo for diferente
        if (docContent !== existingContent) {
          await fs.writeFile(docPath, docContent)
          console.log(`📄 Documentação atualizada para ${repo.name}`)
        }
      }),
    )

    console.log("📋 Documentação gerada com sucesso.")
  } catch (error) {
    console.error("❌ Erro ao gerar documentação:", error.message)
    throw error
  }
}

// Executar o script
main()
