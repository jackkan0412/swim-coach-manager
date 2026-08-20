import {
  useCallback,
  useState,
} from 'react'

import type {
  ToastType,
} from '../components/Toast'

type ToastState = {
  type: ToastType
  message: string
} | null

function useToast() {
  const [
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null,
    )

  const showToast =
    useCallback(
      (
        type: ToastType,
        message: string,
      ) => {
        setToast({
          type,
          message,
        })
      },
      [],
    )

  const showSuccess =
    useCallback(
      (
        message: string,
      ) => {
        showToast(
          'success',
          message,
        )
      },
      [
        showToast,
      ],
    )

  const showError =
    useCallback(
      (
        message: string,
      ) => {
        showToast(
          'error',
          message,
        )
      },
      [
        showToast,
      ],
    )

  const showGraduate =
    useCallback(
      (
        message: string,
      ) => {
        showToast(
          'graduate',
          message,
        )
      },
      [
        showToast,
      ],
    )

  const hideToast =
    useCallback(
      () => {
        setToast(null)
      },
      [],
    )

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showGraduate,
    hideToast,
  }
}

export default useToast