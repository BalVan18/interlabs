export interface Team {
    id: string;
    name: string;
    city?: string;
}

export interface Match {
    id: string;
    home: Team | string;
    away: Team | string;
    score: unknown;
    startsAt: string | null;
    status: string;
}