export type Role = 'sender' | 'receiver';

export type TraceMeta = {
  imageId: string | null;
  localPath?: string | null; // local URI if downloaded or just-sent
  caption?: string | null;
  sentAt?: string | null; // ISO
  viewedAt?: string | null; // ISO when first viewed
  partnerId?: string | null;
  role?: Role | null;
};
