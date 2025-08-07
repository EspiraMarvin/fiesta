import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

const logPath = path.join(__dirname, '../../logs');

/** daily logs */
const transport = new DailyRotateFile({
  filename: `${logPath}/%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // environment-based log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: `${logPath}/combined.log` }),
    new winston.transports.File({
      filename: `${logPath}/error.log`,
      level: `error`,
    }),
    transport, // daily logs
  ],
});

export default logger;
