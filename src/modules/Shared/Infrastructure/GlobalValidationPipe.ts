import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { ValidationError } from 'class-validator'

type ParsedError = {
  message: string
  path: string
}

type GroupedParsedError = Record<string, Array<string>>

function formatErrors(errors: ValidationError[]) {
  const parse = (error: ValidationError, path = error.property): Array<ParsedError> => {
    const messages = error.constraints ? Object.values(error.constraints).map((message) => ({ path, message })) : []
    const kids = (error.children ?? []).flatMap(
      (childrenError): Array<ParsedError> => parse(childrenError, `${path}.${childrenError.property}`),
    )
    return [...messages, ...kids]
  }

  return errors
    .flatMap((error) => parse(error))
    .reduce<GroupedParsedError>((accumulator, currentValue) => {
      if (accumulator[currentValue.path]) {
        accumulator[currentValue.path].push(currentValue.message)
      } else {
        accumulator[currentValue.path] = [currentValue.message]
      }

      return accumulator
    }, {})
}

export const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  validationError: {
    target: false,
    value: false,
  },
  exceptionFactory: (errors: ValidationError[]) => new BadRequestException({ code: 'VALIDATION_ERROR', errors: formatErrors(errors) }),
})
