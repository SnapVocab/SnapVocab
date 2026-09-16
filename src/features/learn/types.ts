export type Collection = {
  id: number;
  name: string;
  translation: string;
  type: 'SYSTEM' | 'USER';
  ownerId: number | null;
  createdAt: string;
  updatedAt: string;
};
