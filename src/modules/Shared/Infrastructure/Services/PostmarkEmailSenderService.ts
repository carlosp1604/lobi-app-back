import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { ServerClient, Errors, TemplatedMessage } from 'postmark'
import { TemplateAlias, TemplateContextMap } from '~/src/modules/Shared/Domain/EmailTemplates'
import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'

export class PostmarkEmailSenderService implements EmailSenderServiceInterface {
  constructor(
    private readonly postmarkClient: ServerClient,
    private readonly senderAddress: string,
    private readonly companyName: string,
    private readonly productName: string,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  /**
   * Sends an email using a pre-defined template
   * @param to The recipient's email address
   * @param templateAlias The alias/ID of the template to use
   * @param context An object containing variables to be injected into the template
   * @param language
   * @param now
   *
   * @returns A promise that resolves when the email is sent (or queued), or rejects on critical failure
   */
  async sendWithTemplate<TAlias extends TemplateAlias>(
    to: string,
    templateAlias: TAlias,
    context: TemplateContextMap[TAlias],
    // TODO: Process input language and add new flags when more languages are supported
    language: string,
    now: Date,
  ): Promise<void> {
    const currentYear = now.getFullYear()

    const message: TemplatedMessage = {
      From: this.senderAddress,
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: {
        ...context,
        product_name: this.productName,
        company_name: this.companyName,
        current_year: currentYear,
      },
    }

    try {
      this.loggerService.log('Attempting to send email with template', {
        recipient: to,
        templateAlias,
      })

      const response = await this.postmarkClient.sendEmailWithTemplate(message)

      this.loggerService.log('Email sent successfully', {
        recipient: to,
        messageId: response.MessageID,
        provider: 'Postmark',
      })
    } catch (error: unknown) {
      const normalizedError = ErrorUtils.normalize(error)

      let errorDetails: Record<string, any> = {
        recipient: to,
        templateAlias,
        provider: 'Postmark',
        error: normalizedError.message,
      }

      if (error instanceof Errors.PostmarkError) {
        errorDetails = {
          ...errorDetails,
          type: 'PostmarkAPIError',
          statusCode: error.statusCode,
          postmarkErrorCode: error.code,
        }
      }

      this.loggerService.error('Failed to send email', normalizedError.stack, errorDetails)
      throw error
    }
  }
}
