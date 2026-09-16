export type Collection = {
  id: number;
  name: string;
  translation: string;
  type: 'SYSTEM' | 'USER';
  ownerId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionDTO = Collection;

export type UpdateCollectionDTO = {
  name: string;
  translation?: string;
};
