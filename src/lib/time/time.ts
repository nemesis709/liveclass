const kMinutesPerHour = 60;

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time format: ${time}`);
  }

  return hours * kMinutesPerHour + minutes;
};

export const formatMinutesToTime = (minutes: number): string => {
  if (minutes < 0) {
    throw new Error(`Minutes must be a positive number: ${minutes}`);
  }

  const hours = Math.floor(minutes / kMinutesPerHour);
  const remainedMinutes = minutes % kMinutesPerHour;

  return `${String(hours).padStart(2, '0')}:${String(remainedMinutes).padStart(2, '0')}`;
};

export const isValidTimeRange = (
  startMinutes: number,
  endMinutes: number,
): boolean => startMinutes < endMinutes;

export const getDurationMinutes = (
  startMinutes: number,
  endMinutes: number,
): number => endMinutes - startMinutes;

export const isAlignedToInterval = (
  minutes: number,
  intervalMinutes: number,
): boolean => minutes % intervalMinutes === 0;

export const formatDuration = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / kMinutesPerHour);
  const minutes = totalMinutes % kMinutesPerHour;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};
