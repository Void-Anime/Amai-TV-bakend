export interface EpisodeItem {
  number?: string | null;
  title?: string | null;
  url: string;
}

export interface SeasonItem {
  season: number | string;
  label: string;
  nonRegional: boolean;
}

export interface AnimeDetailsResponse {
  url: string;
  postId: number;
  season?: number | null;
  seasons: SeasonItem[];
  episodes: EpisodeItem[];
  poster?: string | null;
}

export interface SeriesListItem {
  title: string | null;
  url: string;
  image?: string | null;
  postId?: number;
}

export interface AnimeListResponse {
  page: number;
  items: SeriesListItem[];
}

export interface PlayerSourceItem {
  src: string;
  label?: string | null;
  quality?: string | null;
  kind: "iframe" | "video";
}

