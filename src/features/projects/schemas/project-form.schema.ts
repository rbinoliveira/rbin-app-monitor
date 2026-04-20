import { z } from 'zod'

const optionalGithubRepo = z
  .string()
  .optional()
  .transform((v) => (v === '' || v == null ? undefined : v))
  .refine(
    (v) => {
      if (!v) return true
      const parts = v.split('/')
      return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0
    },
    {
      message: 'Use o formato owner/repo (ex: dramluisabraga/adere-web-admin)',
    },
  )

export const projectFormSchema = z.object({
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  cypressGithubRepo: optionalGithubRepo,
})

export type ProjectFormSchema = z.infer<typeof projectFormSchema>
