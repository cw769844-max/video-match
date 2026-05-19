import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { requireAuth, AuthRequest } from '../middleware/auth';
import logger from '../logger';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const db = () => admin.firestore();

// Create a Stripe checkout session for premium subscription
router.post('/create-checkout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    const validPriceIds = [
      process.env.STRIPE_MONTHLY_PRICE_ID,
      process.env.STRIPE_YEARLY_PRICE_ID,
    ];

    if (!validPriceIds.includes(priceId)) {
      res.status(400).json({ error: 'Invalid price ID' });
      return;
    }

    const userDoc = await db().collection('users').doc(req.uid!).get();
    const userData = userDoc.data();

    let customerId: string | undefined = userData?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { firebaseUid: req.uid! },
      });
      customerId = customer.id;
      await db().collection('users').doc(req.uid!).update({ stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || 'videomatch://premium-success',
      cancel_url: cancelUrl || 'videomatch://premium-cancel',
      metadata: { firebaseUid: req.uid! },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    logger.error(`POST /subscriptions/create-checkout: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a Stripe customer portal session to manage subscription
router.post('/portal', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userDoc = await db().collection('users').doc(req.uid!).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      res.status(400).json({ error: 'No subscription found' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'videomatch://settings',
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error(`POST /subscriptions/portal: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe webhook — grant/revoke premium based on subscription events
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error(`Webhook signature failed: ${err}`);
    res.status(400).send('Webhook Error');
    return;
  }

  const getFirebaseUid = (obj: Stripe.Subscription | Stripe.CheckoutSessionCompletedEvent['data']['object']): string | undefined => {
    if ('metadata' in obj) return obj.metadata?.firebaseUid;
    return undefined;
  };

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = getFirebaseUid(subscription);
      if (!uid) break;

      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const premiumExpiry = isActive
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : undefined;

      await db().collection('users').doc(uid).update({
        isPremium: isActive,
        premiumExpiry: premiumExpiry || admin.firestore.FieldValue.delete(),
        stripeSubscriptionId: subscription.id,
      });

      logger.info(`User ${uid} premium status: ${isActive} (expires: ${premiumExpiry})`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = getFirebaseUid(subscription);
      if (!uid) break;

      await db().collection('users').doc(uid).update({
        isPremium: false,
        premiumExpiry: admin.firestore.FieldValue.delete(),
      });
      logger.info(`User ${uid} premium revoked`);
      break;
    }

    default:
      logger.debug(`Unhandled webhook event: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
