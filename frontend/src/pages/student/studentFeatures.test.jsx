/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Roadmap from "./Roadmap"
import LearningPath from "./LearningPath"
import InterviewArena from "./InterviewArena"
import Certificates from "./Certificates"
import CertificateVerify from "./CertificateVerify"

import * as roadmapApi from "../../api/roadmapApi"
import * as learningApi from "../../api/learningApi"
import * as interviewApi from "../../api/interviewApi"
import * as certificateApi from "../../api/certificateApi"

vi.mock("../../api/roadmapApi", () => ({
  getRoadmaps: vi.fn(),
  getRoadmap: vi.fn(),
  getMyRoadmaps: vi.fn(),
  enrollRoadmap: vi.fn(),
  unenrollRoadmap: vi.fn(),
  updateRoadmapTopic: vi.fn(),
}))

vi.mock("../../api/learningApi", () => ({
  getLearningCourses: vi.fn(),
  getLearningCourse: vi.fn(),
  enrollLearningCourse: vi.fn(),
  getMyLearning: vi.fn(),
  getLearningLesson: vi.fn(),
  completeLearningLesson: vi.fn(),
  toggleLessonBookmark: vi.fn(),
  saveLessonNote: vi.fn(),
  getLearningBookmarks: vi.fn(),
  getLearningProgress: vi.fn(),
  getLearningRecommendations: vi.fn(),
}))

vi.mock("../../api/interviewApi", () => ({
  getInterviewCategories: vi.fn(),
  getInterviewQuestions: vi.fn(),
  startInterviewSession: vi.fn(),
  getInterviewSession: vi.fn(),
  saveInterviewAnswer: vi.fn(),
  submitInterviewSession: vi.fn(),
  getInterviewResult: vi.fn(),
  getInterviewHistory: vi.fn(),
  getInterviewAnalytics: vi.fn(),
}))

