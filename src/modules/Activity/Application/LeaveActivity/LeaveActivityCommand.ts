export class LeaveActivityCommand {
  constructor(
    public readonly activityId: string,
    public readonly userId: string,
  ) {}
}
