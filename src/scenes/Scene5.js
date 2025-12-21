import * as THREE from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';

export class Scene5 {
    constructor(scene, assetManager, scene2Objects, scene1Objects) {
        this.scene = scene;
        this.assets = assetManager;
        this.scene2 = scene2Objects; 
        this.scene1 = scene1Objects; 

        this.mobs = [];
        this.isActive = false;
        
        this.doorTarget = new THREE.Vector3(-27.19, 19.70, 39.20);
        this.mobSpeed = 0.6; 
        
        // List lampu api untuk efek flicker
        this.fireLights = []; 
        
        this.timer = 0; 
        this.defaultEnvIntensity = 1.0; 
        this.defaultBgIntensity = 1.0;
    }

    setup() {
        console.log("🛠️ Setup: Scene 5");
        this.setupMobs();

        // 1. LAMPU DALAM RUMAH (Indoor)
        // Posisi manual di dekat Steve/Alex
        const indoorLight = new THREE.PointLight(0xffaa00, 15, 20, 2);
        indoorLight.position.set(-27, 21, 33);
        indoorLight.castShadow = true;
        indoorLight.shadow.bias = -0.0001;
        indoorLight.visible = false;
        this.scene.add(indoorLight);
        this.fireLights.push(indoorLight); // Masukkan ke list flicker

        // 2. LAMPU OBOR PILAR (Outdoor - Penerang Mobs)
        // Kita cari object mesh obor pilar berdasarkan nama yang Anda berikan
        const pillarTorchName = 'projek_uas_grafkom__-566_32_203_to_-332_319_461_42';
        
        // Kita cari saat setup, tapi kadang map belum full load, jadi kita cek lagi di start()
        this.pillarTorchMesh = this.scene.getObjectByName(pillarTorchName);
        
        if (this.pillarTorchMesh) {
            console.log("✅ Obor Pilar Ditemukan!");
            this.setupPillarLight(this.pillarTorchMesh);
        } else {
            console.warn("⚠️ Obor Pilar belum ketemu di setup, akan dicoba lagi saat start.");
        }
    }

    setupPillarLight(mesh) {
        // Buat Lampu untuk Obor Luar
        // Intensity besar (40) dan Distance jauh (40) agar menerangi halaman
        const pillarLight = new THREE.PointLight(0xff6600, 40, 40, 2);
        
        // Geser sedikit posisi lampu dari titik pusat mesh agar tidak tertelan tembok
        // Kita asumsi mesh obor ada di dinding, jadi kita majukan sedikit
        pillarLight.position.set(0, 0.5, 0.5); 
        
        pillarLight.castShadow = true;
        pillarLight.shadow.bias = -0.0001;
        pillarLight.visible = false; // Nanti dinyalakan pas start

        // Tempelkan lampu SEBAGAI ANAK dari mesh obor
        // Jadi kalau obor gerak/rotasi, lampu ikut
        mesh.add(pillarLight);
        this.fireLights.push(pillarLight);

        // Buat Mesh Obor-nya Menyala (Emissive)
        if (mesh.material) {
            // Clone material agar tidak merusak obor lain jika sharing material
            mesh.material = mesh.material.clone();
            mesh.material.emissive.set(0xffaa00);
            mesh.material.emissiveIntensity = 5.0; // Glow terang
        }
    }

