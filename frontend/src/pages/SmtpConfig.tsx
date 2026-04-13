import { useState, useEffect } from "react";
import api from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from: string;
  smtp_from_name: string;
  configured: boolean;
}

interface TestEmailResponse {
  success: boolean;
  message: string;
}

export default function SmtpConfigPage() {
  const [config, setConfig] = useState<SmtpConfig | null>(null);
  const [formData, setFormData] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    smtp_from: "",
    smtp_from_name: "Student Mark Tracker",
  });
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  console.log("SmtpConfigPage component mounted");

  // Fetch current SMTP configuration
  useEffect(() => {
    console.log("Fetching SMTP configuration...");
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get<SmtpConfig>("/settings/smtp");
        setConfig(response.data);
        setFormData({
          smtp_host: response.data.smtp_host,
          smtp_port: response.data.smtp_port,
          smtp_user: response.data.smtp_user,
          smtp_password: "", // Password is not returned for security
          smtp_from: response.data.smtp_from,
          smtp_from_name: response.data.smtp_from_name,
        });
      } catch (error: any) {
        console.error("Error fetching SMTP config:", error);
        setMessage({
          type: "error",
          text: error.response?.data?.detail || "Failed to load SMTP configuration. Make sure you are logged in as a teacher.",
        });
        // Set a default config so component still renders
        setConfig({
          smtp_host: "",
          smtp_port: 587,
          smtp_user: "",
          smtp_from: "",
          smtp_from_name: "Student Mark Tracker",
          configured: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "smtp_port" ? parseInt(value) || 587 : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await api.post<SmtpConfig>(
        "/settings/smtp",
        formData
      );
      setConfig(response.data);
      setMessage({
        type: "success",
        text: "SMTP configuration updated successfully!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Failed to update SMTP configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      setMessage({
        type: "error",
        text: "Please enter a test email address",
      });
      return;
    }

    try {
      setTesting(true);
      setMessage({ type: "", text: "" });

      const response = await api.post<TestEmailResponse>(
        "/settings/smtp/test",
        { recipient_email: testEmail }
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
          "Failed to test SMTP connection",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading SMTP configuration..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            SMTP Configuration
          </h1>
          <p className="text-slate-600">
            Configure email settings for automated notifications in the RPA system
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
              {config.configured ? (
                <span className="text-green-600">✓ Configured and Active</span>
              ) : (
                <span className="text-yellow-600">⚠ Not Configured</span>
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
            SMTP Server Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMTP Host */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SMTP Host *
              </label>
              <input
                type="text"
                name="smtp_host"
                value={formData.smtp_host}
                onChange={handleInputChange}
                placeholder="e.g., smtp.gmail.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                The SMTP server address
              </p>
            </div>

            {/* SMTP Port */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SMTP Port *
              </label>
              <input
                type="number"
                name="smtp_port"
                value={formData.smtp_port}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Common ports: Gmail (587), Other (465 or 587)
              </p>
            </div>

            {/* SMTP User */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SMTP Username/Email *
              </label>
              <input
                type="email"
                name="smtp_user"
                value={formData.smtp_user}
                onChange={handleInputChange}
                placeholder="your-email@gmail.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Your SMTP authentication username
              </p>
            </div>

            {/* SMTP Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SMTP Password *
              </label>
              <input
                type="password"
                name="smtp_password"
                value={formData.smtp_password}
                onChange={handleInputChange}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required={!config?.configured}
              />
              <p className="text-xs text-slate-500 mt-1">
                For Gmail use 16-char app password
              </p>
            </div>

            {/* SMTP From Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Email Address *
              </label>
              <input
                type="email"
                name="smtp_from"
                value={formData.smtp_from}
                onChange={handleInputChange}
                placeholder="noreply@school.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Email address shown in sent emails
              </p>
            </div>

            {/* SMTP From Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Display Name
              </label>
              <input
                type="text"
                name="smtp_from_name"
                value={formData.smtp_from_name}
                onChange={handleInputChange}
                placeholder="Student Mark Tracker"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Display name for the sender
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>

        {/* Test Email Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Test SMTP Connection
          </h2>
          <p className="text-slate-600 mb-4">
            Send a test email to verify your SMTP configuration is working
            correctly.
          </p>

          <div className="flex gap-4">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter test email address"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
            <button
              onClick={handleTestConnection}
              disabled={testing || !testEmail}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? "Testing..." : "Send Test Email"}
            </button>
          </div>

          {/* Documentation */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">
              ℹ️ How to get Gmail App Password:
            </h3>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
              <li>Enable 2-Step Verification in your Google Account</li>
              <li>Go to myaccount.google.com/app-passwords</li>
              <li>Select "Mail" and "Windows Computer" (or your device)</li>
              <li>
                Copy the 16-character password and paste it above
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
