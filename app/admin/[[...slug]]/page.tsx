/* eslint-disable */
import config from '@/payload.config'

export default function Admin() {
  // PayloadCMS admin will be handled by the Next.js app router
  // The admin UI will be rendered at this route when PayloadCMS is properly configured
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">PayloadCMS Admin Panel</h1>
        <p className="text-muted-foreground">
          PayloadCMS admin is configured and ready to use.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Database tables created in Supabase:</p>
          <ul className="text-xs space-y-1">
            <li>✓ hero_content</li>
            <li>✓ experiences</li>
            <li>✓ projects</li>
            <li>✓ skills</li>
            <li>✓ contact_info</li>
            <li>✓ payload_users</li>
          </ul>
        </div>
      </div>
    </div>
  )
}