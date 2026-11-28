import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { verifyCertificate } from "../../api/certificateApi"
import BackButton from "../../components/common/BackButton"

function Detail({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--cv-muted)]">{label}</p>
      <p className={`mt-1 text-sm font-bold ${mono ? "break-all font-mono text-xs" : ""}`}>{value || "—"}</p>
    </div>
  )
}

export default function CertificateVerify() {
  const { verificationCode } = useParams()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!verificationCode) {
      setError("No verification code was provided.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    setCertificate(null)
    try {
      const response = await verifyCertificate(verificationCode)
      setCertificate(response.data)
    } catch (err) {
      setError(
        err?.response?.status === 400
          ? "This verification code is not valid."
          : err?.response?.data?.message || "Unable to verify this certificate right now.",
      )
    } finally {
      setLoading(false)
    }
  }, [verificationCode])

  useEffect(() => { load() }, [load])

  const issued = certificate?.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : ""

  return (
    <main className="cv-cert-verify cv-page cv-premium-page mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <p className="cv-kicker">SRH CODEVERSE</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Certificate verification</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--cv-muted)]">
          This public page confirms whether a certificate was issued by SRH CodeVerse. Only certificate-safe
          details are shown; no account information is exposed.
        </p>
      </header>

      {loading ? (
        <div className="cv-panel mt-8 h-64 animate-pulse rounded-2xl" />
      ) : error ? (
        <div className="cv-panel mt-8 text-center">
          <p className="text-4xl">⚠️</p>
          <h2 className="mt-3 text-xl font-black">Certificate not verified</h2>
          <p className="mt-2 text-sm text-[var(--cv-muted)]">{error}</p>
          <p className="mt-2 break-all font-mono text-xs text-[var(--cv-muted)]">{verificationCode}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" className="cv-secondary-btn !px-4 !py-2 text-xs" onClick={load}>
              Try again
            </button>
            <BackButton to="/">Back to home</BackButton>
          </div>
        </div>
      ) : certificate ? (
        <div className="cv-cert-sheet cv-panel mt-8 overflow-hidden">
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 ${
            certificate.valid ? "bg-emerald-500/5" : "bg-red-500/5"
          }`}>
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-full text-lg font-black text-white ${
                certificate.valid ? "bg-emerald-500" : "bg-red-500"
              }`}>
                {certificate.valid ? "✓" : "✕"}
              </span>
              <div>
                <p className="text-sm font-black">
                  {certificate.valid ? "Valid certificate" : "Certificate is not active"}
                </p>
                <p className="text-xs text-[var(--cv-muted)]">
                  Status: {certificate.status}
                </p>
              </div>
            </div>
            <span className="cv-pill">{certificate.issuer}</span>
          </div>

          <div className="p-5 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Awarded to</p>
            <h2 className="cv-gradient-text mt-1 text-3xl font-black">{certificate.studentName}</h2>
            <p className="mt-4 text-sm text-[var(--cv-muted)]">for successfully completing</p>
            <h3 className="mt-1 text-xl font-black">{certificate.title}</h3>
            <p className="mt-1 text-xs text-[var(--cv-muted)]">{certificate.category}</p>

            <div className="mt-6 grid gap-4 border-t border-[var(--color-border)] pt-5 sm:grid-cols-2">
              <Detail label="Certificate ID" value={certificate.certificateNumber} mono />
              <Detail label="Issued on" value={issued} />
              <Detail
                label="Assessment score"
                value={certificate.scorePercent === null || certificate.scorePercent === undefined
                  ? "—"
                  : `${certificate.scorePercent}%`}
              />
              <Detail label="Verification code" value={verificationCode} mono />
            </div>

            <p className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--cv-surface-2)]/40 p-3 text-[11px] leading-5 text-[var(--cv-muted)]">
              This record is stored by SRH CodeVerse and is returned directly by the certificate service.
              Anyone can verify it using the verification code above.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 text-center">
        <BackButton to="/">Back to SRH CodeVerse</BackButton>
      </div>
    </main>
  )
}
