import * as THREE from 'three';
import { Scene1 } from '../scenes/scene1.js';
import { Scene2 } from '../scenes/Scene2.js';
import { Scene3 } from '../scenes/Scene3.js';
import { Scene4 } from '../scenes/Scene4.js';
import { Scene5 } from '../scenes/Scene5.js';

import { Scene1Shots } from '../animations/Scene1Shots.js';
import { Scene2Shots } from '../animations/Scene2Shots.js';
import { Scene3Shots } from '../animations/Scene3Shots.js';
import { Scene4Shots } from '../animations/Scene4Shots.js';
import { Scene5Shots } from '../animations/Scene5Shots.js';

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
        this.scene3Objects = new Scene3(this.scene2Objects);
        this.scene4Objects = new Scene4(scene, assetManager, this.scene2Objects);
        this.scene5Objects = new Scene5(scene, assetManager, this.scene2Objects, this.scene1Objects);

        // Shots
        this.scene1Shots = new Scene1Shots();
        this.scene2Shots = new Scene2Shots();
        this.scene3Shots = new Scene3Shots();
        this.scene4Shots = new Scene4Shots();
        this.scene5Shots = new Scene5Shots();

        this.isCinematic = true;
        this.sceneStep = 1;
        this.timer = 0;

        // UI
        this.subtitle = this.createSubtitle("SELAMAT DATANG DI RUMAH STEVE");
        this.fadeOverlay = this.createFadeOverlay();

        this.cinematicBars = this.createCinematicBars();
        this.endingOverlay = this.createEndingOverlay();

        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyR' && this.isCinematic) {
                this.forceFreeRoam();
            }
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) {
                this.keysPressed.add(event.code);
            }
        });
        window.addEventListener('keyup', (event) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) {
                this.keysPressed.delete(event.code);
            }
        });

        // Audio State
        this.listener = new THREE.AudioListener();
        if (this.camera) this.camera.add(this.listener);
        this.sounds = {};
        this.keysPressed = new Set();
        this.doorOpenPlayed = false;
        this.doorClosePlayed = false;
        this.mobsPlayed = false;
    }

    startScene1() {
        console.log("🎬 Action: Scene 1");
        if (this.controls) this.controls.enabled = false;

        this.scene1Objects.setup();
        this.scene1Shots.reset(this.camera);

        this.setupAudio();
        // Play Main BGM (Minecraft.mp3) start from 1:03
        if (this.sounds['bgm_minecraft']) {
            const bgm = this.sounds['bgm_minecraft'];
            if (!bgm.isPlaying) {
                bgm.offset = 63; // Start at 1:03
                bgm.play();
            }
        }

        this.scene2Objects.setup();
        this.scene3Objects.setup();
        this.scene4Objects.setup();
        this.scene5Objects.setup(); // Setup Scene 5 (Pre-load assets here!)

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

        this.handleWalkingSound();

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

                    if (!this.doorOpenPlayed && this.sounds['door_open']) {
                        this.sounds['door_open'].play();
                        this.doorOpenPlayed = true;
                    }

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
                    this.subtitle.innerText = "BERTEMU DENGAN ALEX";
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
                this.sceneStep = 3;
                this.timer = 0;
                this.scene3Objects.start();
                const aPos = this.scene2Objects.getAlexHeadPosition();
                this.scene3Shots.setupCamera(this.camera, aPos);
            }
        }
        // ===========================================
        // 🎬 SCENE 3 (First Person Dialog)
        // ===========================================
        else if (this.sceneStep === 3) {
            this.scene2Objects.update(safeDelta);

            const currentState = this.scene3Objects.state;
            const alexHead = this.scene2Objects.getAlexHeadPosition();

            this.scene3Objects.update(safeDelta, this.timer, this.camera);
            this.scene3Shots.update(this.camera, this.timer, alexHead, currentState);

            if (this.timer > 6.0) {
                if (currentState === 1) {
                    this.scene3Objects.setQuestionData(2);
                    if (this.sounds['click']) {
                        if (this.sounds['click'].isPlaying) this.sounds['click'].stop();
                        this.sounds['click'].play();
                    }
                    this.timer = 0;
                } else if (currentState === 2) {
                    this.scene3Objects.state = 3;
                    this.scene3Objects.showResponse("Oke, semangat!");
                    if (this.sounds['click']) {
                        if (this.sounds['click'].isPlaying) this.sounds['click'].stop();
                        this.sounds['click'].play();
                    }
                    this.timer = 3;
                } else if (currentState === 3) {
                    if (this.timer > 6) {
                        this.scene3Objects.end();
                        this.sceneStep = 4;
                        this.timer = 0;
                        this.scene4Objects.start();
                        const stevePos = this.scene4Objects.stevePathPoints[0];
                        this.scene4Shots.setupCamera(this.camera, stevePos);
                    }
                }
            }
        }
        // ===========================================
        // 🎬 SCENE 4 (Steve Walking)
        // ===========================================
        else if (this.sceneStep === 4) {
            this.scene4Objects.update(safeDelta);

            const currentPos = this.scene4Objects.getCurrentPosition();
            this.scene4Shots.update(this.camera, currentPos, this.scene4Objects.currentPhase, this.scene4Objects.phaseTimer);

            const phase = this.scene4Objects.currentPhase;
            const pTime = this.scene4Objects.phaseTimer;

            // Audio Logic Scene 4
            if (phase === 'steve_at_furnace' && pTime < 0.1) {
                if (this.sounds['frying'] && !this.sounds['frying'].isPlaying) {
                    this.sounds['frying'].play();
                }
            }
            if (phase === 'alex_at_chest' && pTime < 0.1) {
                if (this.sounds['anvil'] && !this.sounds['anvil'].isPlaying) {
                    this.sounds['anvil'].play();
                    setTimeout(() => {
                        if (this.scene4Objects.currentPhase === 'alex_at_chest' && this.sounds['anvil']) {
                            if (this.sounds['anvil'].isPlaying) this.sounds['anvil'].stop();
                            this.sounds['anvil'].play();
                        }
                    }, 800);
                }
            }
            if (phase !== 'steve_at_furnace' && this.sounds['frying'] && this.sounds['frying'].isPlaying) {
                this.sounds['frying'].stop();
            }

            if (this.scene4Objects.currentPhase === 'alex_at_chest') {
                const chestTimer = this.scene4Objects.phaseTimer;
                if (chestTimer > 4.0) {
                    if (this.fadeOverlay) {
                        const fadeVal = (chestTimer - 4.0) / 2.0;
                        this.fadeOverlay.style.opacity = Math.min(fadeVal, 1.0);
                        this.fadeOverlay.style.background = 'black';
                    }
                }
            }

            // --- TRANSISI KE SCENE 5 ---
            if (this.scene4Objects.isDone()) {
                console.log("🎬 Scene 4 selesai, Masuk Scene 5 (Invasion)");

                // [FIX STUCK/LAG] Bersihkan semua timeout yang mungkin tersisa
                let id = window.setTimeout(function () { }, 0);
                while (id--) {
                    window.clearTimeout(id);
                }

                this.sceneStep = 5;
                this.timer = 0;

                if (this.scene4Objects.steveStatic) this.scene4Objects.steveStatic.visible = false;
                if (this.scene4Objects.alexStatic) this.scene4Objects.alexStatic.visible = false;

                // [FIX STUCK] Matikan suara DULUAN sebelum load scene 5
                if (this.sounds['frying'] && this.sounds['frying'].isPlaying) this.sounds['frying'].stop();
                if (this.sounds['anvil'] && this.sounds['anvil'].isPlaying) this.sounds['anvil'].stop();

                // Start Scene 5
                this.scene5Objects.start(this.sunLight);

                if (this.subtitle) {
                    this.subtitle.innerText = "MALAM TELAH TIBA";
                    this.subtitle.style.opacity = '1';
                    this.subtitle.style.color = 'red';
                    this.subtitle.style.textShadow = '3px 3px 6px #500';
                    setTimeout(() => {
                        if (this.subtitle) {
                            this.subtitle.style.opacity = '0';
                            this.subtitle.style.color = 'white';
                            this.subtitle.style.textShadow = '3px 3px 6px black';
                        }
                    }, 4000);
                }

                if (this.sounds['bgm_minecraft'] && this.sounds['bgm_minecraft'].isPlaying) {
                    this.fadeOutSound(this.sounds['bgm_minecraft'], 2.0);
                }
                if (this.sounds['bgm_night']) {
                    this.sounds['bgm_night'].play();
                }
            }
        }
        // ===========================================
        // 🎬 SCENE 5 (Night Invasion) - 30 Detik
        // ===========================================
        else if (this.sceneStep === 5) {
            const durationS5 = 30.0;

            if (this.timer < 2.0) {
                if (this.fadeOverlay) {
                    const val = 1.0 - (this.timer / 2.0);
                    this.fadeOverlay.style.opacity = Math.max(val, 0);
                }
            }

            this.scene5Objects.update(safeDelta);
            this.scene5Shots.update(this.camera, this.timer);

            if (this.timer >= 19.6 && !this.doorClosePlayed) {
                if (this.sounds['door_close']) this.sounds['door_close'].play();
                this.doorClosePlayed = true;

                if (this.sounds['bgm_night'] && this.sounds['bgm_night'].isPlaying) {
                    this.fadeOutSound(this.sounds['bgm_night'], 1.0);
                }
                if (this.sounds['heartbeat'] && this.sounds['heartbeat'].isPlaying) {
                    this.sounds['heartbeat'].stop();
                }
                if (this.sounds['bgm_minecraft']) {
                    const bgm = this.sounds['bgm_minecraft'];
                    bgm.setVolume(0.5);
                    bgm.play();
                }
            }

            if (this.timer > 5.0 && !this.mobsPlayed) {
                this.playMobSounds();
                this.mobsPlayed = true;
            }

            if (this.timer > 20.0) {
                const blurProg = Math.min((this.timer - 20.0) / 2.0, 1.0);
                this.endingOverlay.container.style.backdropFilter = `blur(${blurProg * 8}px) brightness(${1.0 - (blurProg * 0.3)})`;

                const logoProg = Math.min(Math.max((this.timer - 21.0) / 2.0, 0), 1.0);
                this.endingOverlay.logo.style.opacity = logoProg;
                this.endingOverlay.logo.style.transform = `scale(${1.0 + (0.1 * (1 - logoProg))})`;
            }

            if (this.timer >= durationS5) {
                console.log("🎬 Cinematic Selesai, masuk Free Roam");
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

    createEndingOverlay() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0'; container.style.left = '0';
        container.style.width = '100vw'; container.style.height = '100vh';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.zIndex = '1001';
        container.style.pointerEvents = 'none';
        container.style.transition = 'backdrop-filter 0.5s';

        const logo = document.createElement('img');
        logo.src = 'resources/scene5/Minecraft-Logo-2011-2015.png';
        logo.style.width = '40%';
        logo.style.maxWidth = '600px';
        logo.style.opacity = '0';
        logo.style.transition = 'opacity 1s, transform 3s';

        container.appendChild(logo);
        document.body.appendChild(container);
        return { container, logo };
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
            if (this.endingOverlay) {
                this.endingOverlay.container.style.display = 'none';
                this.endingOverlay.logo.style.opacity = '0';
                this.endingOverlay.container.style.backdropFilter = 'blur(0px)';
            }
            if (this.cinematicBars) {
                this.cinematicBars.top.style.top = '-15%';
                this.cinematicBars.bottom.style.bottom = '-15%';
            }

            console.log("🎮 Mode: Free Roam");

            if (this.sunLight) {
                this.sunLight.intensity = 1.5;
                this.sunLight.color.setHex(0xffdf80);
            }

            this.scene.traverse((child) => {
                if (child.isAmbientLight) {
                    child.intensity = 0.5;
                }
            });

            if (this.scene5Objects.pillarLightObj) {
                this.scene5Objects.pillarLightObj.visible = false;
            }

            if (this.controls) {
                const walls = this.scene1Objects.getColliders();
                const scene2Cols = this.scene2Objects.getColliders();
                const scene4Cols = this.scene4Objects.getColliders();
                const scene5Cols = this.scene5Objects.getColliders();

                const allColliders = [...walls, ...scene2Cols, ...scene4Cols, ...scene5Cols];

                this.controls.setColliders(allColliders);
                this.controls.enabled = true;

                const door = this.scene1Objects.door;
                const door2 = this.scene1Objects.door2;

                if (door) {
                    door.rotation.y = 0;
                    door.position.set(-27.5, 18.025, 36);
                }
                if (door2) {
                    door2.rotation.y = Math.PI;
                    door2.position.set(-26.5, 18.025, 36);
                }

                const blocker = document.getElementById('blocker');
                if (blocker) blocker.style.display = 'block';
            }
        }
    }

    setupAudio() {
        const createSound = (name, loop = false, volume = 0.5) => {
            const buffer = this.assets.getAudio(name);
            if (buffer) {
                const sound = new THREE.Audio(this.listener);
                sound.setBuffer(buffer);
                sound.setLoop(loop);
                sound.setVolume(volume);
                this.sounds[name] = sound;
            }
        };

        createSound('bgm_minecraft', false, 0.5);
        createSound('bgm_night', false, 0.7);
        createSound('door_open', false, 0.8);
        createSound('door_close', false, 0.8);
        createSound('walk', true, 0.6);
        createSound('click', false, 0.8);
        createSound('frying', false, 0.6);
        createSound('anvil', false, 0.7);
        createSound('heartbeat', false, 0.9);
        createSound('mob_skeleton', false, 0.6);
        createSound('mob_zombie', false, 0.6);
        createSound('mob_enderman', false, 0.6);
    }

    handleWalkingSound() {
        if (!this.sounds['walk']) return;
        const walkSound = this.sounds['walk'];
        let isWalking = false;

        if (this.isCinematic) {
            if (this.sceneStep === 2 && this.timer < 12.0) isWalking = true;
            if (this.sceneStep === 4) {
                const phase = this.scene4Objects.currentPhase;
                if (phase === 'steve_walking' || phase === 'alex_walking') isWalking = true;
            }
        }

        if (isWalking) {
            if (!walkSound.isPlaying) walkSound.play();
        } else {
            if (walkSound.isPlaying) walkSound.pause();
        }
    }

    fadeOutSound(sound, duration) {
        if (!sound || !sound.isPlaying) return;
        const startVolume = sound.getVolume();
        const startTime = Date.now();

        const fadeInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const t = elapsed / duration;
            if (t >= 1) {
                sound.setVolume(0);
                sound.stop();
                sound.setVolume(startVolume);
                clearInterval(fadeInterval);
            } else {
                sound.setVolume(startVolume * (1 - t));
            }
        }, 50);
    }

    playMobSounds() {
        if (this.sounds['heartbeat'] && !this.sounds['heartbeat'].isPlaying) {
            this.sounds['heartbeat'].play();
        }

        const mobs = ['mob_skeleton', 'mob_zombie', 'mob_enderman'];
        const sequence = [...mobs, ...mobs, ...mobs];
        sequence.forEach((name, index) => {
            setTimeout(() => {
                if (this.sounds[name]) {
                    if (this.sounds[name].isPlaying) this.sounds[name].stop();
                    this.sounds[name].play();
                }
            }, index * 800);
        });
    }
}