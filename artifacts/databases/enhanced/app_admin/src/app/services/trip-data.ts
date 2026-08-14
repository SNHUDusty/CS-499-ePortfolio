import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthenticationService } from './authentication';
import { Trip } from '../models/trip';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private apiBaseUrl = `${environment.apiUrl}/trips`;

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authenticationService.getToken()}`
    });
  }

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiBaseUrl);
  }

  getTrip(code: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiBaseUrl}/${code}`);
  }

  addTrip(trip: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.apiBaseUrl, trip, {
      headers: this.getAuthHeaders()
    });
  }

  updateTrip(trip: Trip): Observable<Trip> {
    return this.http.put<Trip>(
      `${this.apiBaseUrl}/${trip.code}`,
      trip,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  deleteTrip(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${code}`, {
      headers: this.getAuthHeaders()
    });
  }
}