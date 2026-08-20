import {
  useState,
  type FormEvent,
} from 'react'

import { supabase } from '../lib/supabase'

type LoginMode =
  | 'login'
  | 'forgot'

function Login() {
  const [
    mode,
    setMode,
  ] =
    useState<LoginMode>(
      'login',
    )

  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    password,
    setPassword,
  ] =
    useState('')

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('')

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const handleLogin =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      try {
        const {
          error,
        } =
          await supabase.auth.signInWithPassword({
            email:
              email.trim(),

            password,
          })

        if (
          error
        ) {
          setErrorMessage(
            'Email or password is incorrect.',
          )

          return
        }
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setErrorMessage(
          'Unable to sign in. Please try again.',
        )
      } finally {
        setLoading(
          false,
        )
      }
    }

  const handleForgotPassword =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setErrorMessage('')
      setSuccessMessage('')

      const trimmedEmail =
        email.trim()

      if (
        !trimmedEmail
      ) {
        setErrorMessage(
          'Please enter your email address.',
        )

        return
      }

      setLoading(
        true,
      )

      try {
        const redirectUrl =
          `${window.location.origin}/reset-password`

        const {
          error,
        } =
          await supabase.auth.resetPasswordForEmail(
            trimmedEmail,
            {
              redirectTo:
                redirectUrl,
            },
          )

        if (
          error
        ) {
          console.error(
            error,
          )

          setErrorMessage(
            error.message ||
            'Unable to send reset link.',
          )

          return
        }

        setSuccessMessage(
          'If an account exists for this email, a password reset link has been sent.',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setErrorMessage(
          'Unable to send reset link. Please try again.',
        )
      } finally {
        setLoading(
          false,
        )
      }
    }

  const switchToForgot =
    () => {
      setMode(
        'forgot',
      )

      setPassword('')
      setShowPassword(false)
      setErrorMessage('')
      setSuccessMessage('')
    }

  const switchToLogin =
    () => {
      setMode(
        'login',
      )

      setPassword('')
      setShowPassword(false)
      setErrorMessage('')
      setSuccessMessage('')
    }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            🏊
          </div>

          <div>
            <h1>
              SwimCoach
            </h1>

            <p>
              Manager
            </p>
          </div>
        </div>

        <div className="login-heading">
          <h2>
            {mode ===
            'login'
              ? 'Welcome Back'
              : 'Forgot Password'}
          </h2>

          <p>
            {mode ===
            'login'
              ? 'Sign in to manage your swimming lessons.'
              : 'Enter your account email and we will send you a password reset link.'}
          </p>
        </div>

        {mode ===
        'login' ? (
          <form
            className="login-form"
            onSubmit={
              handleLogin
            }
          >
            <label className="login-field">
              <span>
                Email
              </span>

              <input
                type="email"
                value={
                  email
                }
                onChange={(
                  event,
                ) => {
                  setEmail(
                    event.target.value,
                  )

                  setErrorMessage('')
                }}
                placeholder="Email"
                autoComplete="email"
                required
              />
            </label>

            <label className="login-field">
              <span>
                Password
              </span>

              <div className="login-password-wrapper">
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) => {
                    setPassword(
                      event.target.value,
                    )

                    setErrorMessage('')
                  }}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-eye"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 3 18 18" />

                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

                      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2" />

                      <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <button
              className="login-forgot-button"
              type="button"
              onClick={
                switchToForgot
              }
            >
              Forgot Password?
            </button>

            {errorMessage && (
              <div className="login-error">
                {
                  errorMessage
                }
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={
                loading
              }
            >
              {loading
                ? 'Signing In...'
                : 'Sign In'}
            </button>
          </form>
        ) : (
          <form
            className="login-form"
            onSubmit={
              handleForgotPassword
            }
          >
            <label className="login-field">
              <span>
                Email
              </span>

              <input
                type="email"
                value={
                  email
                }
                onChange={(
                  event,
                ) => {
                  setEmail(
                    event.target.value,
                  )

                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                placeholder="Email"
                autoComplete="email"
                required
              />
            </label>

            {errorMessage && (
              <div className="login-error">
                {
                  errorMessage
                }
              </div>
            )}

            {successMessage && (
              <div className="login-success">
                {
                  successMessage
                }
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={
                loading
              }
            >
              {loading
                ? 'Sending...'
                : 'Send Reset Link'}
            </button>

            <button
              className="login-back-button"
              type="button"
              disabled={
                loading
              }
              onClick={
                switchToLogin
              }
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login