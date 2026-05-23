# rbin-app-monitor

CLI para preparar um projeto com Cypress para integração com o RBIN App Monitor.

O comando configura o contrato esperado pelo monitor: workflow `workflow_dispatch`,
execução Cypress headless e artifact `cypress-results` com `output.json`.

## Uso

```bash
npx rbin-app-monitor configure
```

Ou, após instalar globalmente:

```bash
rbin-app-monitor configure
```

## Requisitos no projeto destino

- Node.js 18.18 ou superior
- Cypress já instalado ou configurado
- `package.json` na raiz do projeto
- repositório hospedado no GitHub

## O que o comando faz

- detecta Cypress no projeto atual
- garante scripts `test` e `test:browser` quando eles não existem
- cria `.github/workflows/cypress-e2e.yml`
- cria `scripts/rbin-app-monitor/normalize-cypress-json.mjs`
- cria `scripts/rbin-app-monitor/run-cypress-headless.mjs`
- configura o workflow para gerar artifact `cypress-results` com `output.json`

O workflow roda `workflow_dispatch`, usa uma URL remota quando configurada ou sobe
a aplicação no CI, espera a URL responder e executa Cypress em modo headless.

## URL monitorada

Para rodar contra uma URL publicada, configure a variável do repositório no GitHub:

```text
CYPRESS_PRODUCTION_BASE_URL=https://sua-aplicacao.com
```

Caminho no GitHub:

```text
Settings > Secrets and variables > Actions > Variables
```

Também é possível informar `base_url` manualmente ao disparar o workflow.

Se nenhuma URL remota for configurada, o workflow tenta subir a aplicação localmente
com `pnpm start`, `npm run start` ou `yarn start` e usa `http://127.0.0.1:3000`.

## Opções

```bash
rbin-app-monitor configure --dry-run
```

`--dry-run` mostra o que seria criado sem escrever arquivos.

Por padrão, o comando sobrescreve os arquivos de integração gerados pelo CLI.

## Depois de configurar

No RBIN App Monitor:

- cadastre o projeto com o repositório no formato `owner/repo`
- configure a integração GitHub com um PAT capaz de disparar workflows e ler artifacts
