import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';

type SortField = 'name' | 'resort' | 'length' | 'start';

@Component({
  selector: 'app-trip-list',
  standalone: false,
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList implements OnInit {
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];

  editing = false;
  errorMessage = '';

  searchTerm = '';
  sortField: SortField = 'name';
  sortAscending = true;

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
        this.applySearchAndSort();
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error('Error loading trips:', error);
        this.errorMessage = 'Unable to load trips. Please try again.';
      }
    });
  }

  filterTrips(): void {
    this.applySearchAndSort();
  }

  sortTrips(): void {
    this.applySearchAndSort();
  }

  toggleSortDirection(): void {
    this.sortAscending = !this.sortAscending;
    this.applySearchAndSort();
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
        this.errorMessage =
          'Unable to save the trip. Please verify the information and try again.';
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

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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

  private applySearchAndSort(): void {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    const matchingTrips = this.trips.filter((trip: Trip) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        trip.code,
        trip.name,
        trip.resort,
        trip.description
      ];

      return searchableFields.some((field: string) =>
        field.toLowerCase().includes(normalizedSearch)
      );
    });

    this.filteredTrips = [...matchingTrips].sort(
      (firstTrip: Trip, secondTrip: Trip) =>
        this.compareTrips(firstTrip, secondTrip)
    );
  }

  private compareTrips(firstTrip: Trip, secondTrip: Trip): number {
    let comparison = 0;

    switch (this.sortField) {
      case 'start':
        comparison =
          this.getDateValue(firstTrip.start) -
          this.getDateValue(secondTrip.start);
        break;

      case 'length':
        comparison =
          this.getLengthValue(firstTrip.length) -
          this.getLengthValue(secondTrip.length);
        break;

      case 'resort':
        comparison = firstTrip.resort.localeCompare(
          secondTrip.resort,
          undefined,
          { sensitivity: 'base' }
        );
        break;

      case 'name':
      default:
        comparison = firstTrip.name.localeCompare(
          secondTrip.name,
          undefined,
          { sensitivity: 'base' }
        );
        break;
    }

    return this.sortAscending ? comparison : -comparison;
  }

  private getLengthValue(length: string): number {
    const numericLength = Number.parseFloat(length);
    return Number.isNaN(numericLength)
      ? Number.MAX_SAFE_INTEGER
      : numericLength;
  }

  private getDateValue(date: string): number {
    const timestamp = Date.parse(date);
    return Number.isNaN(timestamp)
      ? Number.MAX_SAFE_INTEGER
      : timestamp;
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