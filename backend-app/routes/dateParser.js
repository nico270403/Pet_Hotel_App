import chrono from "chrono-node";
import { addDays, endOfMonth, nextSaturday, nextSunday, format } from "date-fns";

export function parseNaturalDate(text) {
  const now = new Date();
  const lower = text.toLowerCase();

  if (lower.includes("mâine") || lower.includes("maine")) {
    const d = addDays(now, 1);
    return format(d, "yyyy-MM-dd");
  }

  if (lower.includes("poimâine") || lower.includes("poimaine")) {
    const d = addDays(now, 2);
    return format(d, "yyyy-MM-dd");
  }

  if (lower.includes("în") && lower.includes("zile")) {
    const match = lower.match(/(\d+)/);
    if (match) {
      const d = addDays(now, parseInt(match[1]));
      return format(d, "yyyy-MM-dd");
    }
  }

  if (lower.includes("weekend")) {
    const saturday = nextSaturday(now);
    return format(saturday, "yyyy-MM-dd");
  }

  if (lower.includes("sfârșitul lunii") || lower.includes("sfarsitul lunii")) {
    const d = endOfMonth(now);
    return format(d, "yyyy-MM-dd");
  }

  if (lower.includes("weekenduri")) {
  const match = lower.match(/(\d+)/);
  if (match) {
    let date = now;
    for (let i = 0; i < parseInt(match[1]); i++) {
      date = nextSaturday(addDays(date, 7));
    }
    return format(date, "yyyy-MM-dd");
  }
}

  const chronoResult = chrono.parseDate(text, now);
  if (chronoResult) {
    return format(chronoResult, "yyyy-MM-dd");
  }

  return null;
}