import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { supabase } from '../lib/supabase'

export type Coach =
  | 'Jack'
  | 'Thomas'
  | 'Jack + Thomas'

export type CurrentCoach =
  | 'Jack'
  | 'Thomas'
  | null

export type Split =
  | 'Jack 100%'
  | 'Thomas 100%'
  | '50 / 50'

export type LessonStatus =
  | 'Pending'
  | 'Present'
  | 'Absent'
  | 'Cancelled'

export type LessonType =
  | 'regular'
  | 'replacement'
  | 'extra'

export type CycleStatus =
  | 'active'
  | 'completed'

export type PaymentStatus =
  | 'not_due'
  | 'pending'
  | 'paid'

export type StudentStatus =
  | 'active'
  | 'stopped'
  | 'graduated'

export type StudentType =
  | 'Group'
  | 'Private'
  | 'Competitive'

export type Student = {
  id: number
  name: string
  parentName: string
  phone: string
  location: string
  studentType: StudentType
  day: string
  startTime: string
  endTime: string
  packagePrice: number
  lessonEarning: number
  defaultCoach: Coach
  defaultSplit: Split
  status: StudentStatus
  statusChangedDate: string | null
  attendanceTrackingStartDate: string | null
  lessonDates: (string | null)[]
}

export type LessonSession = {
  id: number
  studentId: number
  cycleId: number | null
  lessonDate: string
  startTime: string
  endTime: string
  location: string
  lessonType: LessonType
  replacementForDate: string | null
  status: LessonStatus
  coach: Coach
  packagePrice: number
  lessonEarning: number
  earningSplit: Split
  jackEarning: number
  thomasEarning: number
  createdBy: string | null
  updatedBy: string | null
}

export type LessonCycle = {
  id: number
  studentId: number
  cycleNumber: number
  cycleStatus: CycleStatus
  paymentStatus: PaymentStatus
  startedAt: string | null
  completedAt: string | null
  paymentConfirmedAt: string | null
  paymentConfirmedBy: string | null
}

export type AttendanceRecord = {
  sessionId: number
  studentId: number
  cycleId: number | null
  dateKey: string
  dateLabel: string
  status: LessonStatus
  lessonType: LessonType
  startTime: string
  endTime: string
  location: string
  coach: Coach
  packagePrice: number
  lessonEarning: number
  earningSplit: Split
  jackEarning: number
  thomasEarning: number
}

type StudentDatabaseRow = {
  id: number
  name: string
  parent_name: string | null
  phone: string | null
  location: string
  student_type: string
  day: string
  start_time: string
  end_time: string
  package_price: number | string
  lesson_earning: number | string
  default_coach: string
  default_split: string
  status: string
  status_changed_date: string | null
  attendance_tracking_start_date: string | null
}

type LessonSessionDatabaseRow = {
  id: number
  student_id: number
  cycle_id: number | null
  lesson_date: string
  start_time: string
  end_time: string
  location: string
  lesson_type: string
  replacement_for_date: string | null
  status: string
  coach: string
  package_price: number | string
  lesson_earning: number | string
  earning_split: string
  jack_earning: number | string
  thomas_earning: number | string
  created_by: string | null
  updated_by: string | null
}

type LessonCycleDatabaseRow = {
  id: number
  student_id: number
  cycle_number: number
  cycle_status: string
  payment_status: string
  started_at: string | null
  completed_at: string | null
  payment_confirmed_at: string | null
  payment_confirmed_by: string | null
}

type NewStudent = Omit<
  Student,
  | 'id'
  | 'lessonDates'
  | 'status'
  | 'statusChangedDate'
  | 'attendanceTrackingStartDate'
>

type CreateSpecialLessonInput = {
  studentId: number
  lessonDate: string
  startTime: string
  endTime: string
  location: string
  lessonType:
    | 'replacement'
    | 'extra'
  replacementForDate?:
    | string
    | null
  coach: Coach
  earningSplit: Split
  lessonEarning: number
}

