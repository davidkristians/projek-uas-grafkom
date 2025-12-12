import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js';
import { Scene1Shots } from '../animations/Scene1Shots.js'; // Import File Baru

export class StoryManager {
    constructor(scene, camera, assetManager, sunLight, controls) {
        this.scene = scene;
        this.camera = camera;
        this.assets = assetManager;
        this.controls = controls;

        // Setup Panggung (Objek)
        this.scene1Objects = new Scene1(scene, assetManager);
        
        // Setup Kamera (Alur/Shots)
        this.scene1Shots = new Scene1Shots();

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;

        // Shortcut SKIP (Tekan R)
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyR' && this.isCinematic) {
                this.forceFreeRoam();
            }
        });
    }

    startScene1() {
        console.log("🎬 Action: Adegan 1 (Intro)");
        if (this.controls) this.controls.enabled = false;

        // 1. Munculkan Objek
        this.scene1Objects.setup();

        // 2. Reset Kamera ke Titik Awal Alur
        this.scene1Shots.reset(this.camera);
    }

    update(delta) {
        this.assets.update(delta); 

        if (!this.isCinematic) return;

        this.timer += delta;

        // --- UPDATE ADEGAN 1 ---
        if (this.sceneStep === 1) {
            const duration = 12.0; // Durasi 12 detik
            const progress = Math.min(this.timer / duration, 1.0); 

            // PANGGIL ANIMASI DARI FILE TERPISAH
            this.scene1Shots.update(this.camera, progress);

            // Cek Selesai
            if (progress >= 1.0) {
                console.log("Adegan 1 Selesai.");
                this.switchMode('FREEROAM'); 
                // Nanti diganti: this.startScene2();
            }
        } 
    }

    forceFreeRoam() {
        console.log("⏩ SKIP -> Free Roam");
        this.switchMode('FREEROAM');
    }

    switchMode(mode) {
        if (mode === 'FREEROAM') {
            this.isCinematic = false;
            this.sceneStep = 0;
            console.log("🎮 Mode: Free Roam");
            
            if (this.controls) {
                this.controls.enabled = true; 
                this.controls.getObject().position.copy(this.camera.position);
                
                const blocker = document.getElementById('blocker');
                if(blocker) blocker.style.display = 'block';
            }
        }
    }
}