// app/(tabs)/menu.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

const MENU_ITEMS = [
  {
    id: 'vocabulary',
    emoji: '📚',
    title: 'Learn Vocabulary',
    subtitle: 'Flip cards to learn new words',
    color: '#C8F04D',
    route: '/(tabs)/vocabulary',
  },
  {
    id: 'chat',
    emoji: '💬',
    title: 'Chat with Teacher',
    subtitle: 'Practice conversations with AI',
    color: '#4DC8F0',
    route: '/(tabs)/chat',
  },
];

export default function Menu() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day 👋</Text>
            <Text style={styles.title}>What shall we{'\n'}learn today?</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>↩</Text>
          </TouchableOpacity>
        </View>

        {/* Cards */}
        <View style={styles.cards}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { borderColor: item.color + '30' }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.color + '15' }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
              <Text style={[styles.arrow, { color: item.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>English Learn · AI-powered</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  greeting: { color: '#555', fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#F0EDE6',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    backgroundColor: '#141419',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 18 },
  cards: { gap: 16 },
  card: {
    backgroundColor: '#141419',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: {
    color: '#F0EDE6',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: { color: '#555', fontSize: 13 },
  arrow: { fontSize: 20, fontWeight: '300' },
  footer: {
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
});
