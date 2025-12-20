import * as THREE from 'three';

export class Scene4 {
    constructor(scene, assetManager, scene2Objects) {
        this.scene = scene;
        this.assets = assetManager;
        this.scene2 = scene2Objects;

        // Aktor
        this.steveWalk = null;
        this.alexWalk = null;

        // Phase: 'steve' -> 'alex' -> 'done'
        this.currentPhase = 'idle';
        this.moveSpeed = 3.5;

        // Steve path (facing -Z towards Alex, left = -X)
        // Start: (-21.57, 18.85, 25.66) - posisi akhir Scene2
        // 1. Turn left (-X), walk 1 block, down 1
        // 2. Walk 4 blocks (-X)
        // 3. Turn left (+Z), walk 3 blocks
        this.stevePathPoints = [
            new THREE.Vector3(-21.57, 18.85, 25.66),  // Start
            new THREE.Vector3(-22.57, 17.85, 25.66),  // 1 block -X, down 1
            new THREE.Vector3(-26.57, 17.85, 25.66),  // 4 blocks -X
            new THREE.Vector3(-26.57, 17.85, 28.66),  // 3 blocks +Z
        ];

        // Alex path (facing +Z towards Steve, left = +X)
        // Start: (-21.47, 17.67, 23.28)
        // 1. Walk 3 blocks +Z (3rd block down 1)
        // 2. Walk 5 blocks +Z (up 1)
        // 3. Walk 11 blocks +Z
        // 4. Turn left (+X), walk 15 blocks (down 1)
        // 5. Walk 1 block +X
        // 6. Turn left (-Z), walk 50 blocks
        this.alexPathPoints = [
            new THREE.Vector3(-21.47, 17.67, 23.28),  // Start
            new THREE.Vector3(-21.47, 17.67, 25.28),  // 2 blocks +Z
            new THREE.Vector3(-21.47, 16.67, 26.28),  // 1 block +Z, down 1
            new THREE.Vector3(-21.47, 17.67, 31.28),  // 5 blocks +Z, up 1
            new THREE.Vector3(-21.47, 17.67, 42.28),  // 11 blocks +Z
            new THREE.Vector3(-6.47, 16.67, 42.28),   // 15 blocks +X, down 1
            new THREE.Vector3(-5.47, 16.67, 42.28),   // 1 block +X
            new THREE.Vector3(-5.47, 16.67, -7.72),   // 50 blocks -Z
        ];

        this.currentPointIndex = 0;
        this.isActive = false;
    }

    setup() {
        console.log("🛠️ Setup: Scene 4");

        // Steve Walk - reuse dari Scene2 langsung (jangan clone)
        // Kita akan reposisi saat start()
        this.steveWalk = this.scene2.steveWalk;

        // Alex Walk (animated)
        this.alexWalk = this.assets.get('alex_walk');
        if (this.alexWalk) {
            this.alexWalk.position.copy(this.alexPathPoints[0]);
            this.alexWalk.scale.set(0.5, 0.5, 0.5);  // Scale sama seperti alex di Scene2
            this.alexWalk.visible = false;
            this.scene.add(this.alexWalk);

            const mixer = this.alexWalk.userData.mixer;
            const anims = this.alexWalk.userData.animations;
            if (mixer && anims && anims.length > 0) {
                mixer.clipAction(anims[0]).play();
            }
        }
    }

    start() {
        console.log("🎬 Action: Scene 4 Start");
        this.isActive = true;
        this.currentPhase = 'steve';
        this.currentPointIndex = 0;

        // Sembunyikan steve static dari Scene2
        if (this.scene2.steveStatic) {
            this.scene2.steveStatic.visible = false;
        }

        // Sembunyikan alex static dari Scene2
        if (this.scene2.alex) {
            this.scene2.alex.visible = false;
        }

        // Tampilkan steve walk
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

        // Update mixers
        if (this.steveWalk && this.steveWalk.userData.mixer) {
            this.steveWalk.userData.mixer.update(delta);
        }
        if (this.alexWalk && this.alexWalk.userData.mixer) {
            this.alexWalk.userData.mixer.update(delta);
        }

        if (this.currentPhase === 'steve') {
            this.updateWalking(this.steveWalk, this.stevePathPoints, delta);
        } else if (this.currentPhase === 'alex') {
            this.updateWalking(this.alexWalk, this.alexPathPoints, delta);
        }
    }

    updateWalking(character, pathPoints, delta) {
        if (!character || this.currentPointIndex >= pathPoints.length - 1) return;

        const currentPos = character.position;
        const targetPos = pathPoints[this.currentPointIndex + 1];

        // Hadap ke target
        const lookTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
        character.lookAt(lookTarget);

        const distance = currentPos.distanceTo(targetPos);
        const step = this.moveSpeed * delta;

        // Handle naik/turun
        if (targetPos.y > currentPos.y + 0.1) {
            const flatDist = new THREE.Vector2(currentPos.x, currentPos.z)
                .distanceTo(new THREE.Vector2(targetPos.x, targetPos.z));
            if (flatDist < 0.5) {
                character.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.2);
            }
        } else if (targetPos.y < currentPos.y - 0.1) {
            character.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.1);
        }

        if (distance <= step) {
            character.position.copy(targetPos);
            this.currentPointIndex++;

            if (this.currentPointIndex >= pathPoints.length - 1) {
                this.finishCurrentPhase();
            }
        } else {
            const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
            character.position.add(direction.multiplyScalar(step));
        }
    }

    finishCurrentPhase() {
        if (this.currentPhase === 'steve') {
            console.log("🎬 Steve selesai jalan, giliran Alex");

            // Sembunyikan steve walk
            if (this.steveWalk) this.steveWalk.visible = false;

            // Mulai Alex
            this.currentPhase = 'alex';
            this.currentPointIndex = 0;

            if (this.alexWalk) {
                this.alexWalk.visible = true;
                this.alexWalk.position.copy(this.alexPathPoints[0]);
            }

        } else if (this.currentPhase === 'alex') {
            console.log("🎬 Alex selesai jalan, Scene 4 selesai");
            this.currentPhase = 'done';
            this.isActive = false;
        }
    }

    isDone() {
        return this.currentPhase === 'done';
    }
}
