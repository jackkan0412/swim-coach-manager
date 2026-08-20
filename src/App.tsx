import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import type {
  Session,
} from '@supabase/supabase-js'

import { supabase } from './lib/supabase'

import AppLoading from './components/AppLoading'
import AppError from './components/AppError'

import Dashboard from './pages/Dashboard'
import Today from './pages/Today'
import MissingAttendance from './pages/MissingAttendance'
import Students from './pages/Students'
import Schedule from './pages/Schedule'
import Earnings from './pages/Earnings'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'

import './App.css'

type Profile = {
  user_id: string
  coach_name:
    | 'Jack'
    | 'Thomas'
}

const RECOVERY_STORAGE_KEY =
  'swimcoach-password-recovery'

function App() {
  const location =
    useLocation()

  const isResetPasswordPage =
    location.pathname ===
    '/reset-password'

  const [
    session,
    setSession,
  ] =
    useState<Session | null>(
      null,
    )

  const [
    profile,
    setProfile,
  ] =
    useState<Profile | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    loadError,
    setLoadError,
  ] =
    useState('')

  const [
    profileMissing,
    setProfileMissing,
  ] =
    useState(false)

  const [
    recoveryReady,
    setRecoveryReady,
  ] =
    useState(() => {
      return (
        sessionStorage.getItem(
          RECOVERY_STORAGE_KEY,
        ) ===
        'true'
      )
    })

  const loadProfile =
    useCallback(
      async (
        currentSession:
          Session | null,
      ) => {
        if (
          !currentSession
        ) {
          setProfile(
            null,
          )

          setProfileMissing(
            false,
          )

          setLoadError(
            '',
          )

          setLoading(
            false,
          )

          return
        }

        setLoading(
          true,
        )

        setLoadError(
          '',
        )

        setProfileMissing(
          false,
        )

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'profiles',
            )
            .select(
              'user_id, coach_name',
            )
            .eq(
              'user_id',
              currentSession.user.id,
            )
            .maybeSingle()

        if (
          error
        ) {
          console.error(
            error,
          )

          setProfile(
            null,
          )

          setLoadError(
            'Unable to load your SwimCoach account. Check your internet connection and try again.',
          )

          setLoading(
            false,
          )

          return
        }

        if (
          !data
        ) {
          setProfile(
            null,
          )

          setProfileMissing(
            true,
          )

          setLoading(
            false,
          )

          return
        }

        setProfile(
          data as Profile,
        )

        setLoadError(
          '',
        )

        setProfileMissing(
          false,
        )

        setLoading(
          false,
        )
      },
      [],
    )

  const loadApp =
    useCallback(
      async () => {
        setLoading(
          true,
        )

        setLoadError(
          '',
        )

        try {
          const {
            data: {
              session:
                currentSession,
            },

            error:
              sessionError,
          } =
            await supabase.auth.getSession()

          if (
            sessionError
          ) {
            console.error(
              sessionError,
            )

            setLoadError(
              'Unable to connect to your account. Please check your connection and try again.',
            )

            setLoading(
              false,
            )

            return
          }

          setSession(
            currentSession,
          )

          if (
            window.location.pathname ===
            '/reset-password'
          ) {
            setLoading(
              false,
            )

            return
          }

          await loadProfile(
            currentSession,
          )
        } catch (
          error
        ) {
          console.error(
            error,
          )

          setLoadError(
            'Something went wrong while loading SwimCoach.',
          )

          setLoading(
            false,
          )
        }
      },
      [
        loadProfile,
      ],
    )

  useEffect(() => {
    void loadApp()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          newSession,
        ) => {
          setSession(
            newSession,
          )

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {
            sessionStorage.setItem(
              RECOVERY_STORAGE_KEY,
              'true',
            )

            setRecoveryReady(
              true,
            )

            setLoading(
              false,
            )

            return
          }

          if (
            event ===
              'SIGNED_OUT' ||
            !newSession
          ) {
            setProfile(
              null,
            )

            setProfileMissing(
              false,
            )

            setLoadError(
              '',
            )

            setLoading(
              false,
            )

            return
          }

          if (
            window.location.pathname ===
            '/reset-password'
          ) {
            setLoading(
              false,
            )

            return
          }

          if (
            event ===
              'SIGNED_IN' ||
            event ===
              'TOKEN_REFRESHED' ||
            event ===
              'USER_UPDATED'
          ) {
            void loadProfile(
              newSession,
            )
          }
        },
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [
    loadApp,
    loadProfile,
  ])

  const handleRetry =
    () => {
      void loadApp()
    }

  const handleLogout =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signOut()

      if (
        error
      ) {
        console.error(
          error,
        )

        setLoadError(
          'Unable to log out. Please try again.',
        )
      }
    }

  if (
    isResetPasswordPage
  ) {
    return (
      <ResetPassword
        recoveryReady={
          recoveryReady
        }
      />
    )
  }

  if (
    loading
  ) {
    return (
      <AppLoading
        title="SwimCoach"
        message="Loading your account..."
      />
    )
  }

  if (
    loadError
  ) {
    return (
      <AppError
        title="Unable to load SwimCoach"
        message={
          loadError
        }
        onRetry={
          handleRetry
        }
      />
    )
  }

  if (
    !session
  ) {
    return (
      <Login />
    )
  }

  if (
    profileMissing ||
    !profile
  ) {
    return (
      <div className="access-denied-page">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            !
          </div>

          <h1>
            Access Denied
          </h1>

          <p>
            This account is not authorized to use SwimCoach.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={
              handleLogout
            }
          >
            Log Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            🏊
          </div>

          <div>
            <h2>
              SwimCoach
            </h2>

            <p>
              Manager
            </p>
          </div>
        </div>

        <nav className="nav">
          <NavLink
            to="/"
            className="nav-item"
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/today"
            className="nav-item"
          >
            Today
          </NavLink>

          <NavLink
            to="/students"
            className="nav-item"
          >
            Students
          </NavLink>

          <NavLink
            to="/schedule"
            className="nav-item"
          >
            Schedule
          </NavLink>

          <NavLink
            to="/earnings"
            className="nav-item"
          >
            Earnings
          </NavLink>

          <NavLink
            to="/settings"
            className="nav-item"
          >
            Settings
          </NavLink>
        </nav>

        <div className="user">
          <div className="avatar">
            {
              profile.coach_name.charAt(
                0,
              )
            }
          </div>

          <div className="user-info">
            <strong>
              {
                profile.coach_name
              }
            </strong>

            <p>
              Swimming Coach
            </p>
          </div>

          <button
            className="desktop-logout-button"
            type="button"
            onClick={
              handleLogout
            }
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/today"
            element={
              <Today />
            }
          />

          <Route
            path="/missing-attendance"
            element={
              <MissingAttendance />
            }
          />

          <Route
            path="/students"
            element={
              <Students />
            }
          />

          <Route
            path="/schedule"
            element={
              <Schedule />
            }
          />

          <Route
            path="/earnings"
            element={
              <Earnings />
            }
          />

          <Route
            path="/settings"
            element={
              <Settings />
            }
          />

          <Route
            path="*"
            element={
              <AppError
                title="Page not found"
                message="The page you are looking for does not exist."
                onRetry={() => {
                  window.location.href =
                    '/'
                }}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App