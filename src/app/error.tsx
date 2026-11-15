'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container page-section">
      <h1>No se pudo cargar esta página</h1>
      <p>Comprueba la configuración del servicio o intenta nuevamente.</p>
      <button className="button button-purple" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
