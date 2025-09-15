export interface SeriesListItem {
    title?: string | null;
    url: string;
    image?: string;
    postId?: number;
}
export interface EpisodeItem {
    number?: string | null;
    title?: string | null;
    url: string;
    poster?: string | null;
}
export interface SeasonItem {
    season: number | string;
    label: string;
    nonRegional: boolean;
    regionalLanguageInfo: {
        isNonRegional: boolean;
        isSubbed: boolean;
        isDubbed: boolean;
        languageType: 'dubbed' | 'subbed' | 'unknown';
    };
}
export interface PlayerSourceItem {
    src: string;
    kind: 'iframe' | 'video';
    label?: string | null;
    quality?: string | null;
}
export interface AnimeListResponse {
    page: number;
    items: SeriesListItem[];
}
export interface AnimeDetailsResponse {
    url: string;
    postId: number;
    season: number | null;
    seasons: SeasonItem[];
    episodes: EpisodeItem[];
    poster?: string | null;
    related?: Array<{
        url: string;
        title?: string | null;
        poster?: string | null;
        genres?: string[];
        postId?: number;
    }>;
    smartButtons?: Array<{
        url: string;
        actionText: string;
        episodeText: string;
        buttonClass: string;
    }>;
    genres?: string[];
    year?: number | null;
    totalEpisodes?: number | null;
    duration?: string | null;
    languages?: string[];
    synopsis?: string | null;
    status?: string | null;
    players?: PlayerSourceItem[];
}
export interface UpcomingEpisodesResponse {
    episodes: Array<{
        id: string;
        title: string;
        image: string;
        episode: string;
        countdown: number;
        url: string;
    }>;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=types.d.ts.map