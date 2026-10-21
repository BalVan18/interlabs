import { Match } from '../types';

export function extractMatches(json: unknown): Match[] {
    if (Array.isArray(json)) return json as Match[];
    if (json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        if (Array.isArray(obj.matches)) return obj.matches as Match[];
        if (Array.isArray(obj.data)) return obj.data as Match[];
        if (Array.isArray(obj.items)) return obj.items as Match[];

        const values = Object.values(obj);
        if (values.length > 0 && values.every((v) => v && typeof v === 'object')) {
            return values as Match[];
        }
    }
    throw new Error('Неожиданный формат данных матчей');
}

export function teamName(t: unknown): string {
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object') {
        const o = t as Record<string, unknown>;
        if (typeof o.name === 'string') return o.name;
        if (typeof o.title === 'string') return o.title;
    }
    return '—';
}

function toNumber(v: unknown): number | null {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        for (const key of ['score', 'total', 'goals', 'value', 'points']) {
            if (typeof o[key] === 'number') return o[key] as number;
        }
    }
    return null;
}

export function scoreParts(
    score: unknown,
): { home: number; away: number } | null {
    if (!score || typeof score !== 'object') return null;
    const s = score as Record<string, unknown>;
    const home =
        toNumber(s.home) ?? toNumber(s.homeScore) ?? toNumber(s.homeTeam);
    const away =
        toNumber(s.away) ?? toNumber(s.awayScore) ?? toNumber(s.awayTeam);
    if (home == null || away == null) return null;
    return { home, away };
}

export function scoreText(score: unknown): string | null {
    const p = scoreParts(score);
    return p ? `${p.home} : ${p.away}` : null;
}

export function formatDate(iso: string | null): string {
    if (!iso) return 'Дата не назначена';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Дата не назначена';
    return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
