# Convenções do projeto

## Sufixos de arquivo

Arquivos seguem sufixos conforme o papel no código:

| Papel | Sufixo | Exemplo |
|-------|--------|---------|
| Página / tela (orquestrador de rota) | `.page.tsx` | `dashboard.page.tsx`, `login.page.tsx` |
| Service React Query (useQuery / useMutation) | `.service.tsx` | `get-projects.service.tsx`, `create-project.service.tsx` |
| Função pura de API (sem React) | `.use-case.ts` | `get-projects.use-case.ts` |

- Páginas ficam em `features/[feature]/pages/` e são importadas pelas rotas em `app/`.
- Services ficam em `features/[feature]/services/` e encapsulam chamadas com React Query.
- Use-cases ficam em `features/[feature]/use-cases/` (ou equivalente) e contêm apenas a lógica de chamada à API.

## Idioma

- **Documentação**: em português (pt-BR). README, arquivos em `docs/` e textos voltados a quem lê o repositório devem estar em pt-BR.
- **Código**: sempre em inglês. Nomes de variáveis, funções, componentes, arquivos, tipos e comentários no código devem ser em inglês.
- **Interface do usuário**: em pt-BR. Títulos, botões, labels, placeholders, mensagens de toast, erros e qualquer texto exibido ao usuário (páginas, modais, formulários) devem estar em pt-BR.

### Exemplos

| Onde            | Idioma  | Exemplo                                      |
|----------------|---------|----------------------------------------------|
| README / docs  | pt-BR   | "Como executar os testes", "Variáveis de ambiente" |
| Nome de função | inglês  | `formatExecutionLabel`, `handleSignIn`       |
| Label na tela  | pt-BR   | "Entrar com Google", "Projeto criado com sucesso" |
