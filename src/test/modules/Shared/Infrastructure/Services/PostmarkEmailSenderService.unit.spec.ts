/* eslint @typescript-eslint/unbound-method: 0 */
import { Errors, ServerClient, TemplatedMessage } from 'postmark'
import { mock, mockReset } from 'jest-mock-extended'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { TemplateAlias } from '~/src/modules/Shared/Domain/EmailTemplates'
import { PostmarkEmailSenderService } from '~/src/modules/Shared/Infrastructure/Services/PostmarkEmailSenderService'

describe('PostmarkEmailSenderService', () => {
  const mockedLoggerService = mock<LoggerServiceInterface>()
  const mockedPostmarkServerClient = mock<ServerClient>()
  const senderAddress = 'sender@example.com'
  const companyName = 'test-company-name'
  const productName = 'test-app-name'
  const language = 'es'
  const now = new Date('2025-09-30T10:38:00Z')

  const toAddress = 'to@example.com'
  const templateAlias: TemplateAlias = 'verify-email-template-create-account'
  const emailContext = {
    token: '123456',
    expiration_minutes: 15,
  }

  const extraContext = {
    company_name: 'test-company-name',
    product_name: 'test-app-name',
    current_year: 2025,
  }

  const successResponse = {
    MessageID: 'test-message-id',
    SubmittedAt: new Date().toISOString(),
    To: toAddress,
    ErrorCode: 0,
    Message: 'OK',
  }

  const buildService = () => {
    return new PostmarkEmailSenderService(mockedPostmarkServerClient, senderAddress, companyName, productName, mockedLoggerService)
  }

  beforeEach(() => {
    mockReset(mockedLoggerService)
    mockReset(mockedPostmarkServerClient)
  })

  it('should send an email, log attempt and success', async () => {
    const service = buildService()

    mockedPostmarkServerClient.sendEmailWithTemplate.mockResolvedValue(successResponse)

    await service.sendWithTemplate(toAddress, templateAlias, emailContext, language, now)

    const expectedMessage = new TemplatedMessage(senderAddress, templateAlias, { ...emailContext, ...extraContext }, toAddress)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(2)
    expect(mockedLoggerService.error).not.toHaveBeenCalled()
    expect(mockedPostmarkServerClient.sendEmailWithTemplate).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith('Attempting to send email with template', {
      templateAlias,
      recipient: toAddress,
    })
    expect(mockedPostmarkServerClient.sendEmailWithTemplate).toHaveBeenCalledWith(expectedMessage)
    expect(mockedLoggerService.log).toHaveBeenCalledWith('Email sent successfully', {
      recipient: toAddress,
      messageId: successResponse.MessageID,
      provider: 'Postmark',
    })
  })

  it('should throw error when postmark fails with a PostmarkError', async () => {
    const service = buildService()

    const postmarkError = new Errors.PostmarkError('Test Postmark Error', 406, 422)
    mockedPostmarkServerClient.sendEmailWithTemplate.mockRejectedValue(postmarkError)

    await expect(service.sendWithTemplate(toAddress, templateAlias, emailContext, language, now)).rejects.toThrow(postmarkError)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith('Attempting to send email with template', {
      templateAlias,
      recipient: toAddress,
    })
    expect(mockedLoggerService.error).toHaveBeenCalledWith('Failed to send email', postmarkError.stack, {
      recipient: toAddress,
      templateAlias: templateAlias,
      statusCode: postmarkError.statusCode,
      postmarkErrorCode: postmarkError.code,
      type: 'PostmarkAPIError',
      provider: 'Postmark',
      error: postmarkError.message,
    })
  })

  it('should throw error when postmark fails with a generic Error', async () => {
    const service = buildService()

    const genericError = new Error('Unexpected error')
    mockedPostmarkServerClient.sendEmailWithTemplate.mockRejectedValue(genericError)

    await expect(service.sendWithTemplate(toAddress, templateAlias, emailContext, language, now)).rejects.toThrow(genericError)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith('Attempting to send email with template', {
      templateAlias,
      recipient: toAddress,
    })
    expect(mockedLoggerService.error).toHaveBeenCalledWith('Failed to send email', genericError.stack, {
      recipient: toAddress,
      templateAlias: templateAlias,
      provider: 'Postmark',
      error: genericError.message,
    })
  })
})
