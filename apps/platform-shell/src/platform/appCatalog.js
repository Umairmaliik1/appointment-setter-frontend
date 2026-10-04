import {
  Building2,
  Bot,
  Calendar,
  CalendarRange,
  CircleEllipsis,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Mic2,
  RadioTower,
  Send,
  Settings2,
  ShieldOff,
  Users,
} from 'lucide-react';
import { getAppName } from '../utils/appName';

export const PLATFORM_APPS = [
  {
    id: 'appointment_setter',
    slug: 'appointment-setter',
    label: getAppName(),
    iconKey: 'appointment_setter',
    defaultRoute: '/app/appointment-setter/dashboard',
    accent: 'from-amber-400/30 via-amber-300/10 to-transparent',
  },
  {
    id: 'sms',
    slug: 'sms',
    label: 'SMS & Reminders',
    iconKey: 'sms',
    defaultRoute: '/app/sms/dashboard',
    accent: 'from-green-400/30 via-green-300/10 to-transparent',
  },
  {
    id: 'users',
    slug: 'users',
    label: 'Users',
    iconKey: 'users',
    defaultRoute: '/app/users',
    accent: 'from-emerald-400/30 via-emerald-300/10 to-transparent',
  },
];

export const APP_ICON_MAP = {
  appointment_setter: CalendarRange,
  chatbot_agents: Bot,
  sms: MessageSquare,
  users: Users,
};

export const APP_WORKSPACE_NAV = {
  appointment_setter: [
    { to: '/app/appointment-setter/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/appointment-setter/tenants', label: 'Customers', icon: Users },
    { to: '/app/appointment-setter/voice-agents', label: 'Voice Agents', icon: Mic2 },
    { to: '/app/appointment-setter/appointments', label: 'Appointments', icon: CalendarRange },
    { to: '/app/appointment-setter/voice-testing', label: 'Voice Testing', icon: RadioTower },
    { to: '/app/appointment-setter/calendar', label: 'Google Calendar', icon: Calendar },
    { to: '/app/appointment-setter/twilio', label: 'Twilio', icon: Settings2 },
    // Telephony is intentionally hidden from the active platform nav for now.
    // { to: '/app/appointment-setter/telephony', label: 'Telephony', icon: Network },
  ],
  // Chatbot and live-chat are hidden from active platform navigation.
  // chatbot_agents: [
  //   { to: '/app/chatbot-agents', label: 'Workspace', icon: Bot },
  //   { to: '/app/chatbot-agents/live', label: 'Live Chats', icon: CircleEllipsis },
  // ],
  sms: [
    { to: '/app/sms/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/sms/inbox', label: 'Inbox & Confirmations', icon: Inbox },
    { to: '/app/sms/test', label: 'Test SMS', icon: FlaskConical },
    { to: '/app/sms/settings', label: 'Settings', icon: Settings2 },
    // Bulk campaigns and lead lists hidden - confirmations & reminders only
    // { to: '/app/sms/campaigns', label: 'Campaigns', icon: Send },
    // { to: '/app/sms/leads', label: 'Leads', icon: Users },
    // { to: '/app/sms/suppressions', label: 'Suppressions', icon: ShieldOff },
  ],
  users: [
    { to: '/app/users/platform-users', label: 'Platform Users', icon: Users },
    { to: '/app/users/partners', label: 'Partners', icon: Building2 },
    { to: '/app/users/customers', label: 'Customers', icon: CircleEllipsis },
  ],
};

export const getAppDefinition = (appId) => PLATFORM_APPS.find((app) => app.id === appId) || null;
