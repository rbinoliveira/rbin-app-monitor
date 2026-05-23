#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { cwd, exit } from 'node:process'

const ROOT = cwd()
const WORKFLOW_PATH = '.github/workflows/cypress-e2e.yml'
const NORMALIZER_PATH = 'scripts/rbin-app-monitor/normalize-cypress-json.mjs'
const RUNNER_PATH = 'scripts/rbin-app-monitor/run-cypress-headless.mjs'
const VERSION = '1.0.4'

function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === '--version' || command === '-v') {
    console.log(VERSION)
    return
  }

  if (command !== 'configure') {
    fail(`Comando desconhecido: ${command}`)
  }

  configure({
    dryRun: args.includes('--dry-run'),
  })
}

function printHelp() {
  console.log(`RBIN App Monitor CLI

Uso:
  rbin-app-monitor configure [--dry-run]
  rbin-app-monitor --version

Opções:
  --dry-run  mostra o que seria criado sem escrever arquivos`)
}

function configure(options) {
  const packageJsonPath = join(ROOT, 'package.json')
  if (!existsSync(packageJsonPath)) {
    fail('package.json não encontrado. Rode o comando na raiz do projeto.')
  }

  const packageJson = readJson(packageJsonPath)
  if (!hasCypress(packageJson)) {
    fail('Cypress não detectado. Instale/configure Cypress antes de rodar este comando.')
  }

  const packageManager = detectPackageManager()
  const scriptsChanged = ensureScripts(packageJson)
  const writes = []

  if (scriptsChanged) {
    writes.push({
      path: 'package.json',
      content: `${JSON.stringify(packageJson, null, 2)}\n`,
    })
  }

  writes.push({
    path: NORMALIZER_PATH,
    content: normalizerTemplate(),
  })

  writes.push({
    path: RUNNER_PATH,
    content: runnerTemplate(),
  })

  writes.push({
    path: WORKFLOW_PATH,
    content: workflowTemplate({
      packageManager,
      buildScript: Boolean(packageJson.scripts?.build),
      startScript: packageJson.scripts?.start ? 'start' : 'dev',
    }),
  })

  const created = []

  for (const write of writes) {
    const absolutePath = join(ROOT, write.path)
    const exists = existsSync(absolutePath)

    if (!options.dryRun) {
      mkdirSync(dirname(absolutePath), { recursive: true })
      writeFileSync(absolutePath, write.content)
    }

    created.push(exists ? `${write.path} (atualizado)` : write.path)
  }

  printSummary({ created, dryRun: options.dryRun })
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`Não foi possível ler ${path}: ${error.message}`)
  }
}

function hasCypress(packageJson) {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  return Boolean(
    dependencies.cypress ||
      existsSync(join(ROOT, 'cypress.config.ts')) ||
      existsSync(join(ROOT, 'cypress.config.js')) ||
      existsSync(join(ROOT, 'cypress')),
  )
}

function ensureScripts(packageJson) {
  packageJson.scripts = packageJson.scripts ?? {}
  let changed = false

  if (!packageJson.scripts.test) {
    packageJson.scripts.test = `node ${RUNNER_PATH}`
    changed = true
  }

  if (!packageJson.scripts['test:browser']) {
    packageJson.scripts['test:browser'] =
      packageJson.scripts['cypress:open'] ??
      packageJson.scripts['cy:open'] ??
      'cypress open'
    changed = true
  }

  return changed
}

