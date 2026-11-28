import { useMemo, useState } from "react"
import { MentorContext } from "./mentorContextStore"

/** Shares current coding context with the global AI Mentor drawer. */
export function MentorProvider({ children }) {
  const [context, setContext] = useState({})
  const value = useMemo(() => ({ context, setContext }), [context])
  return <MentorContext.Provider value={value}>{children}</MentorContext.Provider>
}
