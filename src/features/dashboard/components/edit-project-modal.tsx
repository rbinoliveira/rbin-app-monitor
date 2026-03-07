'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import {
  type ProjectFormSchema,
  projectFormSchema,
} from '@/features/projects/schemas/project-form.schema'
import { useUpdateProjectService } from '@/features/projects/services/update-project.service'
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
import type { Project } from '@/shared/types/project.type'

export interface EditProjectModalProps {
  project: Project
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function EditProjectModal({
  project,
  open,
  onClose,
  onSuccess,
}: EditProjectModalProps) {
  const { addToast } = useToast()
  const { mutateAsync: updateProject, isPending: loading } =
    useUpdateProjectService({
      onSuccess: () => addToast('Projeto atualizado com sucesso', 'success'),
      onError: (err) => addToast(err.message, 'error'),
    })

  const initialForm = useMemo<ProjectFormSchema>(
    () => ({
      name: project.name,
      frontHealthCheckUrl: project.frontHealthCheckUrl ?? '',
      backHealthCheckUrl: project.backHealthCheckUrl ?? '',
      playwrightRunUrl: project.playwrightRunUrl ?? '',
    }),
    [
      project.name,
      project.frontHealthCheckUrl,
      project.backHealthCheckUrl,
      project.playwrightRunUrl,
    ],
  )

  const { control, handleSubmit, reset } = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialForm,
  })

  useEffect(() => {
    if (open) reset(initialForm)
  }, [open, initialForm, reset])

  const onSubmit = async (data: ProjectFormSchema) => {
    try {
      await updateProject({
        projectId: project.id,
        input: {
          name: data.name,
          frontHealthCheckUrl: data.frontHealthCheckUrl ?? null,
          backHealthCheckUrl: data.backHealthCheckUrl ?? null,
          playwrightRunUrl: data.playwrightRunUrl ?? null,
        },
      })
      onClose()
      await onSuccess()
    } catch {
      // onError already shows toast
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Editar aplicação</ModalTitle>
        <p className="mt-1 text-sm text-slate-300/80">
          Atualize nome e URLs desta aplicação monitorada.
        </p>
      </ModalHeader>
      <ModalContent>
        <form
          id="edit-project-form"
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
        </form>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" form="edit-project-form" loading={loading}>
          Salvar alterações
        </Button>
      </ModalFooter>
    </Modal>
  )
}
