import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-trip-list',
  standalone: false,
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList implements OnInit {
  trips: Trip[] = [];
  editing = false;
  errorMessage = '';

  formTrip: Trip = this.createEmptyTrip();

  constructor(
    private tripDataService: TripDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getTrips();
  }

  getTrips(): void {
    this.errorMessage = '';

    this.tripDataService.getTrips().subscribe({
      next: (data: Trip[]) => {
        this.trips = data;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error('Error loading trips:', error);
        this.errorMessage = 'Unable to load trips. Please try again.';
      }
    });
  }

  saveTrip(): void {
    this.errorMessage = '';

    const request = this.editing
      ? this.tripDataService.updateTrip(this.formTrip)
      : this.tripDataService.addTrip(this.formTrip);

    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.getTrips();
      },
      error: (error: unknown) => {
        console.error('Error saving trip:', error);
        this.errorMessage = 'Unable to save the trip. Please verify the information and try again.';
      }
    });
  }

  editTrip(trip: Trip): void {
    this.editing = true;
    this.errorMessage = '';

    this.formTrip = {
      ...trip,
      start: trip.start ? trip.start.substring(0, 10) : ''
    };
  }

  deleteTrip(code: string): void {
    this.errorMessage = '';

    this.tripDataService.deleteTrip(code).subscribe({
      next: () => {
        this.getTrips();
      },
      error: (error: unknown) => {
        console.error('Error deleting trip:', error);
        this.errorMessage = 'Unable to delete the trip. Please try again.';
      }
    });
  }

  cancelEdit(): void {
    this.editing = false;
    this.errorMessage = '';
    this.formTrip = this.createEmptyTrip();
  }

  private createEmptyTrip(): Trip {
    return {
      code: '',
      name: '',
      length: '',
      start: '',
      resort: '',
      perPerson: '',
      image: 'reef1.jpg',
      description: ''
    };
  }
}