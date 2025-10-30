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

  const toAddress = 'to@example.com'
  const templateAlias: TemplateAlias = 'verify-email-template'
  const emailContext = {
    token: '123456',
    is_signup: false,
    is_password_reset: true,
    expiration_minutes: 15,
    product_name: 'test-app-name',
    company_name: 'test-company-name',
    current_year: 2025,
    lang_es: true,
  }

  const successResponse = {
    MessageID: 'test-message-id',
    SubmittedAt: new Date().toISOString(),
    To: toAddress,
    ErrorCode: 0,
    Message: 'OK',
  }

  const buildService = () => {
    return new PostmarkEmailSenderService(mockedPostmarkServerClient, senderAddress, mockedLoggerService)
  }

  beforeEach(() => {
    mockReset(mockedLoggerService)
    mockReset(mockedPostmarkServerClient)
  })

  it('should send an email, log attempt and success', async () => {
    const service = buildService()

    mockedPostmarkServerClient.sendEmailWithTemplate.mockResolvedValue(successResponse)

    await service.sendWithTemplate(toAddress, templateAlias, emailContext)

    const expectedMessage = new TemplatedMessage(senderAddress, templateAlias, emailContext, toAddress)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(2)
    expect(mockedLoggerService.error).not.toHaveBeenCalled()
    expect(mockedPostmarkServerClient.sendEmailWithTemplate).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith(`Attempting to send email with template [${templateAlias}] to [${toAddress}]`)
    expect(mockedPostmarkServerClient.sendEmailWithTemplate).toHaveBeenCalledWith(expectedMessage)
    expect(mockedLoggerService.log).toHaveBeenCalledWith(
      `Email sent successfully via Postmark to [${toAddress}], MessageID: ${successResponse.MessageID}`,
    )
  })

  it('should throw error when postmark fails with a PostmarkError', async () => {
    const service = buildService()

    const postmarkError = new Errors.PostmarkError('Test Postmark Error', 406, 422)
    mockedPostmarkServerClient.sendEmailWithTemplate.mockRejectedValue(postmarkError)

    await expect(service.sendWithTemplate(toAddress, templateAlias, emailContext)).rejects.toThrow(postmarkError)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith(`Attempting to send email with template [${templateAlias}] to [${toAddress}]`)
    expect(mockedLoggerService.error).toHaveBeenCalledWith(
      `Postmark API error: ${postmarkError.statusCode} - ${postmarkError.message}`,
      postmarkError.stack,
      expect.objectContaining({
        recipient: toAddress,
        templateAlias: templateAlias,
        statusCode: postmarkError.statusCode,
        postmarkErrorCode: postmarkError.code,
      }),
    )
  })

  it('should throw error when postmark fails with a generic Error', async () => {
    const service = buildService()

    const genericError = new Error('Unexpected error')
    mockedPostmarkServerClient.sendEmailWithTemplate.mockRejectedValue(genericError)

    await expect(service.sendWithTemplate(toAddress, templateAlias, emailContext)).rejects.toThrow(genericError)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith(`Attempting to send email with template [${templateAlias}] to [${toAddress}]`)
    expect(mockedLoggerService.error).toHaveBeenCalledWith(
      `Unexpected error sending email: ${genericError.message}`,
      genericError.stack,
      expect.objectContaining({
        recipient: toAddress,
        templateAlias: templateAlias,
        error: genericError.message,
      }),
    )
  })

  it('should throw error when postmark fails with a non-Error', async () => {
    const service = buildService()

    const unknownError = 'Unexpected error'
    mockedPostmarkServerClient.sendEmailWithTemplate.mockRejectedValue(unknownError)

    await expect(service.sendWithTemplate(toAddress, templateAlias, emailContext)).rejects.toEqual(unknownError)

    expect(mockedLoggerService.log).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)

    expect(mockedLoggerService.log).toHaveBeenCalledWith(`Attempting to send email with template [${templateAlias}] to [${toAddress}]`)
    expect(mockedLoggerService.error).toHaveBeenCalledWith(
      'Failed to send email via Postmark',
      undefined,
      expect.objectContaining({
        recipient: toAddress,
        templateAlias: templateAlias,
        error: unknownError,
      }),
    )
  })
})
