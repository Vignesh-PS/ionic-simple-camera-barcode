import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QrcodeResultsPage } from './qrcode-results.page';

const routes: Routes = [
  {
    path: '',
    component: QrcodeResultsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QrcodeResultsPageRoutingModule {}
