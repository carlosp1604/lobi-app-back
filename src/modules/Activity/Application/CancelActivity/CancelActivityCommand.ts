export class CancelActivityCommand {
  constructor(
    public readonly userId: string,
    public readonly activityId: string,
  ) {}
}
