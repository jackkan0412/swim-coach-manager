import {
  useEffect,
  useState,
  type FormEvent,
  type PointerEvent,
} from 'react'

import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

import { supabase } from '../lib/supabase'

import {
  useSwimCoach,
} from '../context/SwimCoachContext'

function Settings() {
  const {
    currentCoach,
  } = useSwimCoach()

  const {
    toast,
    showSuccess,
    showError,
    hideToast,
  } = useToast()

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    savingEmail,
    setSavingEmail,
  ] =
    useState(false)

  const [
    savingPassword,
    setSavingPassword,
  ] =
    useState(false)

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false)

  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    originalEmail,
    setOriginalEmail,
  ] =
    useState('')

  const [
    editingEmail,
    setEditingEmail,
  ] =
    useState(false)

  const [
    changingPassword,
    setChangingPassword,
  ] =
    useState(false)

  const [
    newPassword,
    setNewPassword,
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
    formError,
    setFormError,
  ] =
    useState('')

  useEffect(() => {
    const loadUser =
      async () => {
        setLoading(
          true,
        )

        setFormError(
          '',
        )

        try {
          const {
            data,
            error:
              userError,
          } =
            await supabase.auth.getUser()

          if (
            userError
          ) {
            console.error(
              userError,
            )

            showError(
              'Unable to load account information.',
            )

            setLoading(
              false,
            )

            return
          }

          const user =
            data.user

          setEmail(
            user?.email ??
            '',
          )

          setOriginalEmail(
            user?.email ??
            '',
          )
        } catch (
          error
        ) {
          console.error(
            error,
          )

          showError(
            'Unable to load account information.',
          )
        } finally {
          setLoading(
            false,
          )
        }
      }

    void loadUser()
  }, [
    showError,
  ])

  const clearFormError =
    () => {
      setFormError(
        '',
      )
    }

  const saveEmail =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      clearFormError()

      const trimmedEmail =
        email
          .trim()
          .toLowerCase()

      if (
        !trimmedEmail
      ) {
        setFormError(
          'Email cannot be empty.',
        )

        return
      }

      if (
        trimmedEmail ===
        originalEmail
          .trim()
          .toLowerCase()
      ) {
        setEditingEmail(
          false,
        )

        return
      }

      setSavingEmail(
        true,
      )

      try {
        const {
          data,
          error:
            updateError,
        } =
          await supabase.auth.updateUser(
            {
              email:
                trimmedEmail,
            },
          )

        if (
          updateError
        ) {
          console.error(
            updateError,
          )

          showError(
            updateError.message ||
            'Unable to update email.',
          )

          return
        }

        const updatedEmail =
          data.user?.email ??
          trimmedEmail

        setEmail(
          updatedEmail,
        )

        setOriginalEmail(
          updatedEmail,
        )

        setEditingEmail(
          false,
        )

        showSuccess(
          'Email update requested. Check your email if confirmation is required.',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          'Unable to update email.',
        )
      } finally {
        setSavingEmail(
          false,
        )
      }
    }

  const savePassword =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      clearFormError()

      if (
        newPassword.length <
        6
      ) {
        setFormError(
          'Password must be at least 6 characters.',
        )

        return
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setFormError(
          'Passwords do not match.',
        )

        return
      }

      setSavingPassword(
        true,
      )

      try {
        const {
          error:
            updateError,
        } =
          await supabase.auth.updateUser(
            {
              password:
                newPassword,
            },
          )

        if (
          updateError
        ) {
          console.error(
            updateError,
          )

          showError(
            updateError.message ||
            'Unable to update password.',
          )

          return
        }

        setNewPassword(
          '',
        )

        setConfirmPassword(
          '',
        )

        setShowPassword(
          false,
        )

        setChangingPassword(
          false,
        )

        showSuccess(
          'Password updated successfully.',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          'Unable to update password.',
        )
      } finally {
        setSavingPassword(
          false,
        )
      }
    }

  const startShowingPassword =
    (
      event:
        PointerEvent<HTMLButtonElement>,
    ) => {
      event.preventDefault()

      setShowPassword(
        true,
      )
    }

  const stopShowingPassword =
    () => {
      setShowPassword(
        false,
      )
    }

  const handleLogout =
    async () => {
      if (
        loggingOut
      ) {
        return
      }

      clearFormError()

      setLoggingOut(
        true,
      )

      try {
        const {
          error:
            logoutError,
        } =
          await supabase.auth.signOut()

        if (
          logoutError
        ) {
          console.error(
            logoutError,
          )

          showError(
            logoutError.message ||
            'Unable to log out.',
          )

          return
        }

        /*
         * App.tsx listens for SIGNED_OUT,
         * so we do not need to manually
         * force /login here.
         */
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          'Unable to log out.',
        )
      } finally {
        setLoggingOut(
          false,
        )
      }
    }

  if (
    loading
  ) {
    return (
      <div className="settings-page">
        {toast && (
          <Toast
            type={
              toast.type
            }
            message={
              toast.message
            }
            onClose={
              hideToast
            }
          />
        )}

        <div className="settings-loading">
          <div className="app-loading-spinner"></div>

          <p>
            Loading account...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      {toast && (
        <Toast
          type={
            toast.type
          }
          message={
            toast.message
          }
          onClose={
            hideToast
          }
        />
      )}

      <div className="settings-header">
        <div>
          <p className="small-text">
            Account & App
          </p>

          <h1>
            Settings
          </h1>

          <p className="subtitle">
            Manage your account information.
          </p>
        </div>
      </div>

      {formError && (
        <div className="login-error">
          {
            formError
          }
        </div>
      )}

      <section className="settings-section">
        <div className="settings-section-title">
          <div>
            <span className="settings-section-eyebrow">
              Account
            </span>

            <h2>
              Account Information
            </h2>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-account-row">
            <div className="settings-account-content">
              <span>
                Account Name
              </span>

              <strong>
                {currentCoach ===
                'Thomas'
                  ? 'Thomas'
                  : 'Jack'}
              </strong>
            </div>
          </div>

          <div className="settings-account-row">
            <div className="settings-account-content">
              <span>
                Email
              </span>

              {!editingEmail ? (
                <strong>
                  {email}
                </strong>
              ) : (
                <form
                  className="settings-inline-form"
                  onSubmit={
                    saveEmail
                  }
                >
                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event,
                    ) => {
                      clearFormError()

                      setEmail(
                        event.target.value,
                      )
                    }}
                    autoFocus
                  />

                  <div className="settings-inline-actions">
                    <button
                      type="button"
                      className="settings-small-button secondary"
                      disabled={
                        savingEmail
                      }
                      onClick={() => {
                        setEmail(
                          originalEmail,
                        )

                        setEditingEmail(
                          false,
                        )

                        clearFormError()
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="settings-small-button primary"
                      disabled={
                        savingEmail
                      }
                    >
                      {savingEmail
                        ? 'Saving...'
                        : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!editingEmail && (
              <button
                type="button"
                className="settings-edit-button"
                onClick={() => {
                  clearFormError()

                  setEditingEmail(
                    true,
                  )
                }}
              >
                Edit
              </button>
            )}
          </div>

          <div className="settings-account-row password-row">
            <div className="settings-account-content">
              <span>
                Password
              </span>

              {!changingPassword ? (
                <strong>
                  ••••••••••••
                </strong>
              ) : (
                <form
                  className="settings-password-form"
                  onSubmit={
                    savePassword
                  }
                >
                  <label className="settings-password-field">
                    <span>
                      New Password
                    </span>

                    <div className="settings-password-input">
                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={
                          newPassword
                        }
                        onChange={(
                          event,
                        ) => {
                          clearFormError()

                          setNewPassword(
                            event.target.value,
                          )
                        }}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                      />

                      <button
                        type="button"
                        className="settings-password-eye"
                        aria-label="Hold to show password"
                        onPointerDown={
                          startShowingPassword
                        }
                        onPointerUp={
                          stopShowingPassword
                        }
                        onPointerLeave={
                          stopShowingPassword
                        }
                        onPointerCancel={
                          stopShowingPassword
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

                  <label className="settings-password-field">
                    <span>
                      Confirm Password
                    </span>

                    <div className="settings-password-input">
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
                          clearFormError()

                          setConfirmPassword(
                            event.target.value,
                          )
                        }}
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                      />

                      <button
                        type="button"
                        className="settings-password-eye"
                        aria-label="Hold to show password"
                        onPointerDown={
                          startShowingPassword
                        }
                        onPointerUp={
                          stopShowingPassword
                        }
                        onPointerLeave={
                          stopShowingPassword
                        }
                        onPointerCancel={
                          stopShowingPassword
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

                  <p className="settings-password-hint">
                    Hold the eye icon to show the password.
                    Release to hide it again.
                  </p>

                  <div className="settings-inline-actions">
                    <button
                      type="button"
                      className="settings-small-button secondary"
                      disabled={
                        savingPassword
                      }
                      onClick={() => {
                        setChangingPassword(
                          false,
                        )

                        setNewPassword(
                          '',
                        )

                        setConfirmPassword(
                          '',
                        )

                        setShowPassword(
                          false,
                        )

                        clearFormError()
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="settings-small-button primary"
                      disabled={
                        savingPassword
                      }
                    >
                      {savingPassword
                        ? 'Updating...'
                        : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!changingPassword && (
              <button
                type="button"
                className="settings-edit-button"
                onClick={() => {
                  clearFormError()

                  setChangingPassword(
                    true,
                  )
                }}
              >
                Change
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title">
          <div>
            <span className="settings-section-eyebrow">
              Session
            </span>

            <h2>
              Account Session
            </h2>
          </div>
        </div>

        <div className="settings-logout-card">
          <div className="settings-logout-info">
            <strong>
              Log Out
            </strong>

            <p>
              Sign out of your account on this device.
            </p>
          </div>

          <button
            type="button"
            className="settings-logout-button"
            onClick={
              handleLogout
            }
            disabled={
              loggingOut
            }
          >
            {loggingOut
              ? 'Logging Out...'
              : 'Log Out'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title">
          <div>
            <span className="settings-section-eyebrow">
              App Settings
            </span>

            <h2>
              More Settings
            </h2>
          </div>
        </div>

        <div className="settings-developing-card">
          <div className="settings-developing-icon">
            ⚙
          </div>

          <div>
            <strong>
              Still developing...
            </strong>

            <p>
              More settings and account options will be available here later.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Settings