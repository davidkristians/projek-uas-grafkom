import * as THREE from 'three';

export class Scene4 {
    constructor(scene, assetManager, scene2Objects) {
        this.scene = scene;
        this.assets = assetManager;
        this.scene2 = scene2Objects;

        // Aktor
        this.steveWalk = null;
        this.steveStatic = null;
        this.alexWalk = null;
        this.alexStatic = null;

        // Phase: 'steve_walking' -> 'steve_at_furnace' -> 'alex_walking' -> 'alex_at_chest' -> 'done'
        this.currentPhase = 'idle';
        this.moveSpeed = 3.5;
        this.phaseTimer = 0;

        // Steve path
        this.stevePathPoints = [
            new THREE.Vector3(-21.57, 18.85, 25.66),  // Start
            new THREE.Vector3(-22.67, 18.86, 25.64),
            new THREE.Vector3(-22.67, 17.86, 25.64),
            new THREE.Vector3(-26.67, 17.84, 26),
            new THREE.Vector3(-26.67, 17.84, 29),    // Stop
        ];

        // Alex path
        this.alexPathPoints = [
            new THREE.Vector3(-2.47, 18.67, -12.78),  // Spawn position
            new THREE.Vector3(-2.47, 18.67, -3.78),   // Walk to here
            new THREE.Vector3(-3.47, 18.67, -3.78)    // Look right (face -X), move 1 block
        ];

        this.currentPointIndex = 0;
        this.isActive = false;
    }

    setup() {
        console.log("🛠️ Setup: Scene 4");

        // Steve Walk - reuse dari Scene2
        this.steveWalk = this.scene2.steveWalk;

        // Steve Static - reuse dari Scene2
        this.steveStatic = this.scene2.steveStatic;

        // Alex Walk - diambil dari AssetManager (model animasi)
        this.alexWalk = this.assets.get('alex_walk');
        if (this.alexWalk) {
            this.alexWalk.scale.set(0.5, 0.5, 0.5);
            this.alexWalk.visible = false;
            this.scene.add(this.alexWalk);
        }

        // Alex Static - reuse dari Scene2 (model diam)
        this.alexStatic = this.scene2.alex;
    }

    start() {
        console.log("🎬 Action: Scene 4 Start");
        this.isActive = true;
        this.currentPhase = 'steve_walking';
        this.currentPointIndex = 0;

        // Reset visibility saat scene mulai
        if (this.steveStatic) this.steveStatic.visible = false;
        if (this.alexStatic) this.alexStatic.visible = false;

        // Setup Steve Walk
        if (this.steveWalk) {
            this.steveWalk.visible = true;
            this.steveWalk.position.copy(this.stevePathPoints[0]);

            const mixer = this.steveWalk.userData.mixer;
            const anims = this.steveWalk.userData.animations;
            if (mixer && anims && anims.length > 0) {
                mixer.stopAllAction();
                mixer.clipAction(anims[0]).play();
            }
        }
    }

    update(delta) {
        if (!this.isActive) return;

        // Update Animation Mixers
        if (this.steveWalk && this.steveWalk.userData.mixer) {
            this.steveWalk.userData.mixer.update(delta);
        }
        if (this.alexWalk && this.alexWalk.userData.mixer) {
            this.alexWalk.userData.mixer.update(delta);
        }

        // Handle Movement Logic
        if (this.currentPhase === 'steve_walking') {
            this.updateSteveWalking(delta);
        } else if (this.currentPhase === 'steve_at_furnace') {
            this.phaseTimer += delta;
            // 5 detik POV steve
            if (this.phaseTimer >= 5.0) {
                this.finishSteveFurnace();
            }
        } else if (this.currentPhase === 'alex_walking') {
            this.updateAlexWalking(delta);
        } else if (this.currentPhase === 'alex_at_chest') {
            // Diam di chest, menunggu scene selesai (3 detik)
            this.phaseTimer += delta;
            if (this.phaseTimer >= 3.0) {
                console.log("🎬 Scene 4 Cinematic Finished -> Enable Free Roam");
                this.currentPhase = 'done';
            }
        }
    }

