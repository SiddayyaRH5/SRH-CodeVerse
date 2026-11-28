import { useContext } from "react"
import { MentorContext } from "./mentorContextStore"

export function useMentorContext() {
  return useContext(MentorContext) || { context: {}, setContext: () => {} }
}
