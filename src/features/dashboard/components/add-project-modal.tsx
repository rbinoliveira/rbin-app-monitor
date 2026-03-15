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
      cypressGithubRepo: '',
    },
  })

  const onSubmit = async (data: ProjectFormSchema) => {
    try {
      await createProject({
        name: data.name,
        cypressGithubRepo: data.cypressGithubRepo ?? null,
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
          Cadastre o repositório GitHub preparado para o workflow
          `cypress-e2e.yml` e o comando `pnpm test`.
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
            placeholder="Ex.: Minha Aplicação"
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
        <Button type="submit" form="add-project-form" loading={loading}>
          Criar projeto
        </Button>
      </ModalFooter>
    </Modal>
  )
}
