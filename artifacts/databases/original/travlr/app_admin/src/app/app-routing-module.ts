import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TripList } from './trip-list/trip-list';
import { Login } from './login/login';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'trips', component: TripList },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }