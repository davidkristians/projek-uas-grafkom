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

        // Phase: 'steve_walking' -> 'alex_walking' -> 'done'
        this.currentPhase = 'idle';
        this.moveSpeed = 3.5;

        // Steve path (koordinat dari user)
        this.stevePathPoints = [
            new THREE.Vector3(-21.57, 18.85, 25.66),  // Start (posisi akhir Scene3)
            new THREE.Vector3(-22.67, 18.86, 25.64),  // Hadap kiri, jalan
            new THREE.Vector3(-22.67, 17.86, 25.64),  // Turun 1 block
            new THREE.Vector3(-26.67, 17.84, 26),     // Face left
            new THREE.Vector3(-26.67, 17.84, 29),     // Stop, ganti ke static
        ];

        // Alex path (spawn -> walk -> static)
        this.alexPathPoints = [
            new THREE.Vector3(-1.47, 17.67, -12.78),  // Spawn position
            new THREE.Vector3(-1.47, 17.67, -4.78),   // Walk to here, then stop
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

        // Alex Walk - from assets (animated model)
        this.alexWalk = this.assets.get('alex_walk');
        if (this.alexWalk) {
            this.alexWalk.scale.set(0.5, 0.5, 0.5);
            this.alexWalk.visible = false;
            this.scene.add(this.alexWalk);
        }

        // Alex Static - reuse dari Scene2
        this.alexStatic = this.scene2.alex;
    }

    start() {
        console.log("🎬 Action: Scene 4 Start");
        this.isActive = true;
        this.currentPhase = 'steve_walking';
        this.currentPointIndex = 0;

        // Sembunyikan steve static dari Scene2/3
        if (this.steveStatic) {
            this.steveStatic.visible = false;
        }

        // Sembunyikan alex dari Scene2/3
        if (this.alexStatic) {
            this.alexStatic.visible = false;
        }

        // Tampilkan steve walk dan posisikan
        if (this.steveWalk) {
            this.steveWalk.visible = true;
            this.steveWalk.position.copy(this.stevePathPoints[0]);

            const mixer = this.steveWalk.userData.mixer;
            const anims = this.steveWalk.userData.animations;
            if (mixer && anims && anims.length > 0) {
                mixer.clipAction(anims[0]).play();
            }
        }
    }

    update(delta) {
        if (!this.isActive) return;

        // Update Steve mixer
        if (this.steveWalk && this.steveWalk.userData.mixer) {
            this.steveWalk.userData.mixer.update(delta);
        }

        // Update Alex mixer
        if (this.alexWalk && this.alexWalk.userData.mixer) {
            this.alexWalk.userData.mixer.update(delta);
        }

        if (this.currentPhase === 'steve_walking') {
            this.updateSteveWalking(delta);
        } else if (this.currentPhase === 'alex_walking') {
            this.updateAlexWalking(delta);
        }
    }

    updateSteveWalking(delta) {
        if (!this.steveWalk || this.currentPointIndex >= this.stevePathPoints.length - 1) return;

        const currentPos = this.steveWalk.position;
        const targetPos = this.stevePathPoints[this.currentPointIndex + 1];

        // Hadap ke target
        const lookTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
        this.steveWalk.lookAt(lookTarget);

        const distance = currentPos.distanceTo(targetPos);
        const step = this.moveSpeed * delta;

        // Handle naik/turun
        if (targetPos.y > currentPos.y + 0.1) {
            const flatDist = new THREE.Vector2(currentPos.x, currentPos.z)
                .distanceTo(new THREE.Vector2(targetPos.x, targetPos.z));
            if (flatDist < 0.5) {
                this.steveWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.2);
            }
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
        console.log("🎬 Steve selesai jalan, spawn Alex");

        // Sembunyikan steve walk
        if (this.steveWalk) this.steveWalk.visible = false;

        // Tampilkan steve static di posisi akhir
        if (this.steveStatic) {
            this.steveStatic.position.copy(this.stevePathPoints[this.stevePathPoints.length - 1]);
            this.steveStatic.rotation.copy(this.steveWalk.rotation);
            this.steveStatic.scale.set(0.05, 0.05, 0.05);
            this.steveStatic.visible = true;
        }

        // Start Alex phase
        this.currentPhase = 'alex_walking';
        this.currentPointIndex = 0;

        // Spawn Alex di posisi awal
        if (this.alexWalk) {
            this.alexWalk.visible = true;
            this.alexWalk.position.copy(this.alexPathPoints[0]);

            const mixer = this.alexWalk.userData.mixer;
            const anims = this.alexWalk.userData.animations;
            if (mixer && anims && anims.length > 0) {
                mixer.clipAction(anims[0]).play();
            }
        }
    }

    updateAlexWalking(delta) {
        if (!this.alexWalk || this.currentPointIndex >= this.alexPathPoints.length - 1) return;

        const currentPos = this.alexWalk.position;
        const targetPos = this.alexPathPoints[this.currentPointIndex + 1];

        // Hadap ke target
        const lookTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
        this.alexWalk.lookAt(lookTarget);

        const distance = currentPos.distanceTo(targetPos);
        const step = this.moveSpeed * delta;

        // Handle naik/turun
        if (targetPos.y > currentPos.y + 0.1) {
            const flatDist = new THREE.Vector2(currentPos.x, currentPos.z)
                .distanceTo(new THREE.Vector2(targetPos.x, targetPos.z));
            if (flatDist < 0.5) {
                this.alexWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.2);
            }
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
        console.log("🎬 Alex selesai jalan, ganti ke static");

        // Sembunyikan alex walk
        if (this.alexWalk) this.alexWalk.visible = false;

        // Tampilkan alex static di posisi akhir
        if (this.alexStatic) {
            this.alexStatic.position.copy(this.alexPathPoints[this.alexPathPoints.length - 1]);
            this.alexStatic.rotation.copy(this.alexWalk.rotation);
            this.alexStatic.visible = true;
        }

        this.currentPhase = 'done';
        this.isActive = false;
    }

    getCurrentPosition() {
        if (this.currentPhase === 'steve_walking' && this.steveWalk) {
            return this.steveWalk.position;
        }
        if (this.currentPhase === 'alex_walking' && this.alexWalk) {
            return this.alexWalk.position;
        }
        if (this.steveStatic) {
            return this.steveStatic.position;
        }
        return new THREE.Vector3(0, 0, 0);
    }

    getStevePosition() {
        if (this.currentPhase === 'steve_walking' && this.steveWalk) {
            return this.steveWalk.position;
        }
        if (this.steveStatic) {
            return this.steveStatic.position;
        }
        return new THREE.Vector3(0, 0, 0);
    }

    isDone() {
        return this.currentPhase === 'done';
    }
}
