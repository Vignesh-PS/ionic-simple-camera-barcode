import { Component, OnInit } from '@angular/core';
import { WebView } from '@ionic-native/ionic-webview/ngx';

@Component({
  selector: 'app-captured-images',
  templateUrl: './captured-images.page.html',
  styleUrls: ['./captured-images.page.scss'],
})
export class CapturedImagesPage implements OnInit {

  allImages: any[]= [];

  constructor(private web: WebView) { }

  ngOnInit() {
  }

  ionViewWillEnter(){
    let images: any = localStorage.getItem('local_images');
    if(images && images !==''){
      images = JSON.parse(images);
      this.allImages = images.reverse();
      this.allImages = this.allImages.map(imageIndividual =>{
        imageIndividual.image = this.web.convertFileSrc(imageIndividual.image);
        return imageIndividual;
      });
    }
  }

}
