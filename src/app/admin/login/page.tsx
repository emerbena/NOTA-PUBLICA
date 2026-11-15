import { Brand } from '@/components/public';
import { LoginForm } from '@/components/login';
export const metadata = { title: 'Acceso editorial', robots: { index: false, follow: false } };
export default function Login() {
  return (
    <main className="login-card">
      <Brand />
      <h1>Acceso editorial</h1>
      <p>Utiliza una cuenta creada por la administración.</p>
      <LoginForm />
    </main>
  );
}
