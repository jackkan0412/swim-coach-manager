import {
  useMemo,
  useState,
} from 'react'

import PageLoading from '../components/PageLoading'
import PageError from '../components/PageError'

import {
  useSwimCoach,
  type LessonType,
  type Student,
} from '../context/SwimCoachContext'

type ScheduleLesson = {
  key: string
  sessionId: number | null
  student: Student
  lessonDate: string
  lessonType: LessonType
  startTime: string
  endTime: string
  location: string
  coach: Student['defaultCoach']
  lessonEarning: number
  replacementForDate: string | null
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
      weekday: 'long',
    },
  )
}

function getShortWeekday(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
    },
  )
}

function getDayNumber(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).getDate()
}

function getFullDateLabel(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

function getShortDateLabel(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
    },
  )
}

function getWeekStart(
  dateKey: string,
) {
  const date =
    new Date(
      `${dateKey}T00:00:00`,
    )

  const day =
    date.getDay()

  const difference =
    day === 0
      ? -6
      : 1 - day

  date.setDate(
    date.getDate() +
      difference,
  )

  return getDateKey(
    date,
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

function Schedule() {
  const {
    currentCoach,
    profileLoading,

    students,
    lessonSessions,
    sessionsLoading,
    sessionsError,
    refreshLessonSessions,

    getRegularSession,
    hasPendingPayment,

    isStudentActiveOnDate,
  } = useSwimCoach()

  const todayKey =
    getDateKey(
      new Date(),
    )

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      todayKey,
    )

  const [
    weekStart,
    setWeekStart,
  ] =
    useState(
      getWeekStart(
        todayKey,
      ),
    )

  const dateTabs =
    useMemo(
      () =>
        Array.from(
          {
            length: 7,
          },
          (
            _,
            index,
          ) =>
            addDays(
              weekStart,
              index,
            ),
        ),
      [
        weekStart,
      ],
    )

  const weekEnd =
    addDays(
      weekStart,
      6,
    )

  const selectedWeekday =
    getWeekday(
      selectedDate,
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

  const lessons =
    useMemo(() => {
      const replacedStudentIds =
        new Set(
          lessonSessions
            .filter(
              (session) =>
                session.lessonType ===
                  'replacement' &&
                session.replacementForDate ===
                  selectedDate,
            )
            .map(
              (session) =>
                session.studentId,
            ),
        )

      const regularLessons:
        ScheduleLesson[] =
        students
          .filter(
            (student) =>
              student.day ===
                selectedWeekday &&
              isStudentActiveOnDate(
                student,
                selectedDate,
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
                  selectedDate,
                )

              return {
                key:
                  saved
                    ? `session-${saved.id}`
                    : `regular-${student.id}-${selectedDate}`,

                sessionId:
                  saved?.id ??
                  null,

                student,

                lessonDate:
                  selectedDate,

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

                lessonEarning:
                  saved?.lessonEarning ??
                  student.lessonEarning,

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
                selectedDate &&
              session.lessonType !==
                'regular' &&
              session.status !==
                'Cancelled',
          )
          .map(
            (
              session,
            ):
              | ScheduleLesson
              | null => {
              const student =
                students.find(
                  (item) =>
                    item.id ===
                    session.studentId,
                )

              if (!student) {
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

                lessonEarning:
                  session.lessonEarning,

                replacementForDate:
                  session.replacementForDate,
              }
            },
          )
          .filter(
            (
              lesson,
            ): lesson is ScheduleLesson =>
              lesson !== null,
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
      selectedDate,
      selectedWeekday,
      getRegularSession,
      isStudentActiveOnDate,
      currentCoach,
    ])

  const regularCount =
    lessons.filter(
      (lesson) =>
        lesson.lessonType ===
        'regular',
    ).length

  const replacementCount =
    lessons.filter(
      (lesson) =>
        lesson.lessonType ===
        'replacement',
    ).length

  const extraCount =
    lessons.filter(
      (lesson) =>
        lesson.lessonType ===
        'extra',
    ).length

  const goPreviousWeek =
    () => {
      const newStart =
        addDays(
          weekStart,
          -7,
        )

      setWeekStart(
        newStart,
      )

      setSelectedDate(
        newStart,
      )
    }

  const goNextWeek =
    () => {
      const newStart =
        addDays(
          weekStart,
          7,
        )

      setWeekStart(
        newStart,
      )

      setSelectedDate(
        newStart,
      )
    }

  const goToday =
    () => {
      setSelectedDate(
        todayKey,
      )

      setWeekStart(
        getWeekStart(
          todayKey,
        ),
      )
    }

  const handleDatePicker =
    (
      dateKey: string,
    ) => {
      if (!dateKey) {
        return
      }

      setSelectedDate(
        dateKey,
      )

      setWeekStart(
        getWeekStart(
          dateKey,
        ),
      )
    }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <div>
          <p className="small-text">
            Lesson Schedule
          </p>

          <h1>
            Schedule
          </h1>

          <p className="subtitle">
            View classes on any date.
          </p>
        </div>
      </div>

      <div className="schedule-navigation">
        <div className="schedule-week-navigation">
          <button
            className="schedule-week-arrow"
            type="button"
            onClick={
              goPreviousWeek
            }
            aria-label="Previous week"
          >
            ‹
          </button>

          <div className="schedule-week-label">
            <span>
              Week
            </span>

            <strong>
              {
                getShortDateLabel(
                  weekStart,
                )
              }

              {' - '}

              {
                getShortDateLabel(
                  weekEnd,
                )
              }
            </strong>
          </div>

          <button
            className="schedule-week-arrow"
            type="button"
            onClick={
              goNextWeek
            }
            aria-label="Next week"
          >
            ›
          </button>
        </div>

        <div className="schedule-navigation-bottom">
          <button
            className="schedule-today-button"
            type="button"
            onClick={
              goToday
            }
          >
            Today
          </button>

          <div className="schedule-date-picker-wrapper">
            <div
              className="schedule-date-picker"
              aria-hidden="true"
            >
              <span>
                Choose Date
              </span>

              <strong>
                {
                  new Date(
                    `${selectedDate}T00:00:00`,
                  ).toLocaleDateString(
                    'en-US',
                    {
                      month:
                        '2-digit',
                      day:
                        '2-digit',
                      year:
                        'numeric',
                    },
                  )
                }
              </strong>
            </div>

            <input
              className="schedule-date-native-overlay"
              type="date"
              value={
                selectedDate
              }
              onChange={(
                event,
              ) =>
                handleDatePicker(
                  event.target.value,
                )
              }
              aria-label="Choose date"
            />
          </div>
        </div>
      </div>

      <div className="schedule-day-tabs">
        {dateTabs.map(
          (
            dateKey,
          ) => (
            <button
              className={`schedule-day-button ${
                selectedDate ===
                dateKey
                  ? 'active'
                  : ''
              } ${
                dateKey ===
                todayKey
                  ? 'today'
                  : ''
              }`}
              type="button"
              key={
                dateKey
              }
              onClick={() =>
                setSelectedDate(
                  dateKey,
                )
              }
            >
              <span>
                {
                  getShortWeekday(
                    dateKey,
                  )
                }
              </span>

              <strong>
                {
                  getDayNumber(
                    dateKey,
                  )
                }
              </strong>
            </button>
          ),
        )}
      </div>

      <div className="schedule-selected-date">
        <div>
          <span>
            Selected Date
          </span>

          <strong>
            {
              getFullDateLabel(
                selectedDate,
              )
            }
          </strong>
        </div>

        <div className="schedule-count-badges">
          <span>
            {
              regularCount
            }{' '}
            Regular
          </span>

          {replacementCount >
            0 && (
            <span className="replacement">
              {
                replacementCount
              }{' '}
              Replacement
            </span>
          )}

          {extraCount >
            0 && (
            <span className="extra">
              {
                extraCount
              }{' '}
              Extra
            </span>
          )}
        </div>
      </div>

      {(profileLoading ||
        sessionsLoading) &&
      lessonSessions.length ===
        0 ? (
        <PageLoading
          title="Loading Schedule"
          message="Loading lesson information..."
        />
      ) : sessionsError &&
        lessonSessions.length ===
          0 ? (
        <PageError
          title="Unable to load schedule"
          message={
            sessionsError
          }
          onRetry={() => {
            void refreshLessonSessions()
          }}
        />
      ) : lessons.length >
        0 ? (
        <div className="schedule-list">
          {lessons.map(
            (
              lesson,
            ) => {
              const paymentPending =
                hasPendingPayment(
                  lesson.student.id,
                )

              return (
                <div
                  className={`schedule-card ${
                    paymentPending
                      ? 'schedule-payment-pending'
                      : ''
                  }`}
                  key={
                    lesson.key
                  }
                >
                  <div className="schedule-time">
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

                  <div className="schedule-card-content">
                    <div className="schedule-card-top">
                      <div className="schedule-student-row">
                        <div
                          className={`schedule-avatar ${
                            paymentPending
                              ? 'payment-pending'
                              : ''
                          }`}
                        >
                          {lesson.student.name
                            .charAt(
                              0,
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className="schedule-title-row">
                            <h3
                              className={
                                paymentPending
                                  ? 'schedule-payment-name'
                                  : ''
                              }
                            >
                              {
                                lesson.student.name
                              }
                            </h3>

                            <span
                              className={`schedule-type-badge ${lesson.lessonType}`}
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
                      </div>

                      {paymentPending && (
                        <span className="schedule-payment-badge">
                          Payment Pending
                        </span>
                      )}
                    </div>

                    {lesson.lessonType ===
                      'replacement' &&
                      lesson.replacementForDate && (
                        <div className="schedule-replacement-note">
                          Replaces Regular class on{' '}
                          {
                            lesson.replacementForDate
                          }
                        </div>
                      )}

                    <div className="schedule-meta">
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

                      <div className="schedule-earning-block">
                        <span>
                          Lesson Earning
                        </span>

                        <strong className="schedule-price">
                          RM{' '}
                          {lesson.lessonEarning.toFixed(
                            0,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
          )}
        </div>
      ) : (
        <div className="schedule-empty">
          <div className="schedule-empty-icon">
            📅
          </div>

          <h3>
            No classes
          </h3>

          <p>
            No lessons are scheduled for this date.
          </p>
        </div>
      )}
    </div>
  )
}

export default Schedule