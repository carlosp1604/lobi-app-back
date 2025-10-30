type ValidateMapKeys<KeyUnion extends string | number | symbol, YourMap extends { [K in KeyUnion]: any }> =
  YourMap extends Record<KeyUnion, any> ? YourMap : never

export type TemplateAlias = 'verify-email-template-create-account' | 'verify-email-template-reset-password'

export interface VerificationEmailContext {
  token: string
  expiration_minutes: number
}

export type TemplateContextMap = ValidateMapKeys<
  TemplateAlias,
  {
    'verify-email-template-create-account': VerificationEmailContext
    'verify-email-template-reset-password': VerificationEmailContext
  }
>
