import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotConfigAPI } from '../services/api';
import {
  Bot,
  MessageSquare,
  Clock,
  DollarSign,
  Settings,
  Save,
  TestTube,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

interface OperatingHours {
  [day: string]: { open: string; close: string } | null;
}

interface PricingItem {
  service: string;
  price: number;
  description?: string;
}

interface ChatbotConfig {
  id: string;
  isEnabled: boolean;
  welcomeMessage: string | null;
  fallbackMessage: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  clinicWebsite: string | null;
  operatingHours: OperatingHours | null;
  pricingInfo: PricingItem[] | null;
  aiModel: string;
  aiTemperature: number;
  maxTokens: number;
  systemPrompt: string | null;
  allowScheduling: boolean;
  allowCancellation: boolean;
  allowRescheduling: boolean;
  requireIdentification: boolean;
  humanHandoffKeywords: string[];
  maxMessagesPerHour: number;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function ChatbotConfigPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'messages' | 'hours' | 'pricing' | 'ai'>('general');
  const [formData, setFormData] = useState<Partial<ChatbotConfig>>({});
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['chatbot-config'],
    queryFn: chatbotConfigAPI.getConfig,
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: chatbotConfigAPI.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: chatbotConfigAPI.testChatbot,
    onSuccess: (data) => {
      setTestResult(data);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const updateOperatingHours = (day: string, field: 'open' | 'close', value: string) => {
    const hours = { ...(formData.operatingHours || {}) };
    if (!hours[day]) {
      hours[day] = { open: '09:00', close: '18:00' };
    }
    hours[day] = { ...hours[day]!, [field]: value };
    setFormData({ ...formData, operatingHours: hours });
  };

  const toggleDayEnabled = (day: string) => {
    const hours = { ...(formData.operatingHours || {}) };
    if (hours[day]) {
      hours[day] = null;
    } else {
      hours[day] = { open: '09:00', close: '18:00' };
    }
    setFormData({ ...formData, operatingHours: hours });
  };

  const addPricingItem = () => {
    const pricing = [...(formData.pricingInfo || [])];
    pricing.push({ service: '', price: 0 });
    setFormData({ ...formData, pricingInfo: pricing });
  };

  const updatePricingItem = (index: number, field: keyof PricingItem, value: string | number) => {
    const pricing = [...(formData.pricingInfo || [])];
    pricing[index] = { ...pricing[index], [field]: value };
    setFormData({ ...formData, pricingInfo: pricing });
  };

  const removePricingItem = (index: number) => {
    const pricing = (formData.pricingInfo || []).filter((_, i) => i !== index);
    setFormData({ ...formData, pricingInfo: pricing });
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Chatbot Configuration</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Configure your WhatsApp chatbot settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 sm:mb-6 p-4 sm:p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <div>
              <p className="text-sm sm:text-base font-medium">Enable Chatbot</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Automatically respond to WhatsApp messages</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.isEnabled || false}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
        </label>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'hours', label: 'Hours', icon: Clock },
              { id: 'pricing', label: 'Pricing', icon: DollarSign },
              { id: 'ai', label: 'AI Settings', icon: Bot },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clinic Name</label>
                <input
                  type="text"
                  value={formData.clinicName || ''}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  placeholder="Your Dental Clinic"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                <textarea
                  value={formData.clinicAddress || ''}
                  onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="text"
                    value={formData.clinicPhone || ''}
                    onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.clinicWebsite || ''}
                    onChange={(e) => setFormData({ ...formData, clinicWebsite: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                <h3 className="text-sm sm:text-base font-medium mb-4">Features</h3>
                <div className="space-y-3">
                  {[
                    { key: 'allowScheduling', label: 'Allow appointment scheduling' },
                    { key: 'allowCancellation', label: 'Allow appointment cancellation' },
                    { key: 'allowRescheduling', label: 'Allow appointment rescheduling' },
                    { key: 'requireIdentification', label: 'Require patient identification' },
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={(formData as any)[feature.key] || false}
                        onChange={(e) =>
                          setFormData({ ...formData, [feature.key]: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm sm:text-base">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Welcome Message</label>
                <textarea
                  value={formData.welcomeMessage || ''}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  placeholder="Hello! Welcome to our dental clinic..."
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  This message is sent when a new conversation starts
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fallback Message</label>
                <textarea
                  value={formData.fallbackMessage || ''}
                  onChange={(e) => setFormData({ ...formData, fallbackMessage: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  placeholder="Sorry, I didn't understand. Please try again..."
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Sent when the chatbot can't understand a message
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Human Handoff Keywords
                </label>
                <input
                  type="text"
                  value={(formData.humanHandoffKeywords || []).join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      humanHandoffKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  placeholder="human, agent, person, help"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Comma-separated keywords that trigger human handoff
                </p>
              </div>
            </div>
          )}

          {/* Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 sm:mb-6">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Operating Hours</p>
                  <p>These hours will be shared with patients when they ask about your schedule</p>
                </div>
              </div>

              {DAYS.map((day) => {
                const hours = formData.operatingHours?.[day.key];
                const isEnabled = hours !== null && hours !== undefined;

                return (
                  <div
                    key={day.key}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <label className="flex items-center gap-3 sm:w-32">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleDayEnabled(day.key)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm sm:text-base font-medium">{day.label}</span>
                    </label>
                    {isEnabled ? (
                      <div className="flex items-center gap-2 flex-1 ml-7 sm:ml-0">
                        <input
                          type="time"
                          value={hours?.open || '09:00'}
                          onChange={(e) => updateOperatingHours(day.key, 'open', e.target.value)}
                          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 sm:px-3 py-1 text-sm sm:text-base"
                        />
                        <span className="text-gray-500 text-sm">to</span>
                        <input
                          type="time"
                          value={hours?.close || '18:00'}
                          onChange={(e) => updateOperatingHours(day.key, 'close', e.target.value)}
                          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 sm:px-3 py-1 text-sm sm:text-base"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic ml-7 sm:ml-0">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 sm:mb-6">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Pricing Information</p>
                  <p>Add reference prices for common services. These will be shared when patients ask about costs.</p>
                </div>
              </div>

              {(formData.pricingInfo || []).map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <input
                    type="text"
                    value={item.service}
                    onChange={(e) => updatePricingItem(index, 'service', e.target.value)}
                    placeholder="Service name"
                    className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center flex-1 sm:flex-initial">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updatePricingItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full sm:w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-3 py-2 text-sm sm:text-base"
                      />
                    </div>
                    <button
                      onClick={() => removePricingItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addPricingItem}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>
          )}

          {/* AI Settings Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Model</label>
                  <select
                    value={formData.aiModel || 'gpt-3.5-turbo'}
                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                    <option value="gpt-4">GPT-4 (More Capable)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tokens: {formData.maxTokens || 300}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={formData.maxTokens || 300}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {formData.aiTemperature || 0.7}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.aiTemperature || 0.7}
                  onChange={(e) => setFormData({ ...formData, aiTemperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>More Focused</span>
                  <span>More Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rate Limit: {formData.maxMessagesPerHour || 100} messages/hour
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={formData.maxMessagesPerHour || 100}
                  onChange={(e) => setFormData({ ...formData, maxMessagesPerHour: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom System Prompt (Advanced)
                </label>
                <textarea
                  value={formData.systemPrompt || ''}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 font-mono text-xs sm:text-sm"
                  placeholder="Leave empty to use the default prompt..."
                />
              </div>

              {/* Test Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                <h3 className="text-sm sm:text-base font-medium mb-4 flex items-center gap-2">
                  <TestTube className="w-4 h-4 sm:w-5 sm:h-5" />
                  Test Chatbot
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type a test message..."
                    className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base"
                  />
                  <button
                    onClick={() => testMutation.mutate(testMessage)}
                    disabled={testMutation.isPending || !testMessage}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    {testMutation.isPending ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {testResult && (
                  <div className="mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">System Prompt Preview:</p>
                    <pre className="text-xs bg-white dark:bg-gray-800 p-2 sm:p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-48">
                      {testResult.systemPrompt}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
