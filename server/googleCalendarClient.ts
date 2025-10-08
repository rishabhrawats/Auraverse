import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Helper functions for calendar operations
export async function createZenModeEvent(userId: string, duration: number = 25, startTime?: Date) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const start = startTime || new Date();
  const end = new Date(start.getTime() + duration * 60 * 1000);
  
  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: '🧘 AuraVerse Zen Mode',
      description: `Focused meditation session - ${duration} minutes`,
      start: { 
        dateTime: start.toISOString(),
        timeZone: 'UTC'
      },
      end: { 
        dateTime: end.toISOString(),
        timeZone: 'UTC'
      },
      reminders: { 
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 5 }
        ]
      },
      colorId: '8', // Gray color for focus sessions
      transparency: 'opaque',
      visibility: 'private'
    }
  });

  return event.data;
}

export async function getCalendarWorkload(userId: string, days: number = 7) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + days * 24 * 60 * 60 * 1000);
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  
  // Calculate workload metrics
  let totalBusyMinutes = 0;
  let eveningEvents = 0;
  let longestBlock = 0;
  let currentBlockMinutes = 0;
  let lastEventEnd: Date | null = null;

  events.forEach(event => {
    if (!event.start?.dateTime || !event.end?.dateTime) return;
    
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    
    totalBusyMinutes += duration;
    
    // Check if evening event (after 7 PM)
    if (start.getHours() >= 19) {
      eveningEvents++;
    }
    
    // Calculate continuous blocks
    if (lastEventEnd && start.getTime() - lastEventEnd.getTime() <= 15 * 60 * 1000) {
      // Events are within 15 minutes - consider continuous
      currentBlockMinutes += duration;
    } else {
      // New block starts
      longestBlock = Math.max(longestBlock, currentBlockMinutes);
      currentBlockMinutes = duration;
    }
    
    lastEventEnd = end;
  });
  
  longestBlock = Math.max(longestBlock, currentBlockMinutes);
  
  const totalDayMinutes = days * 24 * 60;
  const workingHourMinutes = days * 12 * 60; // Assume 12-hour working day
  
  return {
    totalEvents: events.length,
    totalBusyMinutes,
    calendarDensity: Math.min(100, (totalBusyMinutes / workingHourMinutes) * 100),
    eveningEvents,
    longestBlockHours: longestBlock / 60,
    averageDailyEvents: events.length / days,
    nextWeekEvents: events.filter(e => {
      const start = new Date(e.start?.dateTime || '');
      return start.getTime() > new Date().getTime();
    }).slice(0, 10)
  };
}

export async function setupCalendarWatch(userId: string, webhookUrl: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  // Set up push notifications for calendar changes
  const watchResponse = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: `auraverse-${userId}-${Date.now()}`,
      type: 'web_hook',
      address: webhookUrl,
      expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString() // 7 days
    }
  });
  
  return {
    channelId: watchResponse.data.id,
    resourceId: watchResponse.data.resourceId,
    expiration: watchResponse.data.expiration
  };
}
