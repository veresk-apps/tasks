export interface Project {
  name: string;
  id: string;
  topic: string | null;
  owner: "me" | "other" | string;
}