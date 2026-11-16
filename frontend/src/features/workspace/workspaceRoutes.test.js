import { describe, expect, it } from "vitest"
import { PORTAL_NAVIGATION } from "./demoData"
import { RESOURCE_PAGES, STATIC_WORKSPACE_SCREENS } from "./resourcePages"

describe("workspace navigation", () => {
  it("maps every portal navigation item to a configured or implemented screen", () => {
    for (const [portal, navigation] of Object.entries(PORTAL_NAVIGATION)) {
      const routes = navigation.map(([, route]) => route)
      expect(new Set(routes).size).toBe(routes.length)
      for (const route of routes) {
        expect(
          RESOURCE_PAGES[portal]?.[route] || STATIC_WORKSPACE_SCREENS[portal]?.includes(route),
          `${portal}/${route} has no screen implementation`,
        ).toBeTruthy()
      }
    }
  })
})
