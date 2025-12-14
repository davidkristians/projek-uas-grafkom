import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js';
import { Scene1Shots } from '../animations/Scene1Shots.js'; 

export class StoryManager {
    constructor(scene, camera, assetManager, sunLight, controls) {
        this.scene = scene;
        this.camera = camera;
        this.assets = assetManager;
        this.controls = controls;
        this.sunLight = sunLight; 

        // Setup Scene & Animasi
        this.scene1Objects = new Scene1(scene, assetManager);
        this.scene1Shots = new Scene1Shots();

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;

        // --- UI VISUAL ---
        this.subtitle = this.createSubtitle("WELCOME TO STEVE'S HOUSE");
        this.fadeOverlay = this.createFadeOverlay(); // Layar Hitam
        this.cinematicBars = this.createCinematicBars(); 

        // Event Listener Skip (Tekan R)
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyR' && this.isCinematic) {
                this.forceFreeRoam();
            }
        });
    }

    startScene1() {
        console.log("🎬 Action: Adegan 1 (Intro)");
        if (this.controls) this.controls.enabled = false;

        // 1. Setup Panggung
        this.scene1Objects.setup();

        // 2. Setup Kamera
        this.scene1Shots.reset(this.camera);

        // 3. Setup Suasana Pagi
        if(this.sunLight) {
            this.sunLight.intensity = 1.5;
            this.sunLight.color.setHex(0xffdf80); 
            this.sunLight.position.set(50, 20, 50); 
        }
    }

    update(delta) {
        this.assets.update(delta); 

        if (!this.isCinematic) return;

        // --- ANTI LAG ---
        const safeDelta = delta > 0.1 ? 0.016 : delta;
        this.timer += safeDelta;

        // --- FADE IN EFFECT (IRIS) ---
        if (this.timer < 1.2) {
            if (this.fadeOverlay) this.fadeOverlay.style.background = 'black'; 
        } 
        else if (this.timer < 3.5) {
            const duration = 3.0; 
            const rawProgress = (this.timer - 0.5) / duration;
            const progress = Math.min(rawProgress, 1.0);
            const easeProgress = progress * progress; 
            const radius = easeProgress * 150; 
            
            if (this.fadeOverlay) {
                this.fadeOverlay.style.background = `radial-gradient(circle, transparent ${radius}%, black ${radius + 20}%)`;
            }
        } 
        else {
            if (this.fadeOverlay) {
                this.fadeOverlay.style.opacity = '0'; 
                this.fadeOverlay.style.pointerEvents = 'none'; 
            }
        }

        // --- UPDATE ADEGAN 1 ---
        if (this.sceneStep === 1) {
            const duration = 12.0; 
            const progress = Math.min(this.timer / duration, 1.0); 

            // 1. Gerakkan Kamera
            this.scene1Shots.update(this.camera, progress);

            // 2. Teks Muncul
            if (progress > 0.58 && progress < 0.7) {
                if(this.subtitle) this.subtitle.style.opacity = '1';
            } else {
                if(this.subtitle) this.subtitle.style.opacity = '0';
            }

            // =========================================================
            // 🚪 3. ANIMASI PINTU TERBUKA (Progress 85% - 95%) 🚪
            // =========================================================
            const door = this.scene1Objects.door; // Ambil pintu dari Scene1
            const door2 = this.scene1Objects.door2; // Ambil pintu dari Scene1
            
            if (door) {
                const startOpen = 0.45; 
                const endOpen = 0.75;   

                const startRot = THREE.MathUtils.degToRad(0);   
                const targetRot = THREE.MathUtils.degToRad(-90); 
                const startX=-27.5; 
                const targetX= -28.25; 

                const startRot2 = THREE.MathUtils.degToRad(180);   
                const targetRot2 = THREE.MathUtils.degToRad(270); 
                const startX2=-26.5; 
                const targetX2= -25.75; 

                if (progress >= startOpen && progress <= endOpen) {
                    const doorProgress = (progress - startOpen) / (endOpen - startOpen);
                    door.rotation.y = THREE.MathUtils.lerp(startRot, targetRot, doorProgress);
                    door.position.x = THREE.MathUtils.lerp(startX, targetX, doorProgress);

                    door2.rotation.y = THREE.MathUtils.lerp(startRot2, targetRot2, doorProgress);
                    door2.position.x = THREE.MathUtils.lerp(startX2, targetX2, doorProgress);
                } 
                else if (progress > endOpen) {
                    door.rotation.y = targetRot;
                    door.position.x = targetX;
                    door2.rotation.y = targetRot2;
                    door2.position.x = targetX2;
                }
            }
            // =========================================================

            // 4. Selesai -> Pindah Free Roam
            if (progress >= 1.0) {
                console.log("Adegan 1 Selesai.");
                this.switchMode('FREEROAM'); 
            }
        } 
    }

    createSubtitle(text) {
        const div = document.createElement('div');
        div.innerText = text;
        div.style.position = 'absolute'; 
        div.style.top = '60%'; 
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)'; 
        div.style.color = 'white';
        div.style.fontFamily = "'Minecraft', 'Arial', sans-serif"; 
        div.style.fontSize = '60px'; 
        div.style.fontWeight = 'bold';
        div.style.textShadow = '4px 4px 8px black';
        div.style.opacity = '0'; 
        div.style.transition = 'opacity 1s ease-in-out'; 
        div.style.pointerEvents = 'none'; 
        div.style.width = '100%'; 
        div.style.textAlign = 'center';
        div.style.zIndex = '10'; 
        document.body.appendChild(div);
        return div;
    }

    createFadeOverlay() {
        const div = document.createElement('div');
        div.style.position = 'fixed'; 
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100vw'; 
        div.style.height = '100vh'; 
        div.style.backgroundColor = 'black'; 
        div.style.background = 'black';      
        div.style.zIndex = '999'; 
        div.style.pointerEvents = 'none';
        div.style.transition = 'opacity 1s'; 
        document.body.appendChild(div);
        return div;
    }

    createCinematicBars() {
        const barHeight = '10%'; 
        const topBar = document.createElement('div');
        topBar.style.position = 'fixed'; 
        topBar.style.top = '0';
        topBar.style.left = '0';
        topBar.style.width = '100%';
        topBar.style.height = barHeight;
        topBar.style.backgroundColor = 'black';
        topBar.style.zIndex = '50'; 
        topBar.style.transition = 'top 1s ease-in-out'; 

        const bottomBar = document.createElement('div');
        bottomBar.style.position = 'fixed'; 
        bottomBar.style.bottom = '0';
        bottomBar.style.left = '0';
        bottomBar.style.width = '100%';
        bottomBar.style.height = barHeight;
        bottomBar.style.backgroundColor = 'black';
        bottomBar.style.zIndex = '50';
        bottomBar.style.transition = 'bottom 1s ease-in-out';

        document.body.appendChild(topBar);
        document.body.appendChild(bottomBar);

        return { top: topBar, bottom: bottomBar };
    }

    forceFreeRoam() {
        console.log("⏩ SKIP -> Free Roam");
        this.switchMode('FREEROAM');
    }

    switchMode(mode) {
        if (mode === 'FREEROAM') {
            this.isCinematic = false;
            this.sceneStep = 0;
            
            if(this.subtitle) this.subtitle.style.opacity = '0';
            
            if(this.fadeOverlay) {
                this.fadeOverlay.style.opacity = '0';
                setTimeout(() => { 
                    if(this.fadeOverlay) this.fadeOverlay.style.display = 'none'; 
                }, 1000);
            }
            
            if (this.cinematicBars) {
                this.cinematicBars.top.style.top = '-15%';
                this.cinematicBars.bottom.style.bottom = '-15%';
            }

            console.log("🎮 Mode: Free Roam");
            
            if (this.controls) {
                // [BARU] Setup Collision dari Scene 1
                const walls = this.scene1Objects.getColliders();
                this.controls.setColliders(walls);

                this.controls.enabled = true; 
                
                const door = this.scene1Objects.door;
                if(door) door.rotation.y = THREE.MathUtils.degToRad(135);

                const blocker = document.getElementById('blocker');
                if(blocker) blocker.style.display = 'block';
            }
        }
    }
}