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

        this.initBlocker();
        this.initEvents();
    }

    initBlocker() {
        const blocker = document.createElement('div');
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
        blocker.innerHTML = 'KLIK UNTUK MULAI<br><span style="font-size:14px">WASD = Gerak, Space/Shift = Naik/Turun</span>';
        document.body.appendChild(blocker);

        document.addEventListener('click', () => this.controls.lock());
        this.controls.addEventListener('lock', () => blocker.style.display = 'none');
        this.controls.addEventListener('unlock', () => blocker.style.display = 'block');
    }

    initEvents() {
        const onKeyDown = (event) => {
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

    update(delta, camera) {
        if (this.controls.isLocked === true) {
            // Deceleration (Gesekan)
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= this.velocity.y * 10.0 * delta;

            // Direction
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            const speed = 100.0;

            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;
            
            // Fly Mode
            if (this.moveUp) this.velocity.y += speed * delta;
            if (this.moveDown) this.velocity.y -= speed * delta;

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            camera.position.y += this.velocity.y * delta;

            // Floor Limit
            if (camera.position.y < 2) {
                camera.position.y = 2;
                this.velocity.y = 0;
            }
        }
    }
}