import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import styles from './AppStyles';

const firebaseConfig = {
  apiKey: 'AIzaSyD68pasmT32P9GILRhgD1LB9EXMpt694t0',
  authDomain: 'program06ip.firebaseapp.com',
  projectId: 'program06ip',
  storageBucket: 'program06ip.firebasestorage.app',
  messagingSenderId: '60180130374',
  appId: '1:60180130374:web:01f59bf7447b869f08b847',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const Stack = createNativeStackNavigator();
const MIN_PASSWORD_LENGTH = 6;

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '...';
 
  return 'R$ ' + value.toFixed(2).replace('.', ',');
};

const currencyCards = [
  { id: 'usd', label: 'USD / BRL', subtitle: '1 Dólar Americano', countryCode: 'US' },
  { id: 'eur', label: 'EUR / BRL', subtitle: '1 Euro', countryCode: 'PT' },
  { id: 'gbp', label: 'GBP / BRL', subtitle: '1 Libra Esterlina', countryCode: 'GB' },
  { id: 'jpy', label: 'JPY / BRL', subtitle: '1 Iene Japonês', countryCode: 'JP' },
  { id: 'cad', label: 'CAD / BRL', subtitle: '1 Dólar Canadense', countryCode: 'CA' },
  { id: 'aud', label: 'AUD / BRL', subtitle: '1 Dólar Australiano', countryCode: 'AU' },
  { id: 'chf', label: 'CHF / BRL', subtitle: '1 Franco Suíço', countryCode: 'CH' },
  { id: 'ars', label: 'ARS / BRL', subtitle: '1 Peso Argentino', countryCode: 'AR' },
  { id: 'clp', label: 'CLP / BRL', subtitle: '1 Peso Chileno', countryCode: 'CL' },
  { id: 'mxn', label: 'MXN / BRL', subtitle: '1 Peso Mexicano', countryCode: 'MX' },
];

const getFlagUrl = (countryCode) => `https://flagsapi.com/${countryCode}/flat/64.png`;

function CurrencyFlags({ countryCode }) {
  return (
    <View style={styles.flagContainer}>
      <Image source={{ uri: getFlagUrl(countryCode) }} style={styles.primaryFlag} resizeMode="cover" />
      <Image source={{ uri: getFlagUrl('BR') }} style={styles.secondaryFlag} resizeMode="cover" />
    </View>
  );
}

function AuthScreen({ mode, setMode, email, setEmail, password, setPassword, handleAuth, authLoading, authError, clearAuthError }) {
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.authBox}>
        <Text style={styles.mainTitle}>Cotação de Moedas</Text>
        <Text style={styles.subtitle}>Faça login ou cadastre-se para continuar</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, mode === 'login' && styles.toggleActive]} onPress={() => { clearAuthError(); setMode('login'); }}>
            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, mode === 'signup' && styles.toggleActive]} onPress={() => { clearAuthError(); setMode('signup'); }}>
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={(text) => { clearAuthError(); setEmail(text); }} />
        <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={password} onChangeText={(text) => { clearAuthError(); setPassword(text); }} />
        <View style={styles.buttonContainer}>
          {authLoading ? <ActivityIndicator size="large" color="#0c4a6e" /> : <Button title={mode === 'login' ? 'Entrar' : 'Cadastrar'} onPress={handleAuth} />}
        </View>
        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
      </View>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

