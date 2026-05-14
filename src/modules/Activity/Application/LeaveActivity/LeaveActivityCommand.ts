export class LeaveActivityCommand {
  constructor(
    public readonly userId: string,
    public readonly activityId: string,
  ) {}
}
