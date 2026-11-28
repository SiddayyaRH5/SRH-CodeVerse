/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Courses from "./Courses"
import CourseDetail from "./CourseDetail"

import * as courseApi from "../../api/courseApi"
import * as razorpayUtil from "../../utils/razorpay"

vi.mock("../../utils/razorpay", () => ({ loadRazorpayScript: vi.fn(async () => true) }))

vi.mock("../../api/courseApi", () => ({
  getCourses: vi.fn(),
  getCourse: vi.fn(),
  getCourseProblems: vi.fn(),
  updateCourseProgress: vi.fn(),
  enrollCourse: vi.fn(),
  createPaymentOrder: vi.fn(),
  verifyPayment: vi.fn(),
  getCourseProblem: vi.fn(),
  getCourseLessons: vi.fn(),
}))

const { mockUser } = vi.hoisted(() => ({ mockUser: { value: null } }))

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser.value,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

const FREE_COURSE = {
  slug: "java-foundations",
  title: "Java Foundations",
  shortDescription: "Learn Java from the ground up.",
  category: "Programming",
  level: "Beginner",
  difficulty: "Beginner",
  thumbnail: "/course-thumbnails/java-programming.svg",
  instructor: "SRH CodeVerse",
  courseType: "FREE",
  price: 0,
  currency: "INR",
  paid: false,
  eligible: true,
  lessonCount: 10,
  problemCount: 5,
  estimatedDurationMinutes: 600,
  progressPercent: 0,
  lessons: [
    {
      id: 1,
      title: "Intro to Java",
      moduleName: "Module 1",
      moduleOrder: 1,
      lessonOrder: 1,
      description: "Getting started",
      lessonContent: "Public course content",
    },
  ],
  resources: [],
  projects: [],
}

const PAID_COURSE = {
  ...FREE_COURSE,
  slug: "paid-course",
  title: "Paid Java Masterclass",
  courseType: "PAID",
  price: 499,
  paid: true,
  eligible: false,
  lessons: [
    {
      ...FREE_COURSE.lessons[0],
      title: "Locked lesson",
      lessonContent: null,
    },
  ],
}

async function render(element, path = "/", routePath = null) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  const content = routePath ? (
    <Routes>
      <Route path={routePath} element={element} />
    </Routes>
  ) : (
    element
  )
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[path]}>{content}</MemoryRouter>)
  })
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

function buttonByText(text) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent.includes(text)
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockUser.value = {
    token: "test-token",
    username: "student",
    role: "STUDENT",
  }
})

