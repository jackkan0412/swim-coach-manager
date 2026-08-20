import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import PageLoading from '../components/PageLoading'
import PageError from '../components/PageError'

import {
  useSwimCoach,
  type LessonCycle,
  type LessonType,
  type Student,
} from '../context/SwimCoachContext'

type DashboardLesson = {
  key: string
  sessionId: number | null
  student: Student
  lessonDate: string
  lessonType: LessonType
  startTime: string
  endTime: string
  location: string
  coach: Student['defaultCoach']
}

type MissingAttendanceItem = {
  key: string
  studentId: number
  lessonDate: string
  startTime: string
  endTime: string
  lessonType: LessonType
}

type PaymentProofMap = {
  [cycleId: number]:
    | File
    | null
}

type PaymentErrorMap = {
  [cycleId: number]:
    | string
    | undefined
}

function getDateKey(
  date: Date,
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      '0',
    ),

    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    ),
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
      weekday:
        'long',
    },
  )
}

function getDateLabel(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      weekday:
        'short',

      day:
        'numeric',

      month:
        'short',
    },
  )
}

function getFullMissingDateLabel(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',
    },
  )
}

function getLessonTypeLabel(
  lessonType:
    LessonType,
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

function formatFileSize(
  size: number,
) {
  if (
    size <
    1024
  ) {
    return `${size} B`
  }

  if (
    size <
    1024 *
    1024
  ) {
    return `${(
      size /
      1024
    ).toFixed(
      1,
    )} KB`
  }

  return `${(
    size /
    (
      1024 *
      1024
    )
  ).toFixed(
    1,
  )} MB`
}

function Dashboard() {
  const {
    currentCoach,
    profileLoading,

    students,
    lessonSessions,
    lessonCycles,

    studentsLoading,
    studentsError,
    sessionsLoading,
    sessionsError,
    cyclesLoading,
    cyclesError,

    refreshAll,

    confirmCyclePayment,

    getRegularSession,
    getSessionById,
    hasPendingPayment,

    isStudentActiveOnDate,
  } = useSwimCoach()

  const [
    confirmingCycleId,
    setConfirmingCycleId,
  ] =
    useState<
      number | null
    >(null)

  const [
    paymentProofs,
    setPaymentProofs,
  ] =
    useState<PaymentProofMap>(
      {},
    )

  const [
    paymentErrors,
    setPaymentErrors,
  ] =
    useState<PaymentErrorMap>(
      {},
    )

  const stickySummaryRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  useEffect(() => {
    let frameId:
      number | null =
      null

    const updateSummary =
      () => {
        frameId =
          null

        const startShrink =
          10

        const endShrink =
          150

        const rawProgress =
          (
            window.scrollY -
            startShrink
          ) /
          (
            endShrink -
            startShrink
          )

        const progress =
          Math.min(
            1,
            Math.max(
              0,
              rawProgress,
            ),
          )

        stickySummaryRef
          .current
          ?.style
          .setProperty(
            '--dashboard-shrink',
            String(
              progress,
            ),
          )
      }

    const handleScroll =
      () => {
        if (
          frameId !==
          null
        ) {
          return
        }

        frameId =
          window.requestAnimationFrame(
            updateSummary,
          )
      }

    updateSummary()

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive:
          true,
      },
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      )

      if (
        frameId !==
        null
      ) {
        window.cancelAnimationFrame(
          frameId,
        )
      }
    }
  }, [])

  const now =
    new Date()

  const todayKey =
    getDateKey(
      now,
    )

  const tomorrowKey =
    addDays(
      todayKey,
      1,
    )

  const todayName =
    getWeekday(
      todayKey,
    )

  const tomorrowName =
    getWeekday(
      tomorrowKey,
    )

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

  const missingAttendance =
    useMemo(() => {
      const missing:
        MissingAttendanceItem[] =
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

                const lessonCoach =
                  saved?.coach ??
                  student.defaultCoach

                if (
                  !isLessonForCurrentCoach(
                    lessonCoach,
                  )
                ) {
                  dateKey =
                    addDays(
                      dateKey,
                      1,
                    )

                  continue
                }

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
                  missing.push({
                    key:
                      saved
                        ? `session-${saved.id}`
                        : `regular-${student.id}-${dateKey}`,

                    studentId:
                      student.id,

                    lessonDate:
                      dateKey,

                    startTime,

                    endTime,

                    lessonType:
                      'regular',
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
            isLessonForCurrentCoach(
              session.coach,
            ) &&
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
            missing.push({
              key:
                `session-${session.id}`,

              studentId:
                session.studentId,

              lessonDate:
                session.lessonDate,

              startTime:
                session.startTime,

              endTime:
                session.endTime,

              lessonType:
                session.lessonType,
            })
          },
        )

      return missing.sort(
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
      currentCoach,
    ])

  const oldestMissing =
    missingAttendance[0]

  const buildLessonsForDate =
    (
      dateKey:
        string,
      weekday:
        string,
    ) => {
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
        DashboardLesson[] =
        students
          .filter(
            (student) =>
              student.day ===
                weekday &&
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

                lessonDate:
                  dateKey,

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

                coach:
                  saved?.coach ??
                  student.defaultCoach,
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
                'regular' &&
              session.status !==
                'Cancelled',
          )
          .map(
            (
              session,
            ):
              DashboardLesson |
              null => {
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

                coach:
                  session.coach,
              }
            },
          )
          .filter(
            (
              lesson,
            ):
              lesson is
                DashboardLesson =>
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
    }

  const todayLessons =
    useMemo(
      () =>
        buildLessonsForDate(
          todayKey,
          todayName,
        ),
      [
        students,
        lessonSessions,
        todayKey,
        todayName,
        currentCoach,
      ],
    )

  const tomorrowLessons =
    useMemo(
      () =>
        buildLessonsForDate(
          tomorrowKey,
          tomorrowName,
        ),
      [
        students,
        lessonSessions,
        tomorrowKey,
        tomorrowName,
        currentCoach,
      ],
    )

  const pendingPaymentCycles =
    useMemo(
      () =>
        lessonCycles
          .filter(
            (cycle) => {
              const student =
                students.find(
                  (item) =>
                    item.id ===
                    cycle.studentId,
                )

              const belongsToCurrentCoach =
                Boolean(
                  student &&
                  (
                    student.defaultCoach ===
                      currentCoach ||
                    student.defaultCoach ===
                      'Jack + Thomas'
                  ),
                )

              return (
                belongsToCurrentCoach &&
                cycle.cycleStatus ===
                  'completed' &&
                cycle.paymentStatus ===
                  'pending'
              )
            },
          )
          .sort(
            (
              a,
              b,
            ) =>
              a.cycleNumber -
              b.cycleNumber,
          ),
      [
        lessonCycles,
        students,
        currentCoach,
      ],
    )

  const getLessonStatus =
    (
      lesson:
        DashboardLesson,
    ) => {
      if (
        lesson.sessionId ===
        null
      ) {
        return 'Pending'
      }

      return (
        getSessionById(
          lesson.sessionId,
        )?.status ??
        'Pending'
      )
    }

  const pendingCount =
    todayLessons.filter(
      (lesson) =>
        getLessonStatus(
          lesson,
        ) ===
        'Pending',
    ).length

  const getStudent =
    (
      studentId:
        number,
    ) => {
      return students.find(
        (student) =>
          student.id ===
          studentId,
      )
    }

  const handleProofChange =
    (
      cycleId:
        number,
      file:
        File | null,
    ) => {
      setPaymentErrors(
        (current) => ({
          ...current,

          [cycleId]:
            undefined,
        }),
      )

      if (
        !file
      ) {
        setPaymentProofs(
          (current) => ({
            ...current,

            [cycleId]:
              null,
          }),
        )

        return
      }

      if (
        !file.type.startsWith(
          'image/',
        )
      ) {
        setPaymentProofs(
          (current) => ({
            ...current,

            [cycleId]:
              null,
          }),
        )

        setPaymentErrors(
          (current) => ({
            ...current,

            [cycleId]:
              'Please select an image file.',
          }),
        )

        return
      }

      const maxSize =
        5 *
        1024 *
        1024

      if (
        file.size >
        maxSize
      ) {
        setPaymentProofs(
          (current) => ({
            ...current,

            [cycleId]:
              null,
          }),
        )

        setPaymentErrors(
          (current) => ({
            ...current,

            [cycleId]:
              'Image must be smaller than 5MB.',
          }),
        )

        return
      }

      setPaymentProofs(
        (current) => ({
          ...current,

          [cycleId]:
            file,
        }),
      )
    }

  const removePaymentProof =
    (
      cycleId:
        number,
    ) => {
      setPaymentProofs(
        (current) => ({
          ...current,

          [cycleId]:
            null,
        }),
      )

      setPaymentErrors(
        (current) => ({
          ...current,

          [cycleId]:
            undefined,
        }),
      )
    }

  const handlePaymentConfirmed =
    async (
      cycle:
        LessonCycle,
    ) => {
      const proof =
        paymentProofs[
          cycle.id
        ]

      if (
        !proof
      ) {
        setPaymentErrors(
          (current) => ({
            ...current,

            [cycle.id]:
              'Upload payment proof before confirming.',
          }),
        )

        return
      }

      setConfirmingCycleId(
        cycle.id,
      )

      setPaymentErrors(
        (current) => ({
          ...current,

          [cycle.id]:
            undefined,
        }),
      )

      const success =
        await confirmCyclePayment(
          cycle.id,
        )

      if (
        success
      ) {
        setPaymentProofs(
          (current) => ({
            ...current,

            [cycle.id]:
              null,
          }),
        )
      } else {
        setPaymentErrors(
          (current) => ({
            ...current,

            [cycle.id]:
              'Unable to confirm payment. Please try again.',
          }),
        )
      }

      setConfirmingCycleId(
        null,
      )
    }

  const dashboardLoading =
    profileLoading ||
    studentsLoading ||
    sessionsLoading ||
    cyclesLoading

  const dashboardError =
    studentsError ||
    sessionsError ||
    cyclesError

  const hasDashboardData =
    students.length > 0 ||
    lessonSessions.length > 0 ||
    lessonCycles.length > 0

  if (
    dashboardLoading &&
    !hasDashboardData
  ) {
    return (
      <div className="dashboard-page">
        <PageLoading
          title="Loading Dashboard"
          message="Loading students, lessons and payment information..."
        />
      </div>
    )
  }

  if (
    dashboardError &&
    !hasDashboardData
  ) {
    return (
      <div className="dashboard-page">
        <PageError
          title="Unable to load dashboard"
          message={
            dashboardError
          }
          onRetry={() => {
            void refreshAll()
          }}
        />
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div
        ref={
          stickySummaryRef
        }
        className="dashboard-scroll-summary"
      >
        <div className="dashboard-scroll-date">
          <span>
            Today
          </span>

          <strong>
            {fullDate}
          </strong>
        </div>

        <div className="dashboard-scroll-summary-main">
          <div className="dashboard-scroll-class-info">
            <span>
              Today's Classes
            </span>

            <strong>
              {
                todayLessons.length
              }
            </strong>
          </div>

          <div className="dashboard-scroll-summary-icon">
            🏊
          </div>
        </div>
      </div>

      {missingAttendance.length >
        0 && (
        <Link
          className="dashboard-missing-attendance"
          to="/missing-attendance"
        >
          <div className="dashboard-missing-icon">
            !
          </div>

          <div className="dashboard-missing-content">
            <span>
              Attendance Required
            </span>

            <strong>
              {
                missingAttendance.length
              }{' '}
              Missing Attendance
            </strong>

            <p>
              {oldestMissing
                ? `Oldest missing lesson: ${getFullMissingDateLabel(
                    oldestMissing.lessonDate,
                  )}`
                : 'Past lessons still need attendance.'}
            </p>
          </div>

          <div className="dashboard-missing-review">
            Review

            <span>
              ›
            </span>
          </div>
        </Link>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>
              Today's Classes
            </h2>

            <p>
              {pendingCount >
              0
                ? `${pendingCount} classes still need attendance`
                : 'Attendance is up to date'}
            </p>
          </div>

          <Link
            className="dashboard-link"
            to="/today"
          >
            View all
          </Link>
        </div>

        {todayLessons.length >
        0 ? (
          <div className="dashboard-class-list">
            {todayLessons.map(
              (lesson) => {
                const status =
                  getLessonStatus(
                    lesson,
                  )

                const paymentPending =
                  hasPendingPayment(
                    lesson.student.id,
                  )

                return (
                  <Link
                    className={`dashboard-class-card ${
                      paymentPending
                        ? 'dashboard-payment-warning-card'
                        : ''
                    }`}
                    to="/today"
                    key={
                      lesson.key
                    }
                  >
                    <div className="dashboard-class-time">
                      <strong>
                        {
                          lesson.startTime
                        }
                      </strong>

                      <span>
                        {
                          lesson.endTime
                        }
                      </span>
                    </div>

                    <div className="dashboard-class-info">
                      <div className="dashboard-class-top">
                        <div>
                          <div className="dashboard-lesson-title-row">
                            <h3
                              className={
                                paymentPending
                                  ? 'dashboard-payment-warning-name'
                                  : ''
                              }
                            >
                              {
                                lesson.student.name
                              }
                            </h3>

                            <span
                              className={`dashboard-lesson-type ${lesson.lessonType}`}
                            >
                              {
                                getLessonTypeLabel(
                                  lesson.lessonType,
                                )
                              }
                            </span>
                          </div>

                          <p>
                            {
                              lesson.location
                            }
                          </p>
                        </div>

                        <span
                          className={`dashboard-status ${status.toLowerCase()}`}
                        >
                          {
                            status
                          }
                        </span>
                      </div>

                      <div className="dashboard-class-bottom">
                        <span>
                          {
                            lesson.coach
                          }
                        </span>

                        {paymentPending && (
                          <strong className="dashboard-payment-warning-text">
                            Payment Pending
                          </strong>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              },
            )}
          </div>
        ) : (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">
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
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>
              Tomorrow
            </h2>

            <p>
              {
                getDateLabel(
                  tomorrowKey,
                )
              }
            </p>
          </div>

          <Link
            className="dashboard-link"
            to="/schedule"
          >
            Schedule
          </Link>
        </div>

        {tomorrowLessons.length >
        0 ? (
          <div className="dashboard-upcoming-list">
            {tomorrowLessons.map(
              (lesson) => {
                const paymentPending =
                  hasPendingPayment(
                    lesson.student.id,
                  )

                return (
                  <div
                    className={`dashboard-upcoming-card ${
                      paymentPending
                        ? 'dashboard-payment-warning-card'
                        : ''
                    }`}
                    key={
                      lesson.key
                    }
                  >
                    <div className="dashboard-upcoming-date">
                      <span>
                        Tomorrow
                      </span>

                      <strong>
                        {
                          lesson.startTime
                        }
                      </strong>
                    </div>

                    <div className="dashboard-upcoming-info">
                      <div className="dashboard-upcoming-title">
                        <h3
                          className={
                            paymentPending
                              ? 'dashboard-payment-warning-name'
                              : ''
                          }
                        >
                          {
                            lesson.student.name
                          }
                        </h3>

                        <span
                          className={`dashboard-lesson-type ${lesson.lessonType}`}
                        >
                          {
                            getLessonTypeLabel(
                              lesson.lessonType,
                            )
                          }
                        </span>
                      </div>

                      <p>
                        {
                          lesson.startTime
                        }{' '}
                        -{' '}
                        {
                          lesson.endTime
                        }{' '}
                        ·{' '}
                        {
                          lesson.location
                        }
                      </p>

                      {paymentPending && (
                        <strong className="dashboard-payment-warning-text">
                          Payment Pending
                        </strong>
                      )}
                    </div>
                  </div>
                )
              },
            )}
          </div>
        ) : (
          <div className="dashboard-reminder-empty">
            No classes tomorrow.
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>
              Payment Reminder
            </h2>

            <p>
              Select payment proof before confirming payment.
            </p>
          </div>
        </div>

        {pendingPaymentCycles.length >
        0 ? (
          <div className="dashboard-payment-list">
            {pendingPaymentCycles.map(
              (cycle) => {
                const student =
                  getStudent(
                    cycle.studentId,
                  )

                if (
                  !student
                ) {
                  return null
                }

                const confirming =
                  confirmingCycleId ===
                  cycle.id

                const proof =
                  paymentProofs[
                    cycle.id
                  ]

                const paymentError =
                  paymentErrors[
                    cycle.id
                  ]

                return (
                  <div
                    className="dashboard-payment-card"
                    key={
                      cycle.id
                    }
                  >
                    <div className="dashboard-payment-profile">
                      <div className="dashboard-reminder-avatar">
                        {student.name
                          .charAt(
                            0,
                          )
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>
                          {
                            student.name
                          }
                        </h3>

                        <p>
                          Cycle{' '}
                          {
                            cycle.cycleNumber
                          }{' '}
                          · 4 / 4 Lessons
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-payment-info">
                      <div>
                        <span>
                          Package
                        </span>

                        <strong>
                          RM{' '}
                          {
                            student.packagePrice
                          }
                        </strong>
                      </div>

                      <span className="dashboard-payment-pending-badge">
                        Payment Pending
                      </span>
                    </div>

                    <div className="payment-proof-section">
                      <div className="payment-proof-header">
                        <div>
                          <span className="payment-proof-label">
                            Payment Proof
                          </span>

                          <p>
                            Image only · Max 5MB · Not saved
                          </p>
                        </div>

                        {proof && (
                          <span className="payment-proof-ready">
                            Ready
                          </span>
                        )}
                      </div>

                      {!proof ? (
                        <label className="payment-proof-upload">
                          <input
                            type="file"
                            accept="image/*"
                            disabled={
                              confirming
                            }
                            onChange={(
                              event,
                            ) => {
                              const file =
                                event
                                  .target
                                  .files?.[0] ??
                                null

                              handleProofChange(
                                cycle.id,
                                file,
                              )

                              event.target.value =
                                ''
                            }}
                          />

                          <div className="payment-proof-upload-icon">
                            +
                          </div>

                          <div className="payment-proof-upload-text">
                            <strong>
                              Select Image Proof
                            </strong>

                            <span>
                              Used only to enable payment confirmation
                            </span>
                          </div>
                        </label>
                      ) : (
                        <div className="payment-proof-file">
                          <div className="payment-proof-file-icon">
                            ✓
                          </div>

                          <div className="payment-proof-file-info">
                            <strong>
                              {
                                proof.name
                              }
                            </strong>

                            <span>
                              {
                                formatFileSize(
                                  proof.size,
                                )
                              }
                            </span>
                          </div>

                          <button
                            type="button"
                            className="payment-proof-remove"
                            disabled={
                              confirming
                            }
                            onClick={() =>
                              removePaymentProof(
                                cycle.id,
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {paymentError && (
                        <div className="payment-proof-error">
                          {
                            paymentError
                          }
                        </div>
                      )}
                    </div>

                    <button
                      className="payment-confirmed-button"
                      type="button"
                      disabled={
                        confirming ||
                        !proof
                      }
                      onClick={() =>
                        handlePaymentConfirmed(
                          cycle,
                        )
                      }
                    >
                      {confirming
                        ? 'Confirming...'
                        : 'Confirm Payment'}
                    </button>
                  </div>
                )
              },
            )}
          </div>
        ) : (
          <div className="dashboard-reminder-empty dashboard-payment-clear">
            <span>
              No payment reminders.
            </span>

            <strong>
              All completed cycles are cleared.
            </strong>
          </div>
        )}
      </section>
    </div>
  )
}

export default Dashboard