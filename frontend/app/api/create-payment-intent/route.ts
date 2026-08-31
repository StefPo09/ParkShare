import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
    try {
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