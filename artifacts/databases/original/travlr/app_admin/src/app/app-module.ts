import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { TripList } from './trip-list/trip-list';
import { TripCard } from './trip-card/trip-card';
import { Login } from './login/login';

@NgModule({
  declarations: [App, TripList, TripCard, Login],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [App],
})
export class AppModule {}
