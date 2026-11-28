const SCRIPT_ID = "srh-codeverse-razorpay-checkout"
const CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js"
const LOAD_TIMEOUT_MS = 10000

let pendingLoad = null

/** Loads the official Razorpay Checkout.js once, over HTTPS, with retry support. */
export function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (pendingLoad) return pendingLoad

  let timeoutId = null
  const load = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID)

    // A previous attempt failed: remove it so a later checkout can retry.
    if (script && script.dataset.loaded === "error") {
      script.remove()
      script = null
    }

    if (script && script.dataset.loaded === "true") {
      resolve(true)
      return
    }

    if (!script) {
      script = document.createElement("script")
      script.id = SCRIPT_ID
      script.src = CHECKOUT_URL
      script.async = true
      document.body.appendChild(script)
    }

    const onLoad = () => {
      script.dataset.loaded = "true"
      if (timeoutId) clearTimeout(timeoutId)
      resolve(true)
    }
    const onError = () => {
      script.dataset.loaded = "error"
      if (timeoutId) clearTimeout(timeoutId)
      reject(new Error("Razorpay Checkout could not be loaded"))
    }

    script.addEventListener("load", onLoad, { once: true })
    script.addEventListener("error", onError, { once: true })

    timeoutId = setTimeout(() => {
      if (window.Razorpay) onLoad()
      else onError()
    }, LOAD_TIMEOUT_MS)
  })

  pendingLoad = load.finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
    pendingLoad = null
  })
  return pendingLoad
}
