'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  type ProjectFormSchema,
  projectFormSchema,
} from '@/features/projects/schemas/project-form.schema'
import { useCreateProjectService } from '@/features/projects/services/create-project.service'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/components/ui/Modal'
import { useToast } from '@/shared/components/ui/Toast'

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      frontHealthCheckUrl: '',
      backHealthCheckUrl: '',
      playwrightRunUrl: '',
    },
  })

  const onSubmit = async (data: ProjectFormSchema) => {
    try {
      await createProject({
        name: data.name,
        frontHealthCheckUrl: data.frontHealthCheckUrl ?? null,
        backHealthCheckUrl: data.backHealthCheckUrl ?? null,
        playwrightRunUrl: data.playwrightRunUrl ?? null,
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
          <Input
            label="Nome do projeto"
            placeholder="Ex.: API Pagamentos"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="URL do front"
            placeholder="https://app.exemplo.com"
            type="url"
            {...register('frontHealthCheckUrl')}
            error={errors.frontHealthCheckUrl?.message}
          />
          <Input
            label="URL de health do back"
            placeholder="https://api.exemplo.com/health"
            type="url"
            {...register('backHealthCheckUrl')}
            error={errors.backHealthCheckUrl?.message}
          />
          <Input
            label="URL de disparo Playwright"
            placeholder="https://ci.exemplo.com/api/playwright/run"
            type="url"
            {...register('playwrightRunUrl')}
            error={errors.playwrightRunUrl?.message}
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
