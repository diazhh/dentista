import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageSquare, RefreshCw, Send, Check, WifiOff, Wifi } from 'lucide-react';
import { whatsappAPI } from '../services/api';

export default function WhatsappSettingsPage() {
    const [testNumber, setTestNumber] = useState('');
    const [testMessage, setTestMessage] = useState('Hola! Este es un mensaje de prueba desde MediCloud.');

    const { data: statusData, refetch, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['whatsappStatus'],
        queryFn: whatsappAPI.getStatus,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            // Poll faster when waiting for QR or initializing
            if (status === 'QR_READY' || status === 'INITIALIZING') return 3000;
            if (status === 'DISCONNECTED') return 10000;
            return 5000;
        },
    });

    const connectMutation = useMutation({
        mutationFn: whatsappAPI.connect,
        onSuccess: () => {
            refetch();
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: (data: { to: string; message: string }) =>
            whatsappAPI.sendMessage(data.to, data.message),
        onSuccess: () => {
            alert('Mensaje enviado correctamente');
        },
        onError: (error: any) => {
            alert(`Error al enviar: ${error.message}`);
        }
    });

    const handleSendTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testNumber) return;
        sendMessageMutation.mutate({ to: testNumber, message: testMessage });
    };

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Integración de WhatsApp</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                        Conecta tu cuenta de WhatsApp para enviar recordatorios automáticos.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                    <span className="whitespace-nowrap">Actualizar Estado</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Card de Estado / QR */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                        Estado de Conexión
                    </h2>

                    <div className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-[250px] sm:min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        {isLoadingStatus ? (
                            <div className="text-center">
                                <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400 mb-2 mx-auto" />
                                <p className="text-sm sm:text-base text-gray-500">Comprobando estado...</p>
                            </div>
                        ) : statusData?.status === 'CONNECTED' ? (
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">Conectado</h3>
                                    <p className="text-sm sm:text-base text-gray-500 max-w-xs mx-auto mt-2">
                                        Tu cuenta de WhatsApp está vinculada y lista para enviar mensajes.
                                    </p>
                                </div>
                            </div>
                        ) : statusData?.qrCode ? (
                            <div className="text-center">
                                <p className="mb-4 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                                    Escanea este código QR con WhatsApp en tu teléfono:
                                </p>
                                <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm inline-block">
                                    <img src={statusData.qrCode} alt="WhatsApp QR Code" className="w-48 h-48 sm:w-64 sm:h-64" />
                                </div>
                                <p className="mt-4 text-xs sm:text-sm text-gray-500">
                                    El código se actualiza automáticamente
                                </p>
                            </div>
                        ) : statusData?.status === 'DISCONNECTED' ? (
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-red-500 dark:text-red-400">Desconectado</h3>
                                    <p className="text-sm sm:text-base text-gray-500 max-w-xs mx-auto mt-2">
                                        WhatsApp no está conectado. Presiona el botón para iniciar la conexión y obtener un código QR.
                                    </p>
                                </div>
                                <button
                                    onClick={() => connectMutation.mutate()}
                                    disabled={connectMutation.isPending}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
                                >
                                    {connectMutation.isPending ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Conectando...</>
                                    ) : (
                                        <><Wifi className="w-4 h-4" /> Conectar WhatsApp</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400 mb-2 mx-auto" />
                                <p className="text-sm sm:text-base text-gray-500">Inicializando conexión...</p>
                                <p className="text-xs text-gray-400">El código QR aparecerá en un momento</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card de Prueba */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                        Probar Mensajería
                    </h2>

                    <form onSubmit={handleSendTest} className="space-y-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Número de Teléfono
                            </label>
                            <input
                                type="text"
                                value={testNumber}
                                onChange={(e) => setTestNumber(e.target.value)}
                                placeholder="Ej: 573101234567"
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                disabled={statusData?.status !== 'CONNECTED'}
                            />
                            <p className="text-xs text-gray-500 mt-1">Incluye el código de país (Ej: 57 para Colombia)</p>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mensaje
                            </label>
                            <textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                rows={4}
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                disabled={statusData?.status !== 'CONNECTED'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={statusData?.status !== 'CONNECTED' || sendMessageMutation.isPending || !testNumber}
                            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                        >
                            {sendMessageMutation.isPending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar Mensaje de Prueba
                                </>
                            )}
                        </button>

                        {statusData?.status !== 'CONNECTED' && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs sm:text-sm">
                                Debes conectar WhatsApp antes de enviar mensajes.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
