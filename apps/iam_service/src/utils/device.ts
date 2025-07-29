/**
 * 设备信息收集工具
 */

import type { DeviceInfo, RequestMeta } from '#/types';

/**
 * 生成设备ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

/**
 * 获取设备名称
 */
export function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  return 'Unknown Device';
}

/**
 * 获取操作系统
 */
export function getOS(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
  if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
  if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
    return match ? `macOS ${match[1].replaceAll('_', '.')}` : 'macOS';
  }
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d[.\d]*)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (userAgent.includes('iPhone OS')) {
    const match = userAgent.match(/iPhone OS (\d+[._]\d+[._]\d+)/);
    return match ? `iOS ${match[1].replaceAll('_', '.')}` : 'iOS';
  }
  return 'Unknown OS';
}

/**
 * 获取应用版本
 */
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}

/**
 * 获取客户端IP地址
 */
export async function getClientIP(): Promise<string> {
  try {
    // 尝试多个IP获取服务
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        const data = await response.json();

        // 根据不同服务的响应格式提取IP
        if (data.ip) return data.ip;
        if (data.origin) return data.origin;
      } catch (error) {
        console.warn(`Failed to get IP from ${service}:`, error);
        continue;
      }
    }

    return '127.0.0.1';
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return '127.0.0.1';
  }
}

/**
 * 生成请求元数据
 */
export function generateRequestMeta(): RequestMeta {
  return {
    request_id: generateRequestId(),
    timestamp: new Date().toISOString(),
    version: 'v1',
  };
}

/**
 * 检测登录类型
 */
export function detectLoginType(
  identifier: string,
): 'email' | 'phone' | 'username' {
  // 邮箱格式检测
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
  if (emailRegex.test(identifier)) {
    return 'email';
  }

  // 手机号格式检测 (支持中国大陆手机号)
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (phoneRegex.test(identifier)) {
    return 'phone';
  }

  // 默认为用户名
  return 'username';
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/**
 * 生成设备指纹
 */
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset(),
    navigator.platform,
    canvas.toDataURL(),
  ].join('|');

  // 简单哈希
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.codePointAt(i) || 0;
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }

  return Math.abs(hash).toString(36);
}

/**
 * 检查是否为可信设备
 */
export function isTrustedDevice(): boolean {
  const trustedDevices = JSON.parse(
    localStorage.getItem('trusted_devices') || '[]',
  );
  const currentDeviceId = getDeviceId();
  return trustedDevices.includes(currentDeviceId);
}

/**
 * 标记设备为可信
 */
export function markDeviceAsTrusted(): void {
  const trustedDevices = JSON.parse(
    localStorage.getItem('trusted_devices') || '[]',
  );
  const currentDeviceId = getDeviceId();

  if (!trustedDevices.includes(currentDeviceId)) {
    trustedDevices.push(currentDeviceId);
    localStorage.setItem('trusted_devices', JSON.stringify(trustedDevices));
  }
}

/**
 * 获取浏览器信息
 */
export function getBrowserInfo(): { browser: string; version: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.includes('Chrome') && !ua.includes('Edge')) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return { browser, version };
}

/**
 * 获取网络信息
 */
export function getNetworkInfo(): { effectiveType?: string; type: string } {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (connection) {
    return {
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
    };
  }

  return { type: 'unknown' };
}

/**
 * 收集设备信息
 */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = getDeviceId();
  const os = getOS();
  const ipAddress = await getClientIP();
  const browserInfo = getBrowserInfo();
  const networkInfo = getNetworkInfo();
  const isMobile = isMobileDevice();
  const fingerprint = generateDeviceFingerprint();

  return {
    device_id: deviceId,
    device_name: `${browserInfo.browser} on ${os}${isMobile ? ' (Mobile)' : ''}`,
    os,
    app_version: '1.0.0',
    ip_address: ipAddress,
    user_agent: navigator.userAgent,
    // 扩展信息
    browser: browserInfo.browser,
    browser_version: browserInfo.version,
    is_mobile: isMobile,
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    fingerprint,
    network_info: networkInfo,
    is_trusted: isTrustedDevice(),
  } as DeviceInfo;
}
