import { Navigate, useParams } from 'react-router-dom';

/**
 * @deprecated This page has been merged into PatientDetailPage.
 * The /patients/:id route now shows the full tabbed interface.
 * This component redirects for backwards compatibility.
 */
export default function PatientDashboardPage() {
  const { patientId } = useParams<{ patientId: string }>();
  return <Navigate to={`/patients/${patientId}`} replace />;
}
