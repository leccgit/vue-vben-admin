// 注意: 使用前请安装jose库: pnpm install jose
import { importSPKI, jwtVerify } from 'jose';

/**
 * JWT令牌解析工具
 * 用于从JWT令牌中提取用户信息和租户信息
 */

// 存储JWT公钥(实际项目中应从环境变量获取完整PEM格式公钥)
// 格式示例: '-----BEGIN PUBLIC KEY-----...公钥内容...-----END PUBLIC KEY-----'
// 注意：环境变量中的公钥不应包含引号
// 开发环境下禁用JWT签名验证
const JWT_PUBLIC_KEY = import.meta.env.VITE_JWT_PUBLIC_KEY || '';
export interface JwtPayload {
  user_id: string; // 用户ID
  tenant_id: string; // 租户ID
  session_id: string; // 会话ID
  roles: string[]; // 用户角色
  permissions_hash: string; // 权限哈希
  device_fingerprint: string; // 设备指纹
  ip_address: string; // IP地址
  iat: number; // 签发时间戳
  exp: number; // 过期时间戳
  type: 'access' | 'refresh'; // 令牌类型
}

/**
 * 添加base64 padding以确保正确解码
 * @param str base64字符串
 * @returns 添加了padding的base64字符串
 */
export function addBase64Padding(str: string): string {
  const padding = 4 - (str.length % 4);
  return padding === 4 ? str : str + '='.repeat(padding);
}

/**
 * 安全地解码JWT token的某个部分
 * @param part JWT token的部分（header或payload）
 * @param partName 部分名称（用于错误日志）
 * @returns 解码后的对象
 */
export function safeDecodeJwtPart(part: string, partName: string): any {
  try {
    const paddedPart = addBase64Padding(part);
    const decoded = atob(paddedPart);
    return JSON.parse(decoded);
  } catch (error) {
    console.error(`Failed to decode JWT ${partName}:`, error);
    console.error(`Original ${partName} part:`, part);
    console.error(`Padded ${partName} part:`, addBase64Padding(part));
    throw new Error(`Invalid JWT token: cannot decode ${partName}`);
  }
}

/**
 * 解析JWT令牌
 * @param token JWT令牌字符串
 * @returns 解析后的令牌 payload
 */
export async function parseJwtToken(token: string): Promise<JwtPayload> {
  try {
    // 确保token存在
    if (!token) {
      throw new Error('Token is required');
    }

    // 添加调试信息
    console.warn('Parsing JWT token, length:', token.length);
    console.warn('Token preview:', `${token.slice(0, 50)}...`);

    // 检查token格式
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid JWT token parts:', tokenParts.length);
      console.error(
        'Token parts lengths:',
        tokenParts.map((part) => part.length),
      );
      throw new Error('Invalid JWT token format: must have 3 parts');
    }

    let decodedPayload: any;
    try {
      // 尝试解码header和payload，不验证签名
      const headerPart = tokenParts[0] || '';
      const payloadPart = tokenParts[1] || '';

      const header = safeDecodeJwtPart(headerPart, 'header');
      decodedPayload = safeDecodeJwtPart(payloadPart, 'payload');

      console.warn('JWT Header:', header);
      console.warn(
        'JWT Payload (decoded without verification):',
        decodedPayload,
      );
    } catch (decodeError) {
      console.error('Failed to decode JWT parts:', decodeError);
      throw new Error('Invalid JWT token: cannot decode token parts');
    }

    // 开发环境下跳过签名验证，直接返回解码的payload
    if (!JWT_PUBLIC_KEY || JWT_PUBLIC_KEY.trim() === '') {
      console.warn(
        '🔓 Development Mode: JWT signature verification is disabled.',
      );
      console.warn('⚠️  This is not secure for production use!');

      // 确保payload包含必要的字段，如果缺少则提供默认值
      const payload = {
        tenant_id:
          decodedPayload.tenant_id || '00000000-0000-0000-0000-000000000000',
        user_id: decodedPayload.user_id || decodedPayload.sub || 'unknown',
        session_id: decodedPayload.session_id || 'dev-session',
        roles: decodedPayload.roles || ['user'],
        permissions_hash: decodedPayload.permissions_hash || 'dev-hash',
        device_fingerprint: decodedPayload.device_fingerprint || 'dev-device',
        ip_address: decodedPayload.ip_address || '127.0.0.1',
        iat: decodedPayload.iat || Math.floor(Date.now() / 1000),
        exp: decodedPayload.exp || Math.floor(Date.now() / 1000) + 3600,
        type: decodedPayload.type || 'access',
        ...decodedPayload, // 保留原有字段
      };

      console.warn('🔍 Parsed JWT payload:', payload);
      return payload as JwtPayload;
    }

    try {
      // 导入SPKI格式公钥
      const publicKey = await importSPKI(JWT_PUBLIC_KEY, 'RS256');

      // 验证并解析token
      const { payload } = await jwtVerify(token, publicKey);

      // 类型转换并返回
      return payload as unknown as JwtPayload;
    } catch (keyError) {
      console.error('Failed to import or verify with public key:', keyError);
      console.warn(
        '🔓 Falling back to unverified token parsing due to key issues.',
      );
      console.warn('⚠️  WARNING: This is not secure for production use!');

      // 如果公钥导入失败，返回未验证的payload，确保包含必要字段
      const fallbackPayload = {
        tenant_id:
          decodedPayload.tenant_id || '00000000-0000-0000-0000-000000000000',
        user_id: decodedPayload.user_id || decodedPayload.sub || 'unknown',
        session_id: decodedPayload.session_id || 'fallback-session',
        roles: decodedPayload.roles || ['user'],
        permissions_hash: decodedPayload.permissions_hash || 'fallback-hash',
        device_fingerprint:
          decodedPayload.device_fingerprint || 'fallback-device',
        ip_address: decodedPayload.ip_address || '127.0.0.1',
        iat: decodedPayload.iat || Math.floor(Date.now() / 1000),
        exp: decodedPayload.exp || Math.floor(Date.now() / 1000) + 3600,
        type: decodedPayload.type || 'access',
        ...decodedPayload, // 保留原有字段
      };

      console.warn('🔍 Fallback JWT payload:', fallbackPayload);
      return fallbackPayload as JwtPayload;
    }
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    if (error instanceof Error) {
      throw new TypeError(`Invalid or expired token: ${error.message}`);
    }
    throw new TypeError('Invalid or expired token');
  }
}

/**
 * 从JWT令牌中提取用户ID
 * @param token JWT令牌字符串
 * @returns 用户ID
 */
export async function getUserIdFromToken(token: string): Promise<string> {
  const payload = await parseJwtToken(token);
  return payload.user_id;
}

/**
 * 从JWT令牌中提取租户ID
 * @param token JWT令牌字符串
 * @returns 租户ID(如果存在)
 */
export async function getTenantIdFromToken(
  token: string,
): Promise<string | undefined> {
  const payload = await parseJwtToken(token);
  return payload.tenant_id;
}

/**
 * 检查JWT令牌是否过期
 * @param token JWT令牌字符串
 * @returns 是否过期
 */
export async function isTokenExpired(token: string): Promise<boolean> {
  const payload = await parseJwtToken(token);
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}
