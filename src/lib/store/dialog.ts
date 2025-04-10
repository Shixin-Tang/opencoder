import { atom, useAtomValue, useSetAtom } from "jotai"
import type { ReactNode } from "react"

const dialogContentAtom = atom<ReactNode | undefined>(undefined)

export function useDialog() {
  const setDialogContent = useSetAtom(dialogContentAtom)
  return function showDialog(content: ReactNode) {
    setDialogContent(content)
  }
}

export { dialogContentAtom }
