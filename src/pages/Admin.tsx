export default function Admin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">PayloadCMS Admin</h1>
        <p className="text-muted-foreground">
          Visit <a href="/admin" className="text-primary hover:underline">/admin</a> for the full admin panel
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Default admin credentials:</p>
          <p className="text-xs font-mono">Email: admin@example.com</p>
          <p className="text-xs font-mono">Password: password123</p>
        </div>
      </div>
    </div>
  )
}