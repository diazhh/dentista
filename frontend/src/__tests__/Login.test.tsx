import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render email and password fields', () => {
    renderLogin();

    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
  });

  it('should render submit button with correct text', () => {
    renderLogin();

    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('should render OAuth buttons (Google, Apple, Microsoft)', () => {
    renderLogin();

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('should render forgot password link', () => {
    renderLogin();

    expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
  });

  it('should update email and password fields on input', async () => {
    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'mypassword');

    expect(emailInput).toHaveValue('test@test.com');
    expect(passwordInput).toHaveValue('mypassword');
  });

  it('should call login function on form submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    localStorage.setItem('medicloud_user', JSON.stringify({ role: 'PROVIDER' }));
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Correo electrónico'), 'dentist@test.com');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('dentist@test.com', 'Password123!');
    });
  });

  it('should show error message on failed login', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Correo electrónico'), 'bad@test.com');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should show loading state while logging in', async () => {
    // Make login hang so we can see the loading state
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Correo electrónico'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
    });
  });

  it('should navigate to SUPER_ADMIN dashboard for super admin users', async () => {
    mockLogin.mockResolvedValue(undefined);
    localStorage.setItem('medicloud_user', JSON.stringify({ role: 'SUPER_ADMIN' }));
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Correo electrónico'), 'admin@medicloud.com');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'Admin123!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/superadmin', { replace: true });
    });
  });
});
