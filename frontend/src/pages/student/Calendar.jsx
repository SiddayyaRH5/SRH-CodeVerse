import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import EmptyState from "../../components/common/EmptyState"

export default function Calendar() {
  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="CALENDAR"
          title="Calendar"
          description="View upcoming events and available schedule data for your learning organization."
        />

        <EmptyState
          icon="📅"
          title="Calendar not available"
          description="A calendar API endpoint is not yet available on the backend. Once it is implemented, your upcoming events, classes, and deadlines will appear here."
          actionLabel="Browse Courses"
          actionTo="/courses"
          className="max-w-md mx-auto mt-20"
        />
      </PageContainer>
    </main>
  )
}