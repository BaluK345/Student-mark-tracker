import { useState, useEffect } from "react";
import api from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

interface UiPathConfig {
  orchestrator_url: string;
  pat_token: string;
  folder_id: string;
  process_name: string;
  enabled: boolean;
  connected: boolean;
}

interface EmailRequest {
  recipient_email: string;
  subject: string;
  body: string;
  body_type: string;
  student_name?: string;
  roll_number?: string;
}

interface JobResponse {
  success: boolean;
  job_id?: string;
  robot_id?: string;
  message: string;
}

export default function UiPathConfigPage() {
  const [config, setConfig] = useState<UiPathConfig | null>(null);
  const [formData, setFormData] = useState({
    orchestrator_url: "",
    pat_token: "",
    folder_id: "",
    process_name: "",
    enabled: false,
  });
  const [testEmail, setTestEmail] = useState({
    recipient_email: "",
    subject: "UiPath Email Test",
    body: "This is a test email from Student Mark Tracker RPA System",
    student_name: "",
    roll_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch current UiPath configuration
  useEffect(() => {
    console.log("Fetching UiPath configuration...");
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get<UiPathConfig>("/settings/uipath");
        setConfig(response.data);
        setFormData({
          orchestrator_url: response.data.orchestrator_url,
          pat_token: "", // Not returned for security
          folder_id: response.data.folder_id,
          process_name: response.data.process_name,
          enabled: response.data.enabled,
        });
      } catch (error: any) {
        console.error("Error fetching UiPath config:", error);
        setMessage({
          type: "error",
          text: error.response?.data?.detail || "Failed to load UiPath configuration",
        });
        // Set a default config so component still renders
        setConfig({
          orchestrator_url: "",
          pat_token: "",
          folder_id: "",
          process_name: "",
          enabled: false,
          connected: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleTestEmailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTestEmail({
      ...testEmail,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await api.post<UiPathConfig>("/settings/uipath", formData);
      setConfig(response.data);
      setMessage({
        type: "success",
        text: "UiPath configuration updated successfully!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Failed to update UiPath configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail.recipient_email) {
      setMessage({
        type: "error",
        text: "Please enter a test email address",
      });
      return;
    }

    try {
      setTesting(true);
      setMessage({ type: "", text: "" });

      const response = await api.post<JobResponse>(
        "/settings/uipath/test",
        {
          recipient_email: testEmail.recipient_email,
          subject: testEmail.subject,
          body: testEmail.body,
          body_type: "plain",
          student_name: testEmail.student_name || undefined,
          roll_number: testEmail.roll_number || undefined,
        }
      );

      setMessage({
        type: response.data.success ? "success" : "error",
        text: response.data.message,
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Failed to test UiPath connection",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading UiPath configuration..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            UiPath Email Automation
          </h1>
          <p className="text-slate-600">
            Configure UiPath Orchestrator for automated email sending via RPA robots
          </p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Configuration Status */}
        {config && (
          <div className="mb-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-blue-800">
              <span className="font-semibold">Status:</span>{" "}
              {config.enabled ? (
                <span className="text-green-600">✓ Automation Enabled</span>
              ) : (
                <span className="text-yellow-600">⚠ Automation Disabled</span>
              )}
            </p>
          </div>
        )}

        {/* Main Configuration Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            UiPath Orchestrator Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orchestrator URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Orchestrator URL *
              </label>
              <input
                type="text"
                name="orchestrator_url"
                value={formData.orchestrator_url}
                onChange={handleInputChange}
                placeholder="https://cloud.uipath.com/"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Your UiPath Orchestrator URL
              </p>
            </div>

            {/* PAT Token */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Personal Access Token (PAT) *
              </label>
              <input
                type="password"
                name="pat_token"
                value={formData.pat_token}
                onChange={handleInputChange}
                placeholder="rt_8D1335AF68581380726044159C1AFDB7A2B0C141CB53C017E86AF43738D98823-1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Generate from UiPath Settings → Add credentials
              </p>
            </div>

            {/* Folder ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Folder ID *
              </label>
              <input
                type="text"
                name="folder_id"
                value={formData.folder_id}
                onChange={handleInputChange}
                placeholder="7659670"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                UiPath Folder ID (found in Orchestrator)
              </p>
            </div>

            {/* Process Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Process Name *
              </label>
              <input
                type="text"
                name="process_name"
                value={formData.process_name}
                onChange={handleInputChange}
                placeholder="rpa project"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                UiPath process name to trigger for emails
              </p>
            </div>

            {/* Enable Toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Enable UiPath Email Automation
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Enable to use UiPath for sending automated emails
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>

        {/* Test Email Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Test UiPath Email
          </h2>
          <p className="text-slate-600 mb-6">
            Send a test email through UiPath to verify your configuration is working correctly.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recipient Email *
              </label>
              <input
                type="email"
                name="recipient_email"
                value={testEmail.recipient_email}
                onChange={handleTestEmailChange}
                placeholder="test@example.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={testEmail.subject}
                onChange={handleTestEmailChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Body
              </label>
              <textarea
                name="body"
                value={testEmail.body}
                onChange={handleTestEmailChange}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={testEmail.student_name}
                  onChange={handleTestEmailChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Roll Number (Optional)
                </label>
                <input
                  type="text"
                  name="roll_number"
                  value={testEmail.roll_number}
                  onChange={handleTestEmailChange}
                  placeholder="12345"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testing || !testEmail.recipient_email || !config?.enabled}
              className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? "Sending..." : "Send Test Email via UiPath"}
            </button>
          </div>

          {/* Documentation */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-3">
              ℹ️ How to Set Up UiPath Automation:
            </h3>
            <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
              <li>Create a UiPath Process with an Email activity</li>
              <li>
                Define input parameters: RecipientEmail, Subject, Body, StudentName, RollNumber
              </li>
              <li>Get your Folder ID from UiPath Cloud Orchestrator</li>
              <li>Generate a Personal Access Token (PAT) from UiPath Settings</li>
              <li>Deploy the process to your UiPath Orchestrator</li>
              <li>Enter your Orchestrator URL, PAT token, Folder ID, and Process Name above</li>
              <li>Test the connection by sending a test email</li>
              <li>Enable UiPath automation once verified</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
