'use client';
import { useState } from 'react';
export function LoginForm() {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        try {
          const fd = new FormData(e.currentTarget);
          const response = await fetch('/api/auth/sign-in/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
          });
          if (!response.ok) {
            setMessage(
              'No se pudo iniciar sesión. Comprueba los datos o espera antes de reintentar.',
            );
          } else location.href = '/admin';
        } catch {
          setMessage('Servicio temporalmente no disponible.');
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        Correo
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label>
        Contraseña
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button className="button button-purple" disabled={pending}>
        {pending ? 'Entrando…' : 'Iniciar sesión'}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
