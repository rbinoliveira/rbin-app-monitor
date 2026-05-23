'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  useDeleteTelegramIntegrationService,
  useGetTelegramIntegrationService,
  useSetTelegramIntegrationService,
} from '@/features/settings/services/telegram-integration.service'
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
import type { UserTelegramCredentialStatus } from '@/shared/types/user-credentials.type'

const schema = z.object({
  botToken: z
    .string()
    .min(20, 'Token muito curto')
    .max(255, 'Token muito longo')
    .refine((value) => value.trim().length > 0, 'Informe o token do bot'),
  chatId: z
    .string()
    .min(3, 'Chat ID muito curto')
    .max(80, 'Chat ID muito longo')
    .refine((value) => value.trim().length > 0, 'Informe o chat ID'),
})

type FormSchema = z.infer<typeof schema>

export interface TelegramIntegrationModalProps {
  open: boolean
  onClose: () => void
  status?: UserTelegramCredentialStatus
}

export function TelegramIntegrationModal({
  open,
  onClose,
  status: statusFromParent,
}: TelegramIntegrationModalProps) {
  const { addToast } = useToast()
  const { data: statusFromQuery, isLoading: statusLoading } =
    useGetTelegramIntegrationService(open && !statusFromParent)
  const status = statusFromParent ?? statusFromQuery

  const { mutateAsync: saveTelegram, isPending: saving } =
    useSetTelegramIntegrationService({
      onSuccess: () => addToast('Integração Telegram salva', 'success'),
      onError: (err) => addToast(err.message, 'error'),
    })

  const { mutateAsync: removeTelegram, isPending: removing } =
    useDeleteTelegramIntegrationService({
      onSuccess: () => addToast('Integração Telegram removida', 'success'),
      onError: (err) => addToast(err.message, 'error'),
    })

  const { control, handleSubmit, reset } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: { botToken: '', chatId: '' },
  })

  const onSubmit = async (data: FormSchema) => {
    await saveTelegram(data)
      .then(() => reset())
      .catch(() => undefined)
  }

  const onRemove = async () => {
    await removeTelegram().catch(() => undefined)
  }

  const formattedUpdatedAt = status?.updatedAt
    ? new Date(status.updatedAt).toLocaleString('pt-BR')
    : null

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Integração Telegram</ModalTitle>
        <ModalDescription>
          Configure seu bot e chat para receber alertas dos seus projetos.
        </ModalDescription>
      </ModalHeader>

      <ModalContent>
        {statusLoading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : (
          <div className="space-y-5">
            {status?.configured ? (
              <div className="glass-surface rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400/75">
                  Bot vinculado
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  @{status.botUsername}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Chat ID {status.chatId}
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
                  Nenhum Telegram vinculado ainda.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/8 px-4 py-3 text-sm text-slate-300/85">
              <p>1. Abra o Telegram e fale com @BotFather.</p>
              <p>2. Use /newbot e copie o token gerado.</p>
              <p>3. Envie uma mensagem para o bot.</p>
              <p>4. Abra https://api.telegram.org/botTOKEN/getUpdates.</p>
              <p>5. Copie o valor de message.chat.id.</p>
            </div>

            {!status?.configured && (
              <form
                id="telegram-integration-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <InputText<FormSchema>
                  name="botToken"
                  control={control}
                  label="Bot token"
                  placeholder="123456789:AA..."
                  type="password"
                />
                <InputText<FormSchema>
                  name="chatId"
                  control={control}
                  label="Chat ID"
                  placeholder="665087399"
                />
                <p className="text-xs text-slate-400/80">
                  O token do bot é cifrado antes de ser persistido.
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
            form="telegram-integration-form"
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
