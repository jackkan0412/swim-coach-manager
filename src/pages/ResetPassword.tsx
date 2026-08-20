import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type ResetPasswordProps = {
  recoveryReady: boolean
}

const RECOVERY_STORAGE_KEY =
  'swimcoach-password-recovery'

function ResetPassword({
  recoveryReady,
}: ResetPasswordProps) {
  const navigate =
    useNavigate()

  const [
    password,
    setPassword,
  ] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('')

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    checkingSession,
    setCheckingSession,
  ] =
    useState(true)

  const [
    sessionValid,
    setSessionValid,
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

  useEffect(() => {
    const verifyRecovery =
      async () => {
        setCheckingSession(
          true,
        )

        try {
          const {
            data: {
              session,
            },
            error,
          } =
            await supabase.auth.getSession()

          if (
            error
          ) {
            console.error(
              error,
            )

            setSessionValid(
              false,
            )

            setErrorMessage(
              'Unable to verify the password reset link.',
            )

            return
          }

          const storedRecovery =
            sessionStorage.getItem(
              RECOVERY_STORAGE_KEY,
            ) ===
            'true'

          if (
            !session ||
            (
              !recoveryReady &&
              !storedRecovery
            )
          ) {
            setSessionValid(
              false,
            )

            setErrorMessage(
              'This password reset link is invalid or has expired.',
            )

            return
          }

          setSessionValid(
            true,
          )

          setErrorMessage(
            '',
          )
        } catch (
          error
        ) {
          console.error(
            error,
          )

          setSessionValid(
            false,
          )

          setErrorMessage(
            'Unable to verify the password reset link.',
          )
        } finally {
          setCheckingSession(
            false,
          )
        }
      }

    /*
      Give Supabase a moment to process
      the recovery URL event when arriving
      from the email.
    */
    const timer =
      window.setTimeout(
        () => {
          void verifyRecovery()
        },
        300,
      )

    return () => {
      window.clearTimeout(
        timer,
      )
    }
  }, [
    recoveryReady,
  ])

  const handleResetPassword =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      if (
        !sessionValid
      ) {
        return
      }

      setErrorMessage(
        '',
      )

      setSuccessMessage(
        '',
      )

      if (
        password.length <
        6
      ) {
        setErrorMessage(
          'Password must be at least 6 characters.',
        )

        return
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          'Passwords do not match.',
        )

        return
      }

      setLoading(
        true,
      )

      try {
        const {
          error,
        } =
          await supabase.auth.updateUser({
            password,
          })

        if (
          error
        ) {
          console.error(
            error,
          )

          setErrorMessage(
            error.message ||
            'Unable to update password.',
          )

          return
        }

        setSuccessMessage(
          'Password updated successfully.',
        )

        setPassword(
          '',
        )

        setConfirmPassword(
          '',
        )

        setShowPassword(
          false,
        )

        sessionStorage.removeItem(
          RECOVERY_STORAGE_KEY,
        )

        await supabase.auth.signOut()

        window.setTimeout(
          () => {
            navigate(
              '/',
              {
                replace:
                  true,
              },
            )
          },
          1200,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setErrorMessage(
          'Unable to update password. Please try again.',
        )
      } finally {
        setLoading(
          false,
        )
      }
    }

  const handleBackToLogin =
    async () => {
      sessionStorage.removeItem(
        RECOVERY_STORAGE_KEY,
      )

      await supabase.auth.signOut()

      navigate(
        '/',
        {
          replace:
            true,
        },
      )
    }

  if (
    checkingSession
  ) {
    return (
      <div className="login-page">
        <div className="login-card reset-password-card">
          <div className="app-loading-spinner"></div>

          <div className="login-heading reset-password-loading">
            <h2>
              Checking Reset Link
            </h2>

            <p>
              Please wait...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card reset-password-card">
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

        {!sessionValid ? (
          <>
            <div className="login-heading">
              <h2>
                Reset Link Invalid
              </h2>

              <p>
                This password reset request cannot be used.
              </p>
            </div>

            <div className="reset-password-invalid">
              <div className="reset-password-invalid-icon">
                !
              </div>

              <strong>
                Unable to reset password
              </strong>

              <p>
                {
                  errorMessage ||
                  'This password reset link is invalid or has expired.'
                }
              </p>

              <button
                type="button"
                className="login-button"
                onClick={
                  handleBackToLogin
                }
              >
                Back to Sign In
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="login-heading">
              <h2>
                Set New Password
              </h2>

              <p>
                Create a new password for your SwimCoach account.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={
                handleResetPassword
              }
            >
              <label className="login-field">
                <span>
                  New Password
                </span>

                <div className="reset-password-input-wrapper">
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

                      setErrorMessage(
                        '',
                      )
                    }}
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="reset-password-eye"
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

              <label className="login-field">
                <span>
                  Confirm Password
                </span>

                <div className="reset-password-input-wrapper">
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event,
                    ) => {
                      setConfirmPassword(
                        event.target.value,
                      )

                      setErrorMessage(
                        '',
                      )
                    }}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="reset-password-eye"
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

              <p className="reset-password-hint">
                Password must contain at least 6 characters.
              </p>

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

                  <span>
                    Returning to Sign In...
                  </span>
                </div>
              )}

              <button
                className="login-button"
                type="submit"
                disabled={
                  loading ||
                  Boolean(
                    successMessage,
                  )
                }
              >
                {loading
                  ? 'Updating...'
                  : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword