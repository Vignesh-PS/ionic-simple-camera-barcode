import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CapturedImagesPage } from './captured-images.page';

const routes: Routes = [
  {
    path: '',
    component: CapturedImagesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CapturedImagesPageRoutingModule {}
