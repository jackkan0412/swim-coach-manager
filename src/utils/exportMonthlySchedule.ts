import ExcelJS from 'exceljs'

import type {
  CurrentCoach,
  LessonCycle,
  LessonSession,
  Student,
} from '../context/SwimCoachContext'

type ExportMonthlyScheduleInput = {
  monthKey: string
  currentCoach: CurrentCoach
  students: Student[]
  lessonSessions: LessonSession[]
  lessonCycles: LessonCycle[]

  isStudentActiveOnDate: (
    student: Student,
    dateKey: string,
  ) => boolean
}

type ExportStatus =
  | 'Present'
  | 'Absent'
  | 'Cancelled'
  | 'Pending'
  | 'No Class'
  | 'Future'

type ExportLessonRow = {
  dateKey: string
  student: Student

  classNo: number | null

  status: ExportStatus

  lessonSession:
    | LessonSession
    | null
}

type ExportGroup = {
  key: string
  weekday: string
  student: Student
  rows: ExportLessonRow[]
}

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

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

function getMonthDateKeys(
  monthKey: string,
) {
  const [
    year,
    month,
  ] =
    monthKey
      .split('-')
      .map(Number)

  const dates: string[] =
    []

  const date =
    new Date(
      year,
      month - 1,
      1,
    )

  while (
    date.getMonth() ===
    month - 1
  ) {
    dates.push(
      getDateKey(
        date,
      ),
    )

    date.setDate(
      date.getDate() + 1,
    )
  }

  return dates
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

function formatTime(
  time: string,
) {
  const [
    hourValue,
    minuteValue,
  ] =
    time
      .split(':')
      .map(Number)

  const suffix =
    hourValue >= 12
      ? 'PM'
      : 'AM'

  const hour =
    hourValue % 12 ||
    12

  return `${hour}:${String(
    minuteValue,
  ).padStart(
    2,
    '0',
  )} ${suffix}`
}

function getPersonalEarning(
  session: LessonSession,
  currentCoach: CurrentCoach,
) {
  if (
    currentCoach ===
    'Thomas'
  ) {
    return (
      session.thomasEarning
    )
  }

  if (
    currentCoach ===
    'Jack'
  ) {
    return (
      session.jackEarning
    )
  }

  return 0
}

function getClassNumber(
  session: LessonSession,
  lessonSessions:
    LessonSession[],
) {
  if (
    session.status !==
      'Present' ||
    session.cycleId ===
      null
  ) {
    return null
  }

  const cycleLessons =
    lessonSessions
      .filter(
        (item) =>
          item.cycleId ===
            session.cycleId &&
          item.status ===
            'Present',
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.lessonDate.localeCompare(
            b.lessonDate,
          ) ||
          a.startTime.localeCompare(
            b.startTime,
          ) ||
          a.id -
            b.id,
      )

  const index =
    cycleLessons.findIndex(
      (item) =>
        item.id ===
        session.id,
    )

  if (
    index === -1
  ) {
    return null
  }

  return (
    index + 1
  )
}

function getExpectedStatus(
  dateKey: string,
  session:
    | LessonSession
    | undefined,
): ExportStatus {
  if (
    session
  ) {
    return session.status
  }

  const today =
    getDateKey(
      new Date(),
    )

  if (
    dateKey >
    today
  ) {
    return 'Future'
  }

  return 'No Class'
}

function getDateColor(
  status: ExportStatus,
) {
  if (
    status ===
    'Present'
  ) {
    return 'FF00B050'
  }

  if (
    status ===
      'Absent' ||
    status ===
      'Cancelled' ||
    status ===
      'Pending' ||
    status ===
      'No Class'
  ) {
    return 'FFFF0000'
  }

  return 'FF000000'
}

function getReceiptText(
  rows:
    ExportLessonRow[],
  lessonCycles:
    LessonCycle[],
) {
  const cycleIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.lessonSession
                ?.cycleId,
          )
          .filter(
            (
              cycleId,
            ):
              cycleId is number =>
              cycleId !==
              null &&
              cycleId !==
              undefined,
          ),
      ),
    )

  const relatedCycles =
    cycleIds
      .map(
        (cycleId) =>
          lessonCycles.find(
            (cycle) =>
              cycle.id ===
              cycleId,
          ),
      )
      .filter(
        (
          cycle,
        ):
          cycle is LessonCycle =>
          Boolean(
            cycle,
          ),
      )

  /*
    Rules:

    1. Pending payment
       -> Payment column blank
       -> Receipt blank

    2. Already paid / Dashboard confirmed
       -> Payment column blank
       -> Receipt blank

    3. No cycle needs payment yet
       -> Payment column blank
       -> Receipt = No Payment Needed
  */

  const hasPaymentRequired =
    relatedCycles.some(
      (cycle) =>
        cycle.cycleStatus ===
          'completed' &&
        cycle.paymentStatus ===
          'pending',
    )

  if (
    hasPaymentRequired
  ) {
    return ''
  }

  const hasPaidCycle =
    relatedCycles.some(
      (cycle) =>
        cycle.paymentStatus ===
        'paid',
    )

  if (
    hasPaidCycle
  ) {
    return ''
  }

  return 'No Payment Needed'
}

