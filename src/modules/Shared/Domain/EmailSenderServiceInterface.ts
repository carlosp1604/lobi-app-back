import { TemplateAlias, TemplateContextMap } from '~/src/modules/Shared/Domain/EmailTemplates'

export interface EmailSenderServiceInterface {
  /**
   * Sends an email using a pre-defined template.
   * @param to The recipient's email address
   * @param templateAlias The alias/ID of the template to use
   * @param context An object containing variables to be injected into the template
   * @returns A promise that resolves when the email is sent (or queued), or rejects on critical failure
   */
  sendWithTemplate<TAlias extends TemplateAlias>(to: string, templateAlias: TAlias, context: TemplateContextMap[TAlias]): Promise<void>
}
