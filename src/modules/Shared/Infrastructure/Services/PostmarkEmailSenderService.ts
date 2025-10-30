import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { ServerClient, Errors, TemplatedMessage } from 'postmark'
import { TemplateAlias, TemplateContextMap } from '~/src/modules/Shared/Domain/EmailTemplates'

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
