const MADAGASCAR_TIMEZONE = 'Indian/Antananarivo';

export const madagascarDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: MADAGASCAR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const madagascarTime = (date = new Date()) => new Intl.DateTimeFormat('fr-FR', {
  timeZone: MADAGASCAR_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
}).format(date);
