import { type FormEvent, useEffect, useState } from "react";
import { saveOwnProfile } from "../profile/profileService";
import { useAuth } from "./useAuth";

type AuthMode = "signIn" | "signUp";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignIn = mode === "signIn";

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isSignIn && !displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!isSignIn && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const result = isSignIn
      ? await signIn(email, password)
      : await signUp(email, password, displayName.trim());

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (!isSignIn) {
      if (result.data.session && result.data.user) {
        try {
          await saveOwnProfile({
            userId: result.data.user.id,
            displayName,
            avatarFile,
          });
        } catch (profileError) {
          setError(
            profileError instanceof Error
              ? `Account created, but profile setup failed: ${profileError.message}`
              : "Account created, but profile setup failed. You can finish it from Profile.",
          );
          return;
        }
      }

      setMessage(
        result.data.session
          ? "Account created. You are now signed in."
          : "Account created. Check your email, then finish your profile after signing in.",
      );
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setDisplayName("");
    setAvatarFile(null);
    setShowPassword(false);
    setConfirmPassword("");
    setShowConfirmPassword(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-5 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-[#eadfd6] bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c75b32]">
            Shared food diary
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#34251f]">
            {isSignIn ? "Welcome back" : "Start your food story"}
          </h1>
          <p className="mt-2 text-[#806f64]">
            {isSignIn
              ? "Sign in to continue your shared memories."
              : "Create an account to begin your private food diary."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <label className="block text-sm font-medium text-[#59483f]">
                Display name
                <input
                  required
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 outline-none transition placeholder:text-[#b4a49a] focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
                  placeholder="Name"
                />
              </label>

              <label className="block text-sm font-medium text-[#59483f]">
                Profile photo <span className="font-normal text-[#806f64]">(optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setAvatarFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-2 block w-full rounded-2xl border border-dashed border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 text-sm text-[#806f64]"
                />
              </label>

              {avatarPreviewUrl && (
                <img
                  src={avatarPreviewUrl}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-full object-cover"
                />
              )}
            </>
          )}

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
            <div className="relative mt-2">
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 pr-16 outline-none transition placeholder:text-[#b4a49a] focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
                placeholder="At least 6 characters"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#806f64] transition hover:bg-[#fbe4d7] hover:text-[#c75b32]"
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="m3 3 18 18" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {!isSignIn && (
            <label className="block text-sm font-medium text-[#59483f]">
              Confirm password
              <div className="relative mt-2">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#ddc9bb] bg-[#fffaf5] px-4 py-3 pr-16 outline-none transition placeholder:text-[#b4a49a] focus:border-[#c75b32] focus:ring-4 focus:ring-[#fbe4d7]"
                  placeholder="Re-enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showConfirmPassword}
                  title={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#806f64] transition hover:bg-[#fbe4d7] hover:text-[#c75b32]"
                >
                  {showConfirmPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="m3 3 18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
          )}

          {error && (
            <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#ad3f2d]">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#367347]">
              {message}
            </p>
          )}

          <button
            disabled={submitting}
            type="submit"
            className="w-full rounded-2xl bg-[#c75b32] px-4 py-3.5 font-semibold text-white transition hover:bg-[#aa4725] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Working…" : isSignIn ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[#806f64]">
          {isSignIn ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(isSignIn ? "signUp" : "signIn")}
            className="font-semibold text-[#c75b32] underline-offset-4 hover:underline"
          >
            {isSignIn ? "Sign up now" : "Log in"}
          </button>
        </div>
      </section>
    </main>
  );
}
