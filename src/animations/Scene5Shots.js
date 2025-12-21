import * as THREE from 'three';

export class Scene5Shots {
    constructor() {
        // --- ORBIT CONFIGURATION (CLASSIC MATH) ---
        // Titik tengah orbit (Pusat putaran) -> Rumah
        this.center = new THREE.Vector3(-27, 20, 35);
        
        // Jari-jari (Radius) orbit
        // Kita hitung rata-rata jarak dari titik-titik Anda sebelumnya ke pusat
        this.radius = 40.0; 

        // Sudut Awal (Start Angle) & Sudut Akhir (End Angle)
        // Kita sesuaikan agar posisi start mirip dengan (-66, 30, 52)
        this.angleStart = Math.PI;       // Mulai dari belakang kiri
        this.angleEnd = Math.PI * 0.2;   // Berhenti di depan agak kanan
        
        // Tinggi kamera saat orbit
        this.orbitHeight = 30.0;

        // --- 2. KOORDINAT ZOOM (TARGET AKHIR ORBIT) ---
        // Kita set target akhir orbit agar pas dengan posisi zoom nanti
        // x = center.x + radius * cos(angleEnd)
        // z = center.z + radius * sin(angleEnd)
        this.zoomCamPos = new THREE.Vector3(-27.01, 25.87, 70.45);
        
        // --- 3. TARGET LIHAT (PINTU) ---
        this.doorTarget = new THREE.Vector3(-27.19, 19.70, 39.20);
    }

    update(camera, timer) {
        // Total Durasi Scene 5 = 20 detik
        // 0 - 12 detik: Orbit (Sin/Cos)
        // 12 - 15 detik: Transisi ke Posisi Zoom
        // 15 - 20 detik: Zoom In Effect (FOV)

        // --- FASE 1: ORBIT CLASSIC (0s - 12s) ---
        if (timer <= 12.0) {
            // Hitung progress 0.0 s/d 1.0
            const t = Math.min(timer / 12.0, 1.0);
            
            // Interpolasi Sudut dari Start ke End
            const currentAngle = THREE.MathUtils.lerp(this.angleStart, this.angleEnd, t);

            // RUMUS MATEMATIKA ORBIT (SIN & COS)
            // x = cx + r * cos(theta)
            // z = cz + r * sin(theta)
            const x = this.center.x + this.radius * Math.cos(currentAngle);
            const z = this.center.z + this.radius * Math.sin(currentAngle);
            
            camera.position.set(x, this.orbitHeight, z);
            camera.lookAt(this.center);
            
            // Reset FOV
            camera.fov = 50;
            camera.updateProjectionMatrix();
        }

        // --- FASE 2: TRANSISI KE TITIK ZOOM (12s - 15s) ---
        else if (timer <= 15.0) {
            // Normalisasi waktu (0.0 - 1.0 dalam rentang 3 detik ini)
            const t = (timer - 12.0) / 3.0;
            const smoothT = t * t * (3 - 2 * t); // Easing smoothstep

            // Hitung posisi terakhir orbit (Sudut Akhir)
            const endX = this.center.x + this.radius * Math.cos(this.angleEnd);
            const endZ = this.center.z + this.radius * Math.sin(this.angleEnd);
            const startPos = new THREE.Vector3(endX, this.orbitHeight, endZ);
            
            // Lerp (Pindah halus) dari Akhir Orbit ke Posisi Zoom
            camera.position.lerpVectors(startPos, this.zoomCamPos, smoothT);
            
            // Transisi fokus pandangan dari Pusat Rumah ke Pintu
            const currentLook = new THREE.Vector3().lerpVectors(this.center, this.doorTarget, smoothT);
            camera.lookAt(currentLook);
        }

        // --- FASE 3: ZOOM LENS EFFECT (15s - 20s) ---
        else {
            // Posisi Camera diam di titik Zoom
            camera.position.copy(this.zoomCamPos);
            camera.lookAt(this.doorTarget);

            // Efek Zoom In dengan mengubah FOV (Field of View)
            const t = Math.min((timer - 14.0) / 5.0, 1.0);
            const smoothT = t * t * (3 - 2 * t);
            
            const newFov = THREE.MathUtils.lerp(50, 14, smoothT);
            camera.fov = newFov;
            camera.updateProjectionMatrix(); 
        }
    }
}