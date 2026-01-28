export class DashboardMetricsDto {
  nextAppointment?: {
    id: string;
    date: string;
    time: string;
    type: string;
    duration: number;
  };
  activeTreatments: number;
  pendingBalance: number;
  lastVisit?: string;
}

export class TimelineItemDto {
  id: string;
  type: 'appointment' | 'treatment' | 'payment' | 'document';
  date: string;
  title: string;
  description: string;
  icon?: string;
  metadata?: any;
}

export class AlertDto {
  id: string;
  type: 'warning' | 'info' | 'danger' | 'success';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export class DashboardSummaryDto {
  metrics: DashboardMetricsDto;
  recentTimeline: TimelineItemDto[];
  alerts: AlertDto[];
  quickStats: {
    totalAppointments: number;
    completedTreatments: number;
    totalPaid: number;
    documentsCount: number;
  };
}
