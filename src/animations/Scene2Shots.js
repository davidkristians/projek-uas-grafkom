import * as THREE from 'three';

export class Scene2Shots {
    constructor() {
        // Jalur Kamera Dynamic (Titik 2 -> 3 -> 4)
        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-29.95, 21.38, 43.63), // Titik 2 (Start Dynamic)
            new THREE.Vector3(-17.24, 24.83, 47.08), // Titik 3
            new THREE.Vector3(-10.08, 24.83, 20.35), // Titik 4
            new THREE.Vector3(-8.96, 24.83, 33.92)   // Titik 4 (Ending / Adjust)
        ]);
    }

    update(camera, timer, totalDuration, stevePos) {
        // Durasi total scene = 10 detik
        // Detik 0.0 - 2.0: Kamera Statis (Titik 1)
        // Detik 2.0 - 10.0: Kamera Dynamic

        const splitTime = 2.0; 

        if (timer < splitTime) {
            // --- SHOT 1: STATIS ---
            // Posisi: -26.44, 19.55, 32.55
            camera.position.set(-26.44, 19.55, 32.55);
            // Pandangan: Ke arah pintu/Steve keluar (-26.72, 19.26, 33.00)
            camera.lookAt(-26.72, 19.26, 41.00); 
        } else {
            // --- SHOT 2: DYNAMIC ---
            // Normalisasi waktu dari detik ke-2 sampai ke-10 (jadi 0.0 - 1.0)
            const dynamicDuration = totalDuration - splitTime;
            const t = (timer - splitTime) / dynamicDuration;
            const safeT = Math.min(Math.max(t, 0), 1); // Clamp 0-1

            const camPos = this.curve.getPoint(safeT);
            camera.position.copy(camPos);
            
            // Kamera selalu melihat ke Steve (mengikuti dari belakang/samping)
            if (stevePos) {
                // Sedikit offset lookAt biar framenya bagus (lihat punggung/kepala)
                camera.lookAt(stevePos.x, stevePos.y + 1.5, stevePos.z);
            }
        }
    }
}