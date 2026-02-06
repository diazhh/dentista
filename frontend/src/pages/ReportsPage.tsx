import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reportes y Analíticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            Módulo de reportes en desarrollo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
