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
      cypressGithubRepo: project.cypressGithubRepo ?? '',
    }),
    [project.name, project.frontHealthCheckUrl, project.cypressGithubRepo],
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
          cypressGithubRepo: data.cypressGithubRepo ?? null,
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
          Atualize nome, health check e o repositório GitHub preparado para o
          workflow `cypress-e2e.yml`.
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
            placeholder="Ex.: Minha Aplicação"
          />
          <InputText<ProjectFormSchema>
            name="frontHealthCheckUrl"
            control={control}
            label="URL do front"
            placeholder="https://app.exemplo.com"
            type="url"
          />
          <InputText<ProjectFormSchema>
            name="cypressGithubRepo"
            control={control}
            label="Repositório GitHub (Cypress)"
            placeholder="owner/repo — ex: minha-org/meu-repo"
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
