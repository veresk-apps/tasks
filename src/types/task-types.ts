
export interface Task {
  text: string;
  completed: boolean;
  id: string;
  projectId: string;
  owner: "me" | "other" | string
}

