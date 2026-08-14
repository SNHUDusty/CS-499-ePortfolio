import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiBaseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  public login(user: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/login`, user);
  }

  public saveToken(token: string): void {
    localStorage.setItem('travlr-token', token);
  }

  public getToken(): string {
    return localStorage.getItem('travlr-token') || '';
  }

  public logout(): void {
    localStorage.removeItem('travlr-token');
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    return token.length > 0;
  }
}