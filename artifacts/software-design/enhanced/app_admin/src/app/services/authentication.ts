import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiBaseUrl = environment.apiUrl;
  private readonly tokenKey = 'travlr-token';

  constructor(private http: HttpClient) {}

  public login(user: unknown): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/login`, user);
  }

  public saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  public getToken(): string {
    return localStorage.getItem(this.tokenKey) ?? '';
  }

  public logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp;

      if (!expiration) {
        return true;
      }

      return Date.now() >= expiration * 1000;
    } catch (error) {
      console.error('Invalid JWT:', error);
      return true;
    }
  }
}