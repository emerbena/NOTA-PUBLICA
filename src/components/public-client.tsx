'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export function Bookmark({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem('np-saved') || '[]').includes(id));
    } catch {}
  }, [id]);
  return (
    <button
      className="bookmark"
      aria-label={saved ? 'Quitar de guardados' : 'Guardar artículo'}
      aria-pressed={saved}
      onClick={() => {
        try {
          const current = JSON.parse(localStorage.getItem('np-saved') || '[]');
          const list = new Set<string>(Array.isArray(current) ? current : []);
          if (saved) list.delete(id);
          else list.add(id);
          localStorage.setItem('np-saved', JSON.stringify([...list]));
        } catch {}
        setSaved(!saved);
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
      </svg>
    </button>
  );
}
export function Newsletter() {
  const [message, setMessage] = useState('');
  const [unsubscribe, setUnsubscribe] = useState('');
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fd.get('email'), consent: fd.get('consent') === 'on' }),
        });
        const data = await response.json();
        setMessage(data.error || data.message);
        if (response.ok) {
          setUnsubscribe(data.unsubscribe);
          form.reset();
        }
      }}
    >
      <label htmlFor="email">Tu próxima buena lectura empieza aquí.</label>
      <div className="email-field">
        <input id="email" name="email" type="email" required placeholder="Tu correo electrónico" />
        <button type="submit" aria-label="Solicitar boletín">
          ↗
        </button>
      </div>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          Acepto la <a href="/privacidad">política de privacidad</a>.
        </span>
      </label>
      <p>Guardamos tu solicitud. El envío de correos aún no está habilitado.</p>
      <p role="status">{message}</p>
      {unsubscribe && <a href={unsubscribe}>Guardar enlace para darme de baja</a>}
    </form>
  );
}
export function VoteForm({
  type,
  id,
  options,
  active,
}: {
  type: 'poll' | 'ranking';
  id: string;
  options: { id: string; label: string; count: number }[];
  active: boolean;
}) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const total = options.reduce((n, o) => n + o.count, 0);
  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          try {
            const choice = new FormData(e.currentTarget).get('choice');
            const response = await fetch('/api/votes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, id, choice }),
            });
            const result = await response.json();
            setMessage(result.error || 'Tu voto quedó registrado.');
            if (response.ok) router.refresh();
          } catch {
            setMessage('No se pudo registrar el voto.');
          } finally {
            setPending(false);
          }
        }}
      >
        {options.map((o) => (
          <label className="vote-option" key={o.id}>
            {active && <input type="radio" name="choice" value={o.id} required />}
            <span>{o.label}</span>
            <strong>{total ? Math.round((o.count / total) * 100) : 0}%</strong>
            <small>{o.count} votos</small>
          </label>
        ))}
        {active && (
          <button disabled={pending} className="button button-purple">
            {pending ? 'Registrando…' : 'Votar'}
          </button>
        )}
      </form>
      <p role="status">{message}</p>
      <small>
        {total} participaciones. Se limita el voto por navegador; esto no acredita identidad
        personal.
      </small>
    </div>
  );
}
export function Share({ title }: { title: string }) {
  const [message, setMessage] = useState('');
  return (
    <div className="share">
      <button
        className="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.href);
            setMessage('Enlace copiado.');
          } catch {
            setMessage('Copia la dirección desde tu navegador.');
          }
        }}
      >
        Copiar enlace
      </button>
      <button
        className="button"
        onClick={() => {
          const url = encodeURIComponent(location.href);
          window.open(
            `https://wa.me/?text=${encodeURIComponent(title)}%20${url}`,
            '_blank',
            'noopener,noreferrer',
          );
        }}
      >
        Compartir por WhatsApp
      </button>
      <span role="status">{message}</span>
    </div>
  );
}
