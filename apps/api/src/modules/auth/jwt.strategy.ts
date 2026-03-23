import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
}

function extractJwtFromCookieOrHeader(req: Request): string | null {
  // Try cookie first, then Authorization header
  const fromCookie = req.cookies?.vetflow_access_token;
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
