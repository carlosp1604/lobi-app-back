export class UserIpMother {
  public static valid(): string {
    return '8.8.8.8'
  }

  public static invalid(): string {
    return 'invalid-user-ip'
  }

  public static private(): string {
    return '192.168.1.1'
  }

  public static normalized(): string {
    return this.valid()
  }
}
