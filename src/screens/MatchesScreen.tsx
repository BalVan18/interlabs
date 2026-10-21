import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MATCHES_URL } from '../config';
import { Match } from '../types';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { extractMatches, formatDate, scoreParts, teamName } from '../utils/matches';

type Filter = 'all' | 'upcoming' | 'finished';

const PALETTE = {
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  error: '#DC2626',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Запланирован',
  finished: 'Завершён',
  live: 'В эфире',
  postponed: 'Отложен',
};

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  scheduled: { bg: '#EEF2FF', fg: '#4F46E5' },
  live: { bg: '#FEF2F2', fg: '#DC2626' },
  finished: { bg: '#F0FDF4', fg: '#16A34A' },
  postponed: { bg: '#FFF7ED', fg: '#EA580C' },
};

function matchesFilter(match: Match, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'upcoming')
    return ['scheduled', 'postponed', 'live'].includes(match.status);
  return match.status === 'finished';
}

async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(MATCHES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  return extractMatches(json);
}

function FadeInCard({
                      index,
                      children,
                    }: {
  index: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = Math.min(index, 8) * 40;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index]);

  return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {children}
      </Animated.View>
  );
}

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.liveDot, { opacity }]} />;
}

export function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchMatches();

      setMatches(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => load(true);

  if (loading && matches.length === 0) {
    return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.muted}>Загрузка матчей…</Text>
        </View>
    );
  }

  if (error && matches.length === 0) {
    return (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Не удалось загрузить матчи</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable
              onPress={() => load()}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
          >
            <Text style={styles.primaryBtnText}>Повторить</Text>
          </Pressable>
        </View>
    );
  }

  const filtered = matches.filter((m) => matchesFilter(m, filter));

  return (
      <View style={styles.root}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>Матчи тура</Text>
                {lastUpdated && (
                    <View style={styles.updatedRow}>
                      <UpdatedAgo since={lastUpdated} />
                    </View>
                )}
              </View>
              <Pressable
                  onPress={onRefresh}
                  style={({ pressed }) => [
                    styles.refreshBtn,
                    pressed && styles.refreshBtnPressed,
                  ]}
              >
                <Text style={styles.refreshText}>
                  {refreshing ? 'Обновление…' : '↻  Обновить'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.filters}>
              {(['all', 'upcoming', 'finished'] as Filter[]).map((f) => {
                const active = filter === f;
                return (
                    <Pressable
                        key={f}
                        onPress={() => setFilter(f)}
                        style={({ pressed }) => [
                          styles.filterBtn,
                          pressed && styles.filterBtnPressed,
                          active && styles.filterBtnActive,
                        ]}
                    >
                      <Text
                          style={[
                            styles.filterText,
                            active && styles.filterTextActive,
                          ]}
                      >
                        {f === 'all'
                            ? 'Все'
                            : f === 'upcoming'
                                ? 'Предстоящие'
                                : 'Завершённые'}
                      </Text>
                    </Pressable>
                );
              })}
            </View>
          </View>

          {filtered.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>
                  {matches.length === 0
                      ? 'Матчей пока нет'
                      : 'В этом фильтре матчей нет'}
                </Text>
                <Text style={styles.muted}>
                  {matches.length === 0
                      ? 'Потяните вниз, чтобы обновить'
                      : 'Попробуйте выбрать другой фильтр'}
                </Text>
              </View>
          ) : (
              <FlatList
                  data={filtered}
                  keyExtractor={(item, index) => item.id || `idx-${index}`}
                  contentContainerStyle={styles.list}
                  refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={PALETTE.primary}
                        colors={[PALETTE.primary]}
                    />
                  }
                  renderItem={({ item, index }) => {
                    const parts = scoreParts(item.score);
                    const statusColors = STATUS_STYLE[item.status] ?? {
                      bg: '#F1F5F9',
                      fg: '#475569',
                    };
                    return (
                        <FadeInCard index={index}>
                          <Pressable
                              style={({ pressed }) => [
                                styles.card,
                                pressed && styles.cardPressed,
                              ]}
                          >
                            <View style={styles.cardHeader}>
                              <View
                                  style={[
                                    styles.statusBadge,
                                    { backgroundColor: statusColors.bg },
                                  ]}
                              >
                                {item.status === 'live' && <LiveDot />}
                                <Text
                                    style={[
                                      styles.statusText,
                                      { color: statusColors.fg },
                                    ]}
                                >
                                  {STATUS_LABEL[item.status] ?? item.status}
                                </Text>
                              </View>
                              <Text style={styles.dateText}>
                                {formatDate(item.startsAt)}
                              </Text>
                            </View>

                            <View style={styles.teamsBlock}>
                              <View style={styles.teamRow}>
                                <Text style={styles.teamName} numberOfLines={1}>
                                  {teamName(item.home)}
                                </Text>
                                {parts && (
                                    <Text style={styles.teamScore}>{parts.home}</Text>
                                )}
                              </View>
                              <View style={styles.divider} />
                              <View style={styles.teamRow}>
                                <Text style={styles.teamName} numberOfLines={1}>
                                  {teamName(item.away)}
                                </Text>
                                {parts && (
                                    <Text style={styles.teamScore}>{parts.away}</Text>
                                )}
                              </View>
                            </View>
                          </Pressable>
                        </FadeInCard>
                    );
                  }}
              />
          )}
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: -0.5,
  },
  updatedRow: {
    marginTop: 4,
    opacity: 0.7,
  },

  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: PALETTE.primarySoft,
  },
  refreshBtnPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: PALETTE.primaryBorder,
  },
  refreshText: {
    color: PALETTE.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterBtnPressed: {
    transform: [{ scale: 0.97 }],
  },
  filterBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.96,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },

  dateText: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontVariant: ['tabular-nums'],
  },

  teamsBlock: {
    gap: 6,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text,
  },
  teamScore: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.text,
    fontVariant: ['tabular-nums'],
    minWidth: 24,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.text,
  },
  muted: {
    color: PALETTE.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },

  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.error,
  },
  primaryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: PALETTE.primary,
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#4338CA',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});