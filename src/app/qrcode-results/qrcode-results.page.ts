import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-qrcode-results',
  templateUrl: './qrcode-results.page.html',
  styleUrls: ['./qrcode-results.page.scss'],
})
export class QrcodeResultsPage implements OnInit {

  allCodes: any[] = [];

  constructor() { }

  ngOnInit() {

  }

  ionViewWillEnter(){
    let codes: any = localStorage.getItem('local_qrcodes');
    if(codes && codes !== ''){
      codes = JSON.parse(codes);
      this.allCodes = codes.reverse();
    }
  }

}
