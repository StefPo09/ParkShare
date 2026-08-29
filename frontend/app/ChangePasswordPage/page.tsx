'use client';

import { FormEvent, useState } from 'react';
import { Check, Eye, EyeOff, LockKeyhole, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PasswordRequirement {
  label: string;
  isMet: boolean;
}

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmNewPassword';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', isMet: newPassword.length >= 8 },
    { label: 'One uppercase letter', isMet: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', isMet: /[a-z]/.test(newPassword) },
    { label: 'One number', isMet: /\d/.test(newPassword) },
    { label: 'One symbol', isMet: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const isNewPasswordValid = passwordRequirements.every((requirement) => requirement.isMet);
  const passwordsMatch = confirmNewPassword === '' || newPassword === confirmNewPassword;
  const canSubmit = !!currentPassword && isNewPasswordValid && newPassword === confirmNewPassword && confirmNewPassword.trim() !== '';

  const togglePasswordVisibility = (field: PasswordField) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);

    if (!currentPassword) {
      setError('Enter your current password to continue.');
      return;
    }

    if (!isNewPasswordValid) {
      setError('Your new password does not meet all requirements.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsSaved(true);
  };

  const renderPasswordField = (
    field: PasswordField,
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    hasError = false,
  ) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#121212] dark:text-white" htmlFor={field}>
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#42565d] dark:text-[#b6cfd1]"
        />
        <input
          id={field}
          type={visibleFields[field] ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
          className={`h-12 w-full rounded-xl border bg-white/85 py-3 pl-11 pr-12 text-sm text-[#121212] outline-none transition placeholder:text-[#697b80] focus:ring-2 dark:bg-white/10 dark:text-white dark:placeholder:text-[#b6cfd1] ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25'
              : 'border-white/60 focus:border-[#0f4c81] focus:ring-[#0f4c81]/20 dark:border-white/15 dark:focus:border-[#9ad7db] dark:focus:ring-[#9ad7db]/20'
          }`}
        />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(field)}
          aria-label={visibleFields[field] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#42565d] transition hover:bg-black/5 hover:text-[#0f4c81] dark:text-[#dfeef0] dark:hover:bg-white/10 dark:hover:text-white"
        >
          {visibleFields[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#dfeef0] dark:bg-[#011b1b]">
      <div className="mx-auto flex min-h-screen w-full max-w-107.5 flex-col bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_42%)] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_36%)] dark:text-white">
        <header className="flex items-center justify-between px-5 pb-4 pt-5 sm:px-6">
          <div className="w-9" aria-hidden="true" />
          <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">Change password</h1>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition hover:scale-[1.02] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-7 w-7 stroke-[2.2]" />
          </button>
        </header>

        <main className="flex flex-1 items-center px-4 pb-8 pt-2 sm:px-6">
          <section className="w-full rounded-[28px] border border-black/5 bg-white/20 p-5 shadow-[0_25px_50px_rgba(15,32,35,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f4c81] text-white shadow-lg shadow-[#0f4c81]/25 dark:bg-[#9ad7db] dark:text-[#011b1b]">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#121212] dark:text-white">Keep your account secure</h2>
              <p className="mt-1 max-w-sm text-sm leading-5 text-[#42565d] dark:text-[#dfeef0]">
                Choose a strong new password that you do not use anywhere else.
              </p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
              {renderPasswordField(
                'currentPassword',
                'Current Password',
                currentPassword,
                setCurrentPassword,
                'Enter your current password',
              )}
              {renderPasswordField(
                'newPassword',
                'New Password',
                newPassword,
                setNewPassword,
                'Create a new password',
              )}

              <div className="rounded-2xl border border-black/5 bg-white/55 p-3.5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 text-xs font-semibold text-[#121212] dark:text-white">Your password needs:</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {passwordRequirements.map((requirement) => (
                    <div
                      key={requirement.label}
                      className={`flex items-center gap-2 text-xs font-medium ${
                        requirement.isMet ? 'text-[#08765f] dark:text-[#82e2c1]' : 'text-[#607277] dark:text-[#b6cfd1]'
                      }`}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${requirement.isMet ? 'bg-[#0f9f82] text-white' : 'bg-[#d8e5e6] dark:bg-white/15'}`}>
                        {requirement.isMet && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {requirement.label}
                    </div>
                  ))}
                </div>
              </div>

              {renderPasswordField(
                'confirmNewPassword',
                'Confirm New Password',
                confirmNewPassword,
                setConfirmNewPassword,
                'Re-enter your new password',
                !passwordsMatch,
              )}
              {!passwordsMatch && <p className="-mt-2 text-xs font-medium text-red-600 dark:text-red-400">New passwords do not match.</p>}

              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
              {isSaved && <p role="status" className="flex items-center gap-2 rounded-xl bg-[#d7f3e9] px-3 py-2.5 text-sm font-medium text-[#08765f] dark:bg-[#0f5d50]/50 dark:text-[#9af0cf]"><Check className="h-4 w-4" strokeWidth={3} />Your password has been updated.</p>}

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[#0f4c81] text-sm font-semibold text-white shadow-lg shadow-[#0f4c81]/20 transition hover:bg-[#0d3e68] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#0f4c81]/45 disabled:hover:bg-[#0f4c81]/45 dark:bg-[#9ad7db] dark:text-[#011b1b] dark:hover:bg-[#b6e9e8]"
              >
                Update password
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}