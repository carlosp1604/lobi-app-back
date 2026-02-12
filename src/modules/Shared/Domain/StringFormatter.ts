export class StringFormatter {
  public static formatSafe(input: string, maxLength: number): string {
    if (!input) {
      return ''
    }

    const str = String(input)

    const singleLineString = str.replace(/[\r\n]+/g, ' ')

    if (singleLineString.length > maxLength) {
      return `${singleLineString.substring(0, maxLength)}...[TRUNCATED]`
    }

    return singleLineString
  }
}
