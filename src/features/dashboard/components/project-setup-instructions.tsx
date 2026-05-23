'use client'

const cliCommands = [
  {
    label: 'Baixar e rodar direto',
    command: 'npx rbin-app-monitor configure',
  },
  {
    label: 'Instalar globalmente',
    command: 'npm install -g rbin-app-monitor\nrbin-app-monitor configure',
  },
  {
    label: 'Simular antes de alterar arquivos',
    command: 'npx rbin-app-monitor configure --dry-run',
  },
]

export function ProjectSetupInstructions() {
  return (
    <div className="rounded-3xl border border-cyan-300/15 bg-slate-950/40 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-white">
          Preparar o repositório com o CLI
        </p>
        <p className="text-xs leading-5 text-slate-300/80">
          Rode no projeto que será monitorado antes de cadastrar o repositório
          no formato `owner/repo`.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {cliCommands.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
              {item.label}
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-100">
              <code>{item.command}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
