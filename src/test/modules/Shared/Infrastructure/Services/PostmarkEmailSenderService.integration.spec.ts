import { PostmarkEmailSenderService } from '~/src/modules/Shared/Infrastructure/Services/PostmarkEmailSenderService'
import { Errors, ServerClient } from 'postmark'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { TemplateAlias } from '~/src/modules/Shared/Domain/EmailTemplates'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'

describe.skip('PostmarkEmailSenderService', () => {
  // TODO: Change email's domain when we get Postmark approval
  const toAddress = 'recipient@cponton.com'
  const blackListedEmail = 'blacklisted@cponton.com' //'test@blacklisted.postmarkapp.com'
  const templateAlias: TemplateAlias = 'verify-email-template-create-account'
  const emailContext = { token: '123456', expiration_minutes: 15 }
  const now = new Date('2025-10-30T14:08:00Z')
  const language = 'es'

  const emailServiceApiKey = env.EMAIL_API_TOKEN
  const productName = env.EMAIL_APP_NAME
  const companyName = env.EMAIL_COMPANY_NAME
  const senderAddress = env.EMAIL_FROM_ADDRESS

  const buildService = () => {
    return new PostmarkEmailSenderService(
      new ServerClient(emailServiceApiKey),
      senderAddress,
      productName,
      companyName,
      new LoggerServiceMock(),
    )
  }

  describe('sendWithTemplate', () => {
    it('should successfully send an email to the test server', async () => {
      const service = buildService()

      await expect(service.sendWithTemplate(toAddress, templateAlias, emailContext, language, now)).resolves.not.toThrow()
    })

    it('should throw error when an email cannot be send', async () => {
      const service = buildService()

      await expect(service.sendWithTemplate(blackListedEmail, templateAlias, emailContext, language, now)).rejects.toThrow(
        Errors.PostmarkError,
      )
    })
  })
})
