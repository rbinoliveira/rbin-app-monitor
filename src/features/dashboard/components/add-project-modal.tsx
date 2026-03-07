'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  type ProjectFormSchema,
  projectFormSchema,
} from '@/features/projects/schemas/project-form.schema'
import { useCreateProjectService } from '@/features/projects/services/create-project.service'
import { Button } from '@/shared/components/button'
import { InputText } from '@/shared/components/input-text'
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/components/modal'
import { useToast } from '@/shared/components/toast'

export interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function AddProjectModal({
  open,
  onClose,
  onSuccess,
}: AddProjectModalProps) {
  const { addToast } = useToast()
  const { mutateAsync: createProject, isPending: loading } =
    useCreateProjectService({
      onSuccess: () => addToast('Projeto criado com sucesso', 'success'),
      onError: (err) => addToast(err.message, 'error'),
    })

  const { control, handleSubmit, reset } = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      frontHealthCheckUrl: '',
      backHealthCheckUrl: '',
      playwrightRunUrl: '',
      cypressRunUrl: '',
    },
  })

  const onSubmit = async (data: ProjectFormSchema) => {
    try {
      await createProject({
        name: data.name,
        frontHealthCheckUrl: data.frontHealthCheckUrl ?? null,
        backHealthCheckUrl: data.backHealthCheckUrl ?? null,
        playwrightRunUrl: data.playwrightRunUrl ?? null,
        cypressRunUrl: data.cypressRunUrl ?? null,
      })
      reset()
      onClose()
      await onSuccess()
    } catch {
      // onError already shows toast
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Adicionar aplicação monitorada</ModalTitle>
        <p className="mt-1 text-sm text-slate-300/80">
          Cadastre front, back e, se quiser, a URL de disparo remoto de testes
          para um projeto.
        </p>
      </ModalHeader>
      <ModalContent>
        <form
          id="add-project-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <InputText<ProjectFormSchema>
            name="name"
            control={control}
            label="Nome do projeto"
            placeholder="Ex.: API Pagamentos"
          />
          <InputText<ProjectFormSchema>
            name="frontHealthCheckUrl"
            control={control}
            label="URL do front"
            placeholder="https://app.exemplo.com"
            type="url"
          />
          <InputText<ProjectFormSchema>
            name="backHealthCheckUrl"
            control={control}
            label="URL de health do back"
            placeholder="https://api.exemplo.com/health"
            type="url"
          />
          <InputText<ProjectFormSchema>
            name="playwrightRunUrl"
            control={control}
            label="URL de disparo Playwright"
            placeholder="https://ci.exemplo.com/api/playwright/run"
            type="url"
          />
          <InputText<ProjectFormSchema>
            name="cypressRunUrl"
            control={control}
            label="URL de disparo Cypress"
            placeholder="https://ci.exemplo.com/api/cypress/run"
            type="url"
          />
        </form>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" form="add-project-form" loading={loading}>
          Criar projeto
        </Button>
      </ModalFooter>
    </Modal>
  )
}
