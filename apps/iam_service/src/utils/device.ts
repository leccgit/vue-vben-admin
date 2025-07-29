/**
 * 设备信息获取工具函数
 */

import type { DeviceInfo, RequestMeta } from '#/types';

/**
 * 生成请求ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * 获取设备ID
 */
export function getDeviceId(): string {
  // 从localStorage获取或生成新的设备ID
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID()}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

/**
 * 获取设备名称
 */
export function getDeviceName(): string {
  // 根据用户代理字符串推断设备名称
  const ua = navigator.userAgent;
  
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android Device';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Mac')) return 'Mac';
  
  return 'Web Browser';
}

/**
 * 获取操作系统
 */
export function getOS(): string {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  
  return platform;
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
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return '127.0.0.1';
  }
}

/**
 * 收集设备信息
 */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  return {
    device_id: getDeviceId(),
    device_name: getDeviceName(),
    os: getOS(),
    app_version: getAppVersion(),
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent
  };
}

/**
 * 生成请求元数据
 */
export function generateRequestMeta(): RequestMeta {
  return {
    request_id: generateRequestId(),
    timestamp: new Date().toISOString(),
    version: 'v1'
  };
}

/**
 * 检测登录类型
 */
export function detectLoginType(identifier: string): 'email' | 'phone' | 'username' {
  // 邮箱格式检测
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier)) {
    return 'email';
  }
  
  // 手机号格式检测（简单的中国手机号格式）
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (phoneRegex.test(identifier)) {
    return 'phone';
  }
  
  // 默认为用户名
  return 'username';
}
