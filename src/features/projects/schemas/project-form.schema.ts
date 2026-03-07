import { z } from 'zod'

const optionalUrl = z
  .union([z.literal(''), z.string().url()])
  .optional()
  .transform((v) => (v === '' || v == null ? undefined : v))

export const projectFormSchema = z.object({
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  frontHealthCheckUrl: optionalUrl,
  backHealthCheckUrl: optionalUrl,
  playwrightRunUrl: optionalUrl,
  cypressRunUrl: optionalUrl,
})

export type ProjectFormSchema = z.infer<typeof projectFormSchema>
