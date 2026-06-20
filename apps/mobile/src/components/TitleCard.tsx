import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ImageBackground,
} from 'react-native';
import { Theme } from './BurgundhyTheme';
import type { ContentTitle } from '@streambrws/shared-types';
import { useExclusionStore } from '../store';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Theme.spacing.md * 3) / 2;
const CARD_H = CARD_W * 1.45;

interface TitleCardProps {
  title: ContentTitle;
  onPress?: (title: ContentTitle) => void;
  onLongPress?: (title: ContentTitle) => void;
  isHidden?: boolean;
}

export function TitleCard({ title, onPress, onLongPress, isHidden }: TitleCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(title)}
      onLongPress={() => onLongPress?.(title)}
      style={[styles.card, isHidden && styles.hiddenCard]}
    >
      <ImageBackground
        source={{ uri: title.posterUrl ?? 'https://via.placeholder.com/200x290/3D0018/gold?text=No+Image' }}
        style={styles.poster}
        imageStyle={styles.posterImage}
        resizeMode="cover"
      >
        <View style={styles.gradient}>
          {/* Service badge */}
          <View style={[styles.badge, { backgroundColor: Theme.colors.service[title.serviceId] ?? Theme.colors.burgundy500 }]}>
            <Text style={styles.badgeText}>{title.serviceId.replace('_', ' ').toUpperCase()}</Text>
          </View>
          {/* Title */}
          <Text style={styles.titleText} numberOfLines={2}>{title.title}</Text>
          {/* Meta */}
          <Text style={styles.metaText}>{title.year} · {title.rating}</Text>
          {/* Hidden indicator */}
          {isHidden && (
            <View style={styles.hiddenBadge}>
              <Text style={styles.hiddenBadgeText}>HIDDEN</Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
    ...Theme.shadow.md,
  },
  hiddenCard: { opacity: 0.55 },
  poster: { flex: 1, justifyContent: 'flex-end' },
  posterImage: { borderRadius: Theme.radius.md },
  gradient: {
    backgroundColor: 'rgba(26,0,8,0.78)',
    padding: Theme.spacing.sm,
    paddingTop: Theme.spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.radius.sm,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    color: Theme.colors.white,
    fontWeight: Theme.typography.weight.bold,
    letterSpacing: 0.5,
  },
  titleText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.sm,
    fontWeight: Theme.typography.weight.semiBold,
    lineHeight: 18,
  },
  metaText: {
    color: Theme.colors.gray400,
    fontSize: Theme.typography.xs,
    marginTop: 2,
  },
  hiddenBadge: {
    marginTop: 4,
    backgroundColor: Theme.colors.burgundy500,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.radius.sm,
  },
  hiddenBadgeText: {
    fontSize: 9,
    color: Theme.colors.white,
    fontWeight: Theme.typography.weight.bold,
  },
});
