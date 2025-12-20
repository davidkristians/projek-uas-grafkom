import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js';
import { Scene2 } from '../scenes/Scene2.js';
import { Scene3 } from '../scenes/Scene3.js';
import { Scene4 } from '../scenes/Scene4.js';
import { Scene1Shots } from '../animations/Scene1Shots.js';
import { Scene2Shots } from '../animations/Scene2Shots.js';
import { Scene3Shots } from '../animations/Scene3Shots.js';
import { Scene4Shots } from '../animations/Scene4Shots.js';

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

        // Shots
        this.scene1Shots = new Scene1Shots();
        this.scene2Shots = new Scene2Shots();
        this.scene3Shots = new Scene3Shots(); // Camera Dialog
        this.scene4Shots = new Scene4Shots(); // Camera Follow

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;

        // UI
        this.subtitle = this.createSubtitle("SELAMAT DATANG DI RUMAH STEVE");
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
                    this.subtitle.innerText = "BERTEMU ALEX";
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
            this.scene2Objects.update(safeDelta); // Animasi background (lebah dll)

            const currentState = this.scene3Objects.state;
            const alexHead = this.scene2Objects.getAlexHeadPosition();

            // Logic UI
            this.scene3Objects.update(safeDelta, this.timer, this.camera);

            // Logic Kamera (Rotasi Kepala Steve)
            this.scene3Shots.update(this.camera, this.timer, alexHead, currentState);

            // Transisi Pertanyaan
            if (this.timer > 7.0) {
                if (currentState === 1) {
                    // Lanjut Q2
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

            // Update kamera ikuti karakter aktif (Steve atau Alex)
            const currentPos = this.scene4Objects.getCurrentPosition();
            this.scene4Shots.update(this.camera, currentPos, this.scene4Objects.currentPhase, this.scene4Objects.phaseTimer);

            // Cek apakah Scene4 sudah selesai
            if (this.scene4Objects.isDone()) {
                console.log("🎬 Scene 4 selesai, masuk Scene 5 (Day-Night)");
                this.sceneStep = 5;
                this.timer = 0;

                // Setup Scene 5 Camera
                // "Buatkan kamera -24.35, 21.43, 21.86"
                this.camera.position.set(-24.35, 21.43, 21.86);
                this.camera.lookAt(0, 15, 45); // Asumsi lihat ke tengah world/rumah

                // Setup Sun Animation Variables
                this.sunElevation = 20; // Start dari agak sore (20 derajat)
                this.sunAzimuth = 180;  // Posisi Matahari (Selatan/Barat)

                // Aktifkan Procedural Sky (Sembunyikan HDR statis)
                if (this.scene.background && this.scene.background.isTexture) {
                    this.oldBackground = this.scene.background;
                    this.scene.background = null; // Hapus HDR
                }

                // Ambil referensi sky & sun dari lighting setup 
                // (Note: StoryManager perlu akses ke objek sky/sunLight yang dibuat di lighting.js
                // Tapi lighting.js setup dipanggil di main.js. 
                // Kita perlu pass 'sky' object ke StoryManager atau akses global.
                // SOLUSI: Kita asumsikan 'sky' ada di scene.children atau di-pass via constructor.
                // Untuk cepatnya, cari di scene children.)

                this.skyMesh = this.scene.children.find(c => c.isMesh && c.material && c.material.uniforms && c.material.uniforms.sunPosition);
                if (this.skyMesh) {
                    this.skyMesh.visible = true;
                    console.log("☀ Sky Mesh Activated");
                }
            }
        }
        // ===========================================
        // 🎬 SCENE 5 (Day to Night Transition) - 10 Detik
        // ===========================================
        else if (this.sceneStep === 5) {
            const durationS5 = 10.0;
            const progress = Math.min(this.timer / durationS5, 1.0);

            // Animate Sun Elevation (20 deg -> -5 deg / Night)
            // 0 deg = Horizon (Sunset)
            const currentElevation = THREE.MathUtils.lerp(20, -5, progress);

            // Perlu import updateSunPosition? Atau copy logikanya.
            // Biar gampang, kita implementasi logika update sun di sini atau import.
            // Karena ini module, kita butuh import di atas file. 
            // TAPI, kita tidak bisa tambah import dynamic di sini tanpa edit atas file.
            // Kita hitung manual saja spherical coordsnya di sini.

            const phi = THREE.MathUtils.degToRad(90 - currentElevation);
            const theta = THREE.MathUtils.degToRad(180); // Tetap di satu azimuth
            const sunVec = new THREE.Vector3();
            sunVec.setFromSphericalCoords(1, phi, theta);

            // Update Sky Shader
            if (this.skyMesh) {
                this.skyMesh.material.uniforms['sunPosition'].value.copy(sunVec);
            }

            // Update Directional Light
            // Cari directional light di scene
            if (!this.directionalLight) {
                this.directionalLight = this.scene.children.find(c => c.isDirectionalLight);
            }
            if (this.directionalLight) {
                this.directionalLight.position.copy(sunVec).multiplyScalar(100);

                // Redupkan cahaya saat matahari turun
                // Elevasi 10 -> 1.0 intensity
                // Elevasi -5 -> 0.0 intensity
                let intensity = (currentElevation + 5) / 25.0; // Norm: 0 to 1 range approx
                intensity = THREE.MathUtils.clamp(intensity, 0, 1.5);
                this.directionalLight.intensity = intensity;

                // Ubah warna cahaya (Putih -> Orange -> Biru Gelap)
                if (currentElevation < 10 && currentElevation > 0) {
                    this.directionalLight.color.setHex(0xffaa00); // Orange Sunset
                } else if (currentElevation <= 0) {
                    this.directionalLight.color.setHex(0x000040); // Blue Night
                } else {
                    this.directionalLight.color.setHex(0xffffff);
                }
            }

            // Gelapkan Environment (Ambient)
            // Scene environment intensity
            if (this.scene.backgroundIntensity !== undefined) {
                this.scene.backgroundIntensity = THREE.MathUtils.lerp(0.5, 0.1, progress); // Gelap total
                this.scene.environmentIntensity = THREE.MathUtils.lerp(0.5, 0.1, progress);
            }

            // Transisi ke Free Roam setelah kelar
            if (this.timer >= durationS5) {
                console.log("🎬 Scene 5 Done (Night). Welcome to Night Free Roam.");
                this.switchMode('FREEROAM');

                // Kembalikan HDR? Atau biarkan malam?
                // "Showcase background changing" -> mungkin biarkan malam.
                // Tapi kalau user mau main, mungkin balikin ke kondisi playable (atau stay night).
                // User request "showcase", kita biarkan di state terakhir (Malam).
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