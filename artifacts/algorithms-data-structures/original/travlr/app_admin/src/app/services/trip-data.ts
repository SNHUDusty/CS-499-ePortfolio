import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication';

@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private apiUrl = 'http://localhost:3000/api/trips';

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  public getTrips(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  public addTrip(trip: any): Observable<any> {
    return this.http.post(this.apiUrl, trip, {
      headers: this.getAuthHeaders()
    });
  }

  public updateTrip(trip: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${trip.code}`, trip, {
      headers: this.getAuthHeaders()
    });
  }

  public deleteTrip(code: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${code}`, {
      headers: this.getAuthHeaders()
    });
  }
}