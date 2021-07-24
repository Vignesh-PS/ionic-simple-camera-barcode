import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CameraService } from './camera-service.service';
import { QrcodeService } from './qrcode-service.service';
// eslint-disable-next-line @typescript-eslint/naming-convention
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  imagesCount: number;
  codesCount: number;
  constructor(private camService: CameraService, private qrservice: QrcodeService, private alertCtrl: AlertController) {}

  /**
   * Camera actions* @param action string
   */
  clickCamera(action: string){
    switch(action){
      case 'front':
        this.camService.captureFrontCamera();
        break;
        case 'back':
        this.camService.captureBackCamera();
        break;
      case 'gallery':
        this.camService.chooseFromGallery();
        break;
        default:
        this.camService.chooseFromGallery();
        break;
    }
  }

  /**
   * Scanner actions* @param action string
   */
  clickScanner(action: string){
    switch(action){
      case 'camera':
        this.qrservice.readFromCamera();
        break;
      case 'gallery':
        this.qrservice.readFromGallery();
        break;
      default:
        break;
    }
  }

  /**
   * For take count for saved images and codes
   */
  ionViewWillEnter(){
    let images: any = localStorage.getItem('local_images');
    if(images && images !==''){
      images = JSON.parse(images);
      this.imagesCount = images.length;
    }else{
      this.imagesCount = 0;
    }

    let codes: any = localStorage.getItem('local_qrcodes');
    if(codes && codes !== ''){
      codes = JSON.parse(codes);
      this.codesCount = codes.length;
    }else{
      this.codesCount = 0;
    }
  }

  resetValues(){
    this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Are you sure to clear all data..?',
      buttons:[
        {
          text: 'Cancel',
          role: 'cancel'
        },{
          text: 'Ok',
          handler: ()=>{
            localStorage.clear();
            this.ionViewWillEnter();
          }
        }
      ]
    }).then(alertData=>{
      alertData.present();
    });
  }
}
