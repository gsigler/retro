export class ActionItemUserSummary {
  constructor(
    public id: string,
    public name: string | null,
    public avatarUrl: string | null,
  ) {}

  static from(user: any): ActionItemUserSummary {
    return new ActionItemUserSummary(user.id, user.name, user.avatarUrl)
  }
}

export class ActionItemResponse {
  constructor(
    public id: string,
    public title: string,
    public description: string | null,
    public status: string,
    public position: number,
    public dueDate: Date | null,
    public retroId: string,
    public assignee: ActionItemUserSummary | null,
    public createdBy: ActionItemUserSummary,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static from(item: any): ActionItemResponse {
    return new ActionItemResponse(
      item.id,
      item.title,
      item.description,
      item.status,
      item.position ?? 0,
      item.dueDate,
      item.retroId,
      item.assignee ? ActionItemUserSummary.from(item.assignee) : null,
      ActionItemUserSummary.from(item.createdBy),
      item.createdAt,
      item.updatedAt,
    )
  }
}
