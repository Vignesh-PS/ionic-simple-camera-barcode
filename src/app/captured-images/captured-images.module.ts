import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CapturedImagesPageRoutingModule } from './captured-images-routing.module';

import { CapturedImagesPage } from './captured-images.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CapturedImagesPageRoutingModule
  ],
  declarations: [CapturedImagesPage]
})
export class CapturedImagesPageModule {}
