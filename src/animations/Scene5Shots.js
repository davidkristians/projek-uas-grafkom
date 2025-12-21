import * as THREE from 'three';

export class Scene5Shots {
    constructor() {
        // --- 1. KOORDINAT ORBIT (JALUR KURVA) ---
        // Kita gunakan CatmullRomCurve3 agar pergerakan melewati 4 titik ini melengkung halus
        this.orbitPoints = [
            new THREE.Vector3(-66.66, 30.03, 52.40), // Titik 1
            new THREE.Vector3(-50.43, 30.03, 46.09), // Titik 2 (Urutan disesuaikan agar alurnya logis)
            new THREE.Vector3(-31.28, 30.03, 75.15), // Titik 3
            new THREE.Vector3(-23.22, 30.03, 43.10)  // Titik 4
        ];
        
        this.orbitCurve = new THREE.CatmullRomCurve3(this.orbitPoints);
        this.orbitCurve.tension = 0.5; // Kelengkungan

        // --- 2. KOORDINAT ZOOM ---
        this.zoomCamPos = new THREE.Vector3(-25.84, 30.03, 71.19);
        
        // --- 3. TARGET LIHAT (PINTU) ---
        this.doorTarget = new THREE.Vector3(-27.19, 19.70, 39.20);
        
        // Target tengah untuk fase orbit (agar kamera selalu melihat ke rumah)
        this.houseCenter = new THREE.Vector3(-27, 20, 35);
    }

    update(camera, timer) {
        // Total Durasi Scene 5 kita anggap 20 detik
        // 0 - 12 detik: Orbit
        // 12 - 15 detik: Transisi ke Posisi Zoom
        // 15 - 20 detik: Zoom In Effect (FOV)

        // --- FASE 1: ORBIT (0s - 12s) ---
        if (timer <= 12.0) {
            // Hitung progress 0.0 sampai 1.0
            const t = Math.min(timer / 12.0, 1.5);
            
            // Ambil posisi di kurva berdasarkan t
            const pos = this.orbitCurve.getPointAt(t); // getPointAt membuat gerakan kecepatan konstan
            
            camera.position.copy(pos);
            camera.lookAt(this.houseCenter);
            
            // Reset FOV jaga-jaga
            camera.fov = 50;
            camera.updateProjectionMatrix();
        } 
        
        // --- FASE 2: TRANSISI KE TITIK ZOOM (12s - 15s) ---
        else if (timer <= 15.0) {
            // Normalisasi waktu (0.0 - 1.0 dalam rentang 3 detik ini)
            const t = (timer - 12.0) / 3.0;
            const smoothT = t * t * (3 - 2 * t); // Easing smoothstep

            // Posisi akhir orbit (Titik 4)
            const startPos = this.orbitPoints[this.orbitPoints.length - 1];
            
            // Lerp (Pindah halus) dari Titik 4 ke Posisi Zoom
            camera.position.lerpVectors(startPos, this.zoomCamPos, smoothT);
            
            // Transisi fokus pandangan dari HouseCenter ke Pintu
            const currentLook = new THREE.Vector3().lerpVectors(this.houseCenter, this.doorTarget, smoothT);
            camera.lookAt(currentLook);
        }

        // --- FASE 3: ZOOM LENS EFFECT (15s - 20s) ---
        else {
            // Posisi Camera diam di titik Zoom
            camera.position.copy(this.zoomCamPos);
            camera.lookAt(this.doorTarget);

            // Efek Zoom In dengan mengubah FOV (Field of View)
            // FOV 50 (Normal) -> FOV 15 (Zoom Telephoto)
            const t = Math.min((timer - 15.0) / 5.0, 1.0);
            const smoothT = t * t * (3 - 2 * t);
            
            const newFov = THREE.MathUtils.lerp(50, 15, smoothT);
            camera.fov = newFov;
            camera.updateProjectionMatrix(); // WAJIB update projection matrix setiap ubah FOV
        }
    }
}