function buildGroups({
  monthKey,
  students,
  lessonSessions,
  isStudentActiveOnDate,
}: {
  monthKey: string

  students: Student[]

  lessonSessions:
    LessonSession[]

  isStudentActiveOnDate: (
    student: Student,
    dateKey: string,
  ) => boolean
}) {
  const groups =
    new Map<
      string,
      ExportGroup
    >()

  const monthDates =
    getMonthDateKeys(
      monthKey,
    )

  const getOrCreateGroup =
    (
      student: Student,
    ) => {
      const groupKey =
        String(
          student.id,
        )

      const existing =
        groups.get(
          groupKey,
        )

      if (
        existing
      ) {
        return existing
      }

      const newGroup:
        ExportGroup = {
          key:
            groupKey,

          weekday:
            student.day,

          student,

          rows:
            [],
        }

      groups.set(
        groupKey,
        newGroup,
      )

      return newGroup
    }

  students.forEach(
    (student) => {
      const regularDates =
        monthDates.filter(
          (dateKey) =>
            getWeekday(
              dateKey,
            ) ===
              student.day &&
            isStudentActiveOnDate(
              student,
              dateKey,
            ),
        )

      regularDates.forEach(
        (dateKey) => {
          const replacement =
            lessonSessions.find(
              (session) =>
                session.studentId ===
                  student.id &&
                session.lessonType ===
                  'replacement' &&
                session.replacementForDate ===
                  dateKey,
            )

          const regularSession =
            lessonSessions.find(
              (session) =>
                session.studentId ===
                  student.id &&
                session.lessonType ===
                  'regular' &&
                session.lessonDate ===
                  dateKey,
            )

          const group =
            getOrCreateGroup(
              student,
            )

          if (
            replacement
          ) {
            group.rows.push({
              dateKey,

              student,

              classNo:
                null,

              status:
                dateKey >
                  getDateKey(
                    new Date(),
                  )
                  ? 'Future'
                  : 'No Class',

              lessonSession:
                null,
            })

            return
          }

          group.rows.push({
            dateKey,

            student,

            classNo:
              regularSession
                ? getClassNumber(
                    regularSession,
                    lessonSessions,
                  )
                : null,

            status:
              getExpectedStatus(
                dateKey,
                regularSession,
              ),

            lessonSession:
              regularSession ??
              null,
          })
        },
      )
    },
  )

  lessonSessions
    .filter(
      (session) =>
        session.lessonDate.startsWith(
          monthKey,
        ) &&
        session.lessonType !==
          'regular',
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

        const group =
          getOrCreateGroup(
            student,
          )

        group.rows.push({
          dateKey:
            session.lessonDate,

          student,

          classNo:
            getClassNumber(
              session,
              lessonSessions,
            ),

          status:
            session.status,

          lessonSession:
            session,
        })
      },
    )

  return Array.from(
    groups.values(),
  )
    .map(
      (group) => ({
        ...group,

        rows:
          [...group.rows]
            .sort(
              (
                a,
                b,
              ) =>
                a.dateKey.localeCompare(
                  b.dateKey,
                ) ||
                (
                  a.lessonSession
                    ?.startTime ??
                  ''
                ).localeCompare(
                  b.lessonSession
                    ?.startTime ??
                    '',
                ) ||
                (
                  a.lessonSession
                    ?.id ??
                  0
                ) -
                  (
                    b.lessonSession
                      ?.id ??
                    0
                  ),
            ),
      }),
    )
    .sort(
      (
        a,
        b,
      ) => {
        const weekdayDifference =
          WEEKDAYS.indexOf(
            a.weekday,
          ) -
          WEEKDAYS.indexOf(
            b.weekday,
          )

        if (
          weekdayDifference !==
          0
        ) {
          return (
            weekdayDifference
          )
        }

        if (
          a.student.startTime !==
          b.student.startTime
        ) {
          return a.student.startTime.localeCompare(
            b.student.startTime,
          )
        }

        return a.student.name.localeCompare(
          b.student.name,
        )
      },
    )
}

