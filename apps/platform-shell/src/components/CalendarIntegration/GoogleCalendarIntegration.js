import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Globe,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { tenantAPI, calendarAPI } from "../../services/api";
import Loader from "../Loader";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "UTC",
];

const GoogleCalendarIntegration = ({ tenantId: propTenantId }) => {
  const [searchParams] = useSearchParams();
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(propTenantId || "");
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Business config edit fields
  const [timezone, setTimezone] = useState("UTC");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [workingHours, setWorkingHours] = useState({
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "17:00" },
    saturday: { start: "10:00", end: "14:00" },
    sunday: { start: "10:00", end: "14:00" },
  });

  useEffect(() => {
    // Check URL parameters for OAuth status feedback
    const urlStatus = searchParams.get("calendar_status");
    const email = searchParams.get("email");
    const errorCode = searchParams.get("error_code") || searchParams.get("error_detail");

    const ERROR_MESSAGES = {
      access_denied: "Google Calendar connection was cancelled or denied.",
      missing_code_or_state: "Authorization request was incomplete. Please try again.",
      missing_params: "Authorization request was incomplete. Please try again.",
      invalid_state: "The authorization session expired. Please try connecting again.",
      token_exchange_failed: "Failed to authenticate with Google. Please check your credentials and try again.",
      no_refresh_token: "Google did not provide offline access. If reconnecting, please revoke access in your Google Account settings first.",
      internal_error: "An unexpected error occurred while connecting Google Calendar. Please try again.",
    };

    if (urlStatus === "connected") {
      setSuccess(`Google Calendar connected successfully${email ? ` as ${email}` : ""}!`);
    } else if (urlStatus === "error") {
      const friendlyMessage =
        ERROR_MESSAGES[errorCode] ||
        "Unable to connect Google Calendar. Please check your settings and try again.";
      setError(friendlyMessage);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!propTenantId) {
      loadTenants();
    } else {
      setSelectedTenant(propTenantId);
    }
  }, [propTenantId]);

  useEffect(() => {
    if (selectedTenant) {
      loadTenantData(selectedTenant);
    }
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      const resp = await tenantAPI.listTenants();
      const list = Array.isArray(resp.data) ? resp.data : [];
      setTenants(list);
      if (list.length > 0 && !selectedTenant) {
        setSelectedTenant(list[0].id);
      }
    } catch (err) {
      console.error("Error loading tenants:", err);
    }
  };

  const loadTenantData = async (tId) => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, bizRes] = await Promise.allSettled([
        calendarAPI.getStatus(tId),
        tenantAPI.getBusinessInfo(tId),
      ]);

      if (statusRes.status === "fulfilled" && statusRes.value.data) {
        setCalendarStatus(statusRes.value.data);
        if (statusRes.value.data.timezone) {
          setTimezone(statusRes.value.data.timezone);
        }
      } else {
        setCalendarStatus(null);
      }

      if (bizRes.status === "fulfilled" && bizRes.value.data) {
        const bData = bizRes.value.data;
        setBusinessInfo(bData);
        if (bData.timezone) setTimezone(bData.timezone);
        if (bData.appointment_duration_minutes) setDurationMinutes(bData.appointment_duration_minutes);
        if (bData.working_hours) setWorkingHours(bData.working_hours);
      }
    } catch (err) {
      console.error("Error loading calendar/business config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    setError("");
    try {
      const resp = await calendarAPI.getConnectUrl(selectedTenant);
      const authUrl = resp.data?.auth_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setError("Failed to retrieve Google authorization URL.");
      }
    } catch (err) {
      console.error("Error getting connect URL:", err);
      setError(err.response?.data?.detail || "Failed to start Google Calendar authorization.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedTenant) return;
    if (!window.confirm("Are you sure you want to disconnect Google Calendar? The voice agent will fall back to internal availability slots.")) {
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await calendarAPI.disconnect(selectedTenant);
      setSuccess("Google Calendar disconnected successfully.");
      await loadTenantData(selectedTenant);
    } catch (err) {
      console.error("Error disconnecting calendar:", err);
      setError(err.response?.data?.detail || "Failed to disconnect Google Calendar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...(businessInfo || {}),
        timezone,
        appointment_duration_minutes: parseInt(durationMinutes, 10),
        working_hours: workingHours,
      };
      await tenantAPI.updateBusinessInfo(selectedTenant, payload);
      setSuccess("Scheduling settings saved successfully.");
      await loadTenantData(selectedTenant);
    } catch (err) {
      console.error("Error saving scheduling settings:", err);
      setError(err.response?.data?.detail || "Failed to save settings.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWorkingHourChange = (day, field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { start: "09:00", end: "17:00" }),
        [field]: value,
      },
    }));
  };

  const isConnected = calendarStatus?.connected;
  const isNeedsReauth = calendarStatus?.status === "needs_reauth";

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
          <XCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Tenant Selector if not embedded */}
      {!propTenantId && tenants.length > 1 && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Select Customer / Tenant:
          </label>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <Loader message="Loading Google Calendar status..." />
      ) : (
        <>
          {/* Reauth Banner */}
          {isNeedsReauth && (
            <div className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-50 p-5 text-amber-900 shadow-sm">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-950">
                  Google Calendar Re-Authorization Required
                </p>
                <p className="text-amber-800">
                  Your Google Calendar connection needs to be reconnected. The authorization grant has expired or was revoked. Click Reconnect below to re-authorize ShipStack Voice.
                </p>
              </div>
            </div>
          )}

          {/* Connection Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  <Calendar className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Google Calendar Sync</h3>
                  <p className="text-xs text-slate-500">
                    Sync appointment bookings, reschedule updates, and block out busy times.
                  </p>
                </div>
              </div>

              {/* Status Chip */}
              <div>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Connected as {calendarStatus?.account_email || "Google User"}
                  </span>
                ) : isNeedsReauth ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Needs Reauthorization
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-600">
                    <XCircle className="h-3.5 w-3.5 text-slate-400" />
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            {/* Connection Details or Action */}
            <div className="mt-5 space-y-4">
              {isConnected ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl bg-slate-50/60 p-4 border border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Account
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {calendarStatus?.account_email || "primary"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Calendar ID
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {calendarStatus?.calendar_id || "primary"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Last Synced
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {calendarStatus?.last_sync_at
                        ? new Date(calendarStatus.last_sync_at).toLocaleString()
                        : "Ready to sync"}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isNeedsReauth ? "Reconnect Google Calendar" : "Connect Google Calendar"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      <RefreshCw className="h-4 w-4 text-slate-500" />
                      Reconnect / Re-authenticate
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100/50 disabled:opacity-50 transition"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Business & Scheduling Settings Form */}
          <form onSubmit={handleSaveConfig} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">Scheduling & Availability Configuration</h3>
              <p className="text-xs text-slate-500">
                Configure timezone, appointment duration, and working hours used for slot calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-400" />
                    Tenant Timezone
                  </span>
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  Google Calendar free/busy availability and voice prompts are evaluated in this timezone.
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Appointment Duration (Minutes)
                  </span>
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Length of each booked slot (default: 60 minutes).
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Working Hours
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {Object.keys(workingHours).map((day) => (
                  <div key={day} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3 space-y-2">
                    <span className="block text-xs font-bold capitalize text-slate-700">
                      {day}
                    </span>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Start</span>
                      <input
                        type="time"
                        value={workingHours[day]?.start || "09:00"}
                        onChange={(e) => handleWorkingHourChange(day, "start", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">End</span>
                      <input
                        type="time"
                        value={workingHours[day]?.end || "17:00"}
                        onChange={(e) => handleWorkingHourChange(day, "end", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {actionLoading ? "Saving..." : "Save Scheduling Settings"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration;
