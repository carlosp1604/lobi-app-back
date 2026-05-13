export class GetActivityQuery {
  constructor(
    public readonly activityId: string,
    public readonly userId: string | null,
  ) {}
}
