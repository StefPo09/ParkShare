'use client';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

export function CheckoutForm({
                                 disabled,
                                 onSuccess,
                             }: {
    disabled: boolean;
    onSuccess: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required', // stay on this page instead of a full redirect
        });

        if (error) {
            setErrorMessage(error.message ?? 'Payment failed. Please try again.');
            setIsProcessing(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            onSuccess();
        } else {
            setErrorMessage('Payment could not be completed.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <PaymentElement />

            {errorMessage && (
                <p className="text-sm font-medium text-red-500">{errorMessage}</p>
            )}

            <button
                type="button"
                disabled={disabled || isProcessing || !stripe || !elements}
                onClick={handleConfirm}
                className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67] disabled:cursor-not-allowed disabled:bg-[#0f4c81]/45 disabled:shadow-none"
            >
                {isProcessing ? 'Processing…' : 'Confirm purchase'}
            </button>
        </div>
    );
}