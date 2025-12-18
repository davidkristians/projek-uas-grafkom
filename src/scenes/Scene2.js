import * as THREE from 'three';

export class Scene2 {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager;
        
        // Aktor
        this.steveWalk = null;
        // this.steveStatic = null; // Tidak perlu variabel ini lagi
        this.alex = null;
        this.villager = null;
        this.fox = null;
        this.bee = null;

        // Path Logic (Titik Jalan Steve)
        this.pathPoints = [
            new THREE.Vector3(-26.72, 19.26, 33.00), // Titik 1
            new THREE.Vector3(-26.92, 19.06, 36.00),
            new THREE.Vector3(-27.12, 18.15, 39.77), 
            new THREE.Vector3(-27.02, 18.0, 39.97), // Titik 1.5 (Turun)
            new THREE.Vector3(-27.24, 17.84, 41.77), // Titik 2
            new THREE.Vector3(-26.35, 17.84, 41.73), // Titik 3
            new THREE.Vector3(-26.48, 18.80, 41.67), // Titik 4 (Naik)
            new THREE.Vector3(-21.42, 18.80, 41.67), // Titik 5
            new THREE.Vector3(-21.42, 18.80, 33.16), // Titik 6
            new THREE.Vector3(-21.43, 18.04, 32.17), // Titik 7
            new THREE.Vector3(-21.63, 18.03, 26.99), // Titik 8
            new THREE.Vector3(-21.67, 18.8, 26.69), // Titik 9 (Naik)
            new THREE.Vector3(-21.57, 18.85, 25.66)  // Titik 10 (Final)
        ];
        
