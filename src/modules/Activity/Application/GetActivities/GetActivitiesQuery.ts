export class GetActivitiesQuery {
  public constructor(
    public readonly userId: string | null,
    public readonly params: Record<string, unknown>,
  ) {}
}
