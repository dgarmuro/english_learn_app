// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost/api';

async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem('access_token');
}

async function authHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Auth ──────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Signup failed');
  }
  return res.json();
}

export async function signIn(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Signin failed');
  }
  const data = await res.json();
  await AsyncStorage.setItem('access_token', data.access_token);
  await AsyncStorage.setItem('refresh_token', data.refresh_token);
  await AsyncStorage.setItem('user_id', data.user_id);
  return data;
}

export async function signOut() {
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('user_id');
}

// ── Conversations ─────────────────────────────────────────

export async function createConversation() {
  
  const token = await getToken();
  console.log('Token:', token);
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json(); // { thread_id }
}

export async function getConversations() {
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function deleteConversation(threadId: string) {
  const res = await fetch(`${BASE_URL}/conversations/${threadId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

// ── Chat ──────────────────────────────────────────────────

export async function sendMessage(threadId: string, message: string) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ thread_id: threadId, message }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json(); // { response, correction }
}

// ── Vocabulary ────────────────────────────────────────────

export async function getVocabulary(limit = 10) {
  const res = await fetch(`${BASE_URL}/vocabulary?limit=${limit}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch vocabulary');
  return res.json();
}

// ── Refresh ────────────────────────────────────────────
export async function refreshToken(refresh_token: string) {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),  // clave correcta
  });
  return res;
}