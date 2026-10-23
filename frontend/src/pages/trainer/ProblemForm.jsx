import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { createProblem, updateProblem, getTrainerProblem } from "../../api/problemApi"

const emptyTestCase = () => ({ input: "", expectedOutput: "", hidden: false, orderIndex: 1 })

function ProblemForm() {
  const { id } = useParams() // undefined on /new, a value on /:id/edit
  const isEditMode = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "EASY",
    topic: "",
    constraints: "",
    starterCode: "",
    estimatedTimeMinutes: 15,
    hint1: "",
    hint2: "",
    hint3: "",
  })
  const [testCases, setTestCases] = useState([emptyTestCase()])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)

  useEffect(() => {
    if (!isEditMode) return
    getTrainerProblem(id)
      .then((res) => {
        const p = res.data
        setForm({
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          topic: p.topic,
          constraints: p.constraints || "",
          starterCode: p.starterCode || "",
          estimatedTimeMinutes: p.estimatedTimeMinutes || 15,
          hint1: p.hint1 || "",
          hint2: p.hint2 || "",
          hint3: p.hint3 || "",
        })
        setTestCases(
          p.testCases.length > 0
            ? p.testCases.map((tc) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                hidden: tc.hidden,
                orderIndex: tc.orderIndex,
              }))
            : [emptyTestCase()]
        )
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load problem"))
      .finally(() => setInitialLoading(false))
  }, [id, isEditMode])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases]
    updated[index] = { ...updated[index], [field]: value }
    setTestCases(updated)
  }

  const addTestCase = () => {
    setTestCases([...testCases, emptyTestCase()])
  }

  const removeTestCase = (index) => {
    if (testCases.length === 1) return // always keep at least one
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const payload = {
      ...form,
      estimatedTimeMinutes: Number(form.estimatedTimeMinutes),
      testCases: testCases.map((tc, i) => ({ ...tc, orderIndex: i + 1 })),
    }

    try {
      if (isEditMode) {
        await updateProblem(id, payload)
      } else {
        await createProblem(payload)
      }
      navigate("/trainer/problems")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save problem")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <p className="text-[var(--color-text-secondary)]">Loading problem...</p>

  const inputClass =
    "w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forge-500)]"

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{isEditMode ? "Edit Problem" : "Create New Problem"}</h1>

      {error && (
        <div className="mb-4 p-3 rounded bg-[var(--color-danger)]/10 border border-[var(--color-danger)] text-[var(--color-danger)] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className={inputClass} required />
        </div>

        <div>
          <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputClass} required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange} className={inputClass}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Topic</label>
            <input name="topic" value={form.topic} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Est. Time (min)</label>
            <input
              type="number"
              name="estimatedTimeMinutes"
              value={form.estimatedTimeMinutes}
              onChange={handleChange}
              className={inputClass}
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Constraints</label>
          <textarea name="constraints" value={form.constraints} onChange={handleChange} rows={2} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Starter Code</label>
          <textarea
            name="starterCode"
            value={form.starterCode}
            onChange={handleChange}
            rows={4}
            className={`${inputClass} font-mono text-sm`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Hint 1</label>
            <input name="hint1" value={form.hint1} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Hint 2</label>
            <input name="hint2" value={form.hint2} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Hint 3</label>
            <input name="hint3" value={form.hint3} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Test Cases</h2>
            <button
              type="button"
              onClick={addTestCase}
              className="text-sm text-[var(--color-forge-500)] hover:underline"
            >
              + Add test case
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {testCases.map((tc, index) => (
              <div key={index} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Test Case {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={tc.hidden}
                        onChange={(e) => handleTestCaseChange(index, "hidden", e.target.checked)}
                      />
                      Hidden
                    </label>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="text-xs text-[var(--color-danger)] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Input"
                    value={tc.input}
                    onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                    className={inputClass}
                    required
                  />
                  <input
                    placeholder="Expected Output"
                    value={tc.expectedOutput}
                    onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-forge-500)] hover:bg-[var(--color-forge-600)] text-white font-semibold py-2 rounded transition disabled:opacity-50 self-start px-6"
        >
          {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Problem"}
        </button>
      </form>
    </div>
  )
}

export default ProblemForm