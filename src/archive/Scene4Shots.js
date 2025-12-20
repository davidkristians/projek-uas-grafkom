import * as THREE from 'three';

export class Scene4Shots {
    constructor() {
        // Camera offset dari karakter (third person view)
        this.cameraOffset = new THREE.Vector3(-5, 3, -5);  // Belakang atas karakter

        // Smooth lookAt
        this.currentLookAt = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3();

        // Track siapa yang sedang difollow
        this.currentTarget = null;
    }

    update(camera, stevePos, alexPos, currentPhase) {
        let targetPos = null;

        // Tentukan target berdasarkan phase
        if (currentPhase === 'steve' && stevePos) {
            targetPos = stevePos.clone();
            this.currentTarget = 'steve';
        } else if (currentPhase === 'alex' && alexPos) {
            targetPos = alexPos.clone();
            this.currentTarget = 'alex';
        }

        if (!targetPos) return;

        // Hitung posisi kamera (di belakang atas karakter)
        const desiredCamPos = targetPos.clone().add(this.cameraOffset);

        // Smooth camera movement
        this.currentCamPos.lerp(desiredCamPos, 0.05);
        camera.position.copy(this.currentCamPos);

        // Target lookAt (sedikit di atas karakter)
        const lookTarget = targetPos.clone();
        lookTarget.y += 1.5;  // Lihat ke kepala karakter

        // Smooth rotation
        this.currentLookAt.lerp(lookTarget, 0.08);
        camera.lookAt(this.currentLookAt);
    }

    // Panggil saat mulai scene untuk reset posisi kamera
    setupCamera(camera, initialTarget) {
        if (initialTarget) {
            this.currentCamPos.copy(initialTarget.clone().add(this.cameraOffset));
            this.currentLookAt.copy(initialTarget);
            camera.position.copy(this.currentCamPos);
            camera.lookAt(this.currentLookAt);
        }
    }
}
