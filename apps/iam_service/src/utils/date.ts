/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间
 * @param dateString - ISO 日期字符串
 * @param format - 格式化选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(
  dateString: string,
  format: 'date' | 'datetime' | 'time' = 'datetime',
): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const options: Intl.DateTimeFormatOptions = {};

    switch (format) {
      case 'date': {
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        break;
      }
      case 'datetime': {
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false;
        break;
      }
      case 'time': {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false;
        break;
      }
    }

    return new Intl.DateTimeFormat('zh-CN', options).format(date);
  } catch (error) {
    console.error('Format date error:', error);
    return '-';
  }
}

/**
 * 格式化相对时间
 * @param dateString - ISO 日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  } catch (error) {
    console.error('Format relative time error:', error);
    return '-';
  }
}
