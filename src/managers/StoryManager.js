import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js';
import { Scene2 } from '../scenes/Scene2.js';
import { Scene3 } from '../scenes/Scene3.js';
import { Scene4 } from '../scenes/Scene4.js';
import { Scene5 } from '../scenes/Scene5.js'; // Import Scene 5

import { Scene1Shots } from '../animations/Scene1Shots.js';
import { Scene2Shots } from '../animations/Scene2Shots.js';
import { Scene3Shots } from '../animations/Scene3Shots.js';
import { Scene4Shots } from '../animations/Scene4Shots.js';
import { Scene5Shots } from '../animations/Scene5Shots.js'; // Import Shots 5

export class StoryManager {
    constructor(scene, camera, assetManager, sunLight, controls) {
        this.scene = scene;
        this.camera = camera;
        this.assets = assetManager;
        this.controls = controls;
        this.sunLight = sunLight;

        // Scenes
        this.scene1Objects = new Scene1(scene, assetManager);
        this.scene2Objects = new Scene2(scene, assetManager);
        this.scene3Objects = new Scene3(this.scene2Objects); // Logic Dialog
        this.scene4Objects = new Scene4(scene, assetManager, this.scene2Objects);
        this.scene5Objects = new Scene5(scene, assetManager, this.scene2Objects, this.scene1Objects);

        // Shots
        this.scene1Shots = new Scene1Shots();
        this.scene2Shots = new Scene2Shots();
        this.scene3Shots = new Scene3Shots(); // Camera Dialog
        this.scene4Shots = new Scene4Shots(); // Camera Follow
        this.scene5Shots = new Scene5Shots(); // Init Shots 5

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;

        // UI
        this.subtitle = this.createSubtitle("WELCOME TO STEVE'S HOUSE");
        this.fadeOverlay = this.createFadeOverlay();
        this.cinematicBars = this.createCinematicBars();

        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyR' && this.isCinematic) {
                this.forceFreeRoam();
            }
        });
    }

    startScene1() {
        console.log("🎬 Action: Scene 1");
        if (this.controls) this.controls.enabled = false;

        this.scene1Objects.setup();
        this.scene1Shots.reset(this.camera);
        this.scene2Objects.setup();
        this.scene3Objects.setup();
        this.scene4Objects.setup();
        this.scene5Objects.setup(); // Setup Scene 5

        if (this.sunLight) {
            this.sunLight.intensity = 1.5;
            this.sunLight.color.setHex(0xffdf80);
            this.sunLight.position.set(50, 20, 50);
        }
    }

    update(delta) {
        this.assets.update(delta);

        if (!this.isCinematic) return;

        const safeDelta = delta > 0.1 ? 0.016 : delta;
        this.timer += safeDelta;

        // FADE IN
        if (this.timer < 1.2) {
            if (this.fadeOverlay) this.fadeOverlay.style.background = 'black';
        } else if (this.timer < 3.5) {
            const duration = 3.0;
            const rawProgress = (this.timer - 0.5) / duration;
            const progress = Math.min(rawProgress, 1.0);
            const easeProgress = progress * progress;
            const radius = easeProgress * 150;
            if (this.fadeOverlay) this.fadeOverlay.style.background = `radial-gradient(circle, transparent ${radius}%, black ${radius + 20}%)`;
        } else {
            if (this.fadeOverlay) this.fadeOverlay.style.opacity = '0';
        }

        // ===========================================
        // 🎬 SCENE 1 (Interior) - 12 Detik
        // ===========================================
        if (this.sceneStep === 1) {
            const durationS1 = 12.0;
            const progress = Math.min(this.timer / durationS1, 1.0);

            this.scene1Shots.update(this.camera, progress);

            if (progress > 0.58 && progress < 0.7) {
                if (this.subtitle) this.subtitle.style.opacity = '1';
            } else {
                if (this.subtitle) this.subtitle.style.opacity = '0';
            }

            const door = this.scene1Objects.door;
            const door2 = this.scene1Objects.door2;
            if (door) {
                const startOpen = 0.45; const endOpen = 0.75;
                if (progress >= startOpen && progress <= endOpen) {
                    const dProg = (progress - startOpen) / (endOpen - startOpen);
                    door.rotation.y = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-90), dProg);
                    door.position.x = THREE.MathUtils.lerp(-27.5, -28.25, dProg);
                    door2.rotation.y = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(270), dProg);
                    door2.position.x = THREE.MathUtils.lerp(-26.5, -25.75, dProg);
                } else if (progress > endOpen) {
                    door.rotation.y = THREE.MathUtils.degToRad(-90);
                    door2.rotation.y = THREE.MathUtils.degToRad(270);
                }
            }

            if (progress >= 1.0) {
                console.log("🎬 Cut: Masuk Scene 2");
                if (this.scene1Objects.steve) this.scene1Objects.steve.visible = false;

                this.sceneStep = 2;
                this.timer = 0;

                if (this.subtitle) {
                    this.subtitle.innerText = "MEETING ALEX";
                    this.subtitle.style.opacity = '1';
                    setTimeout(() => { if (this.subtitle) this.subtitle.style.opacity = '0'; }, 4000);
                }
                this.scene2Objects.startAnimation();
            }
        }
        // ===========================================
        // 🎬 SCENE 2 (Third Person Walk) - 12 Detik
        // ===========================================
        else if (this.sceneStep === 2) {
            const durationS2 = 12.0;

            this.scene2Objects.update(safeDelta);
            const stevePos = this.scene2Objects.getStevePosition();
            this.scene2Shots.update(this.camera, this.timer, durationS2, stevePos);

            if (this.timer >= durationS2) {
                // PINDAH KE SCENE 3 (FPV Dialog)
                this.sceneStep = 3;
                this.timer = 0;

                // Init Scene 3
                this.scene3Objects.start();

                // Init Kamera FPV
                const aPos = this.scene2Objects.getAlexHeadPosition();
                this.scene3Shots.setupCamera(this.camera, aPos);
            }
        }
        // ===========================================
        // 🎬 SCENE 3 (First Person Dialog)
        // ===========================================
        else if (this.sceneStep === 3) {
            this.scene2Objects.update(safeDelta); // Animasi background

            const currentState = this.scene3Objects.state;
            const alexHead = this.scene2Objects.getAlexHeadPosition();

            // Logic UI
            this.scene3Objects.update(safeDelta, this.timer, this.camera);

            // Logic Kamera
            this.scene3Shots.update(this.camera, this.timer, alexHead, currentState);

            // Transisi Pertanyaan
            if (this.timer > 7.0) {
                if (currentState === 1) {
                    this.scene3Objects.setQuestionData(2);
                    this.timer = 0;
                } else if (currentState === 2) {
                    // Selesai Scene3, pindah ke Scene4
                    this.scene3Objects.end();
                    this.sceneStep = 4;
                    this.timer = 0;
                    this.scene4Objects.start();

                    // Setup kamera untuk Scene4
                    const stevePos = this.scene4Objects.stevePathPoints[0];
                    this.scene4Shots.setupCamera(this.camera, stevePos);
                }
            }
        }
        // ===========================================
        // 🎬 SCENE 4 (Steve Walking)
        // ===========================================
        else if (this.sceneStep === 4) {
            this.scene4Objects.update(safeDelta);

            // Update kamera ikuti karakter
            const currentPos = this.scene4Objects.getCurrentPosition();
            this.scene4Shots.update(this.camera, currentPos, this.scene4Objects.currentPhase, this.scene4Objects.phaseTimer);

            // Cek apakah Scene4 sudah selesai
            if (this.scene4Objects.isDone()) {
                console.log("🎬 Scene 4 selesai, Masuk Scene 5 (Invasion)");
                
                this.sceneStep = 5;
                this.timer = 0;

                // Matikan objek scene 4 agar tidak double
                if(this.scene4Objects.steveStatic) this.scene4Objects.steveStatic.visible = false;
                if(this.scene4Objects.alexStatic) this.scene4Objects.alexStatic.visible = false;

                // Mulai Scene 5 & Pass SunLight untuk trigger Night Mode
                this.scene5Objects.start(this.sunLight);

                // Tampilkan judul baru
                if (this.subtitle) {
                    this.subtitle.innerText = "THE NIGHT INVASION";
                    this.subtitle.style.opacity = '1';
                    this.subtitle.style.color = 'red'; // Efek dramatis
                    this.subtitle.style.textShadow = '3px 3px 6px #500';
                    setTimeout(() => { 
                        if (this.subtitle) {
                            this.subtitle.style.opacity = '0';
                            this.subtitle.style.color = 'white'; 
                            this.subtitle.style.textShadow = '3px 3px 6px black';
                        }
                    }, 4000);
                }
            }
        }
        // ===========================================
        // 🎬 SCENE 5 (Night Invasion) - 20 Detik
        // ===========================================

        else if (this.sceneStep === 5) {
            // UBAH DURASI JADI 20.0 AGAR SEMUA FASE SELESAI
            const durationS5 = 20.0; 
            
            this.scene5Objects.update(safeDelta);
            this.scene5Shots.update(this.camera, this.timer);

            if (this.timer >= durationS5) {
                console.log("🎬 Cinematic Selesai, masuk Free Roam");
                
                // PENTING: Reset FOV kembali normal sebelum user main
                this.camera.fov = 50;
                this.camera.updateProjectionMatrix();
                
                this.switchMode('FREEROAM');
            }
        }
    }

    createSubtitle(text) {
        const div = document.createElement('div');
        div.innerText = text; div.style.position = 'absolute'; div.style.top = '70%'; div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)'; div.style.color = 'white';
        div.style.fontFamily = "'Minecraft', 'Arial', sans-serif"; div.style.fontSize = '40px';
        div.style.fontWeight = 'bold'; div.style.textShadow = '3px 3px 6px black';
        div.style.opacity = '0'; div.style.transition = 'opacity 1s ease-in-out';
        div.style.pointerEvents = 'none'; div.style.width = '100%'; div.style.textAlign = 'center'; div.style.zIndex = '10';
        document.body.appendChild(div); return div;
    }

    createFadeOverlay() {
        const div = document.createElement('div');
        div.style.position = 'fixed'; div.style.top = '0'; div.style.left = '0';
        div.style.width = '100vw'; div.style.height = '100vh';
        div.style.backgroundColor = 'black'; div.style.zIndex = '999';
        div.style.pointerEvents = 'none'; document.body.appendChild(div); return div;
    }

    createCinematicBars() {
        const barHeight = '10%';
        const topBar = document.createElement('div');
        topBar.style.position = 'fixed'; topBar.style.top = '0'; topBar.style.left = '0';
        topBar.style.width = '100%'; topBar.style.height = barHeight; topBar.style.backgroundColor = 'black'; topBar.style.zIndex = '50';
        topBar.style.transition = 'top 1s ease-in-out';
        const bottomBar = document.createElement('div');
        bottomBar.style.position = 'fixed'; bottomBar.style.bottom = '0'; bottomBar.style.left = '0';
        bottomBar.style.width = '100%'; bottomBar.style.height = barHeight; bottomBar.style.backgroundColor = 'black'; bottomBar.style.zIndex = '50';
        bottomBar.style.transition = 'bottom 1s ease-in-out';
        document.body.appendChild(topBar); document.body.appendChild(bottomBar);
        return { top: topBar, bottom: bottomBar };
    }

    forceFreeRoam() {
        console.log("⏩ SKIP -> Free Roam");
        if (this.scene3Objects.isActive) this.scene3Objects.end();
        this.switchMode('FREEROAM');
    }

    switchMode(mode) {
        if (mode === 'FREEROAM') {
            this.isCinematic = false;
            this.sceneStep = 0;
            if (this.subtitle) this.subtitle.style.opacity = '0';
            if (this.fadeOverlay) this.fadeOverlay.style.display = 'none';
            if (this.cinematicBars) {
                this.cinematicBars.top.style.top = '-15%';
                this.cinematicBars.bottom.style.bottom = '-15%';
            }

            console.log("🎮 Mode: Free Roam");
            
            // --- RESET LIGHTING KE SIANG (DAY MODE) ---
            if (this.sunLight) {
                this.sunLight.intensity = 1.5;
                this.sunLight.color.setHex(0xffdf80); // Kembali ke kuning hangat
            }
            
            // Reset Ambient Light ke normal
            this.scene.traverse((child) => {
                if (child.isAmbientLight) {
                    child.intensity = 0.5; // Reset intensity
                }
            });

            // Matikan Obor Scene 5
            if (this.scene5Objects.torchLight) {
                this.scene5Objects.torchLight.visible = false;
            }

            if (this.controls) {
                const walls = this.scene1Objects.getColliders();
                this.controls.setColliders(walls);
                this.controls.enabled = true;

                const door = this.scene1Objects.door;
                if (door) door.rotation.y = THREE.MathUtils.degToRad(-90);

                const blocker = document.getElementById('blocker');
                if (blocker) blocker.style.display = 'block';
            }
        }
    }
}