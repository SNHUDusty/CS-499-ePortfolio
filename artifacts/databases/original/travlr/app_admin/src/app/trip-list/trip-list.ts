import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-trip-list',
  standalone: false,
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList implements OnInit {
  trips: any[] = [];
  editing = false;

  formTrip: any = {
    code: '',
    name: '',
    length: '',
    start: '',
    resort: '',
    perPerson: '',
    image: 'reef1.jpg',
    description: ''
  };

  constructor(
    private tripDataService: TripDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getTrips();
  }

  getTrips(): void {
    this.tripDataService.getTrips().subscribe({
      next: (data: any) => {
        this.trips = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading trips:', err)
    });
  }

  saveTrip(): void {
    if (this.editing) {
      this.tripDataService.updateTrip(this.formTrip).subscribe(() => {
        this.cancelEdit();
        this.getTrips();
      });
    } else {
      this.tripDataService.addTrip(this.formTrip).subscribe(() => {
        this.cancelEdit();
        this.getTrips();
      });
    }
  }

  editTrip(trip: any): void {
    this.editing = true;
    this.formTrip = {
      ...trip,
      start: trip.start ? trip.start.substring(0, 10) : ''
    };
  }

  deleteTrip(code: string): void {
    this.tripDataService.deleteTrip(code).subscribe(() => {
      this.getTrips();
    });
  }

  cancelEdit(): void {
    this.editing = false;
    this.formTrip = {
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