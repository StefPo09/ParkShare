'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#dfeef0] dark:bg-[#011b1b] px-5 py-10">
            <div className="mx-auto flex min-h-[80vh] max-w-[430px] items-center justify-center">
                <div className="w-full rounded-3xl bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:bg-white/5">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle
                            className="h-12 w-12 text-green-500"
                            strokeWidth={2}
                        />
                    </div>

                    <h1 className="mt-6 text-3xl font-bold text-[#121212] dark:text-white">
                        Payment successful!
                    </h1>

                    <p className="mt-3 text-sm text-[#42565d] dark:text-[#d6e7ea]">
                        Your parking spot has been successfully reserved.
                    </p>

                    <div className="mt-8 space-y-3 rounded-2xl bg-black/5 p-4 text-left dark:bg-white/5">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">
                                Parking spot
                            </span>

                            <span className="text-sm font-semibold dark:text-white">
                                Parking spot
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">
                                Duration
                            </span>

                            <span className="text-sm font-semibold dark:text-white">
                                2 hours
                            </span>
                        </div>

                        <div className="flex justify-between border-t border-black/10 pt-3 dark:border-white/10">
                            <span className="font-semibold">
                                Total
                            </span>

                            <span className="font-bold text-[#0f4c81] dark:text-[#2dd4bf]">
                                25.00 RON
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 font-semibold text-white transition hover:bg-[#0c3e67]"
                    >
                        Done
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}