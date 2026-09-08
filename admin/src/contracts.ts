export type Visibility = 'draft' | 'published';
export type PostStatus = Visibility | 'published_with_draft';

export interface PostInput {
  title: string;
  description: string;
  pubDate: string;
  category: string;
  tags: string[];
  body: string;
}

export interface Post extends PostInput {
  id: string;
  slug: string;
  version: number;
  desiredVisibility: Visibility;
  status: PostStatus;
  updatedAt: string;
  repoPath?: string;
}

export interface ReportResponse {
  source: 'ga4' | 'search-console';
  status: 'ok' | 'unconfigured' | 'unavailable';
  period: { start: string; end: string };
  previousPeriod?: { start: string; end: string };
  timezone?: string;
  fetchedAt?: string;
  stale: boolean;
  totals: Record<string, number>;
  previousTotals?: Record<string, number>;
  rows: Array<Record<string, string | number>>;
  warnings: string[];
}
