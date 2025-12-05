import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Nie udało się zalogować');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neu-base p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-orange text-white shadow-lg mb-6 transform transition-transform hover:scale-105">
            <Shield className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Insurak</h1>
          <p className="text-sm text-gray-500 mt-2">Zaloguj się, aby kontynuować</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="admin@insurak.local"
          />

          <Input
            label="Hasło"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 shadow-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

