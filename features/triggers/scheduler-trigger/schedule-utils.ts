export type SchedulerRepeat = "once" | "daily" | "weekly";

export type SchedulerConfig = {
    startDate: string;
    repeat: SchedulerRepeat;
    daysOfWeek: number[];
    times: string[];
    timezone: string;
};

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getDateFormatter = (timezone: string) => {
    let formatter = dateFormatterCache.get(timezone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        });
        dateFormatterCache.set(timezone, formatter);
    }
    return formatter;
};

const getZonedParts = (date: Date, timezone: string) => {
    const parts = getDateFormatter(timezone).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? "00";

    return {
        year: Number(part("year")),
        month: Number(part("month")),
        day: Number(part("day")),
        hour: Number(part("hour")),
        minute: Number(part("minute")),
        second: Number(part("second")),
    };
};

const dateKey = (year: number, month: number, day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const addCalendarDays = (date: string, days: number) => {
    const [year, month, day] = date.split("-").map(Number);
    const nextDate = new Date(Date.UTC(year, month - 1, day + days));
    return dateKey(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate());
};

const localDateTimeToTimestamp = (date: string, time: string, timezone: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    let candidate = desiredAsUtc;

    // Correct the UTC guess using the timezone's actual offset. The second
    // pass handles offset changes around daylight-saving transitions.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const local = getZonedParts(new Date(candidate), timezone);
        const representedAsUtc = Date.UTC(
            local.year,
            local.month - 1,
            local.day,
            local.hour,
            local.minute,
            local.second,
        );
        candidate += desiredAsUtc - representedAsUtc;
    }

    const resolved = getZonedParts(new Date(candidate), timezone);
    if (
        resolved.year !== year || resolved.month !== month || resolved.day !== day ||
        resolved.hour !== hour || resolved.minute !== minute
    ) {
        // A local time that falls inside a daylight-saving gap does not exist.
        return null;
    }

    return candidate;
};

export const createDefaultSchedulerConfig = (timezone?: string): SchedulerConfig => {
    const resolvedTimezone = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    const now = new Date();
    const local = getZonedParts(now, resolvedTimezone);
    const roundedMinute = Math.ceil((local.minute + 1) / 5) * 5;
    const nextLocal = new Date(Date.UTC(local.year, local.month - 1, local.day, local.hour, roundedMinute));

    return {
        startDate: dateKey(nextLocal.getUTCFullYear(), nextLocal.getUTCMonth() + 1, nextLocal.getUTCDate()),
        repeat: "daily",
        daysOfWeek: [],
        times: [`${String(nextLocal.getUTCHours()).padStart(2, "0")}:${String(nextLocal.getUTCMinutes()).padStart(2, "0")}`],
        timezone: resolvedTimezone,
    };
};

export const normalizeSchedulerConfig = (value: unknown): SchedulerConfig | null => {
    if (!value || typeof value !== "object") return null;
    const config = value as Partial<SchedulerConfig>;
    if (!config.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(config.startDate)) return null;
    const [year, month, day] = config.startDate.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
        dateKey(year, month, day) !== config.startDate ||
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() + 1 !== month ||
        parsedDate.getUTCDate() !== day
    ) return null;
    if (!config.timezone || typeof config.timezone !== "string") return null;
    if (!config.times?.length || config.times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return null;
    if (!["once", "daily", "weekly"].includes(config.repeat ?? "")) return null;

    const daysOfWeek = config.daysOfWeek ?? [];
    if (daysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) return null;
    if (config.repeat === "weekly" && daysOfWeek.length === 0) return null;

    try {
        getDateFormatter(config.timezone);
    } catch {
        return null;
    }

    return {
        startDate: config.startDate,
        repeat: config.repeat as SchedulerRepeat,
        daysOfWeek: [...new Set(daysOfWeek)].sort((a, b) => a - b),
        times: [...new Set(config.times)].sort(),
        timezone: config.timezone,
    };
};

export const schedulerConfigFingerprint = (config: SchedulerConfig) =>
    JSON.stringify({
        startDate: config.startDate,
        repeat: config.repeat,
        daysOfWeek: [...config.daysOfWeek].sort((a, b) => a - b),
        times: [...config.times].sort(),
        timezone: config.timezone,
    });

export const getNextSchedulerOccurrence = (config: SchedulerConfig, after: Date) => {
    // Validate the timezone before searching dates.
    getDateFormatter(config.timezone);
    const localNow = getZonedParts(after, config.timezone);
    const today = dateKey(localNow.year, localNow.month, localNow.day);
    const firstDate = config.startDate > today ? config.startDate : today;
    const lastDate = config.repeat === "once" ? config.startDate : addCalendarDays(firstDate, 3660);

    for (let date = firstDate; date <= lastDate; date = addCalendarDays(date, 1)) {
        if (date < config.startDate) continue;
        if (config.repeat === "once" && date !== config.startDate) continue;
        if (config.repeat === "weekly") {
            const [year, month, day] = date.split("-").map(Number);
            if (!config.daysOfWeek.includes(new Date(Date.UTC(year, month - 1, day)).getUTCDay())) continue;
        }

        for (const time of [...config.times].sort()) {
            const timestamp = localDateTimeToTimestamp(date, time, config.timezone);
            if (timestamp !== null && timestamp > after.getTime()) {
                return new Date(timestamp);
            }
        }

        if (config.repeat === "once") return null;
    }

    return null;
};
