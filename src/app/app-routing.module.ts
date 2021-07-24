import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'captured-images',
    loadChildren: () => import('./captured-images/captured-images.module').then( m => m.CapturedImagesPageModule)
  },
  {
    path: 'qrcode-results',
    loadChildren: () => import('./qrcode-results/qrcode-results.module').then( m => m.QrcodeResultsPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
