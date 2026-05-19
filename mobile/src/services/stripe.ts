import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { Config } from '../constants/config';
import { getIdToken } from './firebase';

export async function initializeStripe(): Promise<void> {
  await initStripe({
    publishableKey: Config.STRIPE_PUBLISHABLE_KEY,
    merchantIdentifier: 'merchant.com.videomatch.app',
  });
}

async function authFetch(path: string, body: object): Promise<Response> {
  const token = await getIdToken();
  return fetch(`${Config.API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function createCheckoutSession(priceId: string): Promise<{ url: string }> {
  const res = await authFetch('/api/subscriptions/create-checkout', { priceId });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }
  return res.json();
}

export async function openCustomerPortal(): Promise<{ url: string }> {
  const res = await authFetch('/api/subscriptions/portal', {});
  if (!res.ok) throw new Error('Failed to open customer portal');
  return res.json();
}