function HomeScreen({ user, quotes, lastUpdate, loading, onRefreshPress, handleLogout }) {
  const sortedCurrencies = Object.keys(quotes).sort();

  const renderQuoteCard = (key) => {
    const value = quotes[key]?.bid;
    const countryCode = key.slice(0, 2).toUpperCase();
    const currencyName = quotes[key]?.name || key;
    
    return (
      <View key={key} style={styles.card}>
        <View style={styles.cardMainRow}>
          <View style={styles.cardHeader}>
            <CurrencyFlags countryCode={countryCode} />
            <View style={styles.cardTitle}>
              <Text style={styles.cardName}>{key} / BRL</Text>
              <Text style={styles.cardCode}>{currencyName}</Text>
            </View>
          </View>
          <Text style={styles.cardValue}>
            {value ? `R$ ${value.toFixed(2).replace('.', ',')}` : '...'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} style={styles.mainScroll}>
        <View style={styles.header}>
          <Text style={styles.mainTitleLight}>Cotação de{'\n'}Moedas</Text>
        </View>
        <View style={styles.quoteBanner}>
          <Text style={styles.quoteBannerTitle}>Cotação Atual</Text>
          <Text style={styles.quoteBannerSubtitle}>
            Última atualização: {lastUpdate ? lastUpdate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '--'}
          </Text>
          <Text style={styles.quoteBannerSubtitle}>Total: {Object.keys(quotes).length} moedas</Text>
        </View>
        {sortedCurrencies.map(renderQuoteCard)}
        <View style={styles.refreshButtonWrapper}>
          {loading ? <ActivityIndicator size="large" color="#0c4a6e" /> : <TouchableOpacity style={styles.refreshButton} onPress={onRefreshPress}><Text style={styles.refreshButtonText}>Atualizar Cotações</Text></TouchableOpacity>}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.userRow}>
          <Text style={styles.userText}>Logado como: {user?.email}</Text>
          <Button title="Sair" onPress={handleLogout} color="#d9534f" />
        </View>
        <View style={styles.bottomNav}>
          <Text style={[styles.navItem, styles.navItemActive]}>Cotação</Text>
          <Text style={styles.navItem}>Carteira</Text>
          <Text style={styles.navItem}>Perfil</Text>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  const normalizeAuthError = (code) => {
    const map = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/missing-password': 'Informe a senha.',
      'auth/weak-password': `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/invalid-credential': 'E-mail ou senha inválidos.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-login-credentials': 'E-mail ou senha inválidos.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente em instantes.',
      'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
    };
    return map[code] || 'Não foi possível autenticar no momento.';
  };

  const fetchQuotes = async ({ showSuccessMessage = false, useLocalUpdateTime = false } = {}) => {
    setLoading(true);
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/all');
      const data = await response.json();
      
      const newQuotes = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value.bid) {
          newQuotes[key] = {
            bid: parseFloat(value.bid),
            pctChange: value.pctChange ? parseFloat(value.pctChange) : null,
            name: value.name,
          };
        }
      }
      
      setQuotes(newQuotes);
      setLastUpdate(new Date());
      console.log('Cotações carregadas:', Object.keys(newQuotes).length, 'moedas');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as cotações.');
      console.error('Erro ao buscar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchQuotes({ showSuccessMessage: true, useLocalUpdateTime: true });
  };

  const handleAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setAuthError('');
    if (!normalizedEmail || !password) {
      const message = 'Informe e-mail e senha';
      setAuthError(message);
      Alert.alert('Erro', message);
      return;
    }
    if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      const message = `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
      setAuthError(message);
      Alert.alert('Erro', message);
      return;
    }
    setAuthLoading(true);
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        setUser(userCredential.user);
        Alert.alert('Sucesso', `Conta criada: ${userCredential.user.email}`);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        setUser(userCredential.user);
        Alert.alert('Bem-vindo', `Login feito: ${userCredential.user.email}`);
      }
      setEmail('');
      setPassword('');
      // Buscar cotações após login
      fetchQuotes();
    } catch (error) {
      const message = normalizeAuthError(error?.code);
      setAuthError(message);
      Alert.alert('Erro', message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setQuotes({ });
      setLastUpdate(null);
      setMode('login');
      setAuthError('');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0c4a6e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} user={user} quotes={quotes} lastUpdate={lastUpdate} loading={loading} onRefreshPress={handleManualRefresh} handleLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} mode={mode} setMode={setMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleAuth={handleAuth} authLoading={authLoading} authError={authError} clearAuthError={() => setAuthError('')} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
