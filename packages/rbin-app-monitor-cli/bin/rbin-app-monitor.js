#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { cwd, exit } from 'node:process'

const ROOT = cwd()
const WORKFLOW_PATH = '.github/workflows/cypress-e2e.yml'
const NORMALIZER_PATH = 'scripts/rbin-app-monitor/normalize-cypress-json.mjs'
const RUNNER_PATH = 'scripts/rbin-app-monitor/run-cypress-headless.mjs'

function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === '--help' || command === '-h') {
    printHelp()
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
            if curl -fsS "$CYPRESS_BASE_URL/health" > /dev/null || curl -fsS "$CYPRESS_BASE_URL" > /dev/null; then
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
          mkdir -p cypress/reports
          set +e
          ${run} test -- --quiet --reporter json > cypress/reports/output.raw.json
          CYPRESS_EXIT_CODE=$?
          if [ ! -f cypress/reports/output.json ]; then
            node scripts/rbin-app-monitor/normalize-cypress-json.mjs cypress/reports/output.raw.json cypress/reports/output.json
          fi
          exit $CYPRESS_EXIT_CODE

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

const cypressRun = spawnSync(
  cypressBin,
  ['run', '--e2e', '--reporter', 'json'],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  },
)

writeFileSync(rawReportPath, cypressRun.stdout ?? '')

function readJsonFromOutput(path) {
  if (!existsSync(path)) return null

  const raw = readFileSync(path, 'utf8').trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) return null

  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

function normalize(data) {
  const stats = data?.stats ?? data
  const tests = stats?.tests ?? data?.totalTests ?? data?.total ?? 0
  const passes = stats?.passes ?? data?.passes ?? data?.passed ?? 0
  const failures = stats?.failures ?? data?.failures ?? data?.failed ?? 0
  const pending = stats?.pending ?? data?.pending ?? data?.skipped ?? 0
  const duration = stats?.duration ?? data?.duration ?? 0

  return {
    totalTests: tests,
    total: tests,
    passes,
    passed: passes,
    failures,
    failed: failures,
    skipped: pending,
    duration,
    stats: {
      tests,
      passes,
      failures,
      pending,
      duration,
    },
  }
}

const normalized = normalize(readJsonFromOutput(rawReportPath))

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, \`\${JSON.stringify(normalized, null, 2)}\\n\`)

if (cypressRun.error) {
  throw cypressRun.error
}

process.exit(cypressRun.status ?? 1)
`
}

function normalizerTemplate() {
  return `#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

const inputPath = process.argv[2] ?? 'cypress/reports/output.raw.json'
const outputPath = process.argv[3] ?? 'cypress/reports/output.json'

function readJsonFromOutput(path) {
  if (!existsSync(path)) return null

  const raw = readFileSync(path, 'utf8').trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) return null

  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

function normalize(data) {
  const stats = data?.stats ?? data
  const tests = stats?.tests ?? data?.totalTests ?? data?.total ?? 0
  const passes = stats?.passes ?? data?.passes ?? data?.passed ?? 0
  const failures = stats?.failures ?? data?.failures ?? data?.failed ?? 0
  const pending = stats?.pending ?? data?.pending ?? data?.skipped ?? 0
  const duration = stats?.duration ?? data?.duration ?? 0

  return {
    totalTests: tests,
    total: tests,
    passes,
    passed: passes,
    failures,
    failed: failures,
    skipped: pending,
    duration,
    stats: {
      tests,
      passes,
      failures,
      pending,
      duration,
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
