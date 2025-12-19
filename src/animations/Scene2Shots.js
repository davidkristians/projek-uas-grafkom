import * as THREE from 'three';

export class Scene2Shots {
    constructor() {
        // Jalur Kamera Dynamic (Tracking -> Zoom In -> Zoom Out)
        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-29.95, 21.38, 43.63), // 1. Start Dynamic (Jauh)
            new THREE.Vector3(-17.24, 24.83, 47.08), // 2. Tracking (Mengikuti jalan)
            
            // --- POINT BARU UNTUK KETENTUAN NO. 1 ---
            
            // 3. ZOOM IN (Mendekat ke Alex & Steve)
            // Posisi agak rendah dan dekat agar terlihat intim/meeting
            new THREE.Vector3(-21.5, 20.5, 30.0),    

            // 4. ZOOM OUT (Ending Scene / Bird Eye)
            // Tarik kamera mundur ke atas untuk menutup scene
            new THREE.Vector3(-25.29, 20.16, 26.18)     
        ]);
    }

    update(camera, timer, totalDuration, stevePos) {
        // Durasi total scene = 10 detik
        // 0s - 2s: Statis (Menunggu Steve keluar)
        // 2s - 8s: Tracking (Mengikuti Steve jalan)
        // 8s - 10s: Zoom In ke pertemuan & Zoom Out

        const splitTime = 2.0; 

        if (timer < splitTime) {
            // --- SHOT 1: STATIS ---
            // Posisi: -26.44, 19.55, 32.55
            camera.position.set(-26.44, 19.55, 32.55);
            // Pandangan: Sesuai request Anda (Z = 41.00)
            camera.lookAt(-26.72, 19.26, 41.00); 
        } else {
            // --- SHOT 2: DYNAMIC + ZOOM ---
            const dynamicDuration = totalDuration - splitTime;
            const t = (timer - splitTime) / dynamicDuration;
            const safeT = Math.min(Math.max(t, 0), 1); // Clamp 0-1

            // Ambil posisi di kurva baru
            const camPos = this.curve.getPoint(safeT);
            camera.position.copy(camPos);
            
            // --- LOGIKA FOKUS KAMERA (Rotate/Yaw/Pitch) ---
            
            // Jika sudah di fase akhir (Zoom Out/Ending), 
            // kunci pandangan ke titik pertemuan (posisi Alex) agar kamera stabil
            if (safeT > 0.85) {
                // LookAt titik tengah pertemuan (Alex -21.47, 17.67, 23.28)
                camera.lookAt(-21.47, 18.5, 23.28); 
            } 
            // Jika masih fase jalan, ikuti Steve
            else if (stevePos) {
                // Offset Y +1.5 agar melihat punggung/kepala, bukan kaki
                camera.lookAt(stevePos.x, stevePos.y + 1.5, stevePos.z);
            }
        }
    }
}