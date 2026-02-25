export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  referenceId: number | null;
  referenceType: string | null;
  read: boolean;
  createdAt: string;
}
