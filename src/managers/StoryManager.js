import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js'; // Import Scene Objek

export class StoryManager {
    constructor(scene, camera, assetManager, sunLight, controls) {
        this.scene = scene;
        this.camera = camera;
        this.assets = assetManager;
        this.controls = controls;

        // Inisialisasi Scene 1 Objects
        this.scene1Objects = new Scene1(scene, assetManager);

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;
        
        // --- DATA KAMERA ---
        this.camStart = new THREE.Vector3(26.67, 76, 99); 
        this.camEnd = new THREE.Vector3(-26, 19.84, 34.99); 
        
        this.lookAtStart = new THREE.Vector3(0, 0, 0); 
        this.lookAtEnd = new THREE.Vector3(-27.53, 19.84, 33.11); 
        
        this.currentLookAt = new THREE.Vector3();

        // --- BARU: EVENT LISTENER TOMBOL 'R' ---
        window.addEventListener('keydown', (event) => {
            // Cek jika tombol R ditekan DAN masih mode cinematic
            if (event.code === 'KeyR' && this.isCinematic) {
                this.forceFreeRoam();
            }
        });
    }

    startScene1() {
        console.log("🎬 Action: Adegan 1 (Intro)");
        if (this.controls) this.controls.enabled = false;

        // Setup objek panggung
        this.scene1Objects.setup();

        // Setup posisi awal kamera
        this.camera.position.copy(this.camStart);
        this.currentLookAt.copy(this.lookAtStart);
        this.camera.lookAt(this.currentLookAt);
    }

    update(delta) {
        this.assets.update(delta); 

        if (!this.isCinematic) return;

        this.timer += delta;

        // --- UPDATE ADEGAN 1 ---
        if (this.sceneStep === 1) {
            const duration = 12.0;
            const progress = Math.min(this.timer / duration, 1.0); 

            // Gerakkan Kamera
            this.camera.position.lerpVectors(this.camStart, this.camEnd, progress);
            this.currentLookAt.lerpVectors(this.lookAtStart, this.lookAtEnd, progress);
            this.camera.lookAt(this.currentLookAt);

            // Jika durasi habis, masuk Free Roam otomatis
            if (progress >= 1.0) {
                console.log("Adegan 1 Selesai. Auto Free Roam.");
                this.switchMode('FREEROAM'); 
            }
        } 
    }

    // Fungsi Paksa Skip
    forceFreeRoam() {
        console.log("⏩ SKIP DITEKAN: Pindah ke Free Roam");
        this.switchMode('FREEROAM');
    }

    switchMode(mode) {
        if (mode === 'FREEROAM') {
            this.isCinematic = false;
            this.sceneStep = 0; // Matikan step scene
            
            console.log("🎮 Masuk Mode Free Roam");
            
            if (this.controls) {
                this.controls.enabled = true; 
                // Pindahkan badan player ke posisi kamera saat ini (agar mulus)
                this.controls.getObject().position.copy(this.camera.position);
                
                const blocker = document.getElementById('blocker');
                if(blocker) blocker.style.display = 'block';
            }
        }
    }
}