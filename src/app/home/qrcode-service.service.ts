import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Decoder } from '@nuintun/qrcode';
import { File } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { ToastController } from '@ionic/angular';

// eslint-disable-next-line @typescript-eslint/naming-convention
// declare let QRCode: any;

@Injectable({
  providedIn: 'root',
})
export class QrcodeService {
  constructor(
    private router: Router,
    private barcodeScanner: BarcodeScanner,
    private camera: Camera,
    private web: WebView,
    private file: File,
    private filePath: FilePath,
    private toast: ToastController
  ) {}

  async presentToast(msg: string) {
    const toast = await this.toast.create({
      message: msg,
      duration: 4500,
      position: 'bottom',
      cssClass: 'toaster-common',
      animated: true,
      buttons: [
        {
          text: 'X',
          role: 'cancel',
        },
      ],
    });
    toast.present();
  }

  readFromCamera() {
    this.barcodeScanner
      .scan()
      .then((barcode) => {
        console.log('Barcode data', barcode);
        if(barcode.text === '' || !barcode.text){
          return;
        }
        const code = {
          time: Date.now(),
          code: barcode.text,
        };
        this.saveCodesLocal(code);
      })
      .catch((err) => {
        console.log('Error', err);
      });
  }

  readFromGallery() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
    };
    this.camera
      .getPicture(options)
      .then((imageUri) => {
        console.log('imageUri :>> ', imageUri);
         //Check is it a native path or not
      if(imageUri.indexOf('file://')===-1){
        imageUri=`file://${imageUri}`;
      }
        this.filePath.resolveNativePath(imageUri).then(file=>{
          console.log('fileUrl :>> ', file);
          this.relocateGallerFile(file);
        })
        .catch(err=>{
          console.log('err filePath :>> ', err);
          this.presentToast('Service not available');
        });
      })
      .catch((err) => {
        this.presentToast('Service not available');
      });
  }

  relocateGallerFile(imageUrl: string) {
    const qrcode = new Decoder();
    const tempFilename = imageUrl.substr(imageUrl.lastIndexOf('/') + 1);
    const tempBaseFilesystemPath = imageUrl.substr(
      0,
      imageUrl.lastIndexOf('/') + 1
    );
    const newBaseFilesystemPath = this.file.dataDirectory;
    this.file
      .copyFile(
        tempBaseFilesystemPath,
        tempFilename,
        newBaseFilesystemPath,
        tempFilename
      )
      .then((res) => {
        const storedPhoto = newBaseFilesystemPath + tempFilename;
        const image = this.web.convertFileSrc(storedPhoto);
        qrcode
        .scan(image)
        .then((result) => {
          console.log(result.data);
          const code = {
            time: Date.now(),
            code: result.data,
          };
          this.saveCodesLocal(code);
        })
        .catch((error) => {
          this.presentToast('Service not available');
          console.error(error);
        });
      })
      .catch((err) => {
        console.log('err :>> ', err);
      });
  }

  saveCodesLocal(code: any) {
    let qrCodes: any = localStorage.getItem('local_qrcodes');
    if (!qrCodes) {
      qrCodes = [];
    } else {
      qrCodes = JSON.parse(qrCodes);
    }

    qrCodes.push(code);

    localStorage.setItem('local_qrcodes', JSON.stringify(qrCodes));

    this.router.navigate(['/qrcode-results']);
  }
}
