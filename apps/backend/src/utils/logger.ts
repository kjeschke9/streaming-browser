const level = process.env.LOG_LEVEL ?? 'info';
const LEVELS: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[level] ?? 2;

function fmt(lvl: string, msg: string, meta?: object) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${lvl.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  error: (msg: string, meta?: object) => { if (current >= 0) console.error(fmt('error', msg, meta)); },
  warn:  (msg: string, meta?: object) => { if (current >= 1) console.warn(fmt('warn',  msg, meta)); },
  info:  (msg: string, meta?: object) => { if (current >= 2) console.log(fmt('info',   msg, meta)); },
  debug: (msg: string, meta?: object) => { if (current >= 3) console.log(fmt('debug',  msg, meta)); },
};