afterEach(() => {
  if (root) {
    act(() => root.unmount())
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
})

describe("course marketplace listing", () => {
  it("shows FREE/PAID badges, prices, instructor and filters by access", async () => {
    vi.mocked(courseApi.getCourses).mockResolvedValue({
      data: [FREE_COURSE, PAID_COURSE],
    })

    await render(<Courses />)
    await settle()

    expect(container.textContent).toContain("Free")
    expect(container.textContent).toContain("Paid")
    expect(container.textContent).toContain("₹499")
    expect(container.textContent).toContain("By SRH CodeVerse")
    expect(container.querySelectorAll('a[href="/courses/paid-course"]').length).toBe(1)

    const select = container.querySelector("#course-access")
    await act(async () => {
      select.value = "PAID"
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(container.querySelectorAll('a[href="/courses/java-foundations"]').length).toBe(0)
    expect(container.querySelectorAll('a[href="/courses/paid-course"]').length).toBe(1)
  })
})

describe("course marketplace detail access", () => {
  it("locks paid lessons until payment is verified", async () => {
    vi.mocked(courseApi.getCourse).mockResolvedValue({ data: PAID_COURSE })
    vi.mocked(courseApi.createPaymentOrder).mockRejectedValue({
      response: { data: { message: "Online payments are not configured yet" } },
    })

    await render(<CourseDetail />, "/courses/paid-course", "/courses/:slug")
    await settle()

    expect(container.textContent).toContain("Buy Course")
    expect(container.textContent).toContain("Locked lesson")
    expect(container.querySelector('a[href="/courses/paid-course/lessons/1"]')).toBeNull()

    await act(async () => {
      buttonByText("Buy Course").click()
    })

    expect(courseApi.createPaymentOrder).toHaveBeenCalledWith("paid-course")
    expect(container.textContent).toContain("Online payments are not configured yet")
  })

  it("allows free-course enrollment for authenticated students", async () => {
    vi.mocked(courseApi.getCourse).mockResolvedValue({ data: FREE_COURSE })
    vi.mocked(courseApi.enrollCourse).mockResolvedValue({
      data: { ...FREE_COURSE, progressPercent: 0 },
    })

    await render(<CourseDetail />, "/courses/java-foundations", "/courses/:slug")
    await settle()

    const button = buttonByText("Enroll for free")
    expect(button).toBeTruthy()

    await act(async () => {
      button.click()
    })

    expect(courseApi.enrollCourse).toHaveBeenCalledWith("java-foundations")
  })

  it("opens Razorpay Checkout with the server-provided amount and order", async () => {
    vi.mocked(courseApi.getCourse).mockResolvedValue({ data: PAID_COURSE })
    vi.mocked(courseApi.createPaymentOrder).mockResolvedValue({
      data: {
        orderId: "order_server_1",
        amountPaise: 49900,
        currency: "INR",
        keyId: "rzp_test_local",
      },
    })
    let options = null
    const Modal = function (config) {
      options = config
      this.on = vi.fn()
      this.open = vi.fn(() => config.modal.ondismiss())
    }
    window.Razorpay = Modal

    await render(<CourseDetail />, "/courses/paid-course", "/courses/:slug")
    await settle()

    await act(async () => {
      buttonByText("Buy Course").click()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(courseApi.createPaymentOrder).toHaveBeenCalledWith("paid-course")
    expect(razorpayUtil.loadRazorpayScript).toHaveBeenCalled()
    expect(options).toMatchObject({
      key: "rzp_test_local",
      amount: 49900,
      currency: "INR",
      order_id: "order_server_1",
    })
    delete window.Razorpay
  })

  it("verifies only when the checkout order ID matches the server order", async () => {
    vi.mocked(courseApi.getCourse).mockResolvedValue({ data: PAID_COURSE })
    vi.mocked(courseApi.createPaymentOrder).mockResolvedValue({
      data: { orderId: "order_server_2", amountPaise: 49900, currency: "INR", keyId: "rzp_test_local" },
    })
    vi.mocked(courseApi.verifyPayment).mockClear()
    vi.mocked(courseApi.verifyPayment).mockResolvedValue({ enrolled: true })
    let options = null
    window.Razorpay = function (config) {
      options = config
      this.on = vi.fn()
      this.open = vi.fn()
    }

    await render(<CourseDetail />, "/courses/paid-course", "/courses/:slug")
    await settle()
    await act(async () => {
      buttonByText("Buy Course").click()
      await Promise.resolve()
      await Promise.resolve()
    })

    await act(async () => {
      await options.handler({
        razorpay_order_id: "order_server_2",
        razorpay_payment_id: "pay_match",
        razorpay_signature: "sig",
      })
    })
    expect(courseApi.verifyPayment).toHaveBeenCalledWith("order_server_2", "pay_match", "sig")
    delete window.Razorpay
  })

  it("rejects a checkout response with a mismatched order ID", async () => {
    vi.mocked(courseApi.getCourse).mockResolvedValue({ data: PAID_COURSE })
    vi.mocked(courseApi.createPaymentOrder).mockResolvedValue({
      data: { orderId: "order_server_3", amountPaise: 49900, currency: "INR", keyId: "rzp_test_local" },
    })
    vi.mocked(courseApi.verifyPayment).mockClear()
    let options = null
    window.Razorpay = function (config) {
      options = config
      this.on = vi.fn()
      this.open = vi.fn()
    }

    await render(<CourseDetail />, "/courses/paid-course", "/courses/:slug")
    await settle()
    await act(async () => {
      buttonByText("Buy Course").click()
      await Promise.resolve()
      await Promise.resolve()
    })

    await act(async () => {
      await options.handler({
        razorpay_order_id: "someone_elses_order",
        razorpay_payment_id: "pay_bad",
        razorpay_signature: "sig",
      })
    })
    expect(courseApi.verifyPayment).not.toHaveBeenCalled()
    expect(container.textContent).toContain("the order did not match")
    delete window.Razorpay
  })
})