type SwimCoachContextType = {
  currentCoach: CurrentCoach
  profileLoading: boolean

  students: Student[]
  lessonSessions: LessonSession[]
  lessonCycles: LessonCycle[]
  attendance: AttendanceRecord[]

  studentsLoading: boolean
  sessionsLoading: boolean
  cyclesLoading: boolean

  studentsError: string
  sessionsError: string
  cyclesError: string

  addStudent: (
    student: NewStudent,
  ) => Promise<boolean>

  updateStudent: (
    student: Student,
  ) => Promise<boolean>

  stopStudent: (
    studentId: number,
    stopDate: string,
  ) => Promise<boolean>

  graduateStudent: (
    studentId: number,
    graduateDate: string,
  ) => Promise<boolean>

  reactivateStudent: (
    studentId: number,
    resumeDate: string,
  ) => Promise<boolean>

  isStudentActiveOnDate: (
    student: Student,
    dateKey: string,
  ) => boolean

  refreshStudents:
    () => Promise<void>

  refreshLessonSessions:
    () => Promise<void>

  refreshLessonCycles:
    () => Promise<void>

  refreshAll:
    () => Promise<void>

  getAttendanceRecord: (
    studentId: number,
    dateKey: string,
  ) =>
    | AttendanceRecord
    | undefined

  getRegularSession: (
    studentId: number,
    dateKey: string,
  ) =>
    | LessonSession
    | undefined

  getSessionById: (
    sessionId: number,
  ) =>
    | LessonSession
    | undefined

  updateAttendanceStatus: (
    sessionId: number | null,
    studentId: number,
    dateKey: string,
    status: LessonStatus,
    earningSplit: Split,
  ) => Promise<boolean>

  updateLessonSplit: (
    sessionId: number,
    earningSplit: Split,
  ) => Promise<boolean>

  createSpecialLesson: (
    input: CreateSpecialLessonInput,
  ) => Promise<boolean>

  confirmCyclePayment: (
    cycleId: number,
  ) => Promise<boolean>

  hasPendingPayment: (
    studentId: number,
  ) => boolean

  getPendingCycles: (
    studentId: number,
  ) => LessonCycle[]

  getCurrentCycle: (
    studentId: number,
  ) =>
    | LessonCycle
    | undefined

  getCycleLessonCount: (
    cycleId: number,
  ) => number
}

const SwimCoachContext =
  createContext<
    SwimCoachContextType | undefined
  >(undefined)

function getTodayDateKey() {
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
    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    ),
  ].join('-')
}

function databaseStatusToAppStatus(
  status: string,
): LessonStatus {
  if (
    status ===
    'present'
  ) {
    return 'Present'
  }

  if (
    status ===
    'absent'
  ) {
    return 'Absent'
  }

  if (
    status ===
    'cancelled'
  ) {
    return 'Cancelled'
  }

  return 'Pending'
}

function appStatusToDatabaseStatus(
  status: LessonStatus,
) {
  return status.toLowerCase()
}

function formatLessonDate(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
    },
  )
}

function getDateWeekday(
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

function getAbsoluteTimeRange(
  dateKey: string,
  startTime: string,
  endTime: string,
) {
  const start =
    new Date(
      `${dateKey}T${startTime}:00`,
    )

  const end =
    new Date(
      `${dateKey}T${endTime}:00`,
    )

  if (
    end.getTime() <=
    start.getTime()
  ) {
    end.setDate(
      end.getDate() + 1,
    )
  }

  return {
    start:
      start.getTime(),

    end:
      end.getTime(),
  }
}

function timeRangesOverlap(
  firstDate: string,
  firstStart: string,
  firstEnd: string,
  secondDate: string,
  secondStart: string,
  secondEnd: string,
) {
  const first =
    getAbsoluteTimeRange(
      firstDate,
      firstStart,
      firstEnd,
    )

  const second =
    getAbsoluteTimeRange(
      secondDate,
      secondStart,
      secondEnd,
    )

  return (
    first.start <
      second.end &&
    first.end >
      second.start
  )
}

function calculateSplit(
  amount: number,
  split: Split,
) {
  if (
    split ===
    'Jack 100%'
  ) {
    return {
      jackEarning:
        amount,

      thomasEarning:
        0,
    }
  }

  if (
    split ===
    'Thomas 100%'
  ) {
    return {
      jackEarning:
        0,

      thomasEarning:
        amount,
    }
  }

  const jackEarning =
    amount / 2

  return {
    jackEarning,

    thomasEarning:
      amount -
      jackEarning,
  }
}

function convertDatabaseSession(
  row:
    LessonSessionDatabaseRow,
): LessonSession {
  return {
    id:
      row.id,

    studentId:
      row.student_id,

    cycleId:
      row.cycle_id,

    lessonDate:
      row.lesson_date,

    startTime:
      row.start_time.slice(
        0,
        5,
      ),

    endTime:
      row.end_time.slice(
        0,
        5,
      ),

    location:
      row.location,

    lessonType:
      row.lesson_type as
        LessonType,

    replacementForDate:
      row.replacement_for_date,

    status:
      databaseStatusToAppStatus(
        row.status,
      ),

    coach:
      row.coach as
        Coach,

    packagePrice:
      Number(
        row.package_price,
      ),

    lessonEarning:
      Number(
        row.lesson_earning,
      ),

    earningSplit:
      row.earning_split as
        Split,

    jackEarning:
      Number(
        row.jack_earning,
      ),

    thomasEarning:
      Number(
        row.thomas_earning,
      ),

    createdBy:
      row.created_by,

    updatedBy:
      row.updated_by,
  }
}

function convertDatabaseCycle(
  row:
    LessonCycleDatabaseRow,
): LessonCycle {
  return {
    id:
      row.id,

    studentId:
      row.student_id,

    cycleNumber:
      row.cycle_number,

    cycleStatus:
      row.cycle_status as
        CycleStatus,

    paymentStatus:
      row.payment_status as
        PaymentStatus,

    startedAt:
      row.started_at,

    completedAt:
      row.completed_at,

    paymentConfirmedAt:
      row.payment_confirmed_at,

    paymentConfirmedBy:
      row.payment_confirmed_by,
  }
}

function convertDatabaseStudent(
  row: StudentDatabaseRow,
  sessions: LessonSession[],
  cycles: LessonCycle[],
): Student {
  const studentCycles =
    cycles
      .filter(
        (cycle) =>
          cycle.studentId ===
          row.id,
      )
      .sort(
        (
          a,
          b,
        ) =>
          b.cycleNumber -
          a.cycleNumber,
      )

  const activeCycle =
    studentCycles.find(
      (cycle) =>
        cycle.cycleStatus ===
        'active',
    )

  const pendingCycle =
    studentCycles.find(
      (cycle) =>
        cycle.cycleStatus ===
          'completed' &&
        cycle.paymentStatus ===
          'pending',
    )

  const displayCycle =
    activeCycle ??
    pendingCycle

  const cycleSessions =
    displayCycle
      ? sessions
          .filter(
            (session) =>
              session.studentId ===
                row.id &&
              session.cycleId ===
                displayCycle.id &&
              session.status ===
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
              ),
          )
      : []

  const lessonDates:
    (string | null)[] =
      cycleSessions
        .slice(
          0,
          4,
        )
        .map(
          (session) =>
            formatLessonDate(
              session.lessonDate,
            ),
        )

  while (
    lessonDates.length <
    4
  ) {
    lessonDates.push(
      null,
    )
  }

  return {
    id:
      row.id,

    name:
      row.name,

    parentName:
      row.parent_name ??
      '-',

    phone:
      row.phone ??
      '-',

    location:
      row.location,

    studentType:
      row.student_type as
        StudentType,

    day:
      row.day,

    startTime:
      row.start_time.slice(
        0,
        5,
      ),

    endTime:
      row.end_time.slice(
        0,
        5,
      ),

    packagePrice:
      Number(
        row.package_price,
      ),

    lessonEarning:
      Number(
        row.lesson_earning,
      ),

    defaultCoach:
      row.default_coach as
        Coach,

    defaultSplit:
      row.default_split as
        Split,

    status:
      (
        row.status ||
        'active'
      ) as StudentStatus,

    statusChangedDate:
      row.status_changed_date ??
      null,

    attendanceTrackingStartDate:
      row.attendance_tracking_start_date ??
      null,

    lessonDates,
  }
}

