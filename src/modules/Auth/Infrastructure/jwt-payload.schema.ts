import { z } from 'zod'

export const JwtPayloadSchema = z.object({
  sub: z.uuid(),
  sid: z.uuid(),
  iat: z.coerce.number().int().nonnegative().nonoptional(),
  exp: z.coerce.number().int().nonnegative().nonoptional(),
})

export type JwtPayload = z.infer<typeof JwtPayloadSchema>
