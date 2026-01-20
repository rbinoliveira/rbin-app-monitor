import { MainLayout } from '@/components/layout/MainLayout'

export default function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your applications health and test results
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="text-sm font-medium text-gray-500">Total Projects</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">0</div>
          </div>
          <div className="card">
            <div className="text-sm font-medium text-gray-500">Healthy</div>
            <div className="mt-1 text-3xl font-semibold text-success-600">0</div>
          </div>
          <div className="card">
            <div className="text-sm font-medium text-gray-500">Unhealthy</div>
            <div className="mt-1 text-3xl font-semibold text-danger-600">0</div>
          </div>
          <div className="card">
            <div className="text-sm font-medium text-gray-500">Unknown</div>
            <div className="mt-1 text-3xl font-semibold text-gray-400">0</div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-4 text-sm text-gray-500">
            No activity yet. Add a project to start monitoring.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
