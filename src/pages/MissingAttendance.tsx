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

type MissingLesson = {
  key: string
  sessionId: number | null
  student: Student
  lessonDate: string
  lessonType: LessonType
  startTime: string
  endTime: string
  location: string
  lessonEarning: number
  coach: Student['defaultCoach']
  earningSplit: Split
  replacementForDate: string | null
}

type DeleteLessonConfirmation = {
  sessionId: number
  studentName: string
  lessonType:
    | 'replacement'
    | 'extra'
  lessonDate: string
  startTime: string
  endTime: string
} | null

function getDateKey(
  date: Date,
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1,
    ).padStart(2, '0'),

    String(
      date.getDate(),
    ).padStart(2, '0'),
  ].join('-')
}

function addDays(
  dateKey: string,
  amount: number,
) {
  const date =
    new Date(
      `${dateKey}T00:00:00`,
    )

  date.setDate(
    date.getDate() +
      amount,
  )

  return getDateKey(
    date,
  )
}

function getWeekday(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
    },
  )
}

function formatDate(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function hasLessonEnded(
  lessonDate: string,
  startTime: string,
  endTime: string,
  now: Date,
) {
  const start =
    new Date(
      `${lessonDate}T${startTime}:00`,
    )

  const end =
    new Date(
      `${lessonDate}T${endTime}:00`,
    )

  if (
    end.getTime() <=
    start.getTime()
  ) {
    end.setDate(
      end.getDate() + 1,
    )
  }

  return (
    now.getTime() >
    end.getTime()
  )
}

function getLessonTypeLabel(
  lessonType: LessonType,
) {
  if (
    lessonType ===
    'replacement'
  ) {
    return 'Replacement'
  }

  if (
    lessonType ===
    'extra'
  ) {
    return 'Extra'
  }

  return 'Regular'
}

function MissingAttendance() {
  const {
    students,
    lessonSessions,

    studentsLoading,
    studentsError,
    sessionsLoading,
    sessionsError,

    refreshAll,
    getRegularSession,
    getSessionById,

    updateAttendanceStatus,

    hasPendingPayment,
    getPendingCycles,

    isStudentActiveOnDate,
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

  const todayKey =
    getDateKey(
      now,
    )

  const missingLessons =
    useMemo(() => {
      const lessons:
        MissingLesson[] =
        []

      students.forEach(
        (student) => {
          const trackingStart =
            student.attendanceTrackingStartDate

          if (
            !trackingStart
          ) {
            return
          }

          let dateKey =
            trackingStart

          while (
            dateKey <=
            todayKey
          ) {
            const weekday =
              getWeekday(
                dateKey,
              )

            if (
              weekday ===
                student.day &&
              isStudentActiveOnDate(
                student,
                dateKey,
              )
            ) {
              const replacementExists =
                lessonSessions.some(
                  (session) =>
                    session.studentId ===
                      student.id &&
                    session.lessonType ===
                      'replacement' &&
                    session.replacementForDate ===
                      dateKey,
                )

              if (
                !replacementExists
              ) {
                const saved =
                  getRegularSession(
                    student.id,
                    dateKey,
                  )

                const startTime =
                  saved?.startTime ??
                  student.startTime

                const endTime =
                  saved?.endTime ??
                  student.endTime

                const ended =
                  hasLessonEnded(
                    dateKey,
                    startTime,
                    endTime,
                    now,
                  )

                const isMissing =
                  ended &&
                  (
                    !saved ||
                    saved.status ===
                      'Pending'
                  )

                if (
                  isMissing
                ) {
                  lessons.push({
                    key:
                      saved
                        ? `session-${saved.id}`
                        : `regular-${student.id}-${dateKey}`,

                    sessionId:
                      saved?.id ??
                      null,

                    student,

                    lessonDate:
                      dateKey,

                    lessonType:
                      'regular',

                    startTime,

                    endTime,

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
                  })
                }
              }
            }

            dateKey =
              addDays(
                dateKey,
                1,
              )
          }
        },
      )

      lessonSessions
        .filter(
          (session) =>
            session.lessonType !==
              'regular' &&
            session.status ===
              'Pending' &&
            hasLessonEnded(
              session.lessonDate,
              session.startTime,
              session.endTime,
              now,
            ),
        )
        .forEach(
          (session) => {
            const student =
              students.find(
                (item) =>
                  item.id ===
                  session.studentId,
              )

            if (
              !student
            ) {
              return
            }

            lessons.push({
              key:
                `session-${session.id}`,

              sessionId:
                session.id,

              student,

              lessonDate:
                session.lessonDate,

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
            })
          },
        )

      return lessons.sort(
        (
          a,
          b,
        ) =>
          a.lessonDate.localeCompare(
            b.lessonDate,
          ) ||
          a.startTime.localeCompare(
            b.startTime,
          ),
      )
    }, [
      students,
      lessonSessions,
      todayKey,
      getRegularSession,
      isStudentActiveOnDate,
    ])

  const getLessonSession = (
    lesson: MissingLesson,
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

  const getSplit = (
    lesson: MissingLesson,
  ) => {
    return (
      getLessonSession(
        lesson,
      )?.earningSplit ??
      lesson.earningSplit
    )
  }

  const handleStatus =
    async (
      lesson: MissingLesson,
      status: LessonStatus,
    ) => {
      if (
        savingKey !== null
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
        const success =
          await updateAttendanceStatus(
            lesson.sessionId,
            lesson.student.id,
            lesson.lessonDate,
            status,
            getSplit(
              lesson,
            ),
          )

        if (!success) {
          showError(
            `Unable to update ${lesson.student.name}'s attendance.`,
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

  const requestDeleteLesson = (
    lesson: MissingLesson,
  ) => {
    if (
      lesson.lessonType ===
        'regular' ||
      lesson.sessionId ===
        null
    ) {
      return
    }

    setDeleteConfirmation({
      sessionId:
        lesson.sessionId,

      studentName:
        lesson.student.name,

      lessonType:
        lesson.lessonType,

      lessonDate:
        lesson.lessonDate,

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
          `${studentName}'s ${getLessonTypeLabel(
            lessonType,
          )} class deleted successfully.`,
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

  const loading =
    studentsLoading ||
    sessionsLoading

  return (
    <div className="today-page missing-attendance-page">
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

      <div className="today-header missing-attendance-header">
        <div>
          <p className="small-text">
            Attendance Review
          </p>

          <h1>
            Missing Attendance
          </h1>

          <p className="subtitle">
            Review past lessons that still need attendance.
          </p>
        </div>

        <div className="today-progress missing-attendance-count">
          {
            missingLessons.length
          }{' '}
          Missing
        </div>
      </div>

      {loading &&
      students.length === 0 &&
      lessonSessions.length ===
        0 ? (
        <PageLoading
          title="Loading Missing Attendance"
          message="Checking past lesson records..."
        />
      ) : (studentsError ||
          sessionsError) &&
        students.length === 0 &&
        lessonSessions.length ===
          0 ? (
        <PageError
          title="Unable to load missing attendance"
          message={
            studentsError ||
            sessionsError
          }
          onRetry={() => {
            void refreshAll()
          }}
        />
      ) : missingLessons.length >
        0 ? (
        <div className="today-list">
          {missingLessons.map(
            (
              lesson,
            ) => {
              const saving =
                savingKey ===
                lesson.key

              const paymentPending =
                hasPendingPayment(
                  lesson.student.id,
                )

              const pendingCycles =
                getPendingCycles(
                  lesson.student.id,
                )

              const isSpecialLesson =
                lesson.lessonType ===
                  'extra' ||
                lesson.lessonType ===
                  'replacement'

              return (
                <div
                  className={`today-lesson-card missing-attendance-card ${
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

                  <div className="missing-attendance-date-row">
                    <span>
                      {
                        formatDate(
                          lesson.lessonDate,
                        )
                      }
                    </span>

                    <strong>
                      Missing
                    </strong>
                  </div>

                  <div className="today-lesson-type-row">
                    <span
                      className={`today-lesson-type ${lesson.lessonType}`}
                    >
                      {
                        getLessonTypeLabel(
                          lesson.lessonType,
                        )
                      }
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
                          lesson.student.name
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
                            getSplit(
                              lesson,
                            )
                          }
                        </strong>
                      </div>
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
        <div className="schedule-empty missing-attendance-empty">
          <div className="schedule-empty-icon">
            ✓
          </div>

          <h3>
            All caught up
          </h3>

          <p>
            There are no lessons with missing attendance.
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
                formatDate(
                  deleteConfirmation.lessonDate,
                )
              }

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

export default MissingAttendance