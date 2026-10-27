export interface Membership {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationInDays: number;
  isActive: boolean;
  createdAt: string;
}

