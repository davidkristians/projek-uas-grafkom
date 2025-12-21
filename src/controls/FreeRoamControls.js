import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class FreeRoamControls {
    constructor(camera, domElement) {
        this.controls = new PointerLockControls(camera, domElement);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Status Tombol
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        // CONFIG: Default mati (tunggu cinematic selesai)
        this.enabled = false;

        // Collision Setup
        this.colliders = [];
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 1.5; // Jarak deteksi tembok (1.5 meter)

        this.initBlocker();
        this.initEvents();
    }

    // Fungsi untuk menerima daftar objek tembok dari Scene
    setColliders(objects) {
        this.colliders = objects;
        console.log(`🛡️ Collision Active: ${this.colliders.length} objects`);
    }

    initBlocker() {
        const blocker = document.createElement('div');
        blocker.id = 'blocker';
        blocker.style.position = 'absolute';
        blocker.style.top = '50%';
        blocker.style.left = '50%';
        blocker.style.transform = 'translate(-50%, -50%)';
        blocker.style.color = 'white';
        blocker.style.fontFamily = 'Arial';
        blocker.style.fontSize = '24px';
        blocker.style.backgroundColor = 'rgba(0,0,0,0.5)';
        blocker.style.padding = '20px';
        blocker.style.pointerEvents = 'none';
        blocker.style.display = 'none';
        blocker.innerHTML = 'KLIK UNTUK MULAI<br><span style="font-size:14px">WASD = Gerak, Space/Shift = Naik/Turun</span>';
        document.body.appendChild(blocker);

        document.addEventListener('click', () => {
            if (this.enabled) this.controls.lock();
        });

        this.controls.addEventListener('lock', () => blocker.style.display = 'none');
        this.controls.addEventListener('unlock', () => {
            if (this.enabled) blocker.style.display = 'block';
        });
    }

    initEvents() {
        const onKeyDown = (event) => {
            if (!this.enabled) return;
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
                case 'Space': this.moveUp = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.moveDown = true; break;
            }
        };

        const onKeyUp = (event) => {
            if (!this.enabled) return;
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
                case 'Space': this.moveUp = false; break;
                case 'ShiftLeft': case 'ShiftRight': this.moveDown = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    // Helper sederhana untuk mengambil objek kamera (pengganti getObject lama)
    getObject() {
        return this.controls.object;
    }

    checkCollision(position, directionVector) {
        if (this.colliders.length === 0) return false;

        this.raycaster.set(position, directionVector);
        const intersects = this.raycaster.intersectObjects(this.colliders);

        // Jika ada tembok dalam jarak < 1.5 unit, return true (Tabrakan!)
        if (intersects.length > 0 && intersects[0].distance < 1.5) {
            return true;
        }
        return false;
    }

    update(delta, camera) {
        if (!this.enabled || !this.controls.isLocked) return;

        // 1. Deceleration (Gesekan)
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= this.velocity.y * 10.0 * delta;

        // 2. Tentukan Arah Input (WASD)
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const speed = 100.0;

        // 3. Collision Logic
        // Menggunakan posisi kamera saat ini
        const currentPos = camera.position;

        // Vector bantuan untuk arah
        const forward = new THREE.Vector3();
        const side = new THREE.Vector3();

        // Ambil arah hadap kamera dari controls
        this.controls.getDirection(forward);

        // PENTING: Ratakan arah pandang ke sumbu Y=0 (Horizontal)
        // Agar saat melihat ke bawah, kita tidak "menabrak lantai" dan macet.
        forward.y = 0;
        forward.normalize();

        // Hitung arah samping (kanan)
        side.copy(forward).cross(camera.up).normalize();

        // --- Cek Gerak Maju/Mundur (Z) ---
        if (this.moveForward || this.moveBackward) {
            // Arah gerak (+ maju, - mundur)
            const moveDir = forward.clone().multiplyScalar(this.direction.z);

            // Cek apakah ada tembok di depan?
            if (!this.checkCollision(currentPos, moveDir)) {
                this.velocity.z -= this.direction.z * speed * delta;
            } else {
                this.velocity.z = 0; // Berhenti jika nabrak
            }
        }

        // --- Cek Gerak Kiri/Kanan (X) ---
        if (this.moveLeft || this.moveRight) {
            // Arah gerak (+ kanan, - kiri)
            const moveDir = side.clone().multiplyScalar(this.direction.x);

            if (!this.checkCollision(currentPos, moveDir)) {
                this.velocity.x -= this.direction.x * speed * delta;
            } else {
                this.velocity.x = 0; // Berhenti jika nabrak
            }
        }

        // --- Gerak Vertikal (Terbang) dengan Collision ---
        if (this.moveUp) {
            const moveDir = new THREE.Vector3(0, 1, 0);
            if (!this.checkCollision(currentPos, moveDir)) {
                this.velocity.y += speed * delta;
            } else {
                this.velocity.y = 0;
            }
        }
        if (this.moveDown) {
            const moveDir = new THREE.Vector3(0, -1, 0);
            if (!this.checkCollision(currentPos, moveDir)) {
                this.velocity.y -= speed * delta;
            } else {
                this.velocity.y = 0;
            }
        }

        // Terapkan pergerakan ke controls
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        // Update ketinggian kamera manual (karena moveForward/Right cuma horizontal)
        camera.position.y += this.velocity.y * delta;

        // Batas Lantai (Agar tidak tembus tanah ke bawah)
        if (camera.position.y < 4) {
            camera.position.y = 4;
            this.velocity.y = 0;
        }
    }
}