vi.mock("../../api/certificateApi", () => ({
  getCertificates: vi.fn(),
  getMyCertificates: vi.fn(),
  getCertificate: vi.fn(),
  startCertificateAttempt: vi.fn(),
  getCertificateAttempt: vi.fn(),
  saveCertificateAnswer: vi.fn(),
  submitCertificateAttempt: vi.fn(),
  getCertificateAttemptResult: vi.fn(),
  getCertificateAttempts: vi.fn(),
  claimCertificate: vi.fn(),
  getIssuedCertificate: vi.fn(),
  downloadCertificatePdf: vi.fn(),
  verifyCertificate: vi.fn(),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

const ROADMAP_SUMMARY = {
  slug: "java-full-stack",
  title: "Java Full Stack Developer",
  shortDescription: "Frontend, Java backend and deployment in one guided path.",
  category: "Full Stack",
  difficulty: "Intermediate",
  estimatedHours: 420,
  skills: ["Java", "React", "SQL"],
  icon: "FS",
  stageCount: 1,
  topicCount: 2,
  enrolled: false,
  status: "NOT_STARTED",
  progressPercent: 0,
  completedTopics: 0,
}

const ROADMAP_DETAIL = {
  ...ROADMAP_SUMMARY,
  description: "A complete full-stack route.",
  enrolled: false,
  totalTopics: 2,
  nextTopic: { id: 11, title: "HTML structure", description: "Learn semantic HTML." },
  enrollment: null,
  stages: [
    {
      id: 1,
      order: 1,
      title: "Web Foundations",
      description: "Understand the browser and semantic HTML.",
      skills: ["HTML"],
      estimatedHours: 24,
      prerequisites: [],
      completionCriteria: "Build a responsive page.",
      status: "AVAILABLE",
      progressPercent: 0,
      completedTopics: 0,
      totalTopics: 1,
      topics: [
        {
          id: 11,
          order: 1,
          title: "HTML structure",
          description: "Elements, forms and semantic layout.",
          resourceTitle: "CodeVerse practice",
          resourceUrl: "/problems",
          estimatedMinutes: 60,
          completed: false,
        },
      ],
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
    await Promise.resolve()
  })
  return container
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

function buttonByText(scope, text) {
  return Array.from(scope.querySelectorAll("button")).find((button) =>
    button.textContent.includes(text),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
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

describe("Roadmap page", () => {
  it("renders the backend catalog and opens a roadmap detail", async () => {
    roadmapApi.getRoadmaps.mockResolvedValue({
      data: {
        items: [ROADMAP_SUMMARY],
        categories: [{ name: "Full Stack", count: 1 }],
        total: 1,
        page: 0,
        size: 12,
      },
    })
    roadmapApi.getRoadmap.mockResolvedValue({ data: ROADMAP_DETAIL })
    roadmapApi.enrollRoadmap.mockResolvedValue({ data: ROADMAP_DETAIL })

    const c = await render(<Roadmap />)
    await settle(320)

    expect(c.textContent).toContain("Choose your path")
    expect(c.textContent).toContain("Java Full Stack Developer")

    await act(async () => {
      buttonByText(c, "Java Full Stack Developer").click()
      await Promise.resolve()
    })
    await settle()

    expect(roadmapApi.getRoadmap).toHaveBeenCalledWith("java-full-stack")
    expect(c.textContent).toContain("Web Foundations")
    expect(c.textContent).toContain("HTML structure")

    await act(async () => {
      buttonByText(c, "Start roadmap").click()
      await Promise.resolve()
    })
    await settle()

    expect(roadmapApi.enrollRoadmap).toHaveBeenCalledWith("java-full-stack")
  })

  it("shows a real error message when the catalog fails", async () => {
    roadmapApi.getRoadmaps.mockRejectedValue({
      response: { data: { message: "Unable to load roadmaps." } },
    })

    const c = await render(<Roadmap />)
    await settle(320)

    expect(c.textContent).toContain("Unable to load roadmaps.")
  })
})

describe("LearningPath page", () => {
  it("renders courses, progress and rule-based recommendations", async () => {
    learningApi.getLearningCourses.mockResolvedValue({
      data: {
        items: [
          {
            slug: "java-foundations",
            title: "Java Foundations",
            shortDescription: "Learn Java from types to collections.",
            category: "Programming",
            difficulty: "Beginner",
            lessonCount: 42,
            skillsGained: ["Java", "OOP"],
            enrolled: false,
            progressPercent: 0,
            completedLessons: 0,
            currentLessonId: 1,
          },
        ],
        total: 1,
      },
    })
    learningApi.getLearningProgress.mockResolvedValue({
      data: {
        enrolledCourses: 0,
        completedLessons: 0,
        totalLessons: 0,
        overallPercent: 0,
        bookmarks: 0,
      },
    })
    learningApi.getMyLearning.mockResolvedValue({ data: { items: [] } })
    learningApi.getLearningBookmarks.mockResolvedValue({ data: { items: [] } })
    learningApi.getLearningRecommendations.mockResolvedValue({
      data: {
        engine: "RULE_BASED",
        total: 1,
        items: [
          {
            type: "practice",
            title: "Practice arrays",
            reason: "You solved 0 of 3 array problems.",
            href: "/problems",
          },
        ],
      },
    })

    const c = await render(<LearningPath />)
    await settle(320)

    expect(c.textContent).toContain("Learning Path")
    expect(c.textContent).toContain("Java Foundations")
    expect(c.textContent).toContain("Recommended next")
    expect(c.textContent).toContain("You solved 0 of 3 array problems.")
    expect(learningApi.getLearningRecommendations).toHaveBeenCalled()
  })

  it("keeps successful learning data when one request fails and retries only the failure", async () => {
    const course = {
      slug: "java-foundations",
      title: "Java Foundations",
      shortDescription: "Learn Java from types to collections.",
      category: "Programming",
      difficulty: "Beginner",
      lessonCount: 5,
      skillsGained: ["Java", "OOP"],
      enrolled: true,
      progressPercent: 40,
      completedLessons: 2,
      currentLessonId: 1,
    }

    learningApi.getLearningCourses.mockRejectedValueOnce({
      response: { data: { message: "Course service unavailable." } },
    })
    learningApi.getLearningProgress.mockResolvedValue({
      data: {
        enrolledCourses: 1,
        completedLessons: 2,
        totalLessons: 5,
        overallPercent: 40,
        bookmarks: 1,
      },
    })
    learningApi.getMyLearning.mockResolvedValue({
      data: {
        items: [{
          slug: "java-foundations",
          title: "Java Foundations",
          progressPercent: 40,
          completedLessons: 2,
          totalLessons: 5,
          currentLessonTitle: "Variables and Data Types",
        }],
      },
    })
    learningApi.getLearningBookmarks.mockResolvedValue({
      data: {
        items: [{
          lessonId: 1,
          title: "Variables and Data Types",
          courseTitle: "Java Foundations",
        }],
      },
    })
    learningApi.getLearningRecommendations.mockResolvedValue({
      data: {
        items: [{
          type: "course",
          title: "Continue Java Foundations",
          reason: "You completed 2 of 5 lessons.",
          href: "/learning-path/courses/java-foundations",
        }],
      },
    })

    const c = await render(<LearningPath />)
    await settle(320)

    expect(c.textContent).toContain("Course service unavailable.")
    expect(c.textContent).not.toContain("No courses found")
    expect(c.textContent).toContain("40% overall")
    expect(c.textContent).toContain("Recommended next")
    expect(c.textContent).toContain("Continue learning")
    expect(c.textContent).toContain("Bookmarked lessons")

    learningApi.getLearningCourses.mockResolvedValueOnce({
      data: { items: [course], total: 1 },
    })
    await act(async () => {
      buttonByText(c, "Retry failed").click()
      await Promise.resolve()
    })
    await settle()

    expect(learningApi.getLearningCourses).toHaveBeenCalledTimes(2)
    expect(learningApi.getLearningProgress).toHaveBeenCalledTimes(1)
    expect(learningApi.getMyLearning).toHaveBeenCalledTimes(1)
    expect(learningApi.getLearningBookmarks).toHaveBeenCalledTimes(1)
    expect(learningApi.getLearningRecommendations).toHaveBeenCalledTimes(1)
    expect(c.textContent).toContain("Java Foundations")
    expect(c.textContent).not.toContain("Course service unavailable.")
  })

  it("does not render failed progress as zero statistics", async () => {
    learningApi.getLearningCourses.mockResolvedValue({
      data: {
        items: [{
          slug: "java-foundations",
          title: "Java Foundations",
          shortDescription: "Learn Java from types to collections.",
          category: "Programming",
          difficulty: "Beginner",
          lessonCount: 5,
          skillsGained: ["Java"],
          enrolled: false,
          progressPercent: 0,
          completedLessons: 0,
        }],
      },
    })
    learningApi.getLearningProgress.mockRejectedValue({
      response: { data: { message: "Progress service unavailable." } },
    })
    learningApi.getMyLearning.mockResolvedValue({ data: { items: [] } })
    learningApi.getLearningBookmarks.mockResolvedValue({ data: { items: [] } })
    learningApi.getLearningRecommendations.mockResolvedValue({ data: { items: [] } })

    const c = await render(<LearningPath />)
    await settle(320)

    expect(c.textContent).toContain("Progress service unavailable.")
    expect(c.textContent).toContain("Progress unavailable")

    const statCards = c.querySelectorAll(".cv-stat-card")
    expect(statCards).toHaveLength(4)
    expect(statCards[0].textContent).toContain("—")
    expect(statCards[0].textContent).not.toContain("0")
    expect(statCards[1].textContent).toContain("—")
    expect(statCards[1].textContent).not.toContain("0")
    expect(statCards[2].textContent).toContain("—")
    expect(statCards[2].textContent).not.toContain("0")

    expect(c.textContent).toContain("Java Foundations")
    expect(c.textContent).not.toContain("No courses found")
  })

  it("shows the empty state only after a successful empty course response", async () => {
    learningApi.getLearningCourses.mockResolvedValue({ data: { items: [], total: 0 } })
    learningApi.getLearningProgress.mockResolvedValue({
      data: {
        enrolledCourses: 0,
        completedLessons: 0,
        totalLessons: 0,
        overallPercent: 0,
        bookmarks: 0,
      },
    })
    learningApi.getMyLearning.mockResolvedValue({ data: { items: [] } })
    learningApi.getLearningBookmarks.mockResolvedValue({ data: { items: [] } })
    learningApi.getLearningRecommendations.mockResolvedValue({ data: { items: [] } })

    const c = await render(<LearningPath />)
    await settle(320)

    expect(c.textContent).toContain("No courses found")
    expect(c.textContent).not.toContain("Course library unavailable")
  })
})

describe("InterviewArena page", () => {
  it("starts a backend session and renders the real questions", async () => {
    interviewApi.getInterviewCategories.mockResolvedValue({
      data: [
        { code: "JAVA", name: "Java Fundamentals", questionCount: 8, easy: 3, medium: 3, hard: 2 },
        { code: "SQL", name: "SQL & Databases", questionCount: 8, easy: 3, medium: 3, hard: 2 },
      ],
    })
    interviewApi.getInterviewHistory.mockResolvedValue({ data: { items: [], total: 0 } })
    interviewApi.getInterviewAnalytics.mockResolvedValue({
      data: { submittedSessions: 0, averageScore: 0, bestScore: 0, categories: [] },
    })
    interviewApi.startInterviewSession.mockResolvedValue({
      data: {
        id: 1,
        category: "JAVA",
        difficulty: "MIXED",
        mode: "TIMED",
        status: "IN_PROGRESS",
        questionCount: 1,
        durationMinutes: 10,
        remainingSeconds: 600,
        questions: [
          {
            sessionQuestionId: 99,
            questionId: 1,
            order: 1,
            topic: "OOP",
            difficulty: "EASY",
            type: "MCQ",
            prompt: "Which principle hides internal state behind methods?",
            options: ["Inheritance", "Encapsulation"],
            points: 1,
            selectedOption: null,
            answerText: null,
            flagged: false,
            answered: false,
          },
        ],
      },
    })

    const c = await render(<InterviewArena />)
    await settle()

    expect(c.textContent).toContain("Interview Arena")
    expect(c.textContent).toContain("Java Fundamentals")

    await act(async () => {
      buttonByText(c, "Start interview").click()
      await Promise.resolve()
    })
    await settle()

    expect(interviewApi.startInterviewSession).toHaveBeenCalled()
    expect(c.textContent).toContain("Which principle hides internal state behind methods?")
    expect(c.textContent).toContain("Encapsulation")
  })
})

describe("Certificates page", () => {
  it("renders backend eligibility requirements and locks the assessment", async () => {
    certificateApi.getCertificates.mockResolvedValue({
      data: {
        earned: 0,
        total: 1,
        items: [
          {
            slug: "java-foundations",
            title: "Java Foundations",
            description: "Prove your command of Java.",
            category: "Java",
            icon: "JF",
            assessmentPassScore: 70,
            assessmentQuestionCount: 8,
            assessmentDurationMinutes: 20,
            attemptLimit: 5,
            usedAttempts: 0,
            preparationMet: false,
            eligible: false,
            issued: false,
            certificate: null,
            bestAssessmentScore: 0,
            requirements: [
              {
                key: "lessons",
                label: "Complete at least 80% of the required lessons",
                current: 0,
                required: 80,
                met: false,
                detail: "0/42 lessons completed",
              },
            ],
          },
        ],
      },
    })
    certificateApi.getMyCertificates.mockResolvedValue({ data: { items: [], total: 0 } })

    const c = await render(<Certificates />)
    await settle()

    expect(c.textContent).toContain("Certificates")
    expect(c.textContent).toContain("Java Foundations")
    expect(c.textContent).toContain("Complete at least 80% of the required lessons")
    expect(c.textContent).toContain("0/42 lessons completed")
    expect(c.textContent).toContain("Complete the requirements above to unlock the assessment")
  })
})

describe("CertificateVerify page", () => {
  it("shows only safe certificate fields for a valid public code", async () => {
    certificateApi.verifyCertificate.mockResolvedValue({
      data: {
        valid: true,
        status: "ACTIVE",
        certificateNumber: "SRH-CV-2026-JAVA-ABC123",
        studentName: "ada",
        title: "Java Foundations",
        category: "Java",
        issuedAt: "2026-11-20T10:00:00",
        scorePercent: 88,
        issuer: "SRH CodeVerse",
      },
    })

    const c = await render(<CertificateVerify />, "/verify/CODE123", "/verify/:verificationCode")
    await settle()

    expect(certificateApi.verifyCertificate).toHaveBeenCalledWith("CODE123")
    expect(c.textContent).toContain("Valid certificate")
    expect(c.textContent).toContain("ada")
    expect(c.textContent).toContain("SRH-CV-2026-JAVA-ABC123")
    expect(c.textContent).toContain("88%")
  })

  it("shows a clear message for an unknown verification code", async () => {
    certificateApi.verifyCertificate.mockRejectedValue({
      response: { status: 400, data: { message: "Certificate not found" } },
    })

    const c = await render(<CertificateVerify />, "/verify/UNKNOWN", "/verify/:verificationCode")
    await settle()

    expect(c.textContent).toContain("Certificate not verified")
    expect(c.textContent).toContain("This verification code is not valid.")
  })
})
