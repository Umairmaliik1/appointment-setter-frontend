import React from 'react';
import GoogleCalendarIntegration from '../../../components/CalendarIntegration/GoogleCalendarIntegration';

const CalendarIntegrationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Google Calendar & Availability</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your Google Calendar to sync appointment bookings and prevent double bookings in real-time.
        </p>
      </div>
      <GoogleCalendarIntegration />
    </div>
  );
};

export default CalendarIntegrationPage;