function detectPackageManager() {
  if (existsSync(join(ROOT, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(ROOT, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(ROOT, 'package-lock.json'))) return 'npm'
  return 'npm'
}

function workflowTemplate({ packageManager, buildScript, startScript }) {
  const install = {
    pnpm: 'pnpm install --frozen-lockfile',
    yarn: 'yarn install --frozen-lockfile',
    npm: 'npm ci',
  }[packageManager]

  const run = {
    pnpm: 'pnpm',
    yarn: 'yarn',
    npm: 'npm run',
  }[packageManager]

  const setupPackageManager =
    packageManager === 'pnpm'
      ? `
      - name: Setup pnpm
        uses: pnpm/action-setup@v4`
      : ''

  const buildStep = buildScript
    ? `
      - name: Build application
        run: ${run} build`
    : ''

  return `name: Cypress E2E

on:
  workflow_dispatch:
    inputs:
      base_url:
        description: Base URL override for Cypress
        required: false
        type: string

jobs:
  cypress-e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      RBIN_EXTERNAL_BASE_URL: \${{ inputs.base_url || vars.CYPRESS_PRODUCTION_BASE_URL }}
      CYPRESS_BASE_URL: \${{ inputs.base_url || vars.CYPRESS_PRODUCTION_BASE_URL || 'http://127.0.0.1:3000' }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4${setupPackageManager}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: ${packageManager}

      - name: Install dependencies
        run: ${install}${buildStep}

      - name: Start application
        run: |
          if [ -n "$RBIN_EXTERNAL_BASE_URL" ]; then
            echo "Using external base URL: $RBIN_EXTERNAL_BASE_URL"
            exit 0
          fi
          ${run} ${startScript} > .rbin-app-monitor-server.log 2>&1 &

      - name: Wait for base URL
        run: |
          for i in {1..60}; do
            if [ -n "$RBIN_EXTERNAL_BASE_URL" ]; then
              curl -fsS "$CYPRESS_BASE_URL" > /dev/null && exit 0
            elif curl -fsS "$CYPRESS_BASE_URL/health" > /dev/null || curl -fsS "$CYPRESS_BASE_URL" > /dev/null; then
              exit 0
            fi
            sleep 2
          done
          echo "Base URL did not become ready in time: $CYPRESS_BASE_URL"
          exit 1

      - name: Run Cypress
        id: cypress
        shell: bash
        run: |
          node scripts/rbin-app-monitor/run-cypress-headless.mjs

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-results
          path: cypress/reports/output.json
          if-no-files-found: ignore
          retention-days: 7

      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-screenshots
          path: cypress/screenshots
          if-no-files-found: ignore
          retention-days: 7

      - name: Upload server log
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: rbin-app-monitor-server-log
          path: .rbin-app-monitor-server.log
`
}

function runnerTemplate() {
  return `#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const reportDir = 'cypress/reports'
const rawReportPath = join(reportDir, 'output.raw.json')
const outputPath = join(reportDir, 'output.json')
const cypressBin = process.platform === 'win32'
  ? join('node_modules', '.bin', 'cypress.cmd')
  : join('node_modules', '.bin', 'cypress')

rmSync(reportDir, { force: true, recursive: true })
mkdirSync(reportDir, { recursive: true })

if (!existsSync(cypressBin)) {
  const message = \`Cypress binary not found at \${cypressBin}. Run the dependency install step before this script.\`
  const normalized = normalize(null, message)

  writeFileSync(rawReportPath, '')
  writeFileSync(outputPath, \`\${JSON.stringify(normalized, null, 2)}\\n\`)

  console.error(message)
  console.log('RBIN App Monitor Cypress result:')
  console.log(JSON.stringify(normalized, null, 2))

  process.exit(1)
}

const cypressRun = spawnSync(
  cypressBin,
  ['run', '--e2e', '--reporter', 'json'],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

const rawOutput = \`\${cypressRun.stdout ?? ''}\${cypressRun.stderr ?? ''}\`

writeFileSync(rawReportPath, rawOutput)

function readJsonReportsFromText(rawText) {
  const reports = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let index = 0; index < rawText.length; index += 1) {
    const char = rawText[index]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\\\') {
        escaped = true
        continue
      }

      if (char === '"' && !escaped) inString = false
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
      continue
    }

    if (char !== '}' || depth === 0) continue

    depth -= 1

    if (depth !== 0 || start === -1) continue

    try {
      const parsed = JSON.parse(rawText.slice(start, index + 1))
      if (parsed?.stats) reports.push(parsed)
    } catch {
      start = -1
      continue
    }

    start = -1
  }

  return reports
}

function readJsonFromOutput(path) {
  if (!existsSync(path)) return []

  return readJsonReportsFromText(readFileSync(path, 'utf8'))
}

function normalize(reports, error) {
  const list = Array.isArray(reports) ? reports : [reports].filter(Boolean)
  const totals = list.reduce(
    (acc, report) => {
      const stats = report?.stats ?? report

      acc.tests += stats?.tests ?? report?.totalTests ?? report?.total ?? 0
      acc.passes += stats?.passes ?? report?.passes ?? report?.passed ?? 0
      acc.failures +=
        stats?.failures ?? report?.failures ?? report?.failed ?? 0
      acc.pending += stats?.pending ?? report?.pending ?? report?.skipped ?? 0
      acc.duration += stats?.duration ?? report?.duration ?? 0

      return acc
    },
    {
      tests: 0,
      passes: 0,
      failures: 0,
      pending: 0,
      duration: 0,
    },
  )

  const normalized = {
    totalTests: totals.tests,
    total: totals.tests,
    passes: totals.passes,
    passed: totals.passes,
    failures: totals.failures,
    failed: totals.failures,
    skipped: totals.pending,
    duration: totals.duration,
    stats: {
      tests: totals.tests,
      passes: totals.passes,
      failures: totals.failures,
      pending: totals.pending,
      duration: totals.duration,
    },
  }

  if (error) {
    normalized.error = error
  }

  return normalized
}

const stdoutReports = readJsonReportsFromText(cypressRun.stdout ?? '')
const parsed =
  stdoutReports.length > 0 ? stdoutReports : readJsonFromOutput(rawReportPath)
const parseError =
  parsed.length === 0 && (rawOutput.trim() || cypressRun.error)
    ? 'Cypress did not produce a valid JSON report. See output.raw.json or the workflow log for details.'
    : undefined
const normalized = normalize(
  parsed,
  cypressRun.error instanceof Error ? cypressRun.error.message : parseError,
)

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, \`\${JSON.stringify(normalized, null, 2)}\\n\`)

if (cypressRun.stderr) {
  console.error(cypressRun.stderr)
}

if (parseError) {
  console.error(parseError)
}

console.log('RBIN App Monitor Cypress result:')
console.log(JSON.stringify(normalized, null, 2))

if (cypressRun.error) {
  throw cypressRun.error
}

process.exit(parseError ? 1 : (cypressRun.status ?? 1))
`
}

function normalizerTemplate() {
  return `#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

const inputPath = process.argv[2] ?? 'cypress/reports/output.raw.json'
const outputPath = process.argv[3] ?? 'cypress/reports/output.json'

function readJsonReportsFromText(rawText) {
  const reports = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let index = 0; index < rawText.length; index += 1) {
    const char = rawText[index]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\\\') {
        escaped = true
        continue
      }

      if (char === '"' && !escaped) inString = false
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
      continue
    }

    if (char !== '}' || depth === 0) continue

    depth -= 1

    if (depth !== 0 || start === -1) continue

    try {
      const parsed = JSON.parse(rawText.slice(start, index + 1))
      if (parsed?.stats) reports.push(parsed)
    } catch {
      start = -1
      continue
    }

    start = -1
  }

  return reports
}

function readJsonFromOutput(path) {
  if (!existsSync(path)) return []

  return readJsonReportsFromText(readFileSync(path, 'utf8'))
}

function normalize(reports) {
  const list = Array.isArray(reports) ? reports : [reports].filter(Boolean)
  const totals = list.reduce(
    (acc, report) => {
      const stats = report?.stats ?? report

      acc.tests += stats?.tests ?? report?.totalTests ?? report?.total ?? 0
      acc.passes += stats?.passes ?? report?.passes ?? report?.passed ?? 0
      acc.failures +=
        stats?.failures ?? report?.failures ?? report?.failed ?? 0
      acc.pending += stats?.pending ?? report?.pending ?? report?.skipped ?? 0
      acc.duration += stats?.duration ?? report?.duration ?? 0

      return acc
    },
    {
      tests: 0,
      passes: 0,
      failures: 0,
      pending: 0,
      duration: 0,
    },
  )

  return {
    totalTests: totals.tests,
    total: totals.tests,
    passes: totals.passes,
    passed: totals.passes,
    failures: totals.failures,
    failed: totals.failures,
    skipped: totals.pending,
    duration: totals.duration,
    stats: {
      tests: totals.tests,
      passes: totals.passes,
      failures: totals.failures,
      pending: totals.pending,
      duration: totals.duration,
    },
  }
}

const parsed = readJsonFromOutput(inputPath)
const normalized = normalize(parsed)

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, \`\${JSON.stringify(normalized, null, 2)}\\n\`)
`
}

function printSummary({ created, dryRun }) {
  if (dryRun) {
    console.log('Dry run concluído. Arquivos que seriam escritos:')
  } else {
    console.log('Projeto configurado para o RBIN App Monitor.')
  }

  for (const path of created) {
    console.log(`- ${path}`)
  }

  console.log('\nContrato gerado:')
  console.log('- comando headless: pnpm test / npm run test / yarn test')
  console.log('- comando browser: pnpm test:browser / npm run test:browser / yarn test:browser')
  console.log('- workflow: .github/workflows/cypress-e2e.yml')
  console.log('- artifact: cypress-results contendo output.json')
  console.log('- base URL remota opcional: input base_url ou variável CYPRESS_PRODUCTION_BASE_URL')
}

function fail(message) {
  console.error(`Erro: ${message}`)
  exit(1)
}

main()