function downloadWorkbook(
  buffer:
    ExcelJS.Buffer,
  fileName: string,
) {
  const blob =
    new Blob(
      [
        buffer as
          BlobPart,
      ],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    )

  const url =
    URL.createObjectURL(
      blob,
    )

  const link =
    document.createElement(
      'a',
    )

  link.href =
    url

  link.download =
    fileName

  document.body.appendChild(
    link,
  )

  link.click()

  link.remove()

  URL.revokeObjectURL(
    url,
  )
}

export async function exportMonthlySchedule({
  monthKey,
  currentCoach,
  students,
  lessonSessions,
  lessonCycles,
  isStudentActiveOnDate,
}: ExportMonthlyScheduleInput) {
  if (
    !currentCoach
  ) {
    throw new Error(
      'Coach account is unavailable.',
    )
  }

  const groups =
    buildGroups({
      monthKey,
      students,
      lessonSessions,
      isStudentActiveOnDate,
    })

  const workbook =
    new ExcelJS.Workbook()

  workbook.creator =
    'SwimCoach'

  workbook.created =
    new Date()

  const monthLabel =
    getMonthLabel(
      monthKey,
    )

  const worksheet =
    workbook.addWorksheet(
      monthLabel,
      {
        views: [
          {
            showGridLines:
              false,
          },
        ],
      },
    )

  worksheet.columns = [
    {
      width: 24,
    },
    {
      width: 25,
    },
    {
      width: 11,
    },
    {
      width: 14,
    },
    {
      width: 14,
    },
    {
      width: 18,
    },
    {
      width: 16,
    },
    {
      width: 26,
    },
    {
      width: 22,
    },
  ]

  const headers = [
    'CLASS TIME/ Location',
    'STUDENTS/ Phone no.',
    'Class No',
    'DATE',
    'Package Fee',
    'Wages per class',
    'Total Wages',
    'Payment (Cash/ Bank in {Date})',
    'Receipt',
  ]

  const border:
    Partial<
      ExcelJS.Borders
    > = {
      top: {
        style: 'thin',

        color: {
          argb:
            'FF000000',
        },
      },

      left: {
        style: 'thin',

        color: {
          argb:
            'FF000000',
        },
      },

      bottom: {
        style: 'thin',

        color: {
          argb:
            'FF000000',
        },
      },

      right: {
        style: 'thin',

        color: {
          argb:
            'FF000000',
        },
      },
    }

  let rowNumber =
    1

  WEEKDAYS.forEach(
    (weekday) => {
      const dayGroups =
        groups.filter(
          (group) =>
            group.weekday ===
            weekday,
        )

      if (
        dayGroups.length ===
        0
      ) {
        return
      }

      if (
        rowNumber >
        1
      ) {
        worksheet.getRow(
          rowNumber,
        ).height =
          16

        worksheet.getRow(
          rowNumber + 1,
        ).height =
          16

        rowNumber +=
          2
      }

      worksheet.mergeCells(
        rowNumber,
        1,
        rowNumber + 1,
        9,
      )

      const weekdayCell =
        worksheet.getCell(
          rowNumber,
          1,
        )

      weekdayCell.value =
        weekday

      weekdayCell.fill = {
        type: 'pattern',

        pattern:
          'solid',

        fgColor: {
          argb:
            'FFEAD1DC',
        },
      }

      weekdayCell.font = {
        bold:
          true,

        size:
          18,
      }

      weekdayCell.alignment = {
        horizontal:
          'center',

        vertical:
          'middle',
      }

      worksheet.getRow(
        rowNumber,
      ).height =
        28

      worksheet.getRow(
        rowNumber + 1,
      ).height =
        18

      rowNumber +=
        3

      worksheet.getRow(
        rowNumber,
      ).height =
        10

      rowNumber +=
        1

      dayGroups.forEach(
        (
          group,
          groupIndex,
        ) => {
          if (
            groupIndex >
            0
          ) {
            worksheet.getRow(
              rowNumber,
            ).height =
              10

            rowNumber +=
              1
          }

          const headerRow =
            worksheet.getRow(
              rowNumber,
            )

          headerRow.height =
            38

          headers.forEach(
            (
              header,
              index,
            ) => {
              const cell =
                headerRow.getCell(
                  index + 1,
                )

              cell.value =
                header

              cell.font = {
                bold:
                  true,

                size:
                  10,
              }

              cell.alignment = {
                horizontal:
                  'center',

                vertical:
                  'middle',

                wrapText:
                  true,
              }

              cell.border =
                border
            },
          )

          rowNumber +=
            1

          const startRow =
            rowNumber

          const rowCount =
            Math.max(
              group.rows.length,
              1,
            )

          const endRow =
            startRow +
            rowCount -
            1

          const attendedRows =
            group.rows.filter(
              (row) =>
                row.status ===
                  'Present' &&
                row.lessonSession,
            )

          const totalWages =
            attendedRows.reduce(
              (
                total,
                row,
              ) =>
                total +
                getPersonalEarning(
                  row.lessonSession!,
                  currentCoach,
                ),
              0,
            )

          const packageFee =
            attendedRows[0]
              ?.lessonSession
              ?.packagePrice ??
            group.student.packagePrice

          const receiptText =
            getReceiptText(
              group.rows,
              lessonCycles,
            )

          if (
            rowCount >
            1
          ) {
            [
              1,
              2,
              5,
              7,
              8,
              9,
            ].forEach(
              (column) => {
                worksheet.mergeCells(
                  startRow,
                  column,
                  endRow,
                  column,
                )
              },
            )
          }

          /*
            CLASS TIME / LOCATION

            Always use student's REGULAR schedule.
          */

          worksheet.getCell(
            startRow,
            1,
          ).value =
            `${group.student.day}\n${formatTime(
              group.student.startTime,
            )} - ${formatTime(
              group.student.endTime,
            )}\n${group.student.location}`

          worksheet.getCell(
            startRow,
            2,
          ).value =
            `${group.student.name}\n(${group.student.phone})`

          worksheet.getCell(
            startRow,
            5,
          ).value =
            packageFee

          worksheet.getCell(
            startRow,
            5,
          ).numFmt =
            '"RM" #,##0.00'

          worksheet.getCell(
            startRow,
            7,
          ).value =
            totalWages

          worksheet.getCell(
            startRow,
            7,
          ).numFmt =
            '"RM" #,##0.00'

          /*
            PAYMENT COLUMN

            Always intentionally blank.

            This lets you manually type:
            Cash
            Bank in
            Date
          */

          worksheet.getCell(
            startRow,
            8,
          ).value =
            ''

          /*
            RECEIPT COLUMN

            Not due:
            No Payment Needed

            Need payment:
            blank

            Already paid:
            blank
          */

          worksheet.getCell(
            startRow,
            9,
          ).value =
            receiptText

          if (
            receiptText ===
            'No Payment Needed'
          ) {
            worksheet.getCell(
              startRow,
              9,
            ).font = {
              bold:
                true,

              color: {
                argb:
                  'FF475569',
              },
            }
          }

          group.rows.forEach(
            (
              exportRow,
              index,
            ) => {
              const currentRow =
                startRow +
                index

              const row =
                worksheet.getRow(
                  currentRow,
                )

              row.height =
                24

              row.getCell(
                3,
              ).value =
                exportRow.classNo ??
                ''

              row.getCell(
                4,
              ).value =
                new Date(
                  `${exportRow.dateKey}T00:00:00`,
                )

              row.getCell(
                4,
              ).numFmt =
                'd/m/yyyy'

              row.getCell(
                4,
              ).font = {
                color: {
                  argb:
                    getDateColor(
                      exportRow.status,
                    ),
                },
              }

              if (
                exportRow.status ===
                  'Present' &&
                exportRow.lessonSession
              ) {
                const earning =
                  getPersonalEarning(
                    exportRow.lessonSession,
                    currentCoach,
                  )

                if (
                  earning >
                  0
                ) {
                  row.getCell(
                    6,
                  ).value =
                    earning

                  row.getCell(
                    6,
                  ).numFmt =
                    '"RM" #,##0.00'
                }
              }
            },
          )

          for (
            let currentRow =
              startRow;
            currentRow <=
            endRow;
            currentRow +=
              1
          ) {
            const row =
              worksheet.getRow(
                currentRow,
              )

            for (
              let column =
                1;
              column <=
              9;
              column +=
                1
            ) {
              const cell =
                row.getCell(
                  column,
                )

              cell.border =
                border

              cell.alignment = {
                horizontal:
                  'center',

                vertical:
                  'middle',

                wrapText:
                  true,
              }
            }
          }

          rowNumber =
            endRow +
            1
        },
      )
    },
  )

  const buffer =
    await workbook.xlsx.writeBuffer()

  const fileName =
    `SwimCoach_${monthKey}_${currentCoach}.xlsx`

  downloadWorkbook(
    buffer,
    fileName,
  )
}