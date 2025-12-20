import * as THREE from 'three';

export class Scene4Shots {
    constructor() {
        // Camera offset dari karakter (third person view)
        this.cameraOffset = new THREE.Vector3(-5, 3, -5);  // Belakang atas karakter

        // Smooth lookAt
        this.currentLookAt = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3();
    }

    update(camera, targetPos) {
        if (!targetPos) return;

        // Hitung posisi kamera (di belakang atas karakter)
        const desiredCamPos = targetPos.clone().add(this.cameraOffset);

        // Smooth camera movement
        this.currentCamPos.lerp(desiredCamPos, 0.05);
        camera.position.copy(this.currentCamPos);

        // Target lookAt (sedikit di atas kepala)
        const lookTarget = targetPos.clone();
        lookTarget.y += 1.5;

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
