import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface Props {
  active: boolean;
  onPress: () => void;
}

export function FavoriteButton({ active, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
      <Pressable
          onPress={handlePress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={active ? 'Убрать из избранного' : 'В избранное'}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Animated.Text
            style={[
              styles.star,
              active && styles.starActive,
              { transform: [{ scale }] },
            ]}
        >
          {active ? '★' : '☆'}
        </Animated.Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
  btnPressed: {
    opacity: 0.7,
  },
  star: {
    fontSize: 24,
    lineHeight: 26,
    color: '#94A3B8',
  },
  starActive: {
    color: '#F59E0B',
  },
});
