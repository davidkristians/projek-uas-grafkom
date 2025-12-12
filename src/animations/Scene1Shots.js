import * as THREE from 'three';

export class Scene1Shots {
    constructor() {
        // --- ALUR KAMERA (PATH) ---
        // Ini menghubungkan 5 titik menjadi satu garis lengkung yang mulus
        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3( 48.33, 83.04, 102.88),    // Titik 1: START (Langit)
            
            // --- ISI TITIK TENGAH SESUAI SCREENSHOT ANDA ---
            new THREE.Vector3(17.01, 63.03, 100.51),       // Titik 2: (Contoh - Ganti koordinatnya)
            new THREE.Vector3(-22.22, 38.04, 103.21),        // Titik 3: (Contoh - Ganti koordinatnya)
            new THREE.Vector3(-26.56, 18.94, 44.17),  
            new THREE.Vector3( -27.06, 19.19, 35.11),    // Titik 4: (Contoh - Ganti koordinatnya)
            
            new THREE.Vector3(-26, 19.84, 34.99) // Titik 5: END (Dalam Rumah)
        ]);

        // --- ARAH PANDANG (LOOK AT) ---
        // Kamera akan perlahan berputar dari melihat desa (Start) ke Steve (End)
        this.lookAtStart = new THREE.Vector3(-27.05, 19.10, 34.21); 
        this.lookAtEnd = new THREE.Vector3(-27.53, 19.84, 33.11); 
        
        this.currentLookAt = new THREE.Vector3();
        this.dummyPos = new THREE.Vector3(); // Variabel bantuan
    }

    reset(camera) {
        // Set posisi awal di titik 0 kurva
        this.curve.getPoint(0, this.dummyPos);
        camera.position.copy(this.dummyPos);
        camera.lookAt(this.lookAtStart);
    }

    update(camera, progress) {
        // 1. Gerakkan Kamera mengikuti Kurva (Alur)
        // getPoint mengambil koordinat di kurva berdasarkan progress (0.0 sampai 1.0)
        this.curve.getPoint(progress, this.dummyPos);
        camera.position.copy(this.dummyPos);

        // 2. Putar Kepala Kamera
        this.currentLookAt.lerpVectors(this.lookAtStart, this.lookAtEnd, progress);
        camera.lookAt(this.currentLookAt);
    }
}