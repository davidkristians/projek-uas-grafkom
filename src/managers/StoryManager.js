import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js'; // Import Scene Objek

export class StoryManager {
    constructor(scene, camera, assetManager, sunLight, controls) {
        this.scene = scene;
        this.camera = camera;
        this.assets = assetManager;
        this.controls = controls;

        // Inisialisasi Penata Panggung (Scene1 Objects)
        this.scene1Objects = new Scene1(scene, assetManager);

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;
        
        // --- DATA CAMERA SHOT (Disini tempatnya) ---
        // Posisi Kamera
        this.camStart = new THREE.Vector3(26.67, 76, 99); 
        this.camEnd = new THREE.Vector3(-26, 19.84, 34.99); 
        
        // Arah Pandang (LookAt)
        // Start: Melihat agak ke bawah dari langit
        this.lookAtStart = new THREE.Vector3(0, 0, 0); 
        // End: Fokus ke Steve di dalam rumah
        this.lookAtEnd = new THREE.Vector3(-27.53, 19.84, 33.11); 
        
        this.currentLookAt = new THREE.Vector3();
    }

    startScene1() {
        console.log("🎬 Action: Adegan 1 (Intro Camera Move)");
        if (this.controls) this.controls.enabled = false;

        // 1. Panggil Scene1 untuk tata letak objek (Map & Steve)
        this.scene1Objects.setup();

        // 2. Siapkan Kamera di posisi Start
        this.camera.position.copy(this.camStart);
        this.currentLookAt.copy(this.lookAtStart);
        this.camera.lookAt(this.currentLookAt);
    }

    update(delta) {
        this.assets.update(delta); // Update animasi karakter global

        if (!this.isCinematic) return;

        this.timer += delta;

        // --- CAMERA MOVEMENT LOGIC ---
        if (this.sceneStep === 1) {
            const duration = 12.0;
            const progress = Math.min(this.timer / duration, 1.0); 

            // Gerakkan Kamera (Zoom In)
            this.camera.position.lerpVectors(this.camStart, this.camEnd, progress);
            
            // Gerakkan Kepala Kamera (Panning)
            this.currentLookAt.lerpVectors(this.lookAtStart, this.lookAtEnd, progress);
            this.camera.lookAt(this.currentLookAt);

            if (progress >= 1.0) {
                console.log("Cut! Adegan 1 Selesai.");
                this.switchMode('FREEROAM'); 
                // Nanti kita ganti ini ke Adegan 2
            }
        } 
    }

    switchMode(mode) {
        if (mode === 'FREEROAM') {
            this.isCinematic = false;
            console.log("🎮 Masuk Mode Free Roam");
            
            if (this.controls) {
                this.controls.enabled = true; 
                this.controls.getObject().position.copy(this.camera.position);
                
                const blocker = document.getElementById('blocker');
                if(blocker) blocker.style.display = 'block';
            }
        }
    }
}