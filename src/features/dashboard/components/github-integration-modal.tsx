'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  useDeleteGithubIntegrationService,
  useGetGithubIntegrationService,
  useSetGithubIntegrationService,
} from '@/features/settings/services/github-integration.service'
import { Button } from '@/shared/components/button'
import { InputText } from '@/shared/components/input-text'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/components/modal'
import { useToast } from '@/shared/components/toast'
import type { UserGithubCredentialStatus } from '@/shared/types/user-credentials.type'

const schema = z.object({
  token: z
    .string()
    .min(10, 'Token muito curto')
    .max(255, 'Token muito longo')
    .refine((v) => v.trim().length > 0, 'Informe o token'),
})

type FormSchema = z.infer<typeof schema>

export interface GithubIntegrationModalProps {
  open: boolean
  onClose: () => void
  status?: UserGithubCredentialStatus
}

export function GithubIntegrationModal({
  open,
  onClose,
  status: statusFromParent,
}: GithubIntegrationModalProps) {
  const { addToast } = useToast()
  const { data: statusFromQuery, isLoading: statusLoading } =
    useGetGithubIntegrationService(open && !statusFromParent)
  const status = statusFromParent ?? statusFromQuery

  const { mutateAsync: saveToken, isPending: saving } =
    useSetGithubIntegrationService({
      onSuccess: () => addToast('Integração GitHub salva', 'success'),
      onError: (err) => addToast(err.message, 'error'),
    })

  const { mutateAsync: removeToken, isPending: removing } =
    useDeleteGithubIntegrationService({
      onSuccess: () => addToast('Integração GitHub removida', 'success'),
      onError: (err) => addToast(err.message, 'error'),
    })

  const { control, handleSubmit, reset } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: { token: '' },
  })

  const onSubmit = async (data: FormSchema) => {
    await saveToken(data.token)
      .then(() => reset())
      .catch(() => undefined)
  }

  const onRemove = async () => {
    await removeToken().catch(() => undefined)
  }

  const formattedUpdatedAt = status?.updatedAt
    ? new Date(status.updatedAt).toLocaleString('pt-BR')
    : null

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Integração GitHub</ModalTitle>
        <ModalDescription>
          Configure um Fine-grained personal access token para disparar
          workflows e ler artifacts dos repositórios monitorados.
        </ModalDescription>
      </ModalHeader>

      <ModalContent>
        {statusLoading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : (
          <div className="space-y-5">
            {status?.configured ? (
              <div className="glass-surface rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400/75">
                  Conta vinculada
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  @{status.githubUsername}
                </p>
                {formattedUpdatedAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    Atualizado em {formattedUpdatedAt}
                  </p>
                )}
              </div>
            ) : (
              <div className="glass-surface rounded-2xl px-4 py-3">
                <p className="text-sm text-slate-300/80">
                  Nenhuma conta GitHub vinculada ainda.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/8 px-4 py-3 text-sm text-slate-300/85">
              <p>1. Crie um Fine-grained personal access token no GitHub.</p>
              <p>2. Em Repository access, selecione Only select repositories.</p>
              <p>3. Selecione os repositórios monitorados.</p>
              <p>4. Em Actions, escolha Read and write.</p>
              <p>5. Em Artifact metadata, escolha Read-only.</p>
              <p>6. Metadata fica como Read-only obrigatório.</p>
            </div>

            {!status?.configured && (
              <form
                id="github-integration-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <InputText<FormSchema>
                  name="token"
                  control={control}
                  label="Personal Access Token"
                  placeholder="github_pat_xxx"
                  type="password"
                />
                <p className="text-xs text-slate-400/80">
                  O token é cifrado antes de ser persistido.
                </p>
              </form>
            )}
          </div>
        )}
      </ModalContent>

      <ModalFooter>
        {status?.configured && (
          <Button
            variant="danger"
            onClick={onRemove}
            loading={removing}
            disabled={saving}
          >
            Remover
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} disabled={saving || removing}>
          Fechar
        </Button>
        {!status?.configured && (
          <Button
            type="submit"
            form="github-integration-form"
            loading={saving}
            disabled={removing}
          >
            Salvar
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
