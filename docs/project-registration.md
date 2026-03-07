# Requisitos para cadastro de projeto

Este documento define as informações necessárias para cadastrar um projeto monitorado no RBIN App Monitor e os pré-requisitos que o sistema monitorado deve atender para que health checks e execução remota de testes funcionem de forma confiável.

## Campos obrigatórios de cadastro

### 1. Nome do projeto

- Campo: `name`
- Motivo: é o identificador legível mostrado no dashboard, histórico de execuções, notificações e registros no Firestore.
- Recomendação: use um nome estável, por exemplo `Billing API`, `Customer Portal` ou `Backoffice`.

### 2. URL do frontend

- Campo: `frontHealthCheckUrl`
- Use quando: o projeto monitorado expõe um front público, landing page, SPA ou web app.
- Motivo: o monitor faz uma checagem de disponibilidade pública nessa URL e espera resposta HTTP de sucesso.
- Exemplos: `https://app.example.com`, `https://portal.example.com/login`

### 3. URL de health do backend

- Campo: `backHealthCheckUrl`
- Use quando: o projeto expõe uma API, serviço ou rota de health.
- Motivo: o monitor verifica o backend separadamente do front e registra falhas específicas.
- Exemplos: `https://api.example.com/health`, `https://api.example.com/api/status`

### 4. URL de execução Playwright

- Campo: `playwrightRunUrl`
- Use quando: o projeto pode disparar sua suíte Playwright remotamente e retornar um resultado JSON.
- Motivo: Playwright é o runner padrão para novos projetos monitorados.
- Forma esperada da resposta: `success`, `passed`, `failed`, `skipped`, `totalTests`, `duration`, `specFiles`, `output`, `error`

### 5. Tipo do projeto

- Campo sugerido: `type`
- Valores: `front`, `back`, `fullstack`
- Motivo: define quais URLs são obrigatórias no fluxo de cadastro e como o monitor interpreta campos ausentes.

## Regras mínimas por tipo de projeto

### Projeto frontend

- Obrigatório: `name`, `frontHealthCheckUrl`
- Opcional: `playwrightRunUrl`
- Caso típico: site público, painel admin, SPA.

### Projeto backend

- Obrigatório: `name`, `backHealthCheckUrl`
- Opcional: `playwrightRunUrl`
- Caso típico: API REST, GraphQL, microserviço.

### Projeto fullstack

- Obrigatório: `name` e pelo menos um de `frontHealthCheckUrl` ou `backHealthCheckUrl`
- Recomendado: informar ambas as URLs quando existirem e `playwrightRunUrl` se houver testes E2E.

## Pré-requisitos no projeto monitorado

### Health check

Para o monitor verificar a disponibilidade de forma consistente:

- **Frontend:** URL pública acessível do ambiente do monitor, de preferência retornando HTTP 200, sem login/CAPTCHA/restrição geográfica para a checagem básica.
- **Backend:** endpoint dedicado de health/status (ex.: `/health`, `/ready`, `/api/status`), de preferência HTTP 200 e, idealmente, JSON com status e dependências.

Exemplos de JSON recomendados:

```json
{ "status": "ok" }
```

```json
{
  "status": "ok",
  "database": "up",
  "queue": "up"
}
```

### CORS

- Checagens de frontend geralmente não exigem ajuste de CORS (requisições são server-side no monitor).
- Endpoints de disparo remoto de testes podem precisar permitir origem ou headers do ambiente do monitor.

### Autenticação nas rotas de health

- URLs de health do front costumam ser públicas.
- Rotas de health do back podem ser públicas se retornarem apenas metadados mínimos.
- Se a rota de health do back exigir autenticação, a implementação atual do monitor ainda não injeta credenciais por projeto.
- Recomendação: expor um endpoint leve e não sensível só para monitoramento.

### Pré-requisitos para execução remota de testes

Para suportar `playwrightRunUrl`, o projeto monitorado deve fornecer:

- um endpoint HTTP que inicia a execução dos testes
- resposta JSON com campos de resumo da execução
- ambiente configurado para rodar a suíte sem intervenção
- acesso estável a credenciais, URLs base e fixtures necessários

O monitor não exige agente ou biblioteca instalada dentro do projeto monitorado; precisa apenas de um endpoint remoto acessível controlado pelo projeto.

## Distinção entre projeto frontend e backend

Sim. A distinção deve existir no modelo de cadastro ou no fluxo da UI, pois o comportamento do monitoramento e os campos obrigatórios mudam.

### Comportamento do health check frontend

- O monitor checa uma URL web pública.
- Critério de sucesso: URL acessível e resposta HTTP de sucesso (em geral 200).
- Adequado para: apps públicos, portais, dashboards, sites estáticos.

### Comportamento do health check backend

- O monitor checa um endpoint de API ou health.
- Critério de sucesso: endpoint acessível, resposta HTTP de sucesso e, opcionalmente, JSON com status do serviço.
- Adequado para: APIs, backends com rotas de status.

### Impacto no formulário

Se o produto distinguir o tipo de projeto explicitamente, o formulário pode:

- **front:** destacar `frontHealthCheckUrl`, manter URL do back opcional ou oculta.
- **back:** destacar `backHealthCheckUrl`, manter URL do front opcional ou oculta.
- **fullstack:** mostrar os dois campos e explicar que front e back são monitorados de forma independente.

Isso reduz confusão e evita cadastros em que falta o alvo principal de monitoramento para aquela arquitetura.

## Regras de validação recomendadas no formulário

- Exigir `name`
- Exigir pelo menos um de: `frontHealthCheckUrl`, `backHealthCheckUrl`, `playwrightRunUrl`
- Se `type = front`, exigir `frontHealthCheckUrl`
- Se `type = back`, exigir `backHealthCheckUrl`
- Se `type = fullstack`, exigir pelo menos uma URL de health e recomendar ambas
- Validar todas as URLs como absolutas (http ou https)
