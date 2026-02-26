import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { storage } from '../utils/storage';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      storage.setItem('accessToken', token);
      storage.setItem('refreshToken', refreshToken);

      // Fetch user info and redirect
      api.get('/users/me')
        .then((response) => {
          storage.setItem('user', JSON.stringify(response.data));
          navigate('/admin');
        })
        .catch(() => {
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl">Processing authentication...</div>
    </div>
  );
}
