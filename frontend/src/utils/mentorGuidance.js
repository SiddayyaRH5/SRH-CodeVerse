// Local, deterministic mentoring heuristics. No AI service or key is used.
export function analyzeCode(code = "", problem = null, result = null) {
  const normalized = code.toLowerCase()
  const signals = []
  const tips = []

  if (!code.trim()) {
    return {
      title: "Start with a small plan",
      body: "Write the simplest approach you can describe in 2–3 sentences, then turn that plan into code.",
      tips: ["Identify the input and output first.", "Choose the data structure before writing the loop.", "Handle one example manually before coding."],
    }
  }

  if (normalized.includes("system.out.println")) signals.push("You are using console output, which is useful for quick debugging.")
  if (normalized.includes("hashmap") || normalized.includes("hashset")) signals.push("A hash-based collection is present; check whether its lookup complexity matches the problem.")
  if (normalized.includes("for ") || normalized.includes("while ")) signals.push("You have an iteration step; trace the loop with the smallest and largest input cases.")
  if (normalized.includes("nested") || (normalized.match(/for\s*\(/g) || []).length > 1) tips.push("Check whether the nested iteration can be reduced with a map, set, two pointers, or sorting.")
  if (normalized.includes("==") && normalized.includes("string")) tips.push("For Java strings, prefer .equals(...) for value comparison rather than ==.")
  if (normalized.includes("scanner")) tips.push("If the judge expects exact input parsing, confirm that you consume whitespace/newlines consistently.")
  if (!normalized.includes("public static void main")) tips.push("For a standalone Java solution, confirm that the required main entry point is present.")

  if (result?.status === "FAILED") {
    tips.unshift("Your latest submission has failing tests. Start with the first failed visible case and compare expected vs actual output.")
  }
  if (result?.status === "COMPILE_ERROR" || result?.compileError) {
    tips.unshift("Fix compilation before optimizing. Read the first compiler message carefully; later messages may be cascading errors.")
  }
  if (result?.status === "PASSED") {
    tips.unshift("Nice work — all tests passed. Now review time complexity and whether the solution is easy to maintain.")
  }

  if (problem?.difficulty === "HARD") tips.push("For a hard problem, write down the invariant or recurrence before attempting optimization.")
  if (problem?.topic) tips.push(`Focus on the core ${problem.topic} concept before reaching for a more complex solution.`)
  if (!tips.length) tips.push("Trace the solution on an empty input, one-element input, and a boundary case.")

  return {
    title: signals[0] || "Your approach is taking shape",
    body: signals.slice(1).join(" ") || "Keep the implementation simple first. Once it is correct, inspect complexity and edge cases.",
    tips: [...new Set(tips)].slice(0, 4),
  }
}
