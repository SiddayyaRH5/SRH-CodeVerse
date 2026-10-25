import Editor from "@monaco-editor/react"

const defaultOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: "on",
  padding: { top: 12 },
  tabSize: 4,
}

export default function CodeEditor({
  value,
  onChange,
  theme = "vs-dark",
  language = "java",
  height = "100%",
  onMount,
  options = {},
}) {
  return (
    <Editor
      height={height}
      language={language}
      theme={theme}
      value={value}
      onChange={(newValue) => onChange?.(newValue ?? "")}
      onMount={onMount}
      options={{
        ...defaultOptions,
        ...options,
        minimap: {
          ...defaultOptions.minimap,
          ...options.minimap,
        },
        padding: {
          ...defaultOptions.padding,
          ...options.padding,
        },
      }}
    />
  )
}
