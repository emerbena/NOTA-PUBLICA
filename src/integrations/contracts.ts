export type Platform = 'telegram' | 'facebook' | 'instagram' | 'threads' | 'x';
export type DeliveryState = 'draft' | 'approved' | 'queued' | 'sent' | 'failed';
export interface DistributionAdapter {
  platform: Platform;
  publish(input: {
    idempotencyKey: string;
    text: string;
    articleUrl: string;
    mediaUrls: string[];
  }): Promise<{ remoteId: string }>;
}
// Sin implementaciones ni tokens: los destinos se conectarán en otra fase.
