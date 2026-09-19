import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
    try {
        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
            console.error('STRIPE_SECRET_KEY is not set');
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const stripe = new Stripe(secret);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2500, // it means 25.00 RON
            currency: 'ron',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe PaymentIntent error:', error);

        return NextResponse.json(
            {
                error: 'Unable to create payment intent',
            },
            {
                status: 500,
            }
        );
    }
}