    setupMobs() {
        const mobTypes = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman','skeleton', 'spider', 'creeper', 'enderman'];
        const spawnPoints = [
            new THREE.Vector3(-66, 19, 52), new THREE.Vector3(-31, 16.1, 58),
            new THREE.Vector3(-50, 19, 49), new THREE.Vector3(-60, 17.05, 50),
            new THREE.Vector3(-40, 19, 50), new THREE.Vector3(-55, 18, 55),
            new THREE.Vector3(-35, 19, 55), new THREE.Vector3(-45, 17, 45),
            new THREE.Vector3(-25, 19, 55)
        ];

        mobTypes.forEach((type, index) => {
            const model = this.assets.get(type);
            if (model) {
                // Fix Circular Structure
                const originalMixer = model.userData.mixer;
                delete model.userData.mixer; 
                const mob = model.clone();
                if (originalMixer) model.userData.mixer = originalMixer;

                // Setup Material Mobs (Agar berkilau kena cahaya obor)
                mob.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.roughness = 0.5; // Agak mengkilap
                        child.material.metalness = 0.2; // Sedikit metalik
                    }
                });

                const spawnPos = spawnPoints[index % spawnPoints.length];
                mob.position.copy(spawnPos);
                
                if (type === 'spider'){
                    mob.scale.set(0.8, 0.8, 0.8);
                    mob.rotation.x = Math.PI/2; 
                    mob.rotation.y = degToRad(90); 
                    mob.position.y -= 1.95; 
                } else if (type === 'enderman') {
                    mob.scale.set(0.05, 0.05, 0.05);
                    mob.position.y -= 1.35; 
                } else if (type === 'creeper'){ 
                    mob.scale.set(0.05, 0.05, 0.05);
                    mob.position.y += 0.4; 
                } else if (type === 'skeleton'){
                     mob.scale.set(0.5, 0.5, 0.5);
                    mob.position.y -= 2.9; 
                } else if (type === 'zombie'){
                    mob.scale.set(0.5, 0.5, 0.5);
                    mob.position.y += 3; 
                }
                mob.visible = false;
                
                const mixer = new THREE.AnimationMixer(mob);
                mob.userData.mixer = mixer; 
                const anims = model.userData.animations || [];
                if (anims.length > 0) {
                    let walkClip = anims.find(c => c.name.toLowerCase().includes('walk')) || anims[0];
                    mixer.clipAction(walkClip).play();
                }
                this.scene.add(mob);
                this.mobs.push(mob);
            }
        });
    }

    start(sunLight) {
        console.log("🎬 Action: Scene 5 (Night Mode ON)");
        this.isActive = true;
        this.timer = 0; 

        // --- Coba cari ulang obor pilar jika di setup belum ketemu ---
        if (!this.pillarTorchMesh) {
            const pillarTorchName = 'projek_uas_grafkom__-566_32_203_to_-332_319_461_42';
            this.pillarTorchMesh = this.scene.getObjectByName(pillarTorchName);
            if (this.pillarTorchMesh) this.setupPillarLight(this.pillarTorchMesh);
        }

        // --- Lighting & Env ---
        this.defaultEnvIntensity = this.scene.environmentIntensity !== undefined ? this.scene.environmentIntensity : 0.5;
        this.defaultBgIntensity = this.scene.backgroundIntensity !== undefined ? this.scene.backgroundIntensity : 0.5;
        this.scene.environmentIntensity = 0.05; 
        this.scene.backgroundIntensity = 0.05; 

        if (sunLight) {
            sunLight.intensity = 0.1; 
            sunLight.color.setHex(0x112244); 
        }
        this.scene.traverse((child) => {
            if (child.isAmbientLight) child.intensity = 0.05; 
        });

        // --- NYALAKAN SEMUA LAMPU API (Indoor & Outdoor) ---
        this.fireLights.forEach(light => {
            light.visible = true;
        });

        // --- Emissive pada Obor Indoor (Scene 1) ---
        if (this.scene1 && this.scene1.torch) {
            this.scene1.torch.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0xffaa00);
                    child.material.emissiveIntensity = 3.0;
                }
            });
        }

        // --- Posisi Actor ---
        const steve = this.scene2.steveStatic;
        const alex = this.scene2.alex;

        if (steve) {
            steve.position.set(-27.36, 18.82, 32.73);
            steve.visible = true;
            steve.lookAt(this.doorTarget); 
        }
        if (alex) {
            alex.position.set(-26.52, 17.63, 34.12);
            alex.visible = true;
            alex.lookAt(this.doorTarget);
        }

        // --- Reset Pintu ---
        if (this.scene1 && this.scene1.door) this.scene1.door.rotation.y = degToRad(-90); 
        if (this.scene1 && this.scene1.door2) this.scene1.door2.rotation.y = degToRad(270); 

        this.mobs.forEach(mob => mob.visible = true);
    }

    update(delta) {
        if (!this.isActive) return;

        this.timer += delta; 

        // ✅ ANIMASI FLICKER UNTUK SEMUA LAMPU OBOR (Indoor & Outdoor)
        const flickerSpeed = 10;
        const flickerRange = 0.2; // Persentase variasi (20%)
        
        this.fireLights.forEach(light => {
            if (light.visible) {
                // Simpan intensitas dasar di userData jika belum ada
                if (!light.userData.baseIntensity) light.userData.baseIntensity = light.intensity;
                
                const base = light.userData.baseIntensity;
                // Variasi acak per frame
                const noise = Math.sin(this.timer * flickerSpeed) * 0.5 + Math.random() * 0.5;
                light.intensity = base + (base * flickerRange * noise);
            }
        });

        // --- TUTUP PINTU INSTAN ---
        if (this.timer > 19.85 && this.scene1) {
            const door = this.scene1.door;
            const door2 = this.scene1.door2;
            if (door && door2) {
                door.position.set(-27.5, 18.025, 35.66);
                door2.position.set(-26.5, 18.025, 35.66);
                door.rotation.y = 0; 
                door2.rotation.y = Math.PI;
            }
        }

        // --- UPDATE MOBS ---
        this.mobs.forEach(mob => {
            if (mob.userData.mixer) mob.userData.mixer.update(delta);
            const currentPos = mob.position;
            const distance = currentPos.distanceTo(this.doorTarget);
            if (distance > 3) {
                mob.lookAt(this.doorTarget.x, currentPos.y, this.doorTarget.z);
                const direction = new THREE.Vector3().subVectors(this.doorTarget, currentPos).normalize();
                mob.position.add(direction.multiplyScalar(this.mobSpeed * delta));
            }
        });
    }
}