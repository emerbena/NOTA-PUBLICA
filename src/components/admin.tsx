'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { adminData } from '@/editorial/resources';
import type { revisions, reviews } from '@/database/schema';
import { states, roleLabels } from '@/shared/validation';
import { RichEditor } from './rich-editor';
import css from './admin.module.css';
type Data = Awaited<ReturnType<typeof adminData>>;
type Detail = {
  mediaIds: string[];
  tags: string[];
  sources: { name: string; url: string }[];
  history: (typeof reviews.$inferSelect)[];
  versions: (typeof revisions.$inferSelect)[];
} | null;
type Actor = { id: string; name: string; role: string; permissions: string[] };
type Field = {
  key: string;
  label: string;
  type?: 'textarea' | 'number' | 'checkbox' | 'date' | 'password' | 'select';
  options?: { value: string; label: string }[];
  fields?: Field[];
  strings?: boolean;
};
const baseFields: Record<string, Field[]> = {
  categories: [
    { key: 'name', label: 'Nombre' },
    { key: 'slug', label: 'Dirección corta (sin espacios)' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
  ],
  authors: [
    { key: 'name', label: 'Nombre' },
    { key: 'slug', label: 'Dirección corta' },
    { key: 'bio', label: 'Biografía', type: 'textarea' },
    { key: 'specialty', label: 'Especialidad' },
    { key: 'photo', label: 'URL de fotografía' },
    { key: 'active', label: 'Activo', type: 'checkbox' },
    { key: 'isDemo', label: 'Perfil de demostración', type: 'checkbox' },
  ],
  rankings: [
    { key: 'title', label: 'Título' },
    { key: 'slug', label: 'Dirección corta' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'category', label: 'Categoría (restaurantes, turismo, negocios…) ' },
    {
      key: 'method',
      label: 'Método',
      type: 'select',
      options: [
        { value: 'editorial', label: 'Editorial' },
        { value: 'votes', label: 'Votos abiertos' },
        { value: 'criteria', label: 'Criterios' },
      ],
    },
    { key: 'published', label: 'Publicado', type: 'checkbox' },
    { key: 'isDemo', label: 'Demostración', type: 'checkbox' },
    {
      key: 'entries',
      label: 'Participantes',
      fields: [
        { key: 'name', label: 'Nombre' },
        { key: 'description', label: 'Descripción' },
        { key: 'position', label: 'Posición', type: 'number' },
        { key: 'score', label: 'Puntuación (por criterios)', type: 'number' },
      ],
    },
    {
      key: 'criteria',
      label: 'Criterios de evaluación',
      fields: [
        { key: 'name', label: 'Criterio' },
        { key: 'description', label: 'Cómo se evalúa' },
      ],
    },
  ],
  polls: [
    { key: 'question', label: 'Pregunta' },
    { key: 'slug', label: 'Dirección corta' },
    { key: 'scope', label: 'Alcance y limitaciones', type: 'textarea' },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'draft', label: 'Borrador' },
        { value: 'active', label: 'Activa' },
        { value: 'closed', label: 'Cerrada' },
      ],
    },
    { key: 'startsAt', label: 'Inicio (hora de tu dispositivo)', type: 'date' },
    { key: 'endsAt', label: 'Fin (hora de tu dispositivo)', type: 'date' },
    { key: 'isDemo', label: 'Demostración', type: 'checkbox' },
    { key: 'options', label: 'Opciones', strings: true },
  ],
  awards: [
    { key: 'title', label: 'Edición' },
    { key: 'year', label: 'Año', type: 'number' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'published', label: 'Publicada', type: 'checkbox' },
    { key: 'isDemo', label: 'Demostración', type: 'checkbox' },
    {
      key: 'nominations',
      label: 'Nominaciones',
      fields: [
        { key: 'category', label: 'Categoría' },
        { key: 'name', label: 'Nombre' },
        { key: 'description', label: 'Descripción' },
        { key: 'winner', label: 'Ganador', type: 'checkbox' },
      ],
    },
  ],
  calendar: [
    { key: 'title', label: 'Encargo editorial' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'dueAt', label: 'Fecha límite (hora de tu dispositivo)', type: 'date' },
  ],
  users: [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    { key: 'password', label: 'Contraseña nueva (vacío conserva la actual)', type: 'password' },
    {
      key: 'role',
      label: 'Rol',
      type: 'select',
      options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })),
    },
    { key: 'active', label: 'Acceso activo', type: 'checkbox' },
    { key: 'canApprove', label: 'Autorizar al editor a aprobar', type: 'checkbox' },
  ],
  media: [
    { key: 'title', label: 'Título' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'alt', label: 'Texto alternativo' },
  ],
};
function dateInput(value: unknown) {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function Fields({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  return (
    <>
      {fields.map((f) => {
        const set = (v: unknown) => onChange({ ...value, [f.key]: v });
        if (f.fields || f.strings) {
          const rows = Array.isArray(value[f.key]) ? (value[f.key] as unknown[]) : [];
          return (
            <fieldset key={f.key}>
              <legend>{f.label}</legend>
              {rows.map((row, i) => (
                <div key={i}>
                  <div className={css.row}>
                    {f.strings ? (
                      <input
                        aria-label={`${f.label} ${i + 1}`}
                        value={String(row)}
                        onChange={(e) => set(rows.map((r, n) => (n === i ? e.target.value : r)))}
                      />
                    ) : (
                      <Fields
                        fields={f.fields!}
                        value={row as Record<string, unknown>}
                        onChange={(v) => set(rows.map((r, n) => (n === i ? v : r)))}
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => set(rows.filter((_, n) => n !== i))}>
                    Quitar fila
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button"
                onClick={() =>
                  set([
                    ...rows,
                    f.strings
                      ? ''
                      : Object.fromEntries(
                          f.fields!.map((field) => [
                            field.key,
                            field.type === 'number' ? 0 : field.type === 'checkbox' ? false : '',
                          ]),
                        ),
                  ])
                }
              >
                Añadir {f.strings ? 'opción' : 'fila'}
              </button>
            </fieldset>
          );
        }
        return (
          <label key={f.key}>
            {f.label}
            {f.type === 'textarea' ? (
              <textarea value={String(value[f.key] ?? '')} onChange={(e) => set(e.target.value)} />
            ) : f.type === 'select' ? (
              <select
                aria-label={f.label}
                value={String(value[f.key] ?? '')}
                onChange={(e) => set(e.target.value)}
              >
                <option value="">Seleccionar</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={value[f.key] === true}
                onChange={(e) => set(e.target.checked)}
              />
            ) : (
              <input
                type={f.type === 'date' ? 'datetime-local' : f.type || 'text'}
                value={f.type === 'date' ? dateInput(value[f.key]) : String(value[f.key] ?? '')}
                autoComplete={f.type === 'password' ? 'new-password' : undefined}
                onChange={(e) =>
                  set(
                    f.type === 'number'
                      ? Number(e.target.value)
                      : f.type === 'date'
                        ? e.target.value
                          ? new Date(e.target.value).toISOString()
                          : ''
                        : e.target.value,
                  )
                }
              />
            )}
          </label>
        );
      })}
    </>
  );
}
async function post(resource: string, body: unknown) {
  const response = await fetch(`/api/admin/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo guardar.');
  return data;
}
const nav = [
  ['Dashboard', '', null],
  ['Noticias', 'noticias', null],
  ['Crear noticia', 'noticias/crear', 'write'],
  ['Categorías', 'categorias', 'manage'],
  ['Autores', 'autores', 'manage'],
  ['Multimedia', 'multimedia', 'write'],
  ['Calendario editorial', 'calendario', null],
  ['Aprobaciones', 'aprobaciones', 'review'],
  ['Rankings', 'rankings', 'manage'],
  ['Encuestas', 'encuestas', 'manage'],
  ['Premios', 'premios', 'manage'],
  ['Usuarios', 'usuarios', 'users'],
  ['Distribución', 'distribucion', 'distribute'],
  ['Configuración', 'configuracion', null],
] as const;
const resourceNames: Record<string, string> = {
  categorias: 'categories',
  autores: 'authors',
  rankings: 'rankings',
  encuestas: 'polls',
  premios: 'awards',
  usuarios: 'users',
  multimedia: 'media',
  calendario: 'calendar',
};
export function Admin({
  data,
  path,
  actor,
  detail,
}: {
  data: Data;
  path: string[];
  actor: Actor;
  detail: Detail;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const section = path[0] || '';
  const can = (p: string) => actor.permissions.includes(p);
  const title = nav.find((n) => n[1] === section)?.[0] || 'Noticias';
  async function run(work: () => Promise<unknown>) {
    setPending(true);
    setMessage('');
    try {
      await work();
      setMessage('Cambios guardados.');
      setEditing(null);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se pudo completar.');
    } finally {
      setPending(false);
    }
  }
  const selected = data.articles.find((v) => v.article.id === path[1]);
  let body: React.ReactNode;
  if (section === 'noticias' && path[1] && !can('write'))
    body = selected ? (
      <section className={css.panel}>
        <h2>{selected.revision.title}</h2>
        <p>{selected.revision.summary}</p>
        <Link href={`/noticias/${selected.article.slug}`}>Leer versión publicada</Link>
        <p>
          <Link href="/admin/distribucion">Preparar variante para distribución</Link>
        </p>
      </section>
    ) : (
      <p>No tienes permiso para crear noticias.</p>
    );
  else if (section === 'noticias' && path[1])
    body = (
      <ArticleEditor
        key={selected?.revision.id || 'new'}
        selected={selected}
        data={data}
        detail={detail}
        can={can}
        run={run}
        pending={pending}
      />
    );
  else if (section === 'noticias' || section === 'aprobaciones')
    body = (
      <>
        <form className="filter-form">
          <label>
            Buscar titular
            <input name="q" defaultValue={data.pagination.query} />
          </label>
          {section === 'noticias' && (
            <label>
              Estado
              <select name="estado" defaultValue={data.pagination.state}>
                <option value="">Todos</option>
                {Object.entries(states).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="button">Filtrar</button>
        </form>
        <ArticleTable
          rows={data.articles.filter(
            (v) => section !== 'aprobaciones' || v.article.state === 'review',
          )}
        />
        <nav className="pagination" aria-label="Paginación de noticias">
          {data.pagination.page > 1 && (
            <Link
              href={`?pagina=${data.pagination.page - 1}&q=${encodeURIComponent(data.pagination.query)}&estado=${data.pagination.state}`}
            >
              Anterior
            </Link>
          )}
          <span>Página {data.pagination.page}</span>
          {data.pagination.page * data.pagination.pageSize < data.pagination.total && (
            <Link
              href={`?pagina=${data.pagination.page + 1}&q=${encodeURIComponent(data.pagination.query)}&estado=${data.pagination.state}`}
            >
              Siguiente
            </Link>
          )}
        </nav>
      </>
    );
  else if (section === '')
    body = (
      <>
        <div className={css.stats}>
          {[
            ['Noticias', data.stats.total],
            ['Publicadas', data.stats.published],
            ['Borradores', data.stats.drafts],
            ['En revisión', data.stats.review],
            ['Programadas', data.stats.scheduled],
            ['Autores activos', data.authors.filter((a) => a.active).length],
            ['Rankings publicados', data.rankings.filter((r) => r.published).length],
            [
              'Encuestas activas',
              data.polls.filter(
                (p) =>
                  p.status === 'active' &&
                  new Date(p.startsAt) <= new Date() &&
                  new Date(p.endsAt) > new Date(),
              ).length,
            ],
          ].map(([label, count]) => (
            <div className={css.stat} key={String(label)}>
              {label}
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <section className={css.panel}>
          <h2>Actividad reciente</h2>
          {data.activity.map((a) => (
            <p key={a.id}>
              {new Date(a.createdAt).toLocaleString()} · {a.action}
            </p>
          ))}
          {!data.activity.length && <p>No hay actividad visible para tu rol.</p>}
        </section>
        <ArticleTable rows={data.articles.slice(0, 8)} />
      </>
    );
  else if (section === 'configuracion')
    body = (
      <section className={css.panel}>
        <h2>Operación del medio</h2>
        <p>
          La publicación programada requiere el trabajador del servidor o el endpoint protegido de
          cron. El calendario conserva el estado tras reinicios.
        </p>
        <p>
          Los modelos de IA y las cuentas sociales todavía no están conectados. Las variantes de
          distribución se guardan como borradores.
        </p>
        <p>
          Las credenciales se administran como variables privadas del entorno. No se muestran en el
          panel.
        </p>
        <Link href="/privacidad">Consultar política de privacidad</Link>
      </section>
    );
  else if (section === 'distribucion') body = <Distribution data={data} run={run} />;
  else if (section === 'calendario')
    body = (
      <>
        <Calendar data={data} />
        {can('manage') && (
          <GenericForm
            key={String(editing?.id || 'new-calendar')}
            resource="calendar"
            initial={editing || {}}
            fields={[
              ...baseFields.calendar,
              {
                key: 'assigneeId',
                label: 'Responsable',
                type: 'select',
                options: data.assignees.map((a) => ({ value: a.id, label: a.name })),
              },
              {
                key: 'articleId',
                label: 'Noticia relacionada',
                type: 'select',
                options: data.articles.map((a) => ({
                  value: a.article.id,
                  label: a.revision.title,
                })),
              },
            ]}
            submit={(v) => run(() => post('calendar', v))}
            pending={pending}
          />
        )}
        {can('manage') &&
          data.calendar.map((c) => (
            <section className={css.panel} key={c.id}>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <p>{data.assignees.find((a) => a.id === c.assigneeId)?.name || 'Sin asignar'}</p>
              <div className={css.actions}>
                <button onClick={() => setEditing({ ...c })}>Editar encargo</button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar este encargo?'))
                      void run(() =>
                        post('calendar', { id: c.id, action: 'delete', confirm: c.id }),
                      );
                  }}
                >
                  Eliminar encargo
                </button>
              </div>
            </section>
          ))}
      </>
    );
  else if (resourceNames[section]) {
    const resource = resourceNames[section];
    const allowed =
      resource === 'users' ? can('users') : resource === 'media' ? can('write') : can('manage');
    if (!allowed) body = <p>No tienes permiso para administrar este módulo.</p>;
    else {
      const rows = (data[resource as keyof Data] || []) as unknown as Record<string, unknown>[];
      body = (
        <>
          {resource === 'media' && (
            <MediaUpload
              onDone={() => {
                router.refresh();
                setMessage('Imagen guardada.');
              }}
            />
          )}
          <section className={css.panel}>
            <h2>{editing ? 'Editar registro' : 'Crear registro'}</h2>
            {resource !== 'media' || editing ? (
              <GenericForm
                key={String(editing?.id || resource)}
                resource={resource}
                initial={editing || { active: true, isDemo: true, year: new Date().getFullYear() }}
                submit={(v) => run(() => post(resource, v))}
                pending={pending}
              />
            ) : (
              <p>Selecciona una imagen para modificar sus metadatos.</p>
            )}
            {editing && <button onClick={() => setEditing(null)}>Cancelar edición</button>}
          </section>
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>Registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)}>
                    <td>
                      {resource === 'media' && (
                        <img width="100" src={String(row.url)} alt={String(row.alt)} />
                      )}
                      <strong>{String(row.title || row.name || row.question)}</strong>
                      <p>{String(row.email || row.description || '')}</p>
                      {resource === 'polls' && (
                        <p>
                          {data.pollOptions
                            .filter((o) => o.pollId === row.id)
                            .map(
                              (o) =>
                                `${o.label}: ${data.voteResults.find((v) => v.optionId === o.id)?.count || 0}`,
                            )
                            .join(' · ')}
                        </p>
                      )}
                      {resource === 'rankings' && (
                        <p>
                          {data.rankingEntries
                            .filter((e) => e.rankingId === row.id)
                            .map(
                              (e) =>
                                `${e.name}: ${data.rankingResults.find((v) => v.entryId === e.id)?.count || 0} votos`,
                            )
                            .join(' · ')}
                        </p>
                      )}
                    </td>
                    <td>
                      {String(
                        row.status ??
                          (row.published === undefined
                            ? row.active === false
                              ? 'Inactivo'
                              : 'Activo'
                            : row.published
                              ? 'Publicado'
                              : 'Borrador'),
                      )}
                      {row.isDemo === true && <p>Demostración</p>}
                    </td>
                    <td>
                      <div className={css.actions}>
                        <button
                          onClick={() => {
                            let value = { ...row };
                            if (resource === 'rankings')
                              value = {
                                ...value,
                                entries: data.rankingEntries.filter((e) => e.rankingId === row.id),
                                criteria: data.criteria.filter((c) => c.rankingId === row.id),
                              };
                            if (resource === 'polls')
                              value = {
                                ...value,
                                options: data.pollOptions
                                  .filter((o) => o.pollId === row.id)
                                  .map((o) => o.label),
                              };
                            if (resource === 'awards')
                              value = {
                                ...value,
                                nominations: data.nominations.filter((n) => n.awardId === row.id),
                              };
                            setEditing(value);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          Editar
                        </button>
                        {resource === 'polls' && (
                          <button
                            disabled={pending}
                            onClick={() =>
                              run(() => post(resource, { id: row.id, action: 'close' }))
                            }
                          >
                            Cerrar consulta
                          </button>
                        )}
                        {['rankings', 'awards'].includes(resource) && (
                          <button
                            disabled={pending}
                            onClick={() =>
                              run(() =>
                                post(resource, {
                                  id: row.id,
                                  action: row.published ? 'unpublish' : 'publish',
                                }),
                              )
                            }
                          >
                            {row.published ? 'Despublicar' : 'Publicar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }
  } else body = <p>Sección no encontrada.</p>;
  return (
    <div className={css.shell}>
      <aside className={css.sidebar}>
        <Link href="/">
          <img className={css.logo} src="/assets/nota-publica-horizontal.png" alt="Nota Pública" />
        </Link>
        <nav>
          {nav
            .filter((n) => !n[2] || can(n[2]))
            .map(([label, href]) => (
              <Link
                className={section === href ? css.active : ''}
                key={href}
                href={`/admin/${href}`}
                onClick={() => {
                  setEditing(null);
                  setMessage('');
                }}
              >
                {label}
              </Link>
            ))}
        </nav>
      </aside>
      <main className={css.main}>
        <header className={css.top}>
          <span>
            {actor.name} · {roleLabels[actor.role as keyof typeof roleLabels]}
          </span>
          <div>
            <Link href="/" target="_blank">
              Ver web ↗
            </Link>{' '}
            <button
              onClick={async () => {
                await fetch('/api/auth/sign-out', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: '{}',
                });
                location.href = '/admin/login';
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <h1>{title}</h1>
        {message && (
          <p className={css.feedback} role="status">
            {message}
          </p>
        )}
        {body}
      </main>
    </div>
  );
}
function ArticleTable({ rows }: { rows: Data['articles'] }) {
  return (
    <div className={css.tableWrap}>
      <table className={css.table}>
        <thead>
          <tr>
            <th>Titular</th>
            <th>Autor</th>
            <th>Estado</th>
            <th>Actualización</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ article: a, revision: r, author }) => (
            <tr key={a.id}>
              <td>
                <Link href={`/admin/noticias/${a.id}`}>{r.title}</Link>
                {a.isDemo && <small> · Demo</small>}
              </td>
              <td>{author}</td>
              <td>
                <span className={css.pill}>{states[a.state]}</span>
                {a.publishedVersion && a.publishedVersion !== a.currentVersion && (
                  <p>La versión anterior sigue publicada</p>
                )}
              </td>
              <td>{new Date(a.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p>No hay noticias en esta vista.</p>}
    </div>
  );
}
function GenericForm({
  resource,
  initial,
  submit,
  pending,
  fields,
}: {
  resource: string;
  initial: Record<string, unknown>;
  submit: (v: Record<string, unknown>) => void;
  pending: boolean;
  fields?: Field[];
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      className={css.form}
      onSubmit={(e) => {
        e.preventDefault();
        const data = { ...value };
        if (resource === 'users' && !data.password) delete data.password;
        if (resource === 'calendar') {
          data.assigneeId ||= null;
          data.articleId ||= null;
        }
        submit(data);
      }}
    >
      <Fields fields={fields || baseFields[resource] || []} value={value} onChange={setValue} />
      <button className="button button-purple" disabled={pending}>
        Guardar
      </button>
    </form>
  );
}
function ArticleEditor({
  selected,
  data,
  detail,
  can,
  run,
  pending,
}: {
  selected?: Data['articles'][number];
  data: Data;
  detail: Detail;
  can: (p: string) => boolean;
  run: (work: () => Promise<unknown>) => Promise<void>;
  pending: boolean;
}) {
  const r = selected?.revision;
  const [value, setValue] = useState<Record<string, unknown>>({
    id: selected?.article.id,
    expectedVersion: selected?.article.currentVersion,
    slug: selected?.article.slug || '',
    title: r?.title || '',
    summary: r?.summary || '',
    kicker: r?.kicker || '',
    body: r?.body || '<p></p>',
    cover: r?.cover || '',
    coverAlt: r?.coverAlt || '',
    caption: r?.caption || '',
    authorId: r?.authorId || '',
    categoryId: r?.categoryId || '',
    kind: r?.kind || 'news',
    isDemo: selected?.article.isDemo ?? true,
    tags: detail?.tags || [],
    sources: detail?.sources || [],
    changeNote: '',
    mediaIds: detail?.mediaIds || [],
  });
  const [preview, setPreview] = useState(false);
  const [when, setWhen] = useState('');
  const [comment, setComment] = useState('');
  const [versionPreview, setVersionPreview] = useState('');
  const fields: Field[] = [
    { key: 'title', label: 'Titular' },
    { key: 'slug', label: 'URL corta (sin espacios)' },
    { key: 'kicker', label: 'Antetítulo' },
    { key: 'summary', label: 'Subtítulo / resumen', type: 'textarea' },
    {
      key: 'authorId',
      label: 'Autor',
      type: 'select',
      options: data.authors.filter((a) => a.active).map((a) => ({ value: a.id, label: a.name })),
    },
    {
      key: 'categoryId',
      label: 'Categoría',
      type: 'select',
      options: data.categories.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      key: 'kind',
      label: 'Tipo editorial',
      type: 'select',
      options: [
        ['news', 'Noticia'],
        ['column', 'Columna'],
        ['editorial', 'Editorial'],
        ['analysis', 'Análisis'],
        ['interview', 'Entrevista'],
        ['video', 'Video'],
      ].map(([value, label]) => ({ value, label })),
    },
    { key: 'isDemo', label: 'Contenido de demostración', type: 'checkbox' },
  ];
  return (
    <>
      <form
        className={`${css.panel} ${css.form}`}
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const saved = await post('articles', value);
            location.href = `/admin/noticias/${saved.id}`;
          });
        }}
      >
        <Fields fields={fields} value={value} onChange={setValue} />
        <label>
          Imagen principal
          <select
            value={String(value.cover)}
            onChange={(e) => {
              const m = data.media.find((m) => m.url === e.target.value);
              setValue({
                ...value,
                cover: e.target.value,
                coverAlt: m?.alt || '',
                mediaIds: m ? [m.id] : [],
              });
            }}
          >
            <option value="">Sin imagen</option>
            {Boolean(value.cover) && !data.media.some((m) => m.url === value.cover) && (
              <option value={String(value.cover)}>Imagen actual</option>
            )}
            {data.media.map((m) => (
              <option key={m.id} value={m.url}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <Fields
          fields={[
            { key: 'coverAlt', label: 'Texto alternativo' },
            { key: 'caption', label: 'Pie de foto' },
          ]}
          value={value}
          onChange={setValue}
        />
        <label>Cuerpo del artículo</label>
        <RichEditor
          value={String(value.body)}
          onChange={(body) => setValue((v) => ({ ...v, body }))}
          media={data.media}
        />
        <Fields
          fields={[
            { key: 'tags', label: 'Etiquetas', strings: true },
            {
              key: 'sources',
              label: 'Fuentes consultadas',
              fields: [
                { key: 'name', label: 'Nombre' },
                { key: 'url', label: 'URL de la fuente' },
              ],
            },
            { key: 'changeNote', label: 'Resumen de cambios', type: 'textarea' },
          ]}
          value={value}
          onChange={setValue}
        />
        <div className={css.actions}>
          {can('write') && (
            <button disabled={pending} type="submit">
              Guardar borrador
            </button>
          )}
          <button type="button" onClick={() => setPreview(!preview)}>
            Previsualizar
          </button>
        </div>
        {preview && (
          <iframe
            title="Vista previa del borrador sin scripts"
            sandbox=""
            className={css.preview}
            srcDoc={`<!doctype html><html lang="es"><meta charset="utf-8"><body>${String(value.body)}</body></html>`}
          />
        )}
      </form>
      {selected && (
        <section className={`${css.panel} ${css.form}`}>
          <h2>Flujo editorial · versión {selected.article.currentVersion}</h2>
          <p>Estado: {states[selected.article.state]}</p>
          <label>
            Comentario de revisión
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          <label>
            Programar (hora de tu dispositivo)
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          <div className={css.actions}>
            {[
              ['submit', 'Enviar a revisión', 'write'],
              ['changes', 'Solicitar cambios', 'review'],
              ['reject', 'Rechazar', 'review'],
              ['approve', 'Aprobar esta versión', 'approve'],
              ['schedule', 'Programar', 'publish'],
              ['publish', 'Publicar', 'publish'],
              ['unpublish', 'Despublicar', 'publish'],
              ['archive', 'Archivar', 'publish'],
              ['delete', 'Eliminar', 'edit_all'],
            ]
              .filter(([, , p]) => can(p))
              .map(([action, label]) => (
                <button
                  type="button"
                  disabled={pending}
                  key={action}
                  className={action === 'delete' ? css.danger : ''}
                  onClick={() => {
                    if (
                      action === 'delete' &&
                      !confirm('¿Eliminar esta noticia? Se conservará su historial para auditoría.')
                    )
                      return;
                    void run(() =>
                      post('articles', {
                        id: selected.article.id,
                        action,
                        expectedVersion: selected.article.currentVersion,
                        comment,
                        scheduledAt: when ? new Date(when).toISOString() : undefined,
                        confirm: action === 'delete' ? selected.article.id : undefined,
                      }),
                    );
                  }}
                >
                  {label}
                </button>
              ))}
          </div>
          {can('publish') && (
            <label>
              Prioridad en portada (0 = normal)
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={selected.article.featured}
                onBlur={(e) => {
                  const position = Number(e.target.value);
                  if (position !== selected.article.featured)
                    void run(() =>
                      post('articles', { id: selected.article.id, action: 'featured', position }),
                    );
                }}
              />
            </label>
          )}
          <h2>Historial de decisiones</h2>
          {detail?.history.map((h) => (
            <p key={h.id}>
              {new Date(h.createdAt).toLocaleString()} · {h.decision} · {h.actorId} · {h.comment}
            </p>
          ))}
          <h2>Versiones conservadas</h2>
          {detail?.versions.map((v) => (
            <p key={v.id}>
              <button onClick={() => setVersionPreview(v.body)}>Ver versión {v.version}</button> ·{' '}
              {new Date(v.createdAt).toLocaleString()} · {v.changeNote}
            </p>
          ))}
          {versionPreview && (
            <iframe
              title="Versión histórica"
              sandbox=""
              className={css.preview}
              srcDoc={versionPreview}
            />
          )}
        </section>
      )}
    </>
  );
}
function MediaUpload({ onDone }: { onDone: () => void }) {
  const [message, setMessage] = useState('');
  return (
    <form
      className={`${css.panel} ${css.form}`}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setMessage('Subiendo…');
        try {
          const response = await fetch('/api/media', { method: 'POST', body: new FormData(form) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          form.reset();
          setMessage('Imagen guardada.');
          onDone();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Error al subir.');
        }
      }}
    >
      <h2>Subir imagen</h2>
      <label>
        Archivo (PNG, JPEG o WebP, hasta 3 MB)
        <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
      </label>
      <label>
        Título
        <input name="title" required minLength={2} />
      </label>
      <label>
        Texto alternativo
        <input name="alt" required />
      </label>
      <label>
        Descripción
        <textarea name="description" />
      </label>
      <button className="button button-purple">Subir imagen</button>
      <p role="status">{message}</p>
    </form>
  );
}
function Calendar({ data }: { data: Data }) {
  const [mode, setMode] = useState('month');
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()),
  );
  const start = new Date(`${date}T12:00:00-05:00`);
  if (mode === 'month') start.setUTCDate(1);
  if (mode === 'week') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const count =
    mode === 'day'
      ? 1
      : mode === 'week'
        ? 7
        : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const days = Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
  const key = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d);
  return (
    <section className={css.panel}>
      <div className={css.actions}>
        <label>
          Fecha{' '}
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
          />
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          aria-label="Vista del calendario"
        >
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </select>
      </div>
      <p>Agenda en hora de Colombia. Programa noticias desde su ficha después de aprobarlas.</p>
      <div className={css.calendar}>
        {days.map((day) => (
          <section className={css.day} key={key(day)}>
            <strong>
              {day.toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                timeZone: 'America/Bogota',
              })}
            </strong>
            {data.articles
              .filter(
                (a) =>
                  (a.article.scheduledAt || a.article.publishedAt) &&
                  key(new Date(a.article.scheduledAt || a.article.publishedAt!)) === key(day),
              )
              .map((a) => (
                <Link key={a.article.id} href={`/admin/noticias/${a.article.id}`}>
                  {a.revision.title} · {states[a.article.state]}
                </Link>
              ))}
            {data.calendar
              .filter((c) => key(new Date(c.dueAt)) === key(day))
              .map((c) => (
                <p key={c.id}>Encargo: {c.title}</p>
              ))}
          </section>
        ))}
      </div>
    </section>
  );
}
function Distribution({
  data,
  run,
}: {
  data: Data;
  run: (work: () => Promise<unknown>) => Promise<void>;
}) {
  const [articleId, setArticleId] = useState('');
  const [platform, setPlatform] = useState('telegram');
  const [text, setText] = useState('');
  const selected = data.articles.find((a) => a.article.id === articleId);
  return (
    <section className={`${css.panel} ${css.form}`}>
      <p>Preparación editorial. No se envían mensajes ni se conectan cuentas en esta fase.</p>
      <label>
        Noticia publicada
        <select value={articleId} onChange={(e) => setArticleId(e.target.value)}>
          <option value="">Seleccionar</option>
          {data.articles
            .filter((a) => a.article.publishedVersion === a.revision.version)
            .map((a) => (
              <option key={a.article.id} value={a.article.id}>
                {a.revision.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        Plataforma
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {['telegram', 'facebook', 'instagram', 'threads', 'x'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        Texto propuesto
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button
        className="button button-purple"
        disabled={!selected}
        onClick={() =>
          run(() =>
            post('distribution', { articleId, revisionId: selected?.revision.id, platform, text }),
          )
        }
      >
        Guardar variante
      </button>
      {data.distribution.map((d) => (
        <p key={d.id}>
          {d.platform} · {d.state}: {d.text}
        </p>
      ))}
    </section>
  );
}
