'use client'
import Image from "next/image"
import { useRouter } from 'next/navigation';
import React from "react";

export default function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isEmailValid) {
            return;
        }

        router.push('/RegisterPage');
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-white">
            <div className="flex w-full max-w-sm flex-1 flex-col">
                {/* Logo + wordmark */}
                <div className="flex flex-col items-center pb-8 pt-16">
                    <Image
                        src="../Icon.svg"
                        alt="Park | Share logo"
                        width={135}
                        height={110}
                        className="h-23 w-auto"
                        priority
                    />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight">
                        <span className="text-[#0F4C81]">Park</span>
                        <span className="mx-2 text-[#0F4C81]/60">|</span>
                        <span className="text-[#04B697]">Share</span>
                    </h1>
                </div>

                {/* Bottom sheet */}
                <div
                    className="flex flex-1 flex-col items-center rounded-t-4xl px-6 pb-10 pt-8"
                    style={{
                        background: "linear-gradient(180deg, #B3E3DE 0%, #B6CDDA 100%)",
                    }}
                >
                    <div className="mb-3 flex h-8 w-8 items-center justify-center">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="1.6"
                        >
                            <circle cx="9" cy="7" r="3.2"/>
                            <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6"/>
                            <path d="M18 8v5M15.5 10.5h5" strokeLinecap="round"/>
                        </svg>
                    </div>

                    <h2 className="text-lg font-bold text-[#0B1C2C]">Create an account</h2>
                    <p className="mt-1 text-center text-sm text-[#33475A]">
                        Enter your email to sign up for this app
                    </p>

                    <form className="mt-6 w-full space-y-3" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@domain.com"
                            className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                        />
                        <button
                            type="submit"
                            disabled={!isEmailValid}
                            className="h-12 w-full rounded-xl bg-[#0F4C81] text-sm font-semibold text-white transition hover:bg-[#0D3E68] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#0F4C81]/45 disabled:hover:bg-[#0F4C81]/45 cursor-pointer"
                        >
                            Continue
                        </button>
                        <a href="/LoginPage" className="text-[#000000]/50 text-sm underline flex justify-end">
                            Already have an account?
                        </a>
                    </form>

                    <div className="my-5 flex w-full items-center gap-3">
                        <span className="h-px flex-1 bg-[#5B6B6E]/50"/>
                        <span className="text-xs text-[#5B6B6E]">or</span>
                        <span className="h-px flex-1 bg-[#5B6B6E]/50"/>
                    </div>

                    <div className="w-full space-y-3">
                        <SocialButton
                            label="Continue with Google"
                            icon={<GoogleIcon/>}
                        />
                        <SocialButton
                            label="Continue with Apple"
                            icon={<AppleIcon/>}
                        />
                        <SocialButton
                            label="Continue with Facebook"
                            icon={<FacebookIcon/>}
                        />
                    </div>

                    <p className="mt-6 text-center text-[11px] leading-relaxed text-[#4A5A63]">
                        By clicking continue, you agree to our{" "}
                        <a href="/TermsOfService" className="font-medium text-[#0B1C2C] underline">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/PrivacyPolicy" className="font-medium text-[#0B1C2C] underline">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

function SocialButton({
                          label,
                          icon,
                      }: {
    label: string
    icon: React.ReactNode
}) {
    return (
        <button
            type="button"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#EEEEEE] text-sm font-medium text-[#0B1C2C] transition hover:bg-[#E4E4E4] active:scale-[0.99]"
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
            />
            <path
                fill="#FBBC05"
                d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"
            />
            <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
            />
        </svg>
    )
}

function AppleIcon() {
    return (
        <svg width="16" height="18" viewBox="0 0 16 18" fill="black">
            <path
                d="M13.1 9.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.3-.9-2.3-3.8zM10.9 3.4c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/>
        </svg>
    )
}

function FacebookIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="9" fill="#1877F2"/>
            <path
                fill="#fff"
                d="M11.5 9.3h-1.6v5.4H7.8V9.3H6.6V7.4h1.2V6.1c0-1.5.7-2.4 2.4-2.4h1.5v1.9h-.9c-.7 0-.7.3-.7.7v1h1.7l-.3 1.9z"
            />
        </svg>
    )
}
