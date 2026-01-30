import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarSyncAPI } from '../services/api';
import { Calendar, RefreshCw, Trash2, Settings, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CalendarConnection {
  id: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE';
  calendarName?: string;
  syncEnabled: boolean;
  syncDirection: string;
  lastSyncAt?: string;
  lastSyncError?: string;
  createdAt: string;
}

export default function CalendarSyncPage() {
  const queryClient = useQueryClient();
  const [selectedConnection, setSelectedConnection] = useState<CalendarConnection | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['calendar-connections'],
    queryFn: calendarSyncAPI.getConnections
  });

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const { authUrl } = await calendarSyncAPI.getGoogleAuthUrl();
      window.location.href = authUrl;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: calendarSyncAPI.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: calendarSyncAPI.syncNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { syncEnabled?: boolean; syncDirection?: string } }) =>
      calendarSyncAPI.updateSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
      setShowSettings(false);
    },
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GOOGLE':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'OUTLOOK':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.152-.354.228-.583.228h-8.327v-6.2l1.903 1.903a.476.476 0 00.672 0 .476.476 0 000-.673l-2.74-2.74a.476.476 0 00-.673 0l-2.74 2.74a.476.476 0 000 .673.476.476 0 00.672 0l1.903-1.903v6.2H0V7.387l12 5.714 12-5.714zM23.179 5.33H.82L12 10.608 23.179 5.33z"/>
          </svg>
        );
      default:
        return <Calendar className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSyncStatusIcon = (connection: CalendarConnection) => {
    if (connection.lastSyncError) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (connection.lastSyncAt) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Calendar Sync</h1>
        <p className="text-gray-600 mt-1">
          Connect your external calendars to sync appointments automatically
        </p>
      </div>

      {/* Connected Calendars */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Connected Calendars</h2>
        </div>
        <div className="divide-y">
          {connections && connections.length > 0 ? (
            connections.map((connection: CalendarConnection) => (
              <div key={connection.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getProviderIcon(connection.provider)}
                  <div>
                    <p className="font-medium">{connection.calendarName || connection.provider}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {getSyncStatusIcon(connection)}
                      <span>
                        {connection.lastSyncAt
                          ? `Last synced: ${new Date(connection.lastSyncAt).toLocaleString()}`
                          : 'Never synced'}
                      </span>
                    </div>
                    {connection.lastSyncError && (
                      <p className="text-sm text-red-500 mt-1">{connection.lastSyncError}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncNowMutation.mutate(connection.id)}
                    disabled={syncNowMutation.isPending}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Sync now"
                  >
                    <RefreshCw className={`w-5 h-5 ${syncNowMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedConnection(connection);
                      setShowSettings(true);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to disconnect this calendar?')) {
                        disconnectMutation.mutate(connection.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Disconnect"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No calendars connected yet</p>
              <p className="text-sm">Connect a calendar to start syncing appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Calendar */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Connect New Calendar</h2>
        </div>
        <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Google Calendar */}
          <button
            onClick={() => connectGoogleMutation.mutate()}
            disabled={connectGoogleMutation.isPending}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div className="text-left">
              <p className="font-medium text-gray-900 group-hover:text-blue-700">Google Calendar</p>
              <p className="text-sm text-gray-500">Connect your Google account</p>
            </div>
            <ExternalLink className="w-4 h-4 ml-auto text-gray-400 group-hover:text-blue-500" />
          </button>

          {/* Outlook Calendar - Coming Soon */}
          <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed relative">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.152-.354.228-.583.228h-8.327v-6.2l1.903 1.903a.476.476 0 00.672 0 .476.476 0 000-.673l-2.74-2.74a.476.476 0 00-.673 0l-2.74 2.74a.476.476 0 000 .673.476.476 0 00.672 0l1.903-1.903v6.2H0V7.387l12 5.714 12-5.714z"/>
            </svg>
            <div className="text-left">
              <p className="font-medium text-gray-900">Outlook Calendar</p>
              <p className="text-sm text-gray-500">Microsoft 365</p>
            </div>
            <span className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>

          {/* Apple Calendar - Coming Soon */}
          <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed relative">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#555" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/>
            </svg>
            <div className="text-left">
              <p className="font-medium text-gray-900">Apple Calendar</p>
              <p className="text-sm text-gray-500">iCloud Calendar</p>
            </div>
            <span className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Calendar Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedConnection.syncEnabled}
                    onChange={(e) =>
                      setSelectedConnection({
                        ...selectedConnection,
                        syncEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Enable sync</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Direction
                </label>
                <select
                  value={selectedConnection.syncDirection}
                  onChange={(e) =>
                    setSelectedConnection({
                      ...selectedConnection,
                      syncDirection: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="both">Two-way sync</option>
                  <option value="to_external">DentiCloud to External only</option>
                  <option value="from_external">External to DentiCloud only</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateSettingsMutation.mutate({
                    id: selectedConnection.id,
                    data: {
                      syncEnabled: selectedConnection.syncEnabled,
                      syncDirection: selectedConnection.syncDirection,
                    },
                  })
                }
                disabled={updateSettingsMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
