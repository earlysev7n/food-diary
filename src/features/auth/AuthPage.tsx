import { type FormEvent, useState } from 'react'
import { useAuth } from './useAuth'

type AuthMode = 'signIn' | 'signUp'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignIn = mode === 'signIn'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    const result = isSignIn
      ? await signIn(email, password)
      : await signUp(email, password)

    setSubmitting(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    if (!isSignIn) {
      setMessage(
        result.data.session
          ? 'Account created. You are now signed in.'
          : 'Account created. Check your email to confirm your account.',
      )
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError(null)
    setMessage(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-5 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-[#eadfd6] bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
            Shared food diary
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#34251f]">
            {isSignIn ? 'Welcome back' : 'Start your food story'}
          </h1>
          <p className="mt-2 text-[#806f64]">
            {isSignIn
              ? 'Sign in to continue your shared memories.'
              : 'Create an account to begin your private food diary.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#f8eee7] p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => switchMode('signIn')}
            className={`rounded-xl px-4 py-2.5 transition ${
              isSignIn ? 'bg-white text-[#c75b32] shadow-sm' : 'text-[#806f64]'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signUp')}
            className={`rounded-xl px-4 py-2.5 transition ${
              !isSignIn ? 'bg-white text-[#c75b32] shadow-sm' : 'text-[#806f64]'
            }`}
          >
            Sign up
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#59483f]">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none transition placeholder:text-[#b4a49a] focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-[#59483f]">
            Password
            <input
              required
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none transition placeholder:text-[#b4a49a] focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">{error}</p>
          )}
          {message && (
            <p className="rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#367347]">{message}</p>
          )}

          <button
            disabled={submitting}
            type="submit"
            className="w-full rounded-2xl bg-[#c75b32] px-4 py-3.5 font-semibold text-white transition hover:bg-[#aa4725] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Working…' : isSignIn ? 'Log in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
