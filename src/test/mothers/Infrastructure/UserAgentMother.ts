export class UserAgentMother {
  static valid(): string {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LobiTestRunner/1.0'
  }

  static invalid(): string {
    return 'Mozilla/5.0 😊'
  }
}
