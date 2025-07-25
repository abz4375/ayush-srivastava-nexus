import React from 'react';
import Image from 'next/image';

const CustomLogin: React.FC<any> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'hsl(var(--background))',
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Image
          src="/ayush.png"
          alt="Ayush Srivastava"
          width={100}
          height={100}
          style={{ borderRadius: '50%' }}
        />
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginTop: '1rem',
        }}>
          Ayush Srivastava
        </h1>
      </div>
      {children}
    </div>
  );
};

export default CustomLogin;
