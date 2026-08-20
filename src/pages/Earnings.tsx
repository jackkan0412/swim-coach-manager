import {
  useMemo,
  useRef,
  useState,
} from 'react'

import MoneyDisplay from '../components/MoneyDisplay'
import Toast from '../components/Toast'
import PageLoading from '../components/PageLoading'
import PageError from '../components/PageError'

import useToast from '../hooks/useToast'

import {
  exportMonthlySchedule,
} from '../utils/exportMonthlySchedule'

import {
  useSwimCoach,
  type LessonSession,
} from '../context/SwimCoachContext'

type HistoryMode =
  | 'personal'
  | 'total'

type StudentLessonGroup = {
  studentId: number
  studentName: string
  lessons: LessonSession[]
}

function getCurrentMonthKey() {
  const now =
    new Date()

  return [
    now.getFullYear(),

    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      '0',
    ),
  ].join('-')
}

function getMonthLabel(
  monthKey: string,
) {
  const [
    year,
    month,
  ] =
    monthKey
      .split('-')
      .map(Number)

  return new Date(
    year,
    month - 1,
    1,
  ).toLocaleDateString(
    'en-GB',
    {
      month: 'long',
      year: 'numeric',
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

function getLessonTypeLabel(
  lessonType:
    LessonSession['lessonType'],
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

/*
 * Coach displayed inside Earnings
 * should follow the FINAL earning split
 * saved for that lesson.
 */
function getEarningCoach(
  lesson:
    LessonSession,
) {
  if (
    lesson.earningSplit ===
    'Jack 100%'
  ) {
    return 'Jack'
  }

  if (
    lesson.earningSplit ===
    'Thomas 100%'
  ) {
    return 'Thomas'
  }

  return 'Jack + Thomas'
}

function Earnings() {
  const {
    currentCoach,
    students,
    lessonSessions,
    lessonCycles,

    sessionsLoading,
    sessionsError,

    refreshLessonSessions,
    isStudentActiveOnDate,
  } = useSwimCoach()

  const {
    toast,
    showSuccess,
    showError,
    hideToast,
  } = useToast()

  const [
    selectedMonth,
    setSelectedMonth,
  ] =
    useState(
      getCurrentMonthKey(),
    )

  const [
    historyMode,
    setHistoryMode,
  ] =
    useState<HistoryMode>(
      'personal',
    )

  const [
    expandedStudentId,
    setExpandedStudentId,
  ] =
    useState<
      number | null
    >(null)

  const [
    exporting,
    setExporting,
  ] =
    useState(false)

  const [
    showPersonalEarning,
    setShowPersonalEarning,
  ] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'earnings-personal-visible',
        )

      if (
        saved === null
      ) {
        return false
      }

      return (
        saved ===
        'true'
      )
    })

  const [
    showTotal,
    setShowTotal,
  ] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'earnings-total-visible',
        )

      if (
        saved === null
      ) {
        return false
      }

      return (
        saved ===
        'true'
      )
    })

  const monthInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const openMonthPicker =
    () => {
      const input =
        monthInputRef.current

      if (
        !input
      ) {
        return
      }

      try {
        if (
          typeof input.showPicker ===
          'function'
        ) {
          input.showPicker()
        } else {
          input.click()
        }
      } catch {
        input.click()
      }
    }

  const togglePersonalEarning =
    () => {
      setShowPersonalEarning(
        (current) => {
          const next =
            !current

          localStorage.setItem(
            'earnings-personal-visible',
            String(next),
          )

          return next
        },
      )
    }

  const toggleTotal =
    () => {
      setShowTotal(
        (current) => {
          const next =
            !current

          localStorage.setItem(
            'earnings-total-visible',
            String(next),
          )

          return next
        },
      )
    }

  const getPersonalLessonEarning =
    (
      lesson:
        LessonSession,
    ) => {
      if (
        currentCoach ===
        'Thomas'
      ) {
        return (
          lesson.thomasEarning
        )
      }

      return (
        lesson.jackEarning
      )
    }

  const allPresentLessons =
    useMemo(
      () =>
        lessonSessions
          .filter(
            (session) =>
              session.status ===
                'Present' &&
              session.lessonDate.startsWith(
                selectedMonth,
              ),
          )
          .sort(
            (
              a,
              b,
            ) =>
              b.lessonDate.localeCompare(
                a.lessonDate,
              ) ||
              b.startTime.localeCompare(
                a.startTime,
              ),
          ),
      [
        lessonSessions,
        selectedMonth,
      ],
    )

  const personalPresentLessons =
    useMemo(
      () =>
        allPresentLessons.filter(
          (lesson) =>
            getPersonalLessonEarning(
              lesson,
            ) > 0,
        ),
      [
        allPresentLessons,
        currentCoach,
      ],
    )

  const personalEarning =
    useMemo(
      () =>
        personalPresentLessons.reduce(
          (
            total,
            lesson,
          ) =>
            total +
            getPersonalLessonEarning(
              lesson,
            ),
          0,
        ),
      [
        personalPresentLessons,
        currentCoach,
      ],
    )

  const totalValue =
    useMemo(() => {
      return allPresentLessons.reduce(
        (
          total,
          lesson,
        ) => {
          const lessonTotal =
            (
              lesson.packagePrice /
              4
            ) *
            0.8

          return (
            total +
            lessonTotal
          )
        },
        0,
      )
    }, [
      allPresentLessons,
    ])

  const getStudentName = (
    studentId: number,
  ) => {
    return (
      students.find(
        (student) =>
          student.id ===
          studentId,
      )?.name ??
      'Unknown Student'
    )
  }

  const groupLessonsByStudent =
    (
      lessons:
        LessonSession[],
    ) => {
      const groups =
        new Map<
          number,
          StudentLessonGroup
        >()

      lessons.forEach(
        (lesson) => {
          const existing =
            groups.get(
              lesson.studentId,
            )

          if (
            existing
          ) {
            existing.lessons.push(
              lesson,
            )

            return
          }

          groups.set(
            lesson.studentId,
            {
              studentId:
                lesson.studentId,

              studentName:
                getStudentName(
                  lesson.studentId,
                ),

              lessons: [
                lesson,
              ],
            },
          )
        },
      )

      return Array.from(
        groups.values(),
      ).sort(
        (
          a,
          b,
        ) =>
          a.studentName.localeCompare(
            b.studentName,
          ),
      )
    }

  const personalStudentGroups =
    useMemo(
      () =>
        groupLessonsByStudent(
          personalPresentLessons,
        ),
      [
        personalPresentLessons,
        students,
      ],
    )

  const totalStudentGroups =
    useMemo(
      () =>
        groupLessonsByStudent(
          allPresentLessons,
        ),
      [
        allPresentLessons,
        students,
      ],
    )

  const activeGroups =
    historyMode ===
    'personal'
      ? personalStudentGroups
      : totalStudentGroups

  const toggleStudent =
    (
      studentId:
        number,
    ) => {
      setExpandedStudentId(
        (current) =>
          current ===
          studentId
            ? null
            : studentId,
      )
    }

  const changeHistoryMode =
    (
      mode:
        HistoryMode,
    ) => {
      setHistoryMode(
        mode,
      )

      setExpandedStudentId(
        null,
      )
    }

  const handleExportExcel =
    async () => {
      if (
        exporting
      ) {
        return
      }

      if (
        !currentCoach
      ) {
        showError(
          'Unable to identify the current coach.',
        )

        return
      }

      setExporting(
        true,
      )

      try {
        await exportMonthlySchedule({
          monthKey:
            selectedMonth,

          currentCoach,

          students,

          lessonSessions,

          lessonCycles,

          isStudentActiveOnDate,
        })

        showSuccess(
          `${getMonthLabel(
            selectedMonth,
          )} Excel exported successfully.`,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          'Unable to export Excel file.',
        )
      } finally {
        setExporting(
          false,
        )
      }
    }

  return (
    <div className="earnings-page">
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

      <div className="earnings-header">
        <div>
          <p className="small-text">
            Income Tracking
          </p>

          <h1>
            Earnings
          </h1>

          <p className="subtitle">
            View your lesson earnings and monthly total.
          </p>
        </div>

        <div className="earnings-header-actions">
          <div className="earnings-month-picker-wrapper">
            <button
              className="earnings-month-picker"
              type="button"
              onClick={
                openMonthPicker
              }
            >
              <span className="earnings-month-picker-label">
                Month
              </span>

              <strong className="earnings-month-picker-value">
                {
                  getMonthLabel(
                    selectedMonth,
                  )
                }
              </strong>
            </button>

            <input
              ref={
                monthInputRef
              }
              className="earnings-month-native-input"
              type="month"
              value={
                selectedMonth
              }
              onChange={(
                event,
              ) => {
                setSelectedMonth(
                  event.target.value,
                )

                setExpandedStudentId(
                  null,
                )
              }}
              tabIndex={
                -1
              }
              aria-label="Select month"
            />
          </div>

          <button
            type="button"
            className="earnings-export-button"
            onClick={
              handleExportExcel
            }
            disabled={
              exporting ||
              sessionsLoading
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />

              <path d="m7 10 5 5 5-5" />

              <path d="M5 21h14" />
            </svg>

            <span>
              {exporting
                ? 'Exporting...'
                : 'Export Excel'}
            </span>
          </button>
        </div>
      </div>

      <div className="earnings-new-summary">
        <div className="earning-main-card">
          <div className="earning-summary-title-row">
            <span>
              {currentCoach ===
              'Thomas'
                ? 'Thomas Earnings'
                : 'Jack Earnings'}
            </span>

            <button
              type="button"
              className="earning-visibility-button"
              onClick={
                togglePersonalEarning
              }
              aria-label={
                showPersonalEarning
                  ? 'Hide earnings'
                  : 'Show earnings'
              }
            >
              {showPersonalEarning ? (
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

          {showPersonalEarning ? (
            <MoneyDisplay
              amount={
                personalEarning
              }
              className="earnings-main-money"
            />
          ) : (
            <div className="earnings-hidden-value earnings-main-hidden">
              RM ***
            </div>
          )}

          <p>
            Your earnings from Present lessons this month.
          </p>
        </div>

        <div className="earning-total-card">
          <div className="earning-summary-title-row">
            <span>
              Total
            </span>

            <button
              type="button"
              className="earning-visibility-button"
              onClick={
                toggleTotal
              }
              aria-label={
                showTotal
                  ? 'Hide total'
                  : 'Show total'
              }
            >
              {showTotal ? (
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

          {showTotal ? (
            <MoneyDisplay
              amount={
                totalValue
              }
              className="earnings-total-money"
            />
          ) : (
            <div className="earnings-hidden-value earnings-total-hidden">
              RM ***
            </div>
          )}

          <p>
            Package Price ÷ 4 × 80% × Present Lessons
          </p>
        </div>
      </div>

      <div className="earnings-month-info">
        <div>
          <span>
            Month
          </span>

          <strong>
            {
              getMonthLabel(
                selectedMonth,
              )
            }
          </strong>
        </div>

        <div>
          <span>
            Total Present Lessons
          </span>

          <strong>
            {
              allPresentLessons.length
            }
          </strong>
        </div>
      </div>

      <div className="earnings-section-header">
        <h2>
          Lesson History
        </h2>

        <p>
          View your lessons or all Present lessons.
        </p>
      </div>

      <div className="earnings-history-tabs">
        <button
          type="button"
          className={`earnings-history-tab ${
            historyMode ===
            'personal'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            changeHistoryMode(
              'personal',
            )
          }
        >
          <span>
            My History
          </span>

          <strong>
            {
              personalPresentLessons.length
            }
          </strong>
        </button>

        <button
          type="button"
          className={`earnings-history-tab ${
            historyMode ===
            'total'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            changeHistoryMode(
              'total',
            )
          }
        >
          <span>
            Total History
          </span>

          <strong>
            {
              allPresentLessons.length
            }
          </strong>
        </button>
      </div>

      {sessionsLoading &&
      lessonSessions.length ===
        0 ? (
        <PageLoading
          title="Loading Earnings"
          message="Loading lesson records..."
        />
      ) : sessionsError &&
        lessonSessions.length ===
          0 ? (
        <PageError
          title="Unable to load earnings"
          message={
            sessionsError
          }
          onRetry={() => {
            void refreshLessonSessions()
          }}
        />
      ) : activeGroups.length >
        0 ? (
        <div className="earning-student-history-list">
          {activeGroups.map(
            (
              group,
            ) => {
              const isExpanded =
                expandedStudentId ===
                group.studentId

              return (
                <div
                  className={`earning-student-history-card ${
                    isExpanded
                      ? 'expanded'
                      : ''
                  }`}
                  key={
                    group.studentId
                  }
                >
                  <button
                    type="button"
                    className="earning-student-history-summary"
                    onClick={() =>
                      toggleStudent(
                        group.studentId,
                      )
                    }
                    aria-expanded={
                      isExpanded
                    }
                  >
                    <div className="earning-student-history-left">
                      <div className="earning-avatar">
                        {group.studentName
                          .charAt(
                            0,
                          )
                          .toUpperCase()}
                      </div>

                      <div className="earning-student-history-info">
                        <strong>
                          {
                            group.studentName
                          }
                        </strong>

                        <span>
                          {
                            group.lessons.length
                          }{' '}
                          {group.lessons.length ===
                          1
                            ? 'Lesson'
                            : 'Lessons'}
                        </span>
                      </div>
                    </div>

                    <svg
                      className={`earning-history-chevron ${
                        isExpanded
                          ? 'open'
                          : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="earning-student-history-details">
                      {group.lessons.map(
                        (
                          lesson,
                        ) => {
                          const myEarning =
                            getPersonalLessonEarning(
                              lesson,
                            )

                          const earningCoach =
                            getEarningCoach(
                              lesson,
                            )

                          return (
                            <div
                              className="earning-history-detail-card"
                              key={
                                lesson.id
                              }
                            >
                              <div className="earning-history-detail-top">
                                <div className="earning-history-date">
                                  <strong>
                                    {
                                      formatDate(
                                        lesson.lessonDate,
                                      )
                                    }
                                  </strong>

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

                                <span
                                  className={`earning-type-badge ${lesson.lessonType}`}
                                >
                                  {
                                    getLessonTypeLabel(
                                      lesson.lessonType,
                                    )
                                  }
                                </span>
                              </div>

                              <div className="earning-history-location">
                                <span>
                                  Location
                                </span>

                                <strong>
                                  {
                                    lesson.location
                                  }
                                </strong>
                              </div>

                              {historyMode ===
                                'personal' ? (
                                <div className="earning-history-bottom">
                                  <div className="earning-history-value-card">
                                    <span>
                                      Your Earning
                                    </span>

                                    <MoneyDisplay
                                      amount={
                                        myEarning
                                      }
                                      className="earning-history-money"
                                    />
                                  </div>

                                  <div className="earning-history-coach-card">
                                    <span>
                                      Coach
                                    </span>

                                    <strong>
                                      {
                                        earningCoach
                                      }
                                    </strong>
                                  </div>
                                </div>
                              ) : (
                                <div className="earning-history-total-bottom">
                                  <span>
                                    Coach
                                  </span>

                                  <strong>
                                    {
                                      earningCoach
                                    }
                                  </strong>
                                </div>
                              )}
                            </div>
                          )
                        },
                      )}
                    </div>
                  )}
                </div>
              )
            },
          )}
        </div>
      ) : (
        <div className="earnings-empty">
          <div className="earnings-empty-icon">
            RM
          </div>

          <h3>
            {historyMode ===
            'personal'
              ? 'No Personal Earnings'
              : 'No Lessons Yet'}
          </h3>

          <p>
            {historyMode ===
            'personal'
              ? `You did not receive earnings from any Present lessons in ${getMonthLabel(
                  selectedMonth,
                )}.`
              : `No Present lessons were found for ${getMonthLabel(
                  selectedMonth,
                )}.`}
          </p>
        </div>
      )}
    </div>
  )
}

export default Earnings