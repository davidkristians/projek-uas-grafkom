import * as THREE from 'three';

export class Scene4Shots {
    constructor() {
        // Camera offset dari karakter (third person view)
        this.cameraOffset = new THREE.Vector3(-5, 3, -5);  // Belakang atas karakter

        // Smooth lookAt
        this.currentLookAt = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3();
    }

    update(camera, targetPos, phase, timer) {
        if (!targetPos) return;

        let desiredCamPos = targetPos.clone().add(this.cameraOffset);
        let desiredLookAt = targetPos.clone();
        desiredLookAt.y += 1.5;

        // 1. STEVE AT FURNACE (POV + Tilt/Roll)
        if (phase === 'steve_at_furnace') {
            // POV Position: In front of face/Almost from eyes
            desiredCamPos = targetPos.clone().add(new THREE.Vector3(0, 1, 0.4));

            // Look Forward (+Z), TILT DOWN slightly more
            // WAS: 1.65 -> NOW: 1.2
            desiredLookAt = targetPos.clone().add(new THREE.Vector3(0, -3, 5));

            // Camera Roll (Z-axis rotation) & Tilt
            // Oscillate roll
            const rollAngle = Math.sin(timer * 2.0) * 0.1; // +/- 0.1 rad
            camera.up.set(Math.sin(rollAngle), Math.cos(rollAngle), 0);

            // Slight Oscillation Look Up/Down
            desiredLookAt.y += Math.sin(timer * 1.5) * 0.2;
        }
        // 2. ALEX AT CHEST (Front View)
        else if (phase === 'alex_at_chest') {
            // Front View (+Z looking back to -Z)
            // RAISED Height (2.5) and Tilted Down (LookAt 1.0)

            desiredCamPos = targetPos.clone().add(new THREE.Vector3(0, 2.0, 3.2)); // 3.5 units front, higher
            desiredLookAt = targetPos.clone().add(new THREE.Vector3(0, 0.8, 0)); // Look lower body

            // Reset Up vector
            camera.up.set(0, 1, 0);
        }
        // 3. ALEX WALKING (Follow)
        else if (phase === 'alex_walking') {
            // Default follow
            desiredCamPos = targetPos.clone().add(this.cameraOffset);
            camera.up.set(0, 1, 0);
        }
        else {
            // Default follow
            desiredCamPos = targetPos.clone().add(this.cameraOffset);
            camera.up.set(0, 1, 0);
        }

        // Smooth camera movement
        if (phase === 'steve_at_furnace') {
            camera.position.lerp(desiredCamPos, 0.1);
        } else {
            this.currentCamPos.lerp(desiredCamPos, 0.05);
            camera.position.copy(this.currentCamPos);
        }

        // Smooth rotation
        this.currentLookAt.lerp(desiredLookAt, 0.08);
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
