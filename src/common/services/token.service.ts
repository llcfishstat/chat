import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
@Injectable()
export class TokenService {
  constructor(private configService: ConfigService) {}

  extractToken(connectionParams: any): string | null {
    return connectionParams?.token || null;
  }

  validateToken(token: string): any {
    const accessTokenSecret = this.configService.get<string>(
      'auth.accessToken.secret',
    );

    try {
      return verify(token, accessTokenSecret);
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }
}