        this.currentPointIndex = 0;
        this.moveSpeed = 3.5; // Kecepatan jalan santai
        this.isWalking = false;
    }

    setup() {
        console.log("🛠️ Setup: Scene 2 (Meeting)");

        // 1. STEVE WALK (Aktor Utama Scene Ini)
        this.steveWalk = this.assets.get('steve_walk');
        if (this.steveWalk) {
            this.steveWalk.position.copy(this.pathPoints[0]);
            // Skala disesuaikan dengan kode Anda sebelumnya
            this.steveWalk.scale.set(0.0013, 0.0013, 0.0013); 
            this.steveWalk.visible = false; 
            this.scene.add(this.steveWalk);

            const mixer = this.steveWalk.userData.mixer;
            const anims = this.steveWalk.userData.animations;
            if (mixer && anims.length > 0) mixer.clipAction(anims[0]).play();
        }

        // 2. ALEX (Teman)
        this.alex = this.assets.get('alex');
        if (this.alex) {
            this.alex.position.set(-21.47, 17.67, 23.28); 
            this.alex.rotation.y = THREE.MathUtils.degToRad(0); 
            this.alex.scale.set(0.47, 0.47, 0.47);
            this.scene.add(this.alex);

            // Coba mainkan animasi Alex jika ada
            const mixer = this.alex.userData.mixer;
            const anims = this.alex.userData.animations;
            if (mixer && anims && anims.length > 0) {
                mixer.clipAction(anims[0]).play();
            }
        }

        // 3. VILLAGER (Background)
        this.villager = this.assets.get('villager');
        if (this.villager) {
            this.villager.position.set(-14.85, 17.41, 28.81);
            this.villager.rotation.y = THREE.MathUtils.degToRad(-90);
            this.villager.scale.set(0.05, 0.05, 0.05);
            this.scene.add(this.villager);

            const mixer = this.villager.userData.mixer;
            const anims = this.villager.userData.animations;
            if(mixer && anims.length > 0) mixer.clipAction(anims[0]).play();
        }

        // 4. ANIMALS
        this.fox = this.assets.get('fox');
        if(this.fox) {
            this.fox.position.set(-25, 17.67, 28);
            this.fox.rotation.y = THREE.MathUtils.degToRad(0);
            this.fox.scale.set(0.5, 0.5, 0.5);
            this.scene.add(this.fox);
        }
        
        this.bee = this.assets.get('bee');
        if(this.bee) {
            this.bee.position.set(-22, 22, 35);
            this.bee.scale.set(0.02, 0.02, 0.02);
            this.scene.add(this.bee);
        }
        
        // HAPUS bagian setup "steveStatic" clone disini
        // Kita akan panggil Steve asli nanti di finishWalk
    }

    startAnimation() {
        if(this.steveWalk) this.steveWalk.visible = true;
        this.isWalking = true;
        this.currentPointIndex = 0;
    }

    update(delta) {
        // Update Animasi Alex & Villager
        if (this.alex && this.alex.userData.mixer) this.alex.userData.mixer.update(delta);
        if (this.villager && this.villager.userData.mixer) this.villager.userData.mixer.update(delta);

        // Logika Jalan Steve
        if (this.isWalking && this.steveWalk && this.currentPointIndex < this.pathPoints.length - 1) {
            
            const currentPos = this.steveWalk.position;
            const targetPos = this.pathPoints[this.currentPointIndex + 1];
            
            const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
            
            const lookTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
            this.steveWalk.lookAt(lookTarget);

            const distance = currentPos.distanceTo(targetPos);
            const step = this.moveSpeed * delta;

            // Logika "Naik Balok"
            if (targetPos.y > currentPos.y + 0.1) {
                const flatDist = new THREE.Vector2(currentPos.x, currentPos.z).distanceTo(new THREE.Vector2(targetPos.x, targetPos.z));
                if (flatDist < 0.5) {
                    this.steveWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.2);
                }
            } else if (targetPos.y < currentPos.y - 0.1) {
                 this.steveWalk.position.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, 0.1);
            }

            if (distance <= step) {
                this.steveWalk.position.copy(targetPos);
                this.currentPointIndex++;

                if (this.currentPointIndex >= this.pathPoints.length - 1) {
                    this.finishWalk();
                }
            } else {
                this.steveWalk.position.add(direction.multiplyScalar(step));
            }
        }
        
        // Animasi Lebah
        if(this.bee) {
            this.bee.position.y += Math.sin(Date.now() * 0.005) * 0.01;
            this.bee.rotation.y += delta;
        }
    }

    finishWalk() {
        console.log("Scene 2: Steve sampai tujuan, ganti ke Steve Scene 1.");
        this.isWalking = false;
        
        // 1. Sembunyikan Animasi Jalan
        if (this.steveWalk) this.steveWalk.visible = false;
        
        // 2. Ambil Steve Asli (Scene 1) dari Assets
        const steveOriginal = this.assets.get('steve');
        
        if (steveOriginal) {
            // Pindahkan Steve Asli ke posisi terakhir Steve Jalan
            steveOriginal.position.copy(this.steveWalk.position);
            steveOriginal.rotation.copy(this.steveWalk.rotation);
            
            // [PENTING] Samakan skalanya agar tidak jadi raksasa/hilang
            // Menggunakan skala yang sama dengan steveWalk (0.0013)
            steveOriginal.scale.set(0.05, 0.05, 0.05); 
            
            // Munculkan
            steveOriginal.visible = true;

            // Jika Steve asli punya animasi idle, mainkan
            const mixer = steveOriginal.userData.mixer;
            const anims = steveOriginal.userData.animations;
            if (mixer && anims && anims.length > 0) {
                // Biasanya animasi pertama di model mixamo/blockbench adalah Idle
                mixer.clipAction(anims[0]).play(); 
            }
        }
    }
    
    getStevePosition() {
        // Helper untuk kamera mengikuti objek yang aktif
        if (this.isWalking && this.steveWalk) return this.steveWalk.position;
        
        // Jika sudah berhenti, return posisi Steve Asli
        const steveOriginal = this.assets.get('steve');
        if (!this.isWalking && steveOriginal) return steveOriginal.position;
        
        return new THREE.Vector3(0,0,0);
    }
}