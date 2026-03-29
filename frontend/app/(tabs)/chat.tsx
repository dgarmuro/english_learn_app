// app/(tabs)/chat.tsx
import React, { useEffect,useState,useRef } from 'react';

import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Modal, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  createConversation, getConversations,
  sendMessage, deleteConversation
} from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  correction?: string;
}

interface Conversation {
  thread_id: string;
  preview: string;
  created_at: string;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showConvs, setShowConvs] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingConvs(false);
    }
  };

  const startNewConversation = async () => {
    try {
      const { thread_id } = await createConversation();
      setActiveThread(thread_id);
      setMessages([]);
      setShowConvs(false);
      await loadConversations();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const selectConversation = (thread_id: string) => {
    setActiveThread(thread_id);
    setMessages([]);
    setShowConvs(false);
  };

  const handleDelete = async (thread_id: string) => {
    Alert.alert('Delete', 'Delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(thread_id);
            if (activeThread === thread_id) {
              setActiveThread(null);
              setMessages([]);
            }
            await loadConversations();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeThread || sending) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const data = await sendMessage(activeThread, userMsg.content);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        correction: data.correction,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.msgRow,
      item.role === 'user' ? styles.msgRowUser : styles.msgRowAssistant
    ]}>
      {item.role === 'assistant' && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🎓</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
      ]}>
        <Text style={[
          styles.bubbleText,
          item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant
        ]}>
          {item.content}
        </Text>
        {item.correction && (
          <View style={styles.correctionBox}>
            <Text style={styles.correctionLabel}>✏️ Correction</Text>
            <Text style={styles.correctionText}>{item.correction}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.convSelector}
          onPress={() => setShowConvs(true)}
        >
          <Text style={styles.convSelectorText} numberOfLines={1}>
            {activeThread
              ? conversations.find(c => c.thread_id === activeThread)?.preview || 'Conversation'
              : 'Select conversation'}
          </Text>
          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={startNewConversation}>
          <Text style={styles.iconBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Chat area */}
      {!activeThread ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>Start a conversation</Text>
          <Text style={styles.emptySub}>Tap + to create a new chat{'\n'}or select an existing one</Text>
          <TouchableOpacity style={styles.newBtn} onPress={startNewConversation}>
            <Text style={styles.newBtnText}>New Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.chatEmpty}>
                <Text style={styles.chatEmptyText}>Say hello to your teacher 👋</Text>
              </View>
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#444"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color="#0A0A0F" size="small" />
                : <Text style={styles.sendIcon}>↑</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Conversations Modal */}
      <Modal visible={showConvs} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowConvs(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Conversations</Text>

            {loadingConvs ? (
              <ActivityIndicator color="#4DC8F0" style={{ marginTop: 20 }} />
            ) : conversations.length === 0 ? (
              <Text style={styles.noConvs}>No conversations yet</Text>
            ) : (
              conversations.map(conv => (
                <TouchableOpacity
                  key={conv.thread_id}
                  style={[
                    styles.convItem,
                    activeThread === conv.thread_id && styles.convItemActive
                  ]}
                  onPress={() => selectConversation(conv.thread_id)}
                  onLongPress={() => handleDelete(conv.thread_id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.convPreview} numberOfLines={1}>
                      {conv.preview}
                    </Text>
                    <Text style={styles.convDate}>
                      {new Date(conv.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {activeThread === conv.thread_id && (
                    <Text style={styles.activeCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity style={styles.newConvBtn} onPress={startNewConversation}>
              <Text style={styles.newConvBtnText}>+ New Conversation</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#141419',
  },
  iconBtn: {
    width: 38, height: 38,
    backgroundColor: '#141419',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: '#F0EDE6', fontSize: 17 },
  convSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  convSelectorText: { color: '#F0EDE6', fontSize: 14, flex: 1 },
  chevron: { color: '#555', fontSize: 14 },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { color: '#F0EDE6', fontSize: 20, fontWeight: '700' },
  emptySub: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  newBtn: {
    backgroundColor: '#4DC8F0',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  newBtnText: { color: '#0A0A0F', fontWeight: '800', fontSize: 15 },

  // Messages
  msgList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 32, height: 32,
    backgroundColor: '#141419',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: { fontSize: 16 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 13 },
  bubbleUser: { backgroundColor: '#4DC8F0', borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: '#141419', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#222' },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: '#0A0A0F', fontWeight: '500' },
  bubbleTextAssistant: { color: '#F0EDE6' },
  correctionBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  correctionLabel: { color: '#C8F04D', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  correctionText: { color: '#AAA', fontSize: 13, lineHeight: 18 },

  chatEmpty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  chatEmptyText: { color: '#333', fontSize: 14 },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#141419',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F0EDE6',
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44,
    backgroundColor: '#4DC8F0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#141419', borderWidth: 1, borderColor: '#222' },
  sendIcon: { color: '#0A0A0F', fontSize: 18, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#141419',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36, height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#F0EDE6', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  noConvs: { color: '#555', textAlign: 'center', marginVertical: 20 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#0A0A0F',
    borderWidth: 1,
    borderColor: '#222',
  },
  convItemActive: { borderColor: '#4DC8F030', backgroundColor: '#0A1520' },
  convPreview: { color: '#F0EDE6', fontSize: 14, marginBottom: 3 },
  convDate: { color: '#444', fontSize: 11 },
  activeCheck: { color: '#4DC8F0', fontSize: 16, fontWeight: '700' },
  newConvBtn: {
    backgroundColor: '#4DC8F015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4DC8F030',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  newConvBtnText: { color: '#4DC8F0', fontWeight: '700', fontSize: 15 },
});