    updateSteveWalking(delta) {
        if (!this.steveWalk || this.currentPointIndex >= this.stevePathPoints.length - 1) return;

        const currentPos = this.steveWalk.position;
        const targetPos = this.stevePathPoints[this.currentPointIndex + 1];

        const lookTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
        this.steveWalk.lookAt(lookTarget);

        const distance = currentPos.distanceTo(targetPos);
        const step = this.moveSpeed * delta;

        if (targetPos.y > currentPos.y + 0.1) {
            this.steveWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.2);
        } else if (targetPos.y < currentPos.y - 0.1) {
            this.steveWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.1);
        }

        if (distance <= step) {
            this.steveWalk.position.copy(targetPos);
            this.currentPointIndex++;

            if (this.currentPointIndex >= this.stevePathPoints.length - 1) {
                this.finishSteveWalking();
            }
        } else {
            const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
            this.steveWalk.position.add(direction.multiplyScalar(step));
        }
    }

    finishSteveWalking() {
        console.log("🎬 Steve sampai di furnace. Start POV 5 detik.");

        // 1. Swap Steve ke Static
        if (this.steveWalk) this.steveWalk.visible = false;
        if (this.steveStatic) {
            this.steveStatic.position.copy(this.stevePathPoints[this.stevePathPoints.length - 1]);
            this.steveStatic.rotation.copy(this.steveWalk.rotation);
            this.steveStatic.scale.set(0.05, 0.05, 0.05);
            this.steveStatic.visible = true;
        }

        // 2. Masuk fase Pause (Camera POV)
        this.currentPhase = 'steve_at_furnace';
        this.phaseTimer = 0;
    }

    finishSteveFurnace() {
        console.log("🎬 Steve POV selesai. Start Alex Walk.");

        // 3. Mulai Fase Alex
        this.currentPhase = 'alex_walking';
        this.currentPointIndex = 0;

        // 4. Setup Alex Walk dan Animasi
        if (this.alexWalk) {
            this.alexWalk.visible = true;
            this.alexWalk.position.copy(this.alexPathPoints[0]);

            const mixer = this.alexWalk.userData.mixer;
            const anims = this.alexWalk.userData.animations;

            if (mixer && anims && anims.length > 0) {
                mixer.stopAllAction();

                let walkClip = anims.find(clip => clip.name.toLowerCase().includes('walk'));
                if (!walkClip) {
                    console.warn("⚠️ Animasi 'Walk' tidak ditemukan spesifik, menggunakan index 0");
                    walkClip = anims[0];
                }

                console.log(`▶️ Memainkan animasi Alex: ${walkClip.name}`);
                mixer.clipAction(walkClip).play();
            }
        }
    }

    updateAlexWalking(delta) {
        if (!this.alexWalk || this.currentPointIndex >= this.alexPathPoints.length - 1) return;

        const currentPos = this.alexWalk.position;
        const targetPos = this.alexPathPoints[this.currentPointIndex + 1];

        const lookTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
        this.alexWalk.lookAt(lookTarget);

        const distance = currentPos.distanceTo(targetPos);
        const step = this.moveSpeed * delta;

        if (targetPos.y > currentPos.y + 0.1) {
            this.alexWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.2);
        } else if (targetPos.y < currentPos.y - 0.1) {
            this.alexWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.1);
        }

        if (distance <= step) {
            this.alexWalk.position.copy(targetPos);
            this.currentPointIndex++;

            if (this.currentPointIndex >= this.alexPathPoints.length - 1) {
                this.finishAlexWalking();
            }
        } else {
            const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
            this.alexWalk.position.add(direction.multiplyScalar(step));
        }
    }

    finishAlexWalking() {
        console.log("🎬 Alex sampai di Chest. Start Camera Front View.");

        // 1. Swap ke Static
        if (this.alexWalk) {
            this.alexWalk.visible = false;
            if (this.alexWalk.userData.mixer) {
                this.alexWalk.userData.mixer.stopAllAction();
            }
        }

        if (this.alexStatic) {
            const finalPos = this.alexPathPoints[this.alexPathPoints.length - 1];
            this.alexStatic.position.copy(finalPos);
            // Face left logic (back to +Z / front)
            this.alexStatic.rotation.set(0, THREE.MathUtils.degToRad(0), 0);
            this.alexStatic.visible = true;
        }

        this.currentPhase = 'alex_at_chest';
        this.phaseTimer = 0; // Reset timer untuk durasi shot akhir
    }

    // --- Helper Functions untuk Camera Shots ---

    getCurrentPosition() {
        if (this.currentPhase === 'steve_walking' && this.steveWalk) {
            return this.steveWalk.position;
        }
        if (this.currentPhase === 'steve_at_furnace' && this.steveStatic) {
            return this.steveStatic.position;
        }
        if (this.currentPhase === 'alex_walking' && this.alexWalk) {
            return this.alexWalk.position;
        }
        if (this.currentPhase === 'alex_at_chest' && this.alexStatic) {
            return this.alexStatic.position;
        }
        return new THREE.Vector3(0, 0, 0);
    }

    getStevePosition() {
        if (this.steveWalk && this.steveWalk.visible) return this.steveWalk.position;
        if (this.steveStatic) return this.steveStatic.position;
        return new THREE.Vector3(0, 0, 0);
    }

    isDone() {
        return this.currentPhase === 'done';
    }
}
