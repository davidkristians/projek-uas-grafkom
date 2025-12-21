import * as THREE from 'three';

export class Scene3Shots {
    constructor() { }

    setupCamera(camera, alexHeadPos) {
        // [UPDATE] Posisi FPV Hardcoded sesuai request
        // Titik mulai FPV: -21.54, 19.25, 24.81
        camera.position.set(-21.54, 19.25, 24.81);

        // Kamera langsung melihat ke mata Alex
        camera.lookAt(alexHeadPos);
    }

    update(camera, timer, alexHeadPos, questionState) {
        const t = timer;
        let targetLook = alexHeadPos.clone();

        // LOGIKA ANIMASI ROTASI (YAW & PITCH)
        if (questionState === 1) {
            // Q1: Cek Kiri -> Kanan -> Pilih Kanan
            if (t >= 2.5 && t < 3.5) targetLook.x -= 2.0; // Lihat Kiri (-X)
            else if (t >= 3.5 && t < 4.5) targetLook.x += 2.0; // Lihat Kanan (+X)
            else if (t >= 4.5) {
                targetLook.x += 2.0; // Tahan Kanan
                if (t > 5.0 && t < 5.5) targetLook.y -= 1.0; // Angguk
            }
        }
        else if (questionState === 2) {
            // Q2: Cek Kanan -> Kiri -> Pilih Kiri
            if (t >= 2.5 && t < 3.5) targetLook.x += 2.0; // Lihat Kanan
            else if (t >= 3.5 && t < 4.5) targetLook.x -= 2.0; // Lihat Kiri
            else if (t >= 4.5) {
                targetLook.x -= 2.0; // Tahan Kiri
                if (t > 5.0 && t < 5.5) targetLook.y -= 1.0; // Angguk
            }
        }

        // SMOOTHING GERAKAN
        const currentDir = new THREE.Vector3();
        camera.getWorldDirection(currentDir);
        const currentTarget = camera.position.clone().add(currentDir);

        currentTarget.lerp(targetLook, 0.1);
        camera.lookAt(currentTarget);
    }
}