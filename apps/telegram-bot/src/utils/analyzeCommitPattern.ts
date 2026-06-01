import { CommitPattern, PatternLabel } from '../types/index';

export function analyzeCommitPattern(events: any[], repos: any[]): CommitPattern {
  if (!events || events.length === 0) {
    // Fallback to repos if no events
    if (repos && repos.length > 0) {
      const dates = repos
        .map(r => r.pushed_at ? new Date(r.pushed_at) : null)
        .filter((d): d is Date => d !== null);
      
      if (dates.length > 0) {
        // Derive from repos
        const dayCounts = new Map<number, number>();
        const hourCounts = new Map<number, number>();
        
        for (const date of dates) {
          const day = date.getUTCDay();
          const hour = date.getUTCHours();
          dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        }
        
        return calculatePattern(dayCounts, hourCounts, dates.length);
      }
    }
    
    return {
      most_active_day: "Not enough data",
      most_active_hour: 0,
      pattern_label: "Bursty Sprinter",
    };
  }

  let pushEvents = events.filter((e) => e.type === 'PushEvent');
  console.log('analyzeCommitPattern: pushEvents count:', pushEvents.length);
  
  // Fallback to all events if no PushEvents
  if (pushEvents.length === 0) {
    pushEvents = events;
  }

  const dayCounts = new Map<number, number>();
  const hourCounts = new Map<number, number>();

  for (const event of pushEvents) {
    const date = new Date(event.created_at);
    const day = date.getUTCDay();
    const hour = date.getUTCHours();

    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  return calculatePattern(dayCounts, hourCounts, pushEvents.length);
}

function calculatePattern(dayCounts: Map<number, number>, hourCounts: Map<number, number>, totalEvents: number): CommitPattern {
  let mostActiveDayIndex = 0;
  let maxDayCount = -1;
  for (const [day, count] of dayCounts.entries()) {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostActiveDayIndex = day;
    }
  }

  let mostActiveHour = 0;
  let maxHourCount = -1;
  for (const [hour, count] of hourCounts.entries()) {
    if (count > maxHourCount) {
      maxHourCount = count;
      mostActiveHour = hour;
    }
  }

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const most_active_day = days[mostActiveDayIndex];

  // Determine pattern_label
  let pattern_label: PatternLabel = 'Bursty Sprinter';

  // 1. hour 5–11: "Morning Committer"
  if (mostActiveHour >= 5 && mostActiveHour <= 11) {
    pattern_label = 'Morning Committer';
  }
  // 2. hour 22–23 or 0–4: "Night Owl"
  else if (mostActiveHour >= 22 || mostActiveHour <= 4) {
    pattern_label = 'Night Owl';
  }
  // 3. day 0 or 6: "Weekend Warrior"
  else if (mostActiveDayIndex === 0 || mostActiveDayIndex === 6) {
    pattern_label = 'Weekend Warrior';
  }

  return {
    most_active_day,
    most_active_hour: mostActiveHour,
    pattern_label,
  };
}
