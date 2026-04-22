export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueSeverity = "MINOR" | "MAJOR" | "BLOCKER";

export interface IssueDTO {
  _id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  severity: IssueSeverity;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}
  
export {};
