// app/(tabs)/vocabulary.tsx
import React, { useEffect,useState,useRef } from 'react';

import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, Dimensions, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { getVocabulary } from '../../services/api';

const { width } = Dimensions.get('window');
const CARD_W = width - 48;
const CARD_H = 200;

interface Word {
  id: string;
  word: string;
  translation: string;
  example?: string;
  level?: number;
}

function FlipCard({ word }: { word: Word }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const flip = () => {
    Animated.spring(anim, {
      toValue: flipped ? 0 : 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.95} style={styles.cardWrapper}>
      {/* Front */}
      <Animated.View style={[
        styles.card, styles.cardFront,
        { transform: [{ rotateY: frontRotate }] }
      ]}>
        <Text style={styles.levelBadge}>Level {word.level ?? 1}</Text>
        <Text style={styles.wordText}>{word.word}</Text>
        <Text style={styles.tapHint}>tap to reveal</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[
        styles.card, styles.cardBack,
        { transform: [{ rotateY: backRotate }] }
      ]}>
        <Text style={styles.translationText}>{word.translation}</Text>
        {word.example ? (
          <Text style={styles.exampleText}>"{word.example}"</Text>
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Vocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      // Random 5–12 words
      const count = Math.floor(Math.random() * 8) + 5;
      const data = await getVocabulary(count);
      setWords(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vocabulary</Text>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C8F04D" size="large" />
          <Text style={styles.loadingText}>Loading words...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countText}>{words.length} words today</Text>
          {words.map(word => (
            <FlipCard key={word.id} word={word} />
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: '#141419',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#F0EDE6', fontSize: 18 },
  title: { color: '#F0EDE6', fontSize: 18, fontWeight: '700' },
  refreshBtn: {
    width: 40, height: 40,
    backgroundColor: '#C8F04D15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8F04D30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: { color: '#C8F04D', fontSize: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#555', fontSize: 14 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
  countText: { color: '#555', fontSize: 13, marginBottom: 4 },

  // Flip card
  cardWrapper: {
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardFront: {
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#222',
  },
  cardBack: {
    backgroundColor: '#1A2410',
    borderWidth: 1,
    borderColor: '#C8F04D30',
  },
  levelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    color: '#333',
    fontSize: 11,
    fontWeight: '600',
  },
  wordText: {
    color: '#F0EDE6',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tapHint: {
    position: 'absolute',
    bottom: 16,
    color: '#333',
    fontSize: 11,
  },
  translationText: {
    color: '#C8F04D',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  exampleText: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
