export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sample dashboard cards */}
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary">1,234</p>
          <p className="text-sm text-muted-foreground">+12% from last month</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-primary">$45,678</p>
          <p className="text-sm text-muted-foreground">+8% from last month</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-2">Orders</h3>
          <p className="text-3xl font-bold text-primary">892</p>
          <p className="text-sm text-muted-foreground">+15% from last month</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-2">Conversion</h3>
          <p className="text-3xl font-bold text-primary">3.2%</p>
          <p className="text-sm text-muted-foreground">-2% from last month</p>
        </div>
      </div>

      {/* Sample table area */}
      <div className="border rounded-lg bg-card">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <div className="p-6">
          <p className="text-muted-foreground">
            This is where your data tables, chat UI, and drag & drop flow editor will be displayed.
          </p>
        </div>
      </div>
    </div>
  )
}