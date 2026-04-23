import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

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

const formatCurrency = (value) => {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const currencyCards = [
  {
    id: 'usd',
    label: 'Dólar Americano',
    symbol: '🇺🇸',
    code: 'USD/BRL',
  },
  {
    id: 'eur',
    label: 'Euro',
    symbol: '🇪🇺',
    code: 'EUR/BRL',
  },
];

function AuthScreen({ mode, setMode, email, setEmail, password, setPassword, handleAuth }) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.authBox}>
        <Text style={styles.mainTitle}>Cotação de Moedas</Text>
        <Text style={styles.subtitle}>Faça login ou cadastre-se para continuar</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'login' && styles.toggleActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'signup' && styles.toggleActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.buttonContainer}>
          <Button title={mode === 'login' ? 'Entrar' : 'Cadastrar'} onPress={handleAuth} />
        </View>
      </View>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

function HomeScreen({ user, quotes, lastUpdate, loading, fetchQuotes, handleLogout }) {
  const renderQuoteCard = ({ id, label, code, symbol }) => {
    const value = quotes[id];
    return (
      <View key={id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.flag}>{symbol}</Text>
          <View style={styles.cardTitle}>
            <Text style={styles.cardName}>{label}</Text>
            <Text style={styles.cardCode}>{code}</Text>
          </View>
        </View>
        <Text style={styles.cardValue}>
          {value === null ? 'Carregando...' : formatCurrency(value)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitleLight}>Cotação de Moedas</Text>
        <Text style={styles.lastUpdate}>
          Última atualização:{' '}
          {lastUpdate ? lastUpdate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '--'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currencyCards.map(renderQuoteCard)}
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0c4a6e" />
          ) : (
            <Button title="Atualizar Cotações" onPress={fetchQuotes} />
          )}
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
  const [quotes, setQuotes] = useState({ usd: null, eur: null });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
      if (currentUser) {
        fetchQuotes();
      }
    });

    return unsubscribe;
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/all');
      const data = await response.json();
      setQuotes({
        usd: parseFloat(data.USDBRL.bid),
        eur: parseFloat(data.EURBRL.bid),
      });
      setLastUpdate(new Date());
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as cotações');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Informe e-mail e senha');
      return;
    }

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        Alert.alert('Sucesso', `Conta criada: ${userCredential.user.email}`);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        Alert.alert('Bem-vindo', `Login feito: ${userCredential.user.email}`);
      }
      setEmail('');
      setPassword('');
      fetchQuotes();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setQuotes({ usd: null, eur: null });
      setLastUpdate(null);
      setMode('login');
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
            {(props) => (
              <HomeScreen
                {...props}
                user={user}
                quotes={quotes}
                lastUpdate={lastUpdate}
                loading={loading}
                fetchQuotes={fetchQuotes}
                handleLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {(props) => (
              <AuthScreen
                {...props}
                mode={mode}
                setMode={setMode}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                handleAuth={handleAuth}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  authBox: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  mainTitleLight: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    color: '#334155',
  },
  lastUpdate: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 14,
  },
  content: {
    padding: 24,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  flag: {
    fontSize: 32,
    marginRight: 14,
  },
  cardTitle: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardCode: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
  },
  buttonContainer: {
    marginTop: 12,
    marginHorizontal: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  userText: {
    color: '#334155',
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    color: '#94a3b8',
    fontSize: 14,
  },
  navItemActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    color: '#0f172a',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  toggleActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  toggleText: {
    textAlign: 'center',
    color: '#334155',
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
});