import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { ConfigService } from '@nestjs/config'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { ServerClient, Errors, TemplatedMessage } from 'postmark'
import { TemplateAlias, TemplateContextMap } from '~/src/modules/Shared/Domain/EmailTemplates'

export class PostmarkEmailSenderService implements EmailSenderServiceInterface {
  private readonly postmarkClient: ServerClient
  private readonly senderAddress: string

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly loggerService: LoggerServiceInterface,
  ) {
    const postmarkApiToken = this.configService.get('EMAIL_API_TOKEN', { infer: true })
    this.senderAddress = this.configService.get('EMAIL_FROM_ADDRESS', { infer: true })
    this.postmarkClient = new ServerClient(postmarkApiToken)
  }

  /**
   * Sends an email using a pre-defined template
   *
   * @param to The recipient's email address
   * @param templateAlias The alias/ID of the template to use
   * @param context An object containing variables to be injected into the template
   * @returns A promise that resolves when the email is sent (or queued), or rejects on critical failure
   */
  async sendWithTemplate<TAlias extends TemplateAlias>(
    to: string,
    templateAlias: TAlias,
    context: TemplateContextMap[TAlias],
  ): Promise<void> {
    const message: TemplatedMessage = {
      From: this.senderAddress,
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: context,
    }

    try {
      this.loggerService.log(`Attempting to send email with template [${templateAlias}] to [${to}]`)

      const response = await this.postmarkClient.sendEmailWithTemplate(message)

      this.loggerService.log(`Email sent successfully via Postmark to [${to}], MessageID: ${response.MessageID}`)
    } catch (error: unknown) {
      let errorMessage = 'Failed to send email via Postmark'
      let errorDetails: Record<string, any> = { recipient: to, templateAlias }

      if (error instanceof Errors.PostmarkError) {
        errorMessage = `Postmark API error: ${error.statusCode} - ${error.message}`

        errorDetails = {
          ...errorDetails,
          statusCode: error.statusCode,
          postmarkErrorCode: error.code,
          originalError: error,
        }

        this.loggerService.error(errorMessage, error.stack, errorDetails)
      } else if (error instanceof Error) {
        errorMessage = `Unexpected error sending email: ${error.message}`
        errorDetails.error = error.message
        this.loggerService.error(errorMessage, error.stack, errorDetails)
      } else {
        errorDetails.error = String(error)
        this.loggerService.error(errorMessage, undefined, errorDetails)
      }

      throw error
    }
  }
}
