export class JoinActivityCommand {
  constructor(
    public readonly userId: string,
    public readonly activityId: string,
  ) {}
}
