/**
 * Decorative CSS-3D scene. Purely presentational: pointer-events are disabled,
 * it is hidden from assistive technology, and motion is disabled by the design
 * system when prefers-reduced-motion is set.
 */
export default function FloatingTechScene({ compact = false }) {
  return (
    <div className="cv-3d-scene" aria-hidden="true">
      <div className="cv-3d-object cv-3d-cube cv-3d-object--one" />
      <div className="cv-3d-object cv-3d-ring cv-3d-object--two" />
      {!compact && (
        <>
          <div className="cv-3d-object cv-3d-glyph cv-3d-object--three">{"{ }"}</div>
          <div className="cv-3d-object cv-3d-cube cv-3d-object--four" />
        </>
      )}
    </div>
  )
}
