import { describe, expect, it, vi } from 'vitest';

import { addBase64Padding, parseJwtToken } from '../jwt';

// Mock the environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_JWT_PUBLIC_KEY: '', // Empty to trigger development mode
  },
}));

describe('jWT Utils - Development Mode', () => {
  describe('addBase64Padding', () => {
    it('should add correct padding to base64 strings', () => {
      expect(addBase64Padding('YWJj')).toBe('YWJj'); // No padding needed
      expect(addBase64Padding('YWJjZA')).toBe('YWJjZA=='); // 2 padding chars needed
      expect(addBase64Padding('YWJjZGU')).toBe('YWJjZGU='); // 1 padding char needed
    });
  });

  describe('parseJwtToken - Development Mode', () => {
    it('should parse JWT token without signature verification', async () => {
      // Create a valid JWT token (header.payload.signature)
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        user_id: 'test-user-123',
        tenant_id: 'test-tenant-456',
        session_id: 'test-session-789',
        roles: ['user', 'admin'],
        permissions_hash: 'hash123',
        device_fingerprint: 'device123',
        ip_address: '192.168.1.1',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        type: 'access' as const,
      };

      const headerB64 = btoa(JSON.stringify(header));
      const payloadB64 = btoa(JSON.stringify(payload));
      const signature = 'fake-signature-for-testing';

      const token = `${headerB64}.${payloadB64}.${signature}`;

      const result = await parseJwtToken(token);

      // Should return the payload with all required fields
      expect(result.user_id).toBe('test-user-123');
      expect(result.tenant_id).toBe('test-tenant-456');
      expect(result.session_id).toBe('test-session-789');
      expect(result.roles).toEqual(['user', 'admin']);
      expect(result.type).toBe('access');
    });

    it('should provide default values for missing fields', async () => {
      // Create a JWT token with minimal payload
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        sub: 'minimal-user', // Only has sub field
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const headerB64 = btoa(JSON.stringify(header));
      const payloadB64 = btoa(JSON.stringify(payload));
      const signature = 'fake-signature';

      const token = `${headerB64}.${payloadB64}.${signature}`;

      const result = await parseJwtToken(token);

      // Should provide default values for missing fields
      expect(result.user_id).toBe('minimal-user'); // Should use 'sub' as fallback
      expect(result.tenant_id).toBe('00000000-0000-0000-0000-000000000000'); // Default tenant
      expect(result.session_id).toBe('dev-session'); // Default session
      expect(result.roles).toEqual(['user']); // Default role
      expect(result.type).toBe('access'); // Default type
    });

    it('should handle tokens with base64 padding issues', async () => {
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        user_id: 'padding-test-user',
        tenant_id: 'padding-test-tenant',
        iat: 1_234_567_890,
        exp: 1_234_567_890 + 3600,
      };

      let headerB64 = btoa(JSON.stringify(header));
      let payloadB64 = btoa(JSON.stringify(payload));

      // Remove padding to simulate the original issue
      headerB64 = headerB64.replaceAll('=', '');
      payloadB64 = payloadB64.replaceAll('=', '');

      const signature = 'fake-signature';
      const token = `${headerB64}.${payloadB64}.${signature}`;

      const result = await parseJwtToken(token);
      expect(result.user_id).toBe('padding-test-user');
      expect(result.tenant_id).toBe('padding-test-tenant');
    });
  });
});
