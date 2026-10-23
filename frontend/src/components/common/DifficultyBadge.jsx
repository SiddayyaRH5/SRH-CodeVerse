function DifficultyBadge({ difficulty }) {
  const colorMap = {
    EASY: "var(--color-easy)",
    MEDIUM: "var(--color-medium)",
    HARD: "var(--color-hard)",
  }

  return (
    <span
      className="text-xs font-semibold px-2 py-1 rounded"
      style={{ color: colorMap[difficulty], backgroundColor: `${colorMap[difficulty]}1A` }}
    >
      {difficulty}
    </span>
  )
}

export default DifficultyBadge