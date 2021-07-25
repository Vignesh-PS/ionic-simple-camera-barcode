import { Injectable } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { File } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  constructor(
    private router: Router,
    private camera: Camera,
    private file: File,
    private filePath: FilePath,
    private toast: ToastController
  ) {}

  captureFrontCamera() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      cameraDirection: this.camera.Direction.FRONT,
      correctOrientation: true,
    };
    this.camera
      .getPicture(options)
      .then((imageUri) => {
        console.log('imageUri :>> ', imageUri);
        this.saveImageLocal(imageUri);
        // const captured = {
        //   time: Date.now(),
        //   image: imageUri
        // };
        // this.saveToLocal(captured);
      })
      .catch((err) => {
        this.presentToast('Service not available');
      });
  }

  captureBackCamera() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      cameraDirection: this.camera.Direction.BACK,
    };
    this.camera
      .getPicture(options)
      .then((imageUri) => {
        console.log('imageUri :>> ', imageUri);
        this.saveImageLocal(imageUri);
      })
      .catch((err) => {
        this.presentToast('Service not available');
      });
  }

  chooseFromGallery() {
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
        if (imageUri.indexOf('file://') === -1) {
          imageUri = `file://${imageUri}`;
        }

        this.filePath
          .resolveNativePath(imageUri)
          .then((file) => {
            console.log('fileUrl :>> ', file);
            this.saveImageLocal(file);
          })
          .catch((err) => {
            console.log('err filePath :>> ', err);
            this.presentToast('Service not available');
          });
      })
      .catch((err) => {
        this.presentToast('Service not available');
      });
  }

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

  saveImageLocal(imageUrl: string) {
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
        const captured = {
          time: Date.now(),
          image: storedPhoto,
        };
        console.log('captured :>> ', captured);
        this.saveToLocal(captured);
      })
      .catch((err) => {
        console.log('err :>> ', err);
      });
  }

  saveToLocal(url: any) {
    let imageUrls: any = localStorage.getItem('local_images');
    if (!imageUrls) {
      imageUrls = [];
    } else {
      imageUrls = JSON.parse(imageUrls);
    }

    imageUrls.push(url);

    localStorage.setItem('local_images', JSON.stringify(imageUrls));

    this.router.navigate(['/captured-images']);
  }
}
