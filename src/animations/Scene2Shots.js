import * as THREE from 'three';

export class Scene2Shots {
    constructor() {
        // Jalur Kamera Dynamic
        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-29.95, 21.38, 43.63), // 1. Start Dynamic
            new THREE.Vector3(-17.24, 24.83, 47.08), // 2. Tracking
            new THREE.Vector3(-21.5, 20.5, 30.0),    // 3. Zoom In
            new THREE.Vector3(-28.0, 18.5, 25.0),    // Transition
            new THREE.Vector3(-34.0, 25.0, 28.0),    // Transition
            new THREE.Vector3(-46.38, 35.00, 32.62)  // 4. Zoom Out
        ]);
        
        // Simpan state agar transisi smooth
        this.currentLookAt = new THREE.Vector3();
    }

    update(camera, timer, totalDuration, stevePos) {
        const splitTime = 3.0; // Waktu pindah ke shot dynamic

        // ==========================================
        // 🎥 SHOT 1: STATIS TAPI NOLEH (0s - 2s)
        // ==========================================
        if (timer < splitTime) {
            // 1. Posisi Kamera Tetap (Statis)
            camera.position.set(-26.44, 19.55, 32.55);
            
            // 2. Tentukan Titik Awal & Titik Akhir Noleh
            // Awal: Lihat Pintu (-26.72, 19.26, 41.00)
            const lookStart = new THREE.Vector3(-26.72, 19.26, 41.00);
            
            // Akhir: Lihat ke Kiri (Kita geser X atau Z targetnya)
            // Asumsi: Menggeser X ke positif/negatif akan membuat efek menoleh
            const lookLeft = new THREE.Vector3(-20.0, 19.26, 41.00); // Geser X target

            // 3. Hitung Progress (0% sampai 100% dalam 2 detik)
            const panProgress = timer / splitTime; 

            // 4. Gerakkan Target Pandangan (LerpVektor)
            // Ini akan membuat efek "YAW" (Geleng) secara halus
            this.currentLookAt.lerpVectors(lookStart, lookLeft, panProgress * 0.5); // *0.5 agar tidak terlalu cepat

            camera.lookAt(this.currentLookAt);
        } 
        
        // ==========================================
        // 🎥 SHOT 2: DYNAMIC FOLLOW (2s - Selesai)
        // ==========================================
        else {
            const dynamicDuration = totalDuration - splitTime;
            const t = (timer - splitTime) / dynamicDuration;
            const safeT = Math.min(Math.max(t, 0), 1); 

            // 1. Update Posisi di Rel Kurva
            const camPos = this.curve.getPoint(safeT);
            camera.position.copy(camPos);
            
            // 2. Tentukan Target Fokus
            const targetPos = new THREE.Vector3();

            // Ending: Kunci ke Alex
            if (safeT > 0.85) {
                targetPos.set(-21.47, 18.5, 23.28); 
            } 
            // Action: Ikuti Steve
            else if (stevePos) {
                targetPos.set(stevePos.x, stevePos.y + 1.5, stevePos.z);
            }

            // 3. Smooth Rotation (Lerp)
            // Ini membuat kamera tidak patah leher saat target berubah
            this.currentLookAt.lerp(targetPos, 0.1);
            
            camera.lookAt(this.currentLookAt);
        }
    }
}