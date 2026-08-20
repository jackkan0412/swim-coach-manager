import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import Toast from '../components/Toast'
import PageLoading from '../components/PageLoading'
import PageError from '../components/PageError'
import useToast from '../hooks/useToast'

import {
  useSwimCoach,
  type Coach,
  type Split,
  type Student,
  type StudentStatus,
} from '../context/SwimCoachContext'

type StudentForm = {
  name: string
  parentName: string
  phone: string
  location: string
  day: string
  startTime: string
  endTime: string
  packagePrice: string
  lessonEarning: string
  defaultCoach: Coach
  defaultSplit: Split
}

type SpecialLessonType =
  | 'replacement'
  | 'extra'

type SpecialLessonForm = {
  lessonDate: string
  replacementForDate: string
  startTime: string
  endTime: string
  location: string
  lessonEarning: string
  coach: Coach
  earningSplit: Split
}

type LifecycleAction =
  | 'stop'
  | 'graduate'
  | 'resume'

type LifecycleTarget = {
  student: Student
  action: LifecycleAction
}

type MenuDirection =
  | 'up'
  | 'down'

const emptyForm: StudentForm = {
  name: '',
  parentName: '',
  phone: '',
  location: '',
  day: 'Monday',
  startTime: '',
  endTime: '',
  packagePrice: '',
  lessonEarning: '',
  defaultCoach: 'Jack',
  defaultSplit: 'Jack 100%',
}

