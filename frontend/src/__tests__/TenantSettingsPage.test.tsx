import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TenantSettingsPage from '../pages/TenantSettingsPage';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-001',
      name: 'Dr. Smith',
      email: 'dentist@dentista.com',
      role: 'PROVIDER',
    },
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock API service
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();

vi.mock('../services/api', () => ({
  userProfileAPI: {
    updateProfile: (...args: any[]) => mockUpdateProfile(...args),
    changePassword: (...args: any[]) => mockChangePassword(...args),
  },
}));

function renderPage() {
  return render(
    <BrowserRouter>
      <TenantSettingsPage />
    </BrowserRouter>,
  );
}

describe('TenantSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the settings page title', () => {
    renderPage();

    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('should render profile tab with user information', () => {
    renderPage();

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('dentist@dentista.com')).toBeInTheDocument();
    expect(screen.getByText('Información Personal')).toBeInTheDocument();
  });

  it('should render profile form with pre-filled values', () => {
    renderPage();

    const nameInput = screen.getByDisplayValue('Dr. Smith');
    const emailInput = screen.getByDisplayValue('dentist@dentista.com');

    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
  });

  it('should render both Perfil and Seguridad tabs', () => {
    renderPage();

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
  });

  it('should call updateProfile API on form submit', async () => {
    mockUpdateProfile.mockResolvedValue({});
    renderPage();
    const user = userEvent.setup();

    // Update the name
    const nameInput = screen.getByDisplayValue('Dr. Smith');
    await user.clear(nameInput);
    await user.type(nameInput, 'Dr. John Smith');

    // Submit
    await user.click(screen.getByText('Guardar Cambios'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Dr. John Smith',
          email: 'dentist@dentista.com',
        }),
      );
    });
  });

  it('should show success message after profile update', async () => {
    mockUpdateProfile.mockResolvedValue({});
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByText('Guardar Cambios'));

    await waitFor(() => {
      expect(screen.getByText('Perfil actualizado exitosamente')).toBeInTheDocument();
    });
  });

  it('should show error message on failed profile update', async () => {
    mockUpdateProfile.mockRejectedValue({
      response: { data: { message: 'Email already taken' } },
    });
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByText('Guardar Cambios'));

    await waitFor(() => {
      expect(screen.getByText('Email already taken')).toBeInTheDocument();
    });
  });

  it('should switch to Security tab and show password change option', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByText('Seguridad'));

    // "Cambiar Contraseña" appears both as heading and button
    expect(screen.getAllByText('Cambiar Contraseña').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Actualiza tu contraseña regularmente/)).toBeInTheDocument();
  });

  it('should show password form when clicking change password button', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByText('Seguridad'));
    // Click the button (not the h3 heading)
    const changeBtn = screen.getByRole('button', { name: 'Cambiar Contraseña' });
    await user.click(changeBtn);

    await waitFor(() => {
      expect(screen.getByText('Contraseña Actual')).toBeInTheDocument();
      expect(screen.getByText('Nueva Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Confirmar Nueva Contraseña')).toBeInTheDocument();
    });
  });
});
