type ValidateMapKeys<KeyUnion extends string | number | symbol, YourMap extends { [K in KeyUnion]: any }> =
  YourMap extends Record<KeyUnion, any> ? YourMap : never

export type TemplateAlias = 'verify-email-template'

export interface CommonEmailContext {
  product_name: string
  company_name: string
  current_year: number
  lang_es: boolean
}

export interface VerificationEmailContext extends CommonEmailContext {
  is_signup: boolean
  is_password_reset: boolean
  token: string
  expiration_minutes: number
}

export type TemplateContextMap = ValidateMapKeys<
  TemplateAlias,
  {
    'verify-email-template': VerificationEmailContext
  }
>
