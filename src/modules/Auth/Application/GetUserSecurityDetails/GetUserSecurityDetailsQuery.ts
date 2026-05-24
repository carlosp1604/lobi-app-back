export class GetUserSecurityDetailsQuery {
  constructor(
    readonly userId: string,
    readonly currentSessionId: string,
  ) {}
}
