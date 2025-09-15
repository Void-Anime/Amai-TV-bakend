import { AnimeDetailsResponse, AnimeListResponse, EpisodeItem, SeasonItem, SeriesListItem } from './types';
export declare function extractNonceFromHtml(html: string): string | null;
export declare function extractPostIdFromHtml(html: string): number | null;
export declare function parseEpisodesFromHtml(html: string): EpisodeItem[];
export declare function parseSeasonsFromHtml(html: string): SeasonItem[];
export declare function parseAnimeListFromHtml(html: string): SeriesListItem[];
export declare function fetchAnimeList(page: number): Promise<AnimeListResponse>;
export declare function parsePosterFromHtml(html: string, baseUrl: string): string | null;
export declare function fetchAnimeDetails(params: {
    url: string;
    postId: number;
    season?: number | null;
}): Promise<AnimeDetailsResponse>;
export declare function fetchEpisodePlayers(episodeUrl: string): Promise<{
    src: string;
    label?: string | null;
    quality?: string | null;
    kind: "iframe" | "video";
}[]>;
export declare function enrichSeriesPosters(items: SeriesListItem[]): Promise<SeriesListItem[]>;
export declare function fetchMoviesList(page: number, query?: string): Promise<AnimeListResponse>;
export declare function fetchMovieDetails(url: string): Promise<AnimeDetailsResponse>;
export declare function fetchCartoonList(page?: number, query?: string): Promise<AnimeListResponse>;
export declare function fetchNetworkContent(networkSlug: string, page?: number, query?: string): Promise<AnimeListResponse>;
export declare function fetchOngoingSeries(page?: number, query?: string): Promise<AnimeListResponse>;
export declare function fetchUpcomingEpisodes(): Promise<{
    episodes: Array<{
        id: string;
        title: string;
        image: string;
        episode: string;
        countdown: number;
        url: string;
    }>;
}>;
//# sourceMappingURL=scraper.d.ts.map