export function SwimCoachProvider({
  children,
}: {
  children: ReactNode
}) {
  const [
    currentCoach,
    setCurrentCoach,
  ] =
    useState<CurrentCoach>(
      null,
    )

  const [
    profileLoading,
    setProfileLoading,
  ] =
    useState(true)

  const [
    studentRows,
    setStudentRows,
  ] =
    useState<
      StudentDatabaseRow[]
    >([])

  const [
    lessonSessions,
    setLessonSessions,
  ] =
    useState<
      LessonSession[]
    >([])

  const [
    lessonCycles,
    setLessonCycles,
  ] =
    useState<
      LessonCycle[]
    >([])

  const [
    studentsLoading,
    setStudentsLoading,
  ] =
    useState(false)

  const [
    sessionsLoading,
    setSessionsLoading,
  ] =
    useState(false)

  const [
    cyclesLoading,
    setCyclesLoading,
  ] =
    useState(false)

  const [
    studentsError,
    setStudentsError,
  ] =
    useState('')

  const [
    sessionsError,
    setSessionsError,
  ] =
    useState('')

  const [
    cyclesError,
    setCyclesError,
  ] =
    useState('')

  const students =
    useMemo(
      () =>
        studentRows
          .map(
            (row) =>
              convertDatabaseStudent(
                row,
                lessonSessions,
                lessonCycles,
              ),
          )
          .sort(
            (
              a,
              b,
            ) =>
              a.name.localeCompare(
                b.name,
              ),
          ),
      [
        studentRows,
        lessonSessions,
        lessonCycles,
      ],
    )

  const attendance =
    useMemo<
      AttendanceRecord[]
    >(
      () =>
        lessonSessions.map(
          (session) => ({
            sessionId:
              session.id,

            studentId:
              session.studentId,

            cycleId:
              session.cycleId,

            dateKey:
              session.lessonDate,

            dateLabel:
              formatLessonDate(
                session.lessonDate,
              ),

            status:
              session.status,

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

            packagePrice:
              session.packagePrice,

            lessonEarning:
              session.lessonEarning,

            earningSplit:
              session.earningSplit,

            jackEarning:
              session.jackEarning,

            thomasEarning:
              session.thomasEarning,
          }),
        ),
      [
        lessonSessions,
      ],
    )

  const loadCurrentCoach =
    async () => {
      setProfileLoading(
        true,
      )

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        setCurrentCoach(
          null,
        )

        setProfileLoading(
          false,
        )

        return
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'profiles',
          )
          .select(
            'coach_name',
          )
          .eq(
            'user_id',
            user.id,
          )
          .single()

      if (error) {
        console.error(
          error,
        )

        setCurrentCoach(
          null,
        )

        setProfileLoading(
          false,
        )

        return
      }

      setCurrentCoach(
        data.coach_name as
          | 'Jack'
          | 'Thomas',
      )

      setProfileLoading(
        false,
      )
    }

  const refreshStudents =
    async () => {
      setStudentsLoading(
        true,
      )

      setStudentsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'students',
          )
          .select(`
            id,
            name,
            parent_name,
            phone,
            location,
            student_type,
            day,
            start_time,
            end_time,
            package_price,
            lesson_earning,
            default_coach,
            default_split,
            status,
            status_changed_date,
            attendance_tracking_start_date
          `)
          .order(
            'name',
            {
              ascending:
                true,
            },
          )

      if (error) {
        console.error(
          error,
        )

        setStudentsError(
          'Unable to load students.',
        )

        setStudentsLoading(
          false,
        )

        return
      }

      setStudentRows(
        data as
          StudentDatabaseRow[],
      )

      setStudentsLoading(
        false,
      )
    }

  const refreshLessonSessions =
    async () => {
      setSessionsLoading(
        true,
      )

      setSessionsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_sessions',
          )
          .select(`
            id,
            student_id,
            cycle_id,
            lesson_date,
            start_time,
            end_time,
            location,
            lesson_type,
            replacement_for_date,
            status,
            coach,
            package_price,
            lesson_earning,
            earning_split,
            jack_earning,
            thomas_earning,
            created_by,
            updated_by
          `)
          .order(
            'lesson_date',
            {
              ascending:
                true,
            },
          )
          .order(
            'start_time',
            {
              ascending:
                true,
            },
          )

      if (error) {
        console.error(
          error,
        )

        setSessionsError(
          'Unable to load lesson sessions.',
        )

        setSessionsLoading(
          false,
        )

        return
      }

      setLessonSessions(
        (
          data as
            LessonSessionDatabaseRow[]
        ).map(
          convertDatabaseSession,
        ),
      )

      setSessionsLoading(
        false,
      )
    }

  const refreshLessonCycles =
    async () => {
      setCyclesLoading(
        true,
      )

      setCyclesError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_cycles',
          )
          .select(`
            id,
            student_id,
            cycle_number,
            cycle_status,
            payment_status,
            started_at,
            completed_at,
            payment_confirmed_at,
            payment_confirmed_by
          `)
          .order(
            'cycle_number',
            {
              ascending:
                true,
            },
          )

      if (error) {
        console.error(
          error,
        )

        setCyclesError(
          'Unable to load lesson cycles.',
        )

        setCyclesLoading(
          false,
        )

        return
      }

      setLessonCycles(
        (
          data as
            LessonCycleDatabaseRow[]
        ).map(
          convertDatabaseCycle,
        ),
      )

      setCyclesLoading(
        false,
      )
    }

  const refreshAll =
    async () => {
      await Promise.all([
        loadCurrentCoach(),
        refreshStudents(),
        refreshLessonSessions(),
        refreshLessonCycles(),
      ])
    }

  useEffect(() => {
    const loadData =
      async () => {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (session) {
          await refreshAll()
        }
      }

    loadData()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session,
        ) => {
          if (
            event ===
              'SIGNED_IN' &&
            session
          ) {
            refreshAll()
          }

          if (
            event ===
            'SIGNED_OUT'
          ) {
            setCurrentCoach(
              null,
            )

            setStudentRows(
              [],
            )

            setLessonSessions(
              [],
            )

            setLessonCycles(
              [],
            )
          }
        },
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addStudent =
    async (
      student:
        NewStudent,
    ) => {
      setStudentsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'students',
          )
          .insert({
            name:
              student.name,

            parent_name:
              student.parentName ===
              '-'
                ? null
                : student.parentName,

            phone:
              student.phone ===
              '-'
                ? null
                : student.phone,

            location:
              student.location,

            student_type:
              student.studentType,

            day:
              student.day,

            start_time:
              student.startTime,

            end_time:
              student.endTime,

            package_price:
              student.packagePrice,

            lesson_earning:
              student.lessonEarning,

            default_coach:
              student.defaultCoach,

            default_split:
              student.defaultSplit,

            status:
              'active',

            status_changed_date:
              null,

            attendance_tracking_start_date:
              getTodayDateKey(),
          })
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setStudentsError(
          'Unable to add student.',
        )

        return false
      }

      setStudentRows(
        (current) => [
          ...current,
          data as
            StudentDatabaseRow,
        ],
      )

      return true
    }

  const updateStudent =
    async (
      student:
        Student,
    ) => {
      setStudentsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'students',
          )
          .update({
            name:
              student.name,

            parent_name:
              student.parentName ===
              '-'
                ? null
                : student.parentName,

            phone:
              student.phone ===
              '-'
                ? null
                : student.phone,

            location:
              student.location,

            student_type:
              student.studentType,

            day:
              student.day,

            start_time:
              student.startTime,

            end_time:
              student.endTime,

            package_price:
              student.packagePrice,

            lesson_earning:
              student.lessonEarning,

            default_coach:
              student.defaultCoach,

            default_split:
              student.defaultSplit,
          })
          .eq(
            'id',
            student.id,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setStudentsError(
          'Unable to update student.',
        )

        return false
      }

      setStudentRows(
        (current) =>
          current.map(
            (row) =>
              row.id ===
              student.id
                ? data as
                    StudentDatabaseRow
                : row,
          ),
      )

      return true
    }

  const isStudentActiveOnDate =
    (
      student: Student,
      dateKey: string,
    ) => {
      if (
        student.status ===
        'active'
      ) {
        return true
      }

      if (
        !student.statusChangedDate
      ) {
        return false
      }

      return (
        dateKey <
        student.statusChangedDate
      )
    }

  const stopStudent =
    async (
      studentId: number,
      stopDate: string,
    ) => {
      setStudentsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'students',
          )
          .update({
            status:
              'stopped',

            status_changed_date:
              stopDate,
          })
          .eq(
            'id',
            studentId,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setStudentsError(
          'Unable to stop lesson.',
        )

        return false
      }

      setStudentRows(
        (current) =>
          current.map(
            (row) =>
              row.id ===
              studentId
                ? data as
                    StudentDatabaseRow
                : row,
          ),
      )

      return true
    }

  const graduateStudent =
    async (
      studentId: number,
      graduateDate: string,
    ) => {
      setStudentsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'students',
          )
          .update({
            status:
              'graduated',

            status_changed_date:
              graduateDate,
          })
          .eq(
            'id',
            studentId,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setStudentsError(
          'Unable to graduate student.',
        )

        return false
      }

      setStudentRows(
        (current) =>
          current.map(
            (row) =>
              row.id ===
              studentId
                ? data as
                    StudentDatabaseRow
                : row,
          ),
      )

      return true
    }

  const reactivateStudent =
    async (
      studentId: number,
      resumeDate: string,
    ) => {
      setStudentsError(
        '',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'students',
          )
          .update({
            status:
              'active',

            status_changed_date:
              null,

            attendance_tracking_start_date:
              resumeDate,
          })
          .eq(
            'id',
            studentId,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setStudentsError(
          'Unable to resume lessons.',
        )

        return false
      }

      setStudentRows(
        (current) =>
          current.map(
            (row) =>
              row.id ===
              studentId
                ? data as
                    StudentDatabaseRow
                : row,
          ),
      )

      return true
    }

  const getCycleLessonCount = (
    cycleId: number,
  ) => {
    return lessonSessions.filter(
      (session) =>
        session.cycleId ===
          cycleId &&
        session.status ===
          'Present',
    ).length
  }

  const getPendingCycles = (
    studentId:
      number,
  ) => {
    return lessonCycles
      .filter(
        (cycle) =>
          cycle.studentId ===
            studentId &&
          cycle.cycleStatus ===
            'completed' &&
          cycle.paymentStatus ===
            'pending',
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.cycleNumber -
          b.cycleNumber,
      )
  }

  const hasPendingPayment = (
    studentId:
      number,
  ) => {
    return (
      getPendingCycles(
        studentId,
      ).length >
      0
    )
  }

  const getCurrentCycle = (
    studentId:
      number,
  ) => {
    return lessonCycles
      .filter(
        (cycle) =>
          cycle.studentId ===
            studentId &&
          cycle.cycleStatus ===
            'active',
      )
      .sort(
        (
          a,
          b,
        ) =>
          b.cycleNumber -
          a.cycleNumber,
      )[0]
  }

  const getSessionById = (
    sessionId:
      number,
  ) => {
    return lessonSessions.find(
      (session) =>
        session.id ===
        sessionId,
    )
  }

  const getRegularSession = (
    studentId:
      number,
    dateKey:
      string,
  ) => {
    return lessonSessions.find(
      (session) =>
        session.studentId ===
          studentId &&
        session.lessonDate ===
          dateKey &&
        session.lessonType ===
          'regular',
    )
  }

  const getAttendanceRecord = (
    studentId:
      number,
    dateKey:
      string,
  ) => {
    const regular =
      attendance.find(
        (record) =>
          record.studentId ===
            studentId &&
          record.dateKey ===
            dateKey &&
          record.lessonType ===
            'regular',
      )

    if (regular) {
      return regular
    }

    return attendance.find(
      (record) =>
        record.studentId ===
          studentId &&
        record.dateKey ===
          dateKey,
    )
  }

  const createNewCycle =
    async (
      studentId:
        number,
      lessonDate:
        string,
    ) => {
      const existingCycles =
        lessonCycles.filter(
          (cycle) =>
            cycle.studentId ===
            studentId,
        )

      const highestCycleNumber =
        existingCycles.reduce(
          (
            highest,
            cycle,
          ) =>
            Math.max(
              highest,
              cycle.cycleNumber,
            ),
          0,
        )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_cycles',
          )
          .insert({
            student_id:
              studentId,

            cycle_number:
              highestCycleNumber +
              1,

            cycle_status:
              'active',

            payment_status:
              'not_due',

            started_at:
              lessonDate,

            updated_at:
              new Date()
                .toISOString(),
          })
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setCyclesError(
          'Unable to create lesson cycle.',
        )

        return null
      }

      const cycle =
        convertDatabaseCycle(
          data as
            LessonCycleDatabaseRow,
        )

      setLessonCycles(
        (current) => [
          ...current,
          cycle,
        ],
      )

      return cycle
    }

  const getOrCreateActiveCycle =
    async (
      studentId:
        number,
      lessonDate:
        string,
    ) => {
      const activeCycle =
        lessonCycles
          .filter(
            (cycle) =>
              cycle.studentId ===
                studentId &&
              cycle.cycleStatus ===
                'active',
          )
          .sort(
            (
              a,
              b,
            ) =>
              b.cycleNumber -
              a.cycleNumber,
          )[0]

      if (
        activeCycle
      ) {
        return activeCycle
      }

      return createNewCycle(
        studentId,
        lessonDate,
      )
    }

  const syncCycleStatus =
    async (
      cycleId:
        number,
      lessonDate:
        string,
    ) => {
      const {
        data:
          presentRows,
        error:
          presentError,
      } =
        await supabase
          .from(
            'lesson_sessions',
          )
          .select(
            'id',
          )
          .eq(
            'cycle_id',
            cycleId,
          )
          .eq(
            'status',
            'present',
          )

      if (
        presentError
      ) {
        console.error(
          presentError,
        )

        return
      }

      const presentCount =
        presentRows?.length ??
        0

      const {
        data:
          cycleData,
        error:
          cycleError,
      } =
        await supabase
          .from(
            'lesson_cycles',
          )
          .select(`
            id,
            student_id,
            cycle_number,
            cycle_status,
            payment_status,
            started_at,
            completed_at,
            payment_confirmed_at,
            payment_confirmed_by
          `)
          .eq(
            'id',
            cycleId,
          )
          .single()

      if (
        cycleError ||
        !cycleData
      ) {
        console.error(
          cycleError,
        )

        return
      }

      const cycle =
        convertDatabaseCycle(
          cycleData as
            LessonCycleDatabaseRow,
        )

      if (
        presentCount >=
        4
      ) {
        if (
          cycle.cycleStatus ===
          'completed'
        ) {
          return
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'lesson_cycles',
            )
            .update({
              cycle_status:
                'completed',

              payment_status:
                'pending',

              completed_at:
                lessonDate,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              'id',
              cycleId,
            )
            .select()
            .single()

        if (error) {
          console.error(
            error,
          )

          setCyclesError(
            'Unable to complete lesson cycle.',
          )

          return
        }

        const updatedCycle =
          convertDatabaseCycle(
            data as
              LessonCycleDatabaseRow,
          )

        setLessonCycles(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updatedCycle.id
                  ? updatedCycle
                  : item,
            ),
        )

        return
      }

      if (
        cycle.paymentStatus ===
        'paid'
      ) {
        return
      }

      if (
        cycle.cycleStatus ===
          'active' &&
        cycle.paymentStatus ===
          'not_due'
      ) {
        return
      }

      const laterCycleExists =
        lessonCycles.some(
          (item) =>
            item.studentId ===
              cycle.studentId &&
            item.cycleNumber >
              cycle.cycleNumber,
        )

      if (
        laterCycleExists
      ) {
        return
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_cycles',
          )
          .update({
            cycle_status:
              'active',

            payment_status:
              'not_due',

            completed_at:
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            'id',
            cycleId,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        return
      }

      const updatedCycle =
        convertDatabaseCycle(
          data as
            LessonCycleDatabaseRow,
        )

      setLessonCycles(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updatedCycle.id
                ? updatedCycle
                : item,
          ),
      )
    }

  const updateAttendanceStatus =
    async (
      sessionId:
        number | null,
      studentId:
        number,
      dateKey:
        string,
      status:
        LessonStatus,
      earningSplit:
        Split,
    ) => {
      setSessionsError(
        '',
      )

      const student =
        students.find(
          (item) =>
            item.id ===
            studentId,
        )

      if (!student) {
        return false
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        return false
      }

      const existingSession =
        sessionId
          ? getSessionById(
              sessionId,
            )
          : getRegularSession(
              studentId,
              dateKey,
            )

      if (
        status ===
          'Pending' &&
        !existingSession
      ) {
        return true
      }

      const wasPresent =
        existingSession
          ?.status ===
        'Present'

      const willBePresent =
        status ===
        'Present'

      const lessonEarning =
        existingSession
          ?.lessonEarning ??
        student.lessonEarning

      const earnings =
        willBePresent
          ? calculateSplit(
              lessonEarning,
              earningSplit,
            )
          : {
              jackEarning:
                0,

              thomasEarning:
                0,
            }

      let cycleId =
        existingSession
          ?.cycleId ??
        null

      if (
        willBePresent &&
        !cycleId
      ) {
        const cycle =
          await getOrCreateActiveCycle(
            studentId,
            dateKey,
          )

        if (!cycle) {
          return false
        }

        cycleId =
          cycle.id
      }

      if (
        existingSession
      ) {
        const previousCycleId =
          existingSession
            .cycleId

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'lesson_sessions',
            )
            .update({
              cycle_id:
                willBePresent
                  ? cycleId
                  : null,

              status:
                appStatusToDatabaseStatus(
                  status,
                ),

              earning_split:
                earningSplit,

              jack_earning:
                earnings.jackEarning,

              thomas_earning:
                earnings.thomasEarning,

              updated_by:
                user.id,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              'id',
              existingSession.id,
            )
            .select()
            .single()

        if (error) {
          console.error(
            error,
          )

          setSessionsError(
            'Unable to update attendance.',
          )

          return false
        }

        const updatedSession =
          convertDatabaseSession(
            data as
              LessonSessionDatabaseRow,
          )

        setLessonSessions(
          (current) =>
            current.map(
              (session) =>
                session.id ===
                updatedSession.id
                  ? updatedSession
                  : session,
            ),
        )

        if (
          previousCycleId &&
          wasPresent &&
          !willBePresent
        ) {
          await syncCycleStatus(
            previousCycleId,
            dateKey,
          )
        }

        if (
          cycleId &&
          willBePresent
        ) {
          await syncCycleStatus(
            cycleId,
            dateKey,
          )
        }

        return true
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_sessions',
          )
          .insert({
            student_id:
              studentId,

            cycle_id:
              willBePresent
                ? cycleId
                : null,

            lesson_date:
              dateKey,

            start_time:
              student.startTime,

            end_time:
              student.endTime,

            location:
              student.location,

            lesson_type:
              'regular',

            replacement_for_date:
              null,

            status:
              appStatusToDatabaseStatus(
                status,
              ),

            coach:
              student.defaultCoach,

            package_price:
              student.packagePrice,

            lesson_earning:
              student.lessonEarning,

            earning_split:
              earningSplit,

            jack_earning:
              earnings.jackEarning,

            thomas_earning:
              earnings.thomasEarning,

            created_by:
              user.id,

            updated_by:
              user.id,

            updated_at:
              new Date()
                .toISOString(),
          })
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setSessionsError(
          'Unable to save attendance.',
        )

        return false
      }

      const createdSession =
        convertDatabaseSession(
          data as
            LessonSessionDatabaseRow,
        )

      setLessonSessions(
        (current) => [
          ...current,
          createdSession,
        ],
      )

      if (
        cycleId &&
        willBePresent
      ) {
        await syncCycleStatus(
          cycleId,
          dateKey,
        )
      }

      return true
    }

  const updateLessonSplit =
    async (
      sessionId:
        number,
      earningSplit:
        Split,
    ) => {
      const session =
        getSessionById(
          sessionId,
        )

      if (!session) {
        return false
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        return false
      }

      const earnings =
        session.status ===
        'Present'
          ? calculateSplit(
              session.lessonEarning,
              earningSplit,
            )
          : {
              jackEarning:
                0,

              thomasEarning:
                0,
            }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_sessions',
          )
          .update({
            earning_split:
              earningSplit,

            jack_earning:
              earnings.jackEarning,

            thomas_earning:
              earnings.thomasEarning,

            updated_by:
              user.id,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            'id',
            sessionId,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setSessionsError(
          'Unable to update earning split.',
        )

        return false
      }

      const updatedSession =
        convertDatabaseSession(
          data as
            LessonSessionDatabaseRow,
        )

      setLessonSessions(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updatedSession.id
                ? updatedSession
                : item,
          ),
      )

      return true
    }

  const createSpecialLesson =
    async (
      input:
        CreateSpecialLessonInput,
    ) => {
      setSessionsError(
        '',
      )

      const student =
        students.find(
          (item) =>
            item.id ===
            input.studentId,
        )

      if (!student) {
        setSessionsError(
          'Student could not be found.',
        )

        return false
      }

      if (
        !isStudentActiveOnDate(
          student,
          input.lessonDate,
        )
      ) {
        setSessionsError(
          `${student.name} is no longer active on this date.`,
        )

        return false
      }

      if (
        input.startTime ===
        input.endTime
      ) {
        setSessionsError(
          'Start time and end time cannot be the same.',
        )

        return false
      }

      if (
        input.lessonType ===
          'replacement' &&
        !input.replacementForDate
      ) {
        setSessionsError(
          'Replacement class requires the original class date.',
        )

        return false
      }

      const selectedDate =
        input.lessonDate

      const previousDate =
        addDays(
          selectedDate,
          -1,
        )

      const selectedWeekday =
        getDateWeekday(
          selectedDate,
        )

      const previousWeekday =
        getDateWeekday(
          previousDate,
        )

      const regularStartsToday =
        selectedWeekday ===
        student.day

      if (
        regularStartsToday &&
        timeRangesOverlap(
          selectedDate,
          input.startTime,
          input.endTime,
          selectedDate,
          student.startTime,
          student.endTime,
        )
      ) {
        setSessionsError(
          `This class overlaps ${student.name}'s Regular lesson (${student.startTime} - ${student.endTime}).`,
        )

        return false
      }

      const regularCrossesMidnight =
        student.endTime <=
        student.startTime

      const regularStartedYesterday =
        previousWeekday ===
          student.day &&
        regularCrossesMidnight

      if (
        regularStartedYesterday &&
        timeRangesOverlap(
          selectedDate,
          input.startTime,
          input.endTime,
          previousDate,
          student.startTime,
          student.endTime,
        )
      ) {
        setSessionsError(
          `This class overlaps ${student.name}'s Regular lesson (${student.startTime} - ${student.endTime}).`,
        )

        return false
      }

      const overlappingSession =
        lessonSessions.find(
          (session) => {
            if (
              session.studentId !==
                input.studentId ||
              session.status ===
                'Cancelled'
            ) {
              return false
            }

            return timeRangesOverlap(
              selectedDate,
              input.startTime,
              input.endTime,
              session.lessonDate,
              session.startTime,
              session.endTime,
            )
          },
        )

      if (
        overlappingSession
      ) {
        setSessionsError(
          `This class overlaps an existing ${overlappingSession.lessonType} lesson (${overlappingSession.startTime} - ${overlappingSession.endTime}).`,
        )

        return false
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        setSessionsError(
          'You are not logged in.',
        )

        return false
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_sessions',
          )
          .insert({
            student_id:
              input.studentId,

            cycle_id:
              null,

            lesson_date:
              input.lessonDate,

            start_time:
              input.startTime,

            end_time:
              input.endTime,

            location:
              input.location,

            lesson_type:
              input.lessonType,

            replacement_for_date:
              input.lessonType ===
                'replacement'
                ? input.replacementForDate ??
                  null
                : null,

            status:
              'pending',

            coach:
              input.coach,

            package_price:
              student.packagePrice,

            lesson_earning:
              input.lessonEarning,

            earning_split:
              input.earningSplit,

            jack_earning:
              0,

            thomas_earning:
              0,

            created_by:
              user.id,

            updated_by:
              user.id,

            updated_at:
              new Date()
                .toISOString(),
          })
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setSessionsError(
          'Unable to create class.',
        )

        return false
      }

      const createdSession =
        convertDatabaseSession(
          data as
            LessonSessionDatabaseRow,
        )

      setLessonSessions(
        (current) => [
          ...current,
          createdSession,
        ],
      )

      return true
    }

  const confirmCyclePayment =
    async (
      cycleId:
        number,
    ) => {
      setCyclesError(
        '',
      )

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        return false
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'lesson_cycles',
          )
          .update({
            payment_status:
              'paid',

            payment_confirmed_at:
              new Date()
                .toISOString(),

            payment_confirmed_by:
              user.id,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            'id',
            cycleId,
          )
          .select()
          .single()

      if (error) {
        console.error(
          error,
        )

        setCyclesError(
          'Unable to confirm payment.',
        )

        return false
      }

      const updatedCycle =
        convertDatabaseCycle(
          data as
            LessonCycleDatabaseRow,
        )

      setLessonCycles(
        (current) =>
          current.map(
            (cycle) =>
              cycle.id ===
              updatedCycle.id
                ? updatedCycle
                : cycle,
          ),
      )

      return true
    }

  return (
    <SwimCoachContext.Provider
      value={{
        currentCoach,
        profileLoading,

        students,
        lessonSessions,
        lessonCycles,
        attendance,

        studentsLoading,
        sessionsLoading,
        cyclesLoading,

        studentsError,
        sessionsError,
        cyclesError,

        addStudent,
        updateStudent,

        stopStudent,
        graduateStudent,
        reactivateStudent,
        isStudentActiveOnDate,

        refreshStudents,
        refreshLessonSessions,
        refreshLessonCycles,
        refreshAll,

        getAttendanceRecord,
        getRegularSession,
        getSessionById,

        updateAttendanceStatus,
        updateLessonSplit,

        createSpecialLesson,
        confirmCyclePayment,

        hasPendingPayment,
        getPendingCycles,
        getCurrentCycle,
        getCycleLessonCount,
      }}
    >
      {children}
    </SwimCoachContext.Provider>
  )
}

export function useSwimCoach() {
  const context =
    useContext(
      SwimCoachContext,
    )

  if (!context) {
    throw new Error(
      'useSwimCoach must be used inside SwimCoachProvider',
    )
  }

  return context
}