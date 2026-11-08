const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const dayKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Amsterdam",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function partMap(date: Date) {
  const parts: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return parts;
}

export function amsterdamDayKey(date: Date) {
  const parts: Record<string, string> = {};
  for (const part of dayKeyFormatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addCalendarDays(day: string, amount: number) {
  const match = DAY_KEY.exec(day);
  if (!match) throw new Error("Ongeldige dag");
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + amount));
  return utc.toISOString().slice(0, 10);
}

export function startOfAmsterdamDay(dayKey: string) {
  const match = DAY_KEY.exec(dayKey);
  if (!match) throw new Error("Ongeldige dag");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = Date.UTC(year, month - 1, day, 0, 0, 0);
  const guess = new Date(target);
  const parts = partMap(guess);
  let hour = Number(parts.hour);
  let extraDays = 0;
  if (hour === 24) {
    hour = 0;
    extraDays = 1;
  }
  const zonedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day) + extraDays,
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  const result = new Date(target - (zonedAsUtc - guess.getTime()));
  if (amsterdamDayKey(result) !== dayKey) {
    throw new Error(`Kon de Amsterdamse dagstart niet bepalen voor ${dayKey}`);
  }
  return result;
}

export type PeriodStarts = {
  today: Date;
  days7: Date;
  days30: Date;
};

export function periodStarts(now: Date): PeriodStarts {
  const todayKey = amsterdamDayKey(now);
  return {
    today: startOfAmsterdamDay(todayKey),
    days7: startOfAmsterdamDay(addCalendarDays(todayKey, -6)),
    days30: startOfAmsterdamDay(addCalendarDays(todayKey, -29)),
  };
}
