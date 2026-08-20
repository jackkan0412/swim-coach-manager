import {
  useMemo,
  useState,
} from 'react'

import MoneyDisplay from '../components/MoneyDisplay'
import Toast from '../components/Toast'
import PageLoading from '../components/PageLoading'
import PageError from '../components/PageError'

import useToast from '../hooks/useToast'

import { supabase } from '../lib/supabase'

import {
  useSwimCoach,
  type LessonStatus,
  type LessonType,
  type Split,
  type Student,
} from '../context/SwimCoachContext'

type DeleteLessonConfirmation = {
  sessionId: number
  studentName: string
  lessonType:
    | 'replacement'
    | 'extra'
  startTime: string
  endTime: string
} | null

type TodayLesson = {
  key: string
  sessionId: number | null
  student: Student
  lessonType: LessonType
  startTime: string
  endTime: string
  location: string
  lessonEarning: number
  coach: Student['defaultCoach']
  earningSplit: Split
  replacementForDate: string | null
}

type DraftSplitMap = {
  [lessonKey: string]:
    | Split
    | undefined
}

function Today() {
  const {
    currentCoach,
    profileLoading,

    students,
    lessonSessions,
    sessionsLoading,
    sessionsError,
    refreshLessonSessions,

    getRegularSession,
    getSessionById,

    updateAttendanceStatus,

    hasPendingPayment,
    getPendingCycles,

    isStudentActiveOnDate,

    refreshAll,
  } = useSwimCoach()

  const {
    toast,
    showSuccess,
    showError,
    hideToast,
  } = useToast()

  const [
    savingKey,
    setSavingKey,
  ] =
    useState<string | null>(
      null,
    )

  const [
    savingAction,
    setSavingAction,
  ] =
    useState<LessonStatus | null>(
      null,
    )

  const [
    draftSplits,
    setDraftSplits,
  ] =
    useState<DraftSplitMap>(
      {},
    )

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] =
    useState<DeleteLessonConfirmation>(
      null,
    )

  const [
    deletingLesson,
    setDeletingLesson,
  ] =
    useState(false)

  const now =
    new Date()

  const todayName =
    now.toLocaleDateString(
      'en-US',
      {
        weekday:
          'long',
      },
    )

  const dateKey = [
    now.getFullYear(),

    String(
      now.getMonth() +
        1,
    ).padStart(
      2,
      '0',
    ),

    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    ),
  ].join('-')

  const fullDate =
    now.toLocaleDateString(
      'en-GB',
      {
        weekday:
          'long',

        day:
          'numeric',

        month:
          'long',

        year:
          'numeric',
      },
    )

  const isLessonForCurrentCoach =
    (
      coach:
        Student['defaultCoach'],
    ) => {
      if (
        !currentCoach
      ) {
        return false
      }

      return (
        coach ===
          currentCoach ||
        coach ===
          'Jack + Thomas'
      )
    }

  const todayLessons =
    useMemo(() => {
      const replacedStudentIds =
        new Set(
          lessonSessions
            .filter(
              (session) =>
                session.lessonType ===
                  'replacement' &&
                session.replacementForDate ===
                  dateKey,
            )
            .map(
              (session) =>
                session.studentId,
            ),
        )

      const regularLessons:
        TodayLesson[] =
        students
          .filter(
            (student) =>
              student.day ===
                todayName &&
              isStudentActiveOnDate(
                student,
                dateKey,
              ) &&
              !replacedStudentIds.has(
                student.id,
              ),
          )
          .map(
            (student) => {
              const saved =
                getRegularSession(
                  student.id,
                  dateKey,
                )

              return {
                key:
                  saved
                    ? `session-${saved.id}`
                    : `regular-${student.id}-${dateKey}`,

                sessionId:
                  saved?.id ??
                  null,

                student,

                lessonType:
                  'regular',

                startTime:
                  saved?.startTime ??
                  student.startTime,

                endTime:
                  saved?.endTime ??
                  student.endTime,

                location:
                  saved?.location ??
                  student.location,

                lessonEarning:
                  saved?.lessonEarning ??
                  student.lessonEarning,

                coach:
                  saved?.coach ??
                  student.defaultCoach,

                earningSplit:
                  saved?.earningSplit ??
                  student.defaultSplit,

                replacementForDate:
                  null,
              }
            },
          )

      const specialLessons =
        lessonSessions
          .filter(
            (session) =>
              session.lessonDate ===
                dateKey &&
              session.lessonType !==
                'regular',
          )
          .map(
            (
              session,
            ):
              | TodayLesson
              | null => {
              const student =
                students.find(
                  (item) =>
                    item.id ===
                    session.studentId,
                )

              if (
                !student
              ) {
                return null
              }

              return {
                key:
                  `session-${session.id}`,

                sessionId:
                  session.id,

                student,

                lessonType:
                  session.lessonType,

                startTime:
                  session.startTime,

                endTime:
                  session.endTime,

                location:
                  session.location,

                lessonEarning:
                  session.lessonEarning,

                coach:
                  session.coach,

                earningSplit:
                  session.earningSplit,

                replacementForDate:
                  session.replacementForDate,
              }
            },
          )
          .filter(
            (
              lesson,
            ): lesson is
              TodayLesson =>
              lesson !==
              null,
          )

      return [
        ...regularLessons,
        ...specialLessons,
      ]
        .filter(
          (lesson) =>
            isLessonForCurrentCoach(
              lesson.coach,
            ),
        )
        .sort(
          (
            a,
            b,
          ) =>
            a.startTime.localeCompare(
              b.startTime,
            ),
        )
    }, [
      students,
      lessonSessions,
      dateKey,
      todayName,
      getRegularSession,
      isStudentActiveOnDate,
      currentCoach,
    ])

  const getLessonSession =
    (
      lesson:
        TodayLesson,
    ) => {
      if (
        lesson.sessionId ===
        null
      ) {
        return undefined
      }

      return getSessionById(
        lesson.sessionId,
      )
    }

  const getStatus =
    (
      lesson:
        TodayLesson,
    ): LessonStatus => {
      return (
        getLessonSession(
          lesson,
        )?.status ??
        'Pending'
      )
    }

  const getSavedSplit =
    (
      lesson:
        TodayLesson,
    ): Split => {
      return (
        getLessonSession(
          lesson,
        )?.earningSplit ??
        lesson.earningSplit
      )
    }

  const getSelectedSplit =
    (
      lesson:
        TodayLesson,
    ): Split => {
      return (
        draftSplits[
          lesson.key
        ] ??
        getSavedSplit(
          lesson,
        )
      )
    }

  /*
   * Pending classes stay on top.
   * Marked classes move below them.
   */
  const orderedTodayLessons =
    [...todayLessons]
      .sort(
        (
          a,
          b,
        ) => {
          const aPending =
            getStatus(
              a,
            ) ===
            'Pending'

          const bPending =
            getStatus(
              b,
            ) ===
            'Pending'

          if (
            aPending &&
            !bPending
          ) {
            return -1
          }

          if (
            !aPending &&
            bPending
          ) {
            return 1
          }

          return a.startTime.localeCompare(
            b.startTime,
          )
        },
      )

  const handleSplitSelect =
    (
      lesson:
        TodayLesson,
      split:
        Split,
    ) => {
      if (
        getStatus(
          lesson,
        ) !==
        'Pending'
      ) {
        return
      }

      setDraftSplits(
        (current) => ({
          ...current,

          [lesson.key]:
            split,
        }),
      )
    }

  const handleStatus =
    async (
      lesson:
        TodayLesson,
      status:
        LessonStatus,
    ) => {
      if (
        savingKey !==
        null
      ) {
        return
      }

      setSavingKey(
        lesson.key,
      )

      setSavingAction(
        status,
      )

      try {
        const selectedSplit =
          getSelectedSplit(
            lesson,
          )

        const success =
          await updateAttendanceStatus(
            lesson.sessionId,
            lesson.student.id,
            dateKey,
            status,
            selectedSplit,
          )

        if (
          !success
        ) {
          showError(
            `Unable to update ${lesson.student.name}'s attendance.`,
          )

          return
        }

        /*
         * Once saved, the database now owns
         * the split value, so remove draft.
         */
        setDraftSplits(
          (current) => {
            const next = {
              ...current,
            }

            delete next[
              lesson.key
            ]

            return next
          },
        )

        if (
          status ===
          'Pending'
        ) {
          showSuccess(
            `${lesson.student.name}'s attendance reset successfully.`,
          )

          return
        }

        showSuccess(
          `${lesson.student.name} marked ${status}.`,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          `Unable to update ${lesson.student.name}'s attendance.`,
        )
      } finally {
        setSavingKey(
          null,
        )

        setSavingAction(
          null,
        )
      }
    }

  const requestDeleteLesson =
    (
      lesson:
        TodayLesson,
    ) => {
      if (
        lesson.lessonType ===
          'regular' ||
        lesson.sessionId ===
          null
      ) {
        return
      }

      const session =
        getSessionById(
          lesson.sessionId,
        )

      if (
        !session
      ) {
        showError(
          'Unable to find this class.',
        )

        return
      }

      if (
        session.status ===
        'Present'
      ) {
        showError(
          `${lesson.student.name}'s ${lesson.lessonType} class is already Present. Reset the attendance first, then delete it.`,
        )

        return
      }

      setDeleteConfirmation({
        sessionId:
          lesson.sessionId,

        studentName:
          lesson.student.name,

        lessonType:
          lesson.lessonType,

        startTime:
          lesson.startTime,

        endTime:
          lesson.endTime,
      })
    }

  const confirmDeleteLesson =
    async () => {
      if (
        !deleteConfirmation
      ) {
        return
      }

      const {
        sessionId,
        studentName,
        lessonType,
      } =
        deleteConfirmation

      setDeletingLesson(
        true,
      )

      try {
        const {
          error,
        } =
          await supabase
            .from(
              'lesson_sessions',
            )
            .delete()
            .eq(
              'id',
              sessionId,
            )

        if (
          error
        ) {
          console.error(
            error,
          )

          showError(
            'Unable to delete this class.',
          )

          return
        }

        await refreshAll()

        setDeleteConfirmation(
          null,
        )

        showSuccess(
          `${studentName}'s ${
            lessonType ===
            'replacement'
              ? 'replacement'
              : 'extra'
          } class deleted successfully.`,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          'Unable to delete this class.',
        )
      } finally {
        setDeletingLesson(
          false,
        )
      }
    }

  const markedCount =
    todayLessons.filter(
      (lesson) =>
        getStatus(
          lesson,
        ) !==
        'Pending',
    ).length

  const presentCount =
    todayLessons.filter(
      (lesson) =>
        getStatus(
          lesson,
        ) ===
        'Present',
    ).length

  const absentCount =
    todayLessons.filter(
      (lesson) =>
        getStatus(
          lesson,
        ) ===
        'Absent',
    ).length

  const cancelledCount =
    todayLessons.filter(
      (lesson) =>
        getStatus(
          lesson,
        ) ===
        'Cancelled',
    ).length

  return (
    <div className="today-page">
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

      <div className="today-header">
        <div>
          <p className="small-text">
            {
              fullDate
            }
          </p>

          <h1>
            Today's Classes
          </h1>

          <p className="subtitle">
            Mark attendance for today's lessons.
          </p>
        </div>

        <div className="today-progress">
          {
            markedCount
          }
          {' / '}
          {
            todayLessons.length
          }
          {' marked'}
        </div>
      </div>

      <div className="today-summary">
        <div className="today-summary-card">
          <span>
            Total Classes
          </span>

          <strong>
            {
              todayLessons.length
            }
          </strong>
        </div>

        <div className="today-summary-card">
          <span>
            Present
          </span>

          <strong>
            {
              presentCount
            }
          </strong>
        </div>

        <div className="today-summary-card">
          <span>
            Absent
          </span>

          <strong>
            {
              absentCount
            }
          </strong>
        </div>

        <div className="today-summary-card">
          <span>
            Cancelled
          </span>

          <strong>
            {
              cancelledCount
            }
          </strong>
        </div>
      </div>

      {(profileLoading ||
        sessionsLoading) &&
      lessonSessions.length ===
        0 ? (
        <PageLoading
          title="Loading Classes"
          message="Loading today's lesson records..."
        />
      ) : sessionsError &&
        lessonSessions.length ===
          0 ? (
        <PageError
          title="Unable to load today's classes"
          message={
            sessionsError
          }
          onRetry={() => {
            void refreshLessonSessions()
          }}
        />
      ) : orderedTodayLessons.length >
        0 ? (
        <div className="today-list">
          {orderedTodayLessons.map(
            (lesson) => {
              const student =
                lesson.student

              const status =
                getStatus(
                  lesson,
                )

              const split =
                getSelectedSplit(
                  lesson,
                )

              const saving =
                savingKey ===
                lesson.key

              const paymentPending =
                hasPendingPayment(
                  student.id,
                )

              const pendingCycles =
                getPendingCycles(
                  student.id,
                )

              const isSpecialLesson =
                lesson.lessonType ===
                  'extra' ||
                lesson.lessonType ===
                  'replacement'

              /*
               * Marked class:
               * compact and moved below Pending classes.
               */
              if (
                status !==
                'Pending'
              ) {
                return (
                  <div
                    className={`today-lesson-card today-lesson-card-compact ${status.toLowerCase()}`}
                    key={
                      lesson.key
                    }
                  >
                    <div className="today-compact-main">
                      <div className="today-compact-info">
                        <h2>
                          {
                            student.name
                          }
                        </h2>

                        <p>
                          {
                            lesson.startTime
                          }
                          {' - '}
                          {
                            lesson.endTime
                          }
                        </p>
                      </div>

                      <button
                        className="today-compact-reset"
                        type="button"
                        disabled={
                          savingKey !==
                          null
                        }
                        onClick={() =>
                          handleStatus(
                            lesson,
                            'Pending',
                          )
                        }
                      >
                        {saving &&
                        savingAction ===
                          'Pending'
                          ? 'Resetting...'
                          : 'Reset'}
                      </button>
                    </div>
                  </div>
                )
              }

              /*
               * Pending:
               * full controls remain available.
               */
              return (
                <div
                  className={`today-lesson-card ${
                    paymentPending
                      ? 'payment-pending-card'
                      : ''
                  }`}
                  key={
                    lesson.key
                  }
                >
                  {paymentPending && (
                    <div className="payment-warning">
                      <div className="payment-warning-icon">
                        !
                      </div>

                      <div>
                        <strong>
                          PAYMENT PENDING
                        </strong>

                        <span>
                          {pendingCycles.length ===
                          1
                            ? 'Previous 4-lesson cycle has not been marked as paid.'
                            : `${pendingCycles.length} completed cycles have not been marked as paid.`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="today-lesson-type-row">
                    <span
                      className={`today-lesson-type ${lesson.lessonType}`}
                    >
                      {lesson.lessonType ===
                      'regular'
                        ? 'Regular'
                        : lesson.lessonType ===
                          'replacement'
                        ? 'Replacement'
                        : 'Extra'}
                    </span>

                    {lesson.lessonType ===
                      'replacement' &&
                      lesson.replacementForDate && (
                        <span className="today-replacement-note">
                          Replaces{' '}
                          {
                            lesson.replacementForDate
                          }
                        </span>
                      )}
                  </div>

                  <div className="today-lesson-top">
                    <div>
                      <h2
                        className={
                          paymentPending
                            ? 'payment-pending-name'
                            : ''
                        }
                      >
                        {
                          student.name
                        }
                      </h2>

                      <p>
                        {
                          lesson.startTime
                        }
                        {' - '}
                        {
                          lesson.endTime
                        }
                      </p>
                    </div>

                    <span className="today-status pending">
                      {saving
                        ? 'Saving...'
                        : 'Pending'}
                    </span>
                  </div>

                  <div className="today-lesson-details">
                    <div>
                      <span>
                        Location
                      </span>

                      <strong>
                        {
                          lesson.location
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Lesson Earning
                      </span>

                      <MoneyDisplay
                        amount={
                          lesson.lessonEarning
                        }
                        decimals={
                          0
                        }
                        className="today-money"
                      />
                    </div>

                    <div>
                      <span>
                        Coach
                      </span>

                      <strong>
                        {
                          lesson.coach
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="today-split-section">
                    <div className="today-split-header">
                      <div>
                        <span>
                          Earning Split
                        </span>

                        <strong>
                          {
                            split
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="split-buttons">
                      <button
                        type="button"
                        className={`split-button ${
                          split ===
                          'Jack 100%'
                            ? 'selected'
                            : ''
                        }`}
                        disabled={
                          savingKey !==
                          null
                        }
                        onClick={() =>
                          handleSplitSelect(
                            lesson,
                            'Jack 100%',
                          )
                        }
                      >
                        Jack 100%
                      </button>

                      <button
                        type="button"
                        className={`split-button ${
                          split ===
                          '50 / 50'
                            ? 'selected'
                            : ''
                        }`}
                        disabled={
                          savingKey !==
                          null
                        }
                        onClick={() =>
                          handleSplitSelect(
                            lesson,
                            '50 / 50',
                          )
                        }
                      >
                        50 / 50
                      </button>

                      <button
                        type="button"
                        className={`split-button ${
                          split ===
                          'Thomas 100%'
                            ? 'selected'
                            : ''
                        }`}
                        disabled={
                          savingKey !==
                          null
                        }
                        onClick={() =>
                          handleSplitSelect(
                            lesson,
                            'Thomas 100%',
                          )
                        }
                      >
                        Thomas 100%
                      </button>
                    </div>
                  </div>

                  <div
                    className={`attendance-actions ${
                      paymentPending
                        ? 'payment-pending-attendance'
                        : ''
                    }`}
                  >
                    <button
                      className="attendance-action present"
                      type="button"
                      disabled={
                        savingKey !==
                        null
                      }
                      onClick={() =>
                        handleStatus(
                          lesson,
                          'Present',
                        )
                      }
                    >
                      {saving &&
                      savingAction ===
                        'Present'
                        ? 'Saving...'
                        : 'Present'}
                    </button>

                    <button
                      className="attendance-action absent"
                      type="button"
                      disabled={
                        savingKey !==
                        null
                      }
                      onClick={() =>
                        handleStatus(
                          lesson,
                          'Absent',
                        )
                      }
                    >
                      {saving &&
                      savingAction ===
                        'Absent'
                        ? 'Saving...'
                        : 'Absent'}
                    </button>

                    {isSpecialLesson ? (
                      <button
                        className="attendance-action delete"
                        type="button"
                        disabled={
                          savingKey !==
                          null
                        }
                        onClick={() =>
                          requestDeleteLesson(
                            lesson,
                          )
                        }
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        className="attendance-action cancelled"
                        type="button"
                        disabled={
                          savingKey !==
                          null
                        }
                        onClick={() =>
                          handleStatus(
                            lesson,
                            'Cancelled',
                          )
                        }
                      >
                        {saving &&
                        savingAction ===
                          'Cancelled'
                          ? 'Saving...'
                          : 'Cancelled'}
                      </button>
                    )}
                  </div>
                </div>
              )
            },
          )}
        </div>
      ) : (
        <div className="schedule-empty">
          <div className="schedule-empty-icon">
            🏊
          </div>

          <h3>
            No classes today
          </h3>

          <p>
            There are no lessons scheduled for today.
          </p>
        </div>
      )}

      {deleteConfirmation && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (
              !deletingLesson
            ) {
              setDeleteConfirmation(
                null,
              )
            }
          }}
        >
          <div
            className="confirm-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <h2>
              Delete{' '}
              {deleteConfirmation.lessonType ===
              'replacement'
                ? 'Replacement'
                : 'Extra'}{' '}
              Class?
            </h2>

            <p>
              <strong>
                {
                  deleteConfirmation.studentName
                }
              </strong>

              <br />

              {
                deleteConfirmation.startTime
              }
              {' - '}
              {
                deleteConfirmation.endTime
              }

              <br />

              This class will be permanently removed.
            </p>

            <div className="confirm-actions">
              <button
                className="cancel-button"
                type="button"
                disabled={
                  deletingLesson
                }
                onClick={() =>
                  setDeleteConfirmation(
                    null,
                  )
                }
              >
                Keep Class
              </button>

              <button
                className="confirm-remove-button"
                type="button"
                disabled={
                  deletingLesson
                }
                onClick={
                  confirmDeleteLesson
                }
              >
                {deletingLesson
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Today