function getTodayDateKey() {
  const now = new Date()

  return [
    now.getFullYear(),

    String(
      now.getMonth() + 1,
    ).padStart(2, '0'),

    String(
      now.getDate(),
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

function getDateWeekday(
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

function formatStatusLabel(
  status: StudentStatus,
) {
  if (
    status ===
    'stopped'
  ) {
    return 'Stopped'
  }

  if (
    status ===
    'graduated'
  ) {
    return 'Graduated'
  }

  return 'Active'
}

function formatDate(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00`,
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function Students() {
  const {
    students,
    studentsLoading,
    studentsError,
    lessonSessions,

    addStudent,
    updateStudent,

    stopStudent,
    graduateStudent,
    reactivateStudent,

    createSpecialLesson,
    refreshStudents,
  } = useSwimCoach()

  const {
    toast,
    showSuccess,
    showError,
    showGraduate,
    hideToast,
  } = useToast()

  const [
    searchText,
    setSearchText,
  ] =
    useState('')

  const [
    dayFilter,
    setDayFilter,
  ] =
    useState('all')

  const [
    locationFilter,
    setLocationFilter,
  ] =
    useState('all')

  const [
    coachFilter,
    setCoachFilter,
  ] =
    useState('all')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState('all')

  const [
    showAddForm,
    setShowAddForm,
  ] =
    useState(false)

  const [
    editingStudent,
    setEditingStudent,
  ] =
    useState<Student | null>(
      null,
    )

  const [
    selectedStudent,
    setSelectedStudent,
  ] =
    useState<Student | null>(
      null,
    )

  const [
    openMenuId,
    setOpenMenuId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    menuDirection,
    setMenuDirection,
  ] =
    useState<MenuDirection>(
      'down',
    )

  const [
    specialStudent,
    setSpecialStudent,
  ] =
    useState<Student | null>(
      null,
    )

  const [
    specialLessonType,
    setSpecialLessonType,
  ] =
    useState<
      SpecialLessonType | null
    >(null)

  const [
    lifecycleTarget,
    setLifecycleTarget,
  ] =
    useState<
      LifecycleTarget | null
    >(null)

  const [
    lifecycleDate,
    setLifecycleDate,
  ] =
    useState(
      getTodayDateKey(),
    )

  const [
    form,
    setForm,
  ] =
    useState<StudentForm>(
      emptyForm,
    )

  const [
    specialForm,
    setSpecialForm,
  ] =
    useState<SpecialLessonForm>({
      lessonDate:
        getTodayDateKey(),

      replacementForDate:
        '',

      startTime:
        '',

      endTime:
        '',

      location:
        '',

      lessonEarning:
        '',

      coach:
        'Jack',

      earningSplit:
        'Jack 100%',
    })

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    formError,
    setFormError,
  ] =
    useState('')

  const [
    specialFormError,
    setSpecialFormError,
  ] =
    useState('')

  const [
    specialTimeError,
    setSpecialTimeError,
  ] =
    useState('')

  const [
    lifecycleError,
    setLifecycleError,
  ] =
    useState('')

  const locations =
    useMemo(
      () =>
        Array.from(
          new Set(
            students
              .map(
                (student) =>
                  student.location,
              )
              .filter(Boolean),
          ),
        ).sort(
          (a, b) =>
            a.localeCompare(b),
        ),
      [
        students,
      ],
    )

  const filteredStudents =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase()

      const statusPriority: Record<
        StudentStatus,
        number
      > = {
        active: 1,
        stopped: 2,
        graduated: 3,
      }

      return students
        .filter(
          (student) => {
            const searchableText = [
              student.name,
              student.parentName,
              student.phone,
              student.location,
              student.day,
              student.defaultCoach,
              formatStatusLabel(
                student.status,
              ),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()

            const matchesSearch =
              !search ||
              searchableText.includes(
                search,
              )

            const matchesDay =
              dayFilter ===
                'all' ||
              student.day ===
                dayFilter

            const matchesLocation =
              locationFilter ===
                'all' ||
              student.location ===
                locationFilter

            const matchesCoach =
              coachFilter ===
                'all' ||
              student.defaultCoach ===
                coachFilter

            const matchesStatus =
              statusFilter ===
                'all' ||
              student.status ===
                statusFilter

            return (
              matchesSearch &&
              matchesDay &&
              matchesLocation &&
              matchesCoach &&
              matchesStatus
            )
          },
        )
        .sort(
          (
            a,
            b,
          ) => {
            const statusDifference =
              statusPriority[
                a.status
              ] -
              statusPriority[
                b.status
              ]

            if (
              statusDifference !==
              0
            ) {
              return (
                statusDifference
              )
            }

            return a.name.localeCompare(
              b.name,
            )
          },
        )
    }, [
      students,
      searchText,
      dayFilter,
      locationFilter,
      coachFilter,
      statusFilter,
    ])

  const activeCount =
    students.filter(
      (student) =>
        student.status ===
        'active',
    ).length

  const hasActiveFilters =
    searchText.trim() !== '' ||
    dayFilter !== 'all' ||
    locationFilter !== 'all' ||
    coachFilter !== 'all' ||
    statusFilter !== 'all'

  const clearFilters =
    () => {
      setSearchText('')
      setDayFilter('all')
      setLocationFilter('all')
      setCoachFilter('all')
      setStatusFilter('all')
    }

  const hasOpenModal =
    showAddForm ||
    editingStudent !==
      null ||
    selectedStudent !==
      null ||
    lifecycleTarget !==
      null ||
    (
      specialStudent !==
        null &&
      specialLessonType !==
        null
    )

  useEffect(() => {
    if (
      !hasOpenModal
    ) {
      return
    }

    const previousOverflow =
      document.body.style
        .overflow

    const previousOverscroll =
      document.body.style
        .overscrollBehavior

    document.body.style
      .overflow =
      'hidden'

    document.body.style
      .overscrollBehavior =
      'none'

    return () => {
      document.body.style
        .overflow =
        previousOverflow

      document.body.style
        .overscrollBehavior =
        previousOverscroll
    }
  }, [
    hasOpenModal,
  ])

  const toggleStudentMenu =
    (
      student: Student,
      button:
        HTMLButtonElement,
    ) => {
      if (
        openMenuId ===
        student.id
      ) {
        setOpenMenuId(
          null,
        )

        return
      }

      const rect =
        button.getBoundingClientRect()

      const menuItemCount =
        student.status ===
        'active'
          ? 6
          : 3

      const estimatedMenuHeight =
        (
          menuItemCount *
          44
        ) +
        4

      const mobileBottomNavSpace =
        window.innerWidth <
        1000
          ? 88
          : 16

      const availableBelow =
        window.innerHeight -
        rect.bottom -
        mobileBottomNavSpace

      const availableAbove =
        rect.top -
        16

      if (
        availableBelow >=
        estimatedMenuHeight
      ) {
        setMenuDirection(
          'down',
        )
      } else if (
        availableAbove >=
        estimatedMenuHeight
      ) {
        setMenuDirection(
          'up',
        )
      } else {
        setMenuDirection(
          availableAbove >
          availableBelow
            ? 'up'
            : 'down',
        )
      }

      setOpenMenuId(
        student.id,
      )
    }

  const getLessonProgress =
    (
      lessonDates:
        (string | null)[],
    ) => {
      return lessonDates.filter(
        Boolean,
      ).length
    }

  const closeAddForm =
    () => {
      if (
        saving
      ) {
        return
      }

      setShowAddForm(false)
      setForm(emptyForm)
      setFormError('')
    }

  const closeEditForm =
    () => {
      if (
        saving
      ) {
        return
      }

      setEditingStudent(null)
      setForm(emptyForm)
      setFormError('')
    }

  const closeDetails =
    () => {
      setSelectedStudent(null)
    }

  const viewDetails =
    (
      student: Student,
    ) => {
      setSelectedStudent(
        student,
      )

      setOpenMenuId(
        null,
      )
    }

  const openEditStudent =
    (
      student: Student,
    ) => {
      setFormError('')

      setForm({
        name:
          student.name,

        parentName:
          student.parentName ===
          '-'
            ? ''
            : student.parentName,

        phone:
          student.phone ===
          '-'
            ? ''
            : student.phone,

        location:
          student.location,

        day:
          student.day,

        startTime:
          student.startTime,

        endTime:
          student.endTime,

        packagePrice:
          String(
            student.packagePrice,
          ),

        lessonEarning:
          String(
            student.lessonEarning,
          ),

        defaultCoach:
          student.defaultCoach,

        defaultSplit:
          student.defaultSplit,
      })

      setEditingStudent(
        student,
      )

      setSelectedStudent(
        null,
      )

      setOpenMenuId(
        null,
      )
    }

  const openLifecycleAction =
    (
      student: Student,
      action: LifecycleAction,
    ) => {
      const isResume =
        action ===
        'resume'

      if (
        isResume &&
        student.status ===
          'active'
      ) {
        return
      }

      if (
        !isResume &&
        student.status !==
          'active'
      ) {
        return
      }

      setLifecycleError('')

      setLifecycleDate(
        getTodayDateKey(),
      )

      setLifecycleTarget({
        student,
        action,
      })

      setOpenMenuId(
        null,
      )
    }

  const closeLifecycleAction =
    () => {
      if (
        saving
      ) {
        return
      }

      setLifecycleTarget(
        null,
      )

      setLifecycleError(
        '',
      )
    }

  const confirmLifecycleAction =
    async () => {
      if (
        !lifecycleTarget
      ) {
        return
      }

      if (
        !lifecycleDate
      ) {
        setLifecycleError(
          'Please select a date.',
        )

        return
      }

      const target =
        lifecycleTarget

      const studentName =
        target.student.name

      setLifecycleError(
        '',
      )

      setSaving(
        true,
      )

      try {
        let success =
          false

        if (
          target.action ===
          'stop'
        ) {
          success =
            await stopStudent(
              target.student.id,
              lifecycleDate,
            )
        } else if (
          target.action ===
          'graduate'
        ) {
          success =
            await graduateStudent(
              target.student.id,
              lifecycleDate,
            )
        } else {
          success =
            await reactivateStudent(
              target.student.id,
              lifecycleDate,
            )
        }

        if (
          !success
        ) {
          if (
            target.action ===
            'stop'
          ) {
            showError(
              `Unable to stop lessons for ${studentName}.`,
            )
          } else if (
            target.action ===
            'graduate'
          ) {
            showError(
              `Unable to graduate ${studentName}.`,
            )
          } else {
            showError(
              `Unable to resume lessons for ${studentName}.`,
            )
          }

          return
        }

        if (
          selectedStudent?.id ===
          target.student.id
        ) {
          setSelectedStudent(
            null,
          )
        }

        setLifecycleTarget(
          null,
        )

        if (
          target.action ===
          'graduate'
        ) {
          showGraduate(
            `${studentName} graduated successfully.`,
          )
        } else if (
          target.action ===
          'stop'
        ) {
          showSuccess(
            `${studentName}'s lessons stopped successfully.`,
          )
        } else {
          showSuccess(
            `${studentName}'s lessons resumed successfully.`,
          )
        }
      } catch (
        error
      ) {
        console.error(
          error,
        )

        if (
          target.action ===
          'graduate'
        ) {
          showError(
            `Unable to graduate ${studentName}.`,
          )
        } else if (
          target.action ===
          'stop'
        ) {
          showError(
            `Unable to stop lessons for ${studentName}.`,
          )
        } else {
          showError(
            `Unable to resume lessons for ${studentName}.`,
          )
        }
      } finally {
        setSaving(
          false,
        )
      }
    }

  const openSpecialLesson =
    (
      student: Student,
      type:
        SpecialLessonType,
    ) => {
      if (
        student.status !==
        'active'
      ) {
        return
      }

      setSpecialStudent(
        student,
      )

      setSpecialLessonType(
        type,
      )

      setSpecialForm({
        lessonDate:
          getTodayDateKey(),

        replacementForDate:
          '',

        startTime:
          student.startTime,

        endTime:
          student.endTime,

        location:
          student.location,

        lessonEarning:
          String(
            student.lessonEarning,
          ),

        coach:
          student.defaultCoach,

        earningSplit:
          student.defaultSplit,
      })

      setSpecialFormError(
        '',
      )

      setSpecialTimeError(
        '',
      )

      setOpenMenuId(
        null,
      )
    }

  const closeSpecialLesson =
    () => {
      if (
        saving
      ) {
        return
      }

      setSpecialStudent(
        null,
      )

      setSpecialLessonType(
        null,
      )

      setSpecialFormError(
        '',
      )

      setSpecialTimeError(
        '',
      )
    }

  const handleCoachChange =
    (
      coach: Coach,
    ) => {
      let split: Split

      if (
        coach ===
        'Jack'
      ) {
        split =
          'Jack 100%'
      } else if (
        coach ===
        'Thomas'
      ) {
        split =
          'Thomas 100%'
      } else {
        split =
          '50 / 50'
      }

      setForm({
        ...form,

        defaultCoach:
          coach,

        defaultSplit:
          split,
      })
    }

  const handleSpecialCoachChange =
    (
      coach: Coach,
    ) => {
      let split: Split

      if (
        coach ===
        'Jack'
      ) {
        split =
          'Jack 100%'
      } else if (
        coach ===
        'Thomas'
      ) {
        split =
          'Thomas 100%'
      } else {
        split =
          '50 / 50'
      }

      setSpecialForm({
        ...specialForm,

        coach,

        earningSplit:
          split,
      })
    }

  const validateSpecialTime =
    (
      nextForm:
        SpecialLessonForm,
    ) => {
      if (
        !specialStudent
      ) {
        return ''
      }

      if (
        !nextForm.lessonDate ||
        !nextForm.startTime ||
        !nextForm.endTime
      ) {
        return ''
      }

      if (
        nextForm.startTime ===
        nextForm.endTime
      ) {
        return 'Start time and end time cannot be the same.'
      }

      const selectedDate =
        nextForm.lessonDate

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
        specialStudent.day

      if (
        regularStartsToday &&
        timeRangesOverlap(
          selectedDate,
          nextForm.startTime,
          nextForm.endTime,
          selectedDate,
          specialStudent.startTime,
          specialStudent.endTime,
        )
      ) {
        return `This time overlaps the Regular lesson (${specialStudent.startTime} - ${specialStudent.endTime}).`
      }

      const regularCrossesMidnight =
        specialStudent.endTime <=
        specialStudent.startTime

      const regularStartedYesterday =
        previousWeekday ===
          specialStudent.day &&
        regularCrossesMidnight

      if (
        regularStartedYesterday &&
        timeRangesOverlap(
          selectedDate,
          nextForm.startTime,
          nextForm.endTime,
          previousDate,
          specialStudent.startTime,
          specialStudent.endTime,
        )
      ) {
        return `This time overlaps the Regular lesson (${specialStudent.startTime} - ${specialStudent.endTime}).`
      }

      const overlappingSession =
        lessonSessions.find(
          (session) => {
            if (
              session.studentId !==
                specialStudent.id ||
              session.status ===
                'Cancelled'
            ) {
              return false
            }

            return timeRangesOverlap(
              selectedDate,
              nextForm.startTime,
              nextForm.endTime,
              session.lessonDate,
              session.startTime,
              session.endTime,
            )
          },
        )

      if (
        overlappingSession
      ) {
        return `This time overlaps an existing ${overlappingSession.lessonType} lesson (${overlappingSession.startTime} - ${overlappingSession.endTime}).`
      }

      return ''
    }

  const updateSpecialForm =
    (
      nextForm:
        SpecialLessonForm,
    ) => {
      setSpecialForm(
        nextForm,
      )

      setSpecialTimeError(
        validateSpecialTime(
          nextForm,
        ),
      )
    }

  const validateStudentForm =
    () => {
      const packagePrice =
        Number(
          form.packagePrice,
        )

      const lessonEarning =
        Number(
          form.lessonEarning,
        )

      if (
        !form.name.trim()
      ) {
        return 'Student name is required.'
      }

      if (
        !form.location.trim()
      ) {
        return 'Location is required.'
      }

      if (
        !form.startTime
      ) {
        return 'Start time is required.'
      }

      if (
        !form.endTime
      ) {
        return 'End time is required.'
      }

      if (
        form.startTime ===
        form.endTime
      ) {
        return 'Start time and end time cannot be the same.'
      }

      if (
        !Number.isFinite(
          packagePrice,
        ) ||
        packagePrice <= 0
      ) {
        return 'Package price must be greater than RM 0.'
      }

      if (
        !Number.isFinite(
          lessonEarning,
        ) ||
        lessonEarning <= 0
      ) {
        return 'Lesson earning must be greater than RM 0.'
      }

      return ''
    }

  const addNewStudent =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setFormError(
        '',
      )

      const validationError =
        validateStudentForm()

      if (
        validationError
      ) {
        setFormError(
          validationError,
        )

        return
      }

      const studentName =
        form.name.trim()

      const packagePrice =
        Number(
          form.packagePrice,
        )

      const lessonEarning =
        Number(
          form.lessonEarning,
        )

      setSaving(
        true,
      )

      try {
        const success =
          await addStudent({
            name:
              studentName,

            parentName:
              form.parentName.trim() ||
              '-',

            phone:
              form.phone.trim() ||
              '-',

            location:
              form.location.trim(),

            day:
              form.day,

            startTime:
              form.startTime,

            endTime:
              form.endTime,

            packagePrice,

            lessonEarning,

            defaultCoach:
              form.defaultCoach,

            defaultSplit:
              form.defaultSplit,
          })

        if (
          !success
        ) {
          showError(
            `Unable to add ${studentName}.`,
          )

          return
        }

        setShowAddForm(
          false,
        )

        setForm(
          emptyForm,
        )

        setFormError(
          '',
        )

        showSuccess(
          `${studentName} added successfully.`,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          `Unable to add ${studentName}.`,
        )
      } finally {
        setSaving(
          false,
        )
      }
    }

  const saveStudentChanges =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      if (
        !editingStudent
      ) {
        return
      }

      setFormError(
        '',
      )

      const validationError =
        validateStudentForm()

      if (
        validationError
      ) {
        setFormError(
          validationError,
        )

        return
      }

      const originalName =
        editingStudent.name

      const updatedName =
        form.name.trim()

      const packagePrice =
        Number(
          form.packagePrice,
        )

      const lessonEarning =
        Number(
          form.lessonEarning,
        )

      setSaving(
        true,
      )

      try {
        const success =
          await updateStudent({
            ...editingStudent,

            name:
              updatedName,

            parentName:
              form.parentName.trim() ||
              '-',

            phone:
              form.phone.trim() ||
              '-',

            location:
              form.location.trim(),

            day:
              form.day,

            startTime:
              form.startTime,

            endTime:
              form.endTime,

            packagePrice,

            lessonEarning,

            defaultCoach:
              form.defaultCoach,

            defaultSplit:
              form.defaultSplit,
          })

        if (
          !success
        ) {
          showError(
            `Unable to save changes for ${originalName}.`,
          )

          return
        }

        setEditingStudent(
          null,
        )

        setForm(
          emptyForm,
        )

        setFormError(
          '',
        )

        showSuccess(
          `${updatedName}'s information updated successfully.`,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          `Unable to save changes for ${originalName}.`,
        )
      } finally {
        setSaving(
          false,
        )
      }
    }

  const saveSpecialLesson =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      if (
        !specialStudent ||
        !specialLessonType
      ) {
        return
      }

      if (
        specialStudent.status !==
        'active'
      ) {
        setSpecialFormError(
          'This student is no longer active.',
        )

        return
      }

      setSpecialFormError(
        '',
      )

      const currentTimeError =
        validateSpecialTime(
          specialForm,
        )

      if (
        currentTimeError
      ) {
        setSpecialTimeError(
          currentTimeError,
        )

        return
      }

      const lessonEarning =
        Number(
          specialForm.lessonEarning,
        )

      if (
        !specialForm.lessonDate ||
        !specialForm.startTime ||
        !specialForm.endTime ||
        !specialForm.location.trim() ||
        !Number.isFinite(
          lessonEarning,
        ) ||
        lessonEarning <= 0
      ) {
        setSpecialFormError(
          'Please complete all required fields.',
        )

        return
      }

      if (
        specialLessonType ===
          'replacement' &&
        !specialForm.replacementForDate
      ) {
        setSpecialFormError(
          'Please select the Regular class date being replaced.',
        )

        return
      }

      const studentName =
        specialStudent.name

      const lessonType =
        specialLessonType

      setSaving(
        true,
      )

      try {
        const success =
          await createSpecialLesson({
            studentId:
              specialStudent.id,

            lessonDate:
              specialForm.lessonDate,

            startTime:
              specialForm.startTime,

            endTime:
              specialForm.endTime,

            location:
              specialForm.location.trim(),

            lessonType,

            replacementForDate:
              lessonType ===
                'replacement'
                ? specialForm.replacementForDate
                : null,

            coach:
              specialForm.coach,

            earningSplit:
              specialForm.earningSplit,

            lessonEarning,
          })

        if (
          !success
        ) {
          showError(
            lessonType ===
              'replacement'
              ? `Unable to add replacement class for ${studentName}.`
              : `Unable to add extra class for ${studentName}.`,
          )

          return
        }

        setSpecialStudent(
          null,
        )

        setSpecialLessonType(
          null,
        )

        setSpecialFormError(
          '',
        )

        setSpecialTimeError(
          '',
        )

        showSuccess(
          lessonType ===
            'replacement'
            ? `Replacement class added for ${studentName}.`
            : `Extra class added for ${studentName}.`,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        showError(
          lessonType ===
            'replacement'
            ? `Unable to add replacement class for ${studentName}.`
            : `Unable to add extra class for ${studentName}.`,
        )
      } finally {
        setSaving(
          false,
        )
      }
    }

  const renderStudentForm =
    (
      title: string,
      description: string,
      submitText: string,
      onSubmit: (
        event:
          FormEvent<HTMLFormElement>,
      ) => Promise<void>,
      onClose: () => void,
    ) => (
      <div
        className="modal-overlay"
        onClick={
          onClose
        }
      >
        <div
          className="student-modal"
          onClick={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          <div className="modal-header">
            <div>
              <h2>
                {title}
              </h2>

              <p>
                {description}
              </p>
            </div>

            <button
              className="modal-close"
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
            >
              ×
            </button>
          </div>

          <form
            className="student-form"
            onSubmit={
              onSubmit
            }
          >
            <label className="form-field">
              <span>
                Student Name *
              </span>

              <input
                type="text"
                value={
                  form.name
                }
                onChange={(
                  event,
                ) => {
                  setFormError('')

                  setForm({
                    ...form,

                    name:
                      event.target.value,
                  })
                }}
                required
              />
            </label>

            <label className="form-field">
              <span>
                Parent Name
              </span>

              <input
                type="text"
                value={
                  form.parentName
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    parentName:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="form-field">
              <span>
                Phone
              </span>

              <input
                type="tel"
                value={
                  form.phone
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    phone:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="form-field">
              <span>
                Location *
              </span>

              <input
                type="text"
                value={
                  form.location
                }
                onChange={(
                  event,
                ) => {
                  setFormError('')

                  setForm({
                    ...form,

                    location:
                      event.target.value,
                  })
                }}
                required
              />
            </label>

            <label className="form-field">
              <span>
                Day *
              </span>

              <select
                value={
                  form.day
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    day:
                      event.target.value,
                  })
                }
              >
                <option>
                  Monday
                </option>

                <option>
                  Tuesday
                </option>

                <option>
                  Wednesday
                </option>

                <option>
                  Thursday
                </option>

                <option>
                  Friday
                </option>

                <option>
                  Saturday
                </option>

                <option>
                  Sunday
                </option>
              </select>
            </label>

            <div className="form-row">
              <label className="form-field">
                <span>
                  Start Time *
                </span>

                <input
                  type="time"
                  value={
                    form.startTime
                  }
                  onChange={(
                    event,
                  ) => {
                    setFormError('')

                    setForm({
                      ...form,

                      startTime:
                        event.target.value,
                    })
                  }}
                  required
                />
              </label>

              <label className="form-field">
                <span>
                  End Time *
                </span>

                <input
                  type="time"
                  value={
                    form.endTime
                  }
                  onChange={(
                    event,
                  ) => {
                    setFormError('')

                    setForm({
                      ...form,

                      endTime:
                        event.target.value,
                    })
                  }}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span>
                  Package Price *
                </span>

                <div className="money-input">
                  <span>
                    RM
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.packagePrice
                    }
                    onChange={(
                      event,
                    ) => {
                      setFormError('')

                      setForm({
                        ...form,

                        packagePrice:
                          event.target.value,
                      })
                    }}
                    required
                  />
                </div>
              </label>

              <label className="form-field">
                <span>
                  Lesson Earning *
                </span>

                <div className="money-input">
                  <span>
                    RM
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.lessonEarning
                    }
                    onChange={(
                      event,
                    ) => {
                      setFormError('')

                      setForm({
                        ...form,

                        lessonEarning:
                          event.target.value,
                      })
                    }}
                    required
                  />
                </div>
              </label>
            </div>

            <label className="form-field">
              <span>
                Default Coach *
              </span>

              <select
                value={
                  form.defaultCoach
                }
                onChange={(
                  event,
                ) =>
                  handleCoachChange(
                    event.target
                      .value as Coach,
                  )
                }
              >
                <option value="Jack">
                  Jack
                </option>

                <option value="Thomas">
                  Thomas
                </option>

                <option value="Jack + Thomas">
                  Jack + Thomas
                </option>
              </select>
            </label>

            <label className="form-field">
              <span>
                Default Split *
              </span>

              <select
                value={
                  form.defaultSplit
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    defaultSplit:
                      event.target
                        .value as Split,
                  })
                }
              >
                <option value="Jack 100%">
                  Jack 100%
                </option>

                <option value="50 / 50">
                  50 / 50
                </option>

                <option value="Thomas 100%">
                  Thomas 100%
                </option>
              </select>
            </label>

            {formError && (
              <div className="login-error">
                {formError}
              </div>
            )}

            <div className="form-actions">
              <button
                className="cancel-button"
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                type="submit"
                disabled={
                  saving
                }
              >
                {saving
                  ? 'Saving...'
                  : submitText}
              </button>
            </div>
          </form>
        </div>
      </div>
    )

  return (
    <div className="students-page">
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

      <div className="students-header">
        <div>
          <p className="small-text">
            Student Management
          </p>

          <h1>
            Students
          </h1>

          <p className="subtitle">
            Manage students and lesson information.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setForm(
              emptyForm,
            )

            setFormError(
              '',
            )

            setShowAddForm(
              true,
            )
          }}
        >
          + Add Student
        </button>
      </div>

      <div className="students-tools">
        <div className="student-search-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="search"
            placeholder="Search students..."
            value={
              searchText
            }
            onChange={(
              event,
            ) =>
              setSearchText(
                event.target.value,
              )
            }
          />

          {searchText && (
            <button
              type="button"
              className="student-search-clear"
              onClick={() =>
                setSearchText('')
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="student-filter-grid">
          <label className="student-filter-field">
            <span>
              Status
            </span>

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
                setStatusFilter(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="stopped">
                Stopped
              </option>

              <option value="graduated">
                Graduated
              </option>
            </select>
          </label>

          <label className="student-filter-field">
            <span>
              Day
            </span>

            <select
              value={
                dayFilter
              }
              onChange={(
                event,
              ) =>
                setDayFilter(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All Days
              </option>

              <option value="Monday">
                Monday
              </option>

              <option value="Tuesday">
                Tuesday
              </option>

              <option value="Wednesday">
                Wednesday
              </option>

              <option value="Thursday">
                Thursday
              </option>

              <option value="Friday">
                Friday
              </option>

              <option value="Saturday">
                Saturday
              </option>

              <option value="Sunday">
                Sunday
              </option>
            </select>
          </label>

          <label className="student-filter-field">
            <span>
              Location
            </span>

            <select
              value={
                locationFilter
              }
              onChange={(
                event,
              ) =>
                setLocationFilter(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All Locations
              </option>

              {locations.map(
                (location) => (
                  <option
                    key={
                      location
                    }
                    value={
                      location
                    }
                  >
                    {location}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="student-filter-field">
            <span>
              Coach
            </span>

            <select
              value={
                coachFilter
              }
              onChange={(
                event,
              ) =>
                setCoachFilter(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All Coaches
              </option>

              <option value="Jack">
                Jack
              </option>

              <option value="Thomas">
                Thomas
              </option>

              <option value="Jack + Thomas">
                Jack + Thomas
              </option>
            </select>
          </label>
        </div>

        <div className="student-filter-footer">
          <span>
            Showing{' '}

            <strong>
              {
                filteredStudents.length
              }
            </strong>{' '}

            of{' '}

            <strong>
              {
                students.length
              }
            </strong>{' '}

            students
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              className="student-clear-filters"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="students-summary">
        <div className="students-summary-card">
          <span>
            Active Students
          </span>

          <strong>
            {activeCount}
          </strong>
        </div>
      </div>

      {studentsLoading &&
      students.length === 0 ? (
        <PageLoading
          title="Loading Students"
          message="Loading your student information..."
        />
      ) : studentsError &&
        students.length === 0 ? (
        <PageError
          title="Unable to load students"
          message={studentsError}
          onRetry={() => {
            void refreshStudents()
          }}
        />
      ) : students.length ===
        0 ? (
        <div className="schedule-empty">
          <div className="schedule-empty-icon">
            🏊
          </div>

          <h3>
            No Students Yet
          </h3>

          <p>
            Add your first student.
          </p>
        </div>
      ) : filteredStudents.length ===
        0 ? (
        <div className="schedule-empty">
          <div className="schedule-empty-icon">
            🔎
          </div>

          <h3>
            No Students Found
          </h3>

          <p>
            Try changing your search or filters.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={
              clearFilters
            }
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="students-list">
          {filteredStudents.map(
            (student) => {
              const lessonProgress =
                getLessonProgress(
                  student.lessonDates,
                )

              return (
                <div
                  className={`student-card student-status-${student.status}`}
                  key={
                    student.id
                  }
                >
                  <div className="student-card-header">
                    <div className="student-card-profile">
                      <div className="student-card-avatar">
                        {student.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <div className="student-card-name-row">
                          <h2>
                            {
                              student.name
                            }
                          </h2>

                          <span
                            className={`student-status-badge ${student.status}`}
                          >
                            {
                              formatStatusLabel(
                                student.status,
                              )
                            }
                          </span>
                        </div>

                        <p>
                          {
                            student.location
                          }
                        </p>
                      </div>
                    </div>

                    <div className="student-menu-wrapper">
                      <button
                        className="student-menu-button"
                        type="button"
                        onClick={(
                          event,
                        ) =>
                          toggleStudentMenu(
                            student,
                            event.currentTarget,
                          )
                        }
                      >
                        ⋮
                      </button>

                      {openMenuId ===
                        student.id && (
                        <div
                          className={`student-menu student-menu-${menuDirection}`}
                          style={
                            menuDirection ===
                            'up'
                              ? {
                                  top:
                                    'auto',

                                  bottom:
                                    '50px',
                                }
                              : {
                                  top:
                                    '50px',

                                  bottom:
                                    'auto',
                                }
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              viewDetails(
                                student,
                              )
                            }
                          >
                            View Details
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditStudent(
                                student,
                              )
                            }
                          >
                            Edit Student
                          </button>

                          {student.status !==
                            'active' && (
                            <button
                              className="student-resume-menu-item"
                              type="button"
                              onClick={() =>
                                openLifecycleAction(
                                  student,
                                  'resume',
                                )
                              }
                            >
                              Resume Lessons
                            </button>
                          )}

                          {student.status ===
                            'active' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openSpecialLesson(
                                    student,
                                    'replacement',
                                  )
                                }
                              >
                                Add Replacement
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openSpecialLesson(
                                    student,
                                    'extra',
                                  )
                                }
                              >
                                Add Extra
                              </button>

                              <button
                                className="student-stop-menu-item"
                                type="button"
                                onClick={() =>
                                  openLifecycleAction(
                                    student,
                                    'stop',
                                  )
                                }
                              >
                                Stop Lesson
                              </button>

                              <button
                                className="student-graduate-menu-item"
                                type="button"
                                onClick={() =>
                                  openLifecycleAction(
                                    student,
                                    'graduate',
                                  )
                                }
                              >
                                Graduate
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {student.status !==
                    'active' &&
                    student.statusChangedDate && (
                      <div
                        className={`student-status-note ${student.status}`}
                      >
                        {student.status ===
                        'graduated'
                          ? 'Graduated'
                          : 'Lessons stopped'}{' '}
                        from{' '}

                        <strong>
                          {
                            formatDate(
                              student.statusChangedDate,
                            )
                          }
                        </strong>
                      </div>
                    )}

                  <div className="student-progress-section">
                    <div className="student-progress-top">
                      <div>
                        <span>
                          4-Lesson Progress
                        </span>

                        <strong>
                          {
                            lessonProgress
                          }{' '}
                          / 4 Lessons
                        </strong>
                      </div>
                    </div>

                    <div className="lesson-date-list">
                      {student.lessonDates.map(
                        (
                          date,
                          index,
                        ) => (
                          <div
                            className={`lesson-date-card ${
                              date
                                ? 'completed'
                                : 'pending'
                            }`}
                            key={
                              index
                            }
                          >
                            <span>
                              Lesson{' '}
                              {
                                index + 1
                              }
                            </span>

                            <strong>
                              {date ??
                                '-'}
                            </strong>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )
            },
          )}
        </div>
      )}

      {specialStudent &&
        specialLessonType && (
          <div
            className="modal-overlay"
            onClick={
              closeSpecialLesson
            }
          >
            <div
              className="student-modal"
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <h2>
                    {specialLessonType ===
                    'replacement'
                      ? 'Add Replacement'
                      : 'Add Extra'}
                  </h2>

                  <p>
                    {
                      specialStudent.name
                    }
                  </p>
                </div>

                <button
                  className="modal-close"
                  type="button"
                  onClick={
                    closeSpecialLesson
                  }
                  disabled={
                    saving
                  }
                >
                  ×
                </button>
              </div>

              <form
                className="student-form"
                onSubmit={
                  saveSpecialLesson
                }
              >
                {specialLessonType ===
                  'replacement' && (
                  <label className="form-field">
                    <span>
                      Regular Class Being Replaced *
                    </span>

                    <input
                      type="date"
                      value={
                        specialForm.replacementForDate
                      }
                      onChange={(
                        event,
                      ) =>
                        updateSpecialForm({
                          ...specialForm,

                          replacementForDate:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>
                )}

                <label className="form-field">
                  <span>
                    {specialLessonType ===
                    'replacement'
                      ? 'Replacement Date *'
                      : 'Extra Class Date *'}
                  </span>

                  <input
                    type="date"
                    value={
                      specialForm.lessonDate
                    }
                    onChange={(
                      event,
                    ) =>
                      updateSpecialForm({
                        ...specialForm,

                        lessonDate:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <div className="form-row">
                  <label
                    className={`form-field ${
                      specialTimeError
                        ? 'form-field-error'
                        : ''
                    }`}
                  >
                    <span>
                      Start Time *
                    </span>

                    <input
                      type="time"
                      value={
                        specialForm.startTime
                      }
                      onChange={(
                        event,
                      ) =>
                        updateSpecialForm({
                          ...specialForm,

                          startTime:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label
                    className={`form-field ${
                      specialTimeError
                        ? 'form-field-error'
                        : ''
                    }`}
                  >
                    <span>
                      End Time *
                    </span>

                    <input
                      type="time"
                      value={
                        specialForm.endTime
                      }
                      onChange={(
                        event,
                      ) =>
                        updateSpecialForm({
                          ...specialForm,

                          endTime:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </label>
                </div>

                {specialTimeError && (
                  <div className="time-field-error-message">
                    {
                      specialTimeError
                    }
                  </div>
                )}

                <label className="form-field">
                  <span>
                    Location *
                  </span>

                  <input
                    type="text"
                    value={
                      specialForm.location
                    }
                    onChange={(
                      event,
                    ) =>
                      setSpecialForm({
                        ...specialForm,

                        location:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label className="form-field">
                  <span>
                    Lesson Earning *
                  </span>

                  <div className="money-input">
                    <span>
                      RM
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        specialForm.lessonEarning
                      }
                      onChange={(
                        event,
                      ) =>
                        setSpecialForm({
                          ...specialForm,

                          lessonEarning:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>
                    Coach *
                  </span>

                  <select
                    value={
                      specialForm.coach
                    }
                    onChange={(
                      event,
                    ) =>
                      handleSpecialCoachChange(
                        event.target
                          .value as Coach,
                      )
                    }
                  >
                    <option value="Jack">
                      Jack
                    </option>

                    <option value="Thomas">
                      Thomas
                    </option>

                    <option value="Jack + Thomas">
                      Jack + Thomas
                    </option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Earning Split *
                  </span>

                  <select
                    value={
                      specialForm.earningSplit
                    }
                    onChange={(
                      event,
                    ) =>
                      setSpecialForm({
                        ...specialForm,

                        earningSplit:
                          event.target
                            .value as Split,
                      })
                    }
                  >
                    <option value="Jack 100%">
                      Jack 100%
                    </option>

                    <option value="50 / 50">
                      50 / 50
                    </option>

                    <option value="Thomas 100%">
                      Thomas 100%
                    </option>
                  </select>
                </label>

                {specialFormError && (
                  <div className="login-error">
                    {
                      specialFormError
                    }
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="cancel-button"
                    type="button"
                    onClick={
                      closeSpecialLesson
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      saving ||
                      Boolean(
                        specialTimeError,
                      )
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : specialLessonType ===
                        'replacement'
                      ? 'Add Replacement'
                      : 'Add Extra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {lifecycleTarget && (
        <div
          className="modal-overlay"
          onClick={
            closeLifecycleAction
          }
        >
          <div
            className="confirm-modal student-lifecycle-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div
              className={`student-lifecycle-icon ${lifecycleTarget.action}`}
            >
              {lifecycleTarget.action ===
              'graduate'
                ? '✓'
                : lifecycleTarget.action ===
                  'resume'
                ? '▶'
                : 'Ⅱ'}
            </div>

            <h2>
              {lifecycleTarget.action ===
              'graduate'
                ? 'Graduate Student?'
                : lifecycleTarget.action ===
                  'resume'
                ? 'Resume Lessons?'
                : 'Stop Lessons?'}
            </h2>

            <p>
              {lifecycleTarget.action ===
              'graduate'
                ? `${lifecycleTarget.student.name} will be marked as graduated.`
                : lifecycleTarget.action ===
                  'resume'
                ? `${lifecycleTarget.student.name} will return to Active and receive Regular lessons again.`
                : `${lifecycleTarget.student.name} will stop receiving future Regular lessons.`}
            </p>

            <div className="student-lifecycle-warning">
              {lifecycleTarget.action ===
              'resume'
                ? 'Past lesson history, cycles and earnings will stay unchanged. Attendance tracking restarts from the Resume Date, and future lessons can continue the normal 4-lesson payment cycle.'
                : 'Past lesson history, cycles and earnings will be kept. This does not delete the student.'}
            </div>

            <label className="form-field student-lifecycle-date">
              <span>
                {lifecycleTarget.action ===
                'graduate'
                  ? 'Graduate Date'
                  : lifecycleTarget.action ===
                    'resume'
                  ? 'Resume Date'
                  : 'Stop Date'}
              </span>

              <input
                type="date"
                value={
                  lifecycleDate
                }
                onChange={(
                  event,
                ) => {
                  setLifecycleError(
                    '',
                  )

                  setLifecycleDate(
                    event.target.value,
                  )
                }}
              />
            </label>

            {lifecycleError && (
              <div className="login-error">
                {
                  lifecycleError
                }
              </div>
            )}

            <div className="confirm-actions">
              <button
                className="cancel-button"
                type="button"
                onClick={
                  closeLifecycleAction
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                className={
                  lifecycleTarget.action ===
                  'graduate'
                    ? 'student-graduate-button'
                    : lifecycleTarget.action ===
                      'resume'
                    ? 'student-resume-button'
                    : 'student-stop-button'
                }
                type="button"
                onClick={
                  confirmLifecycleAction
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? 'Saving...'
                  : lifecycleTarget.action ===
                    'graduate'
                  ? 'Graduate'
                  : lifecycleTarget.action ===
                    'resume'
                  ? 'Resume Lessons'
                  : 'Stop Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div
          className="modal-overlay"
          onClick={
            closeDetails
          }
        >
          <div
            className="student-modal details-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <div className="student-detail-title-row">
                  <h2>
                    {
                      selectedStudent.name
                    }
                  </h2>

                  <span
                    className={`student-status-badge ${selectedStudent.status}`}
                  >
                    {
                      formatStatusLabel(
                        selectedStudent.status,
                      )
                    }
                  </span>
                </div>

                <p>
                  {
                    selectedStudent.parentName
                  }
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={
                  closeDetails
                }
              >
                ×
              </button>
            </div>

            <div className="details-list">
              <div className="details-item">
                <span>
                  Status
                </span>

                <strong>
                  {
                    formatStatusLabel(
                      selectedStudent.status,
                    )
                  }
                </strong>
              </div>

              {selectedStudent.status !==
                'active' &&
                selectedStudent.statusChangedDate && (
                  <div className="details-item">
                    <span>
                      {selectedStudent.status ===
                      'graduated'
                        ? 'Graduate Date'
                        : 'Stop Date'}
                    </span>

                    <strong>
                      {
                        formatDate(
                          selectedStudent.statusChangedDate,
                        )
                      }
                    </strong>
                  </div>
                )}

              <div className="details-item">
                <span>
                  Phone
                </span>

                <strong>
                  {
                    selectedStudent.phone
                  }
                </strong>
              </div>

              <div className="details-item">
                <span>
                  Location
                </span>

                <strong>
                  {
                    selectedStudent.location
                  }
                </strong>
              </div>

              <div className="details-item">
                <span>
                  Regular Schedule
                </span>

                <strong>
                  {
                    selectedStudent.day
                  }

                  <br />

                  {
                    selectedStudent.startTime
                  }{' '}
                  -{' '}
                  {
                    selectedStudent.endTime
                  }
                </strong>
              </div>

              <div className="details-item">
                <span>
                  Package Price
                </span>

                <strong>
                  RM{' '}
                  {
                    selectedStudent.packagePrice
                  }
                </strong>
              </div>

              <div className="details-item">
                <span>
                  Lesson Earning
                </span>

                <strong>
                  RM{' '}
                  {
                    selectedStudent.lessonEarning
                  }
                </strong>
              </div>

              <div className="details-item">
                <span>
                  Default Coach
                </span>

                <strong>
                  {
                    selectedStudent.defaultCoach
                  }
                </strong>
              </div>

              <div className="details-item">
                <span>
                  Default Split
                </span>

                <strong>
                  {
                    selectedStudent.defaultSplit
                  }
                </strong>
              </div>
            </div>

            <div className="details-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  openEditStudent(
                    selectedStudent,
                  )
                }
              >
                Edit Student
              </button>

              <button
                className="details-close-button"
                type="button"
                onClick={
                  closeDetails
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm &&
        renderStudentForm(
          'Add Student',
          'Enter the regular lesson information.',
          'Add Student',
          addNewStudent,
          closeAddForm,
        )}

      {editingStudent &&
        renderStudentForm(
          'Edit Student',
          `Update ${editingStudent.name}'s information.`,
          'Save Changes',
          saveStudentChanges,
          closeEditForm,
        )}
    </div>
  )
}

export default Students