import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StyleSheet } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { Config } from './constants/config';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={Config.STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.videomatch.app">
          <AppNavigator />
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
