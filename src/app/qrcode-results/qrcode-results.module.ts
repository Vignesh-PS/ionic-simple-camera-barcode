import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QrcodeResultsPageRoutingModule } from './qrcode-results-routing.module';

import { QrcodeResultsPage } from './qrcode-results.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrcodeResultsPageRoutingModule
  ],
  declarations: [QrcodeResultsPage]
})
export class QrcodeResultsPageModule {}
