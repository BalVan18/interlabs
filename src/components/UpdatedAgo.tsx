import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

interface Props {
  since: Date;
}

function formatAgo(sec: number): string {
  if (sec < 5) return 'Только что обновлено';
  if (sec < 60) return `Обновлено ${sec} сек назад`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Обновлено ${min} мин назад`;
  const h = Math.floor(min / 60);
  return `Обновлено ${h} ч назад`;
}

export function UpdatedAgo({ since }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [since]);

  return <Text style={styles.text}>{formatAgo(seconds)}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: '#64748B',
  },
});
