class CreateActivityActivityConfigCommand {
  constructor(
    public readonly capabilities: Record<string, unknown>,
    public readonly specs: Record<string, unknown>,
  ) {}
}

export class CreateActivityCommand {
  constructor(
    public readonly userId: string,
    public readonly sportId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly scheduledDate: Date,
    public readonly config: CreateActivityActivityConfigCommand,
  ) {}
}
