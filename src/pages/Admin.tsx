import { useEffect } from 'react';

const Admin = () => {
  useEffect(() => {
    // Redirect to PayloadCMS admin panel
    window.location.href = '/admin';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Admin Panel...</h1>
        <p className="text-muted-foreground">
          If you're not redirected automatically, 
          <a href="/admin" className="text-primary hover:underline ml-1">
            click here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Admin;