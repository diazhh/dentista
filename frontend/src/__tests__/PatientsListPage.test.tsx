import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import PatientsListPage from '../pages/PatientsListPage';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <BrowserRouter>
      <PatientsListPage />
    </BrowserRouter>,
  );
}

const mockPatientsList = [
  {
    id: 'p-001',
    documentId: '001-1234567-8',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+18095551234',
    dateOfBirth: '1990-03-15T00:00:00.000Z',
    gender: 'FEMALE',
    user: { email: 'jane@test.com' },
  },
  {
    id: 'p-002',
    documentId: '002-7654321-0',
    firstName: 'John',
    lastName: 'Smith',
    phone: '+18095555678',
    dateOfBirth: '1985-07-22T00:00:00.000Z',
    gender: 'MALE',
    user: { email: 'john@test.com' },
  },
];

describe('PatientsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  it('should render page title "Pacientes"', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();

    expect(screen.getByText('Pacientes')).toBeInTheDocument();
  });

  it('should show loading spinner initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
    renderPage();

    // Loading spinner is a div with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render patient list after API response', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockPatientsList });
    renderPage();

    await waitFor(() => {
      // Names may be split across elements (firstName + lastName), use getAllByText with regex
      expect(screen.getAllByText(/Jane/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/John/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show empty state when no patients found', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No se encontraron pacientes')).toBeInTheDocument();
    });
  });

  it('should render "Nuevo Paciente" button', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();

    expect(screen.getByText('Nuevo Paciente')).toBeInTheDocument();
  });

  it('should render search input', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();

    expect(
      screen.getByPlaceholderText('Buscar por cédula, nombre, teléfono...'),
    ).toBeInTheDocument();
  });

  it('should render export and import buttons', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();

    await waitFor(() => {
      // Multiple CSV-related elements exist (Export CSV button + file input label)
      expect(screen.getAllByText(/CSV/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show patient count', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockPatientsList });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Mostrando 2 de 2 pacientes/)).toBeInTheDocument();
    });
  });

  it('should call API with authorization header', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/patients',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-token' },
        }),
      );
    });
  });
});
