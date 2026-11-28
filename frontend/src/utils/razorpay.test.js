/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest"
import { loadRazorpayScript } from "./razorpay"

const SCRIPT_ID = "srh-codeverse-razorpay-checkout"

function resetDom() {
  document.getElementById(SCRIPT_ID)?.remove()
  delete window.Razorpay
}

describe("loadRazorpayScript", () => {
  afterEach(() => {
    resetDom()
    vi.useRealTimers()
  })

  it("resolves immediately when Checkout is already available", async () => {
    window.Razorpay = function Razorpay() {}
    expect(await loadRazorpayScript()).toBe(true)
    expect(document.getElementById(SCRIPT_ID)).toBeNull()
  })

  it("rejects on script load failure and allows a later retry", async () => {
    const first = loadRazorpayScript()
    const script = document.getElementById(SCRIPT_ID)
    expect(script.src).toBe("https://checkout.razorpay.com/v1/checkout.js")
    script.dispatchEvent(new Event("error"))
    await expect(first).rejects.toThrow("Razorpay Checkout could not be loaded")
    expect(script.dataset.loaded).toBe("error")

    const retry = loadRazorpayScript()
    const retryScript = document.getElementById(SCRIPT_ID)
    expect(retryScript).not.toBe(script)
    window.Razorpay = function Razorpay() {}
    retryScript.dispatchEvent(new Event("load"))
    expect(await retry).toBe(true)
  })

  it("times out safely when the script never loads", async () => {
    vi.useFakeTimers()
    const pending = loadRazorpayScript()
    const assertion = expect(pending).rejects.toThrow("Razorpay Checkout could not be loaded")
    await vi.advanceTimersByTimeAsync(11000)
    await assertion
    expect(document.getElementById(SCRIPT_ID).dataset.loaded).toBe("error")
  })

  it("deduplicates concurrent load requests", () => {
    const a = loadRazorpayScript()
    const b = loadRazorpayScript()
    expect(a).toBe(b)
    expect(document.querySelectorAll(`#${SCRIPT_ID}`).length).toBe(1)
    document.getElementById(SCRIPT_ID).dispatchEvent(new Event("error"))
    return Promise.allSettled([a, b])
  })
})
