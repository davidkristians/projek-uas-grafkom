import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
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

        this.fireLights = [];
        this.timer = 0;
        this.defaultEnvIntensity = 1.0;
        this.defaultBgIntensity = 1.0;
    }

    setup() {
        console.log("🛠️ Setup: Scene 5");
        this.setupMobs();

        // 1. LAMPU DALAM RUMAH (Indoor)
        const indoorLight = new THREE.PointLight(0xffaa00, 20, 30, 2);
        indoorLight.position.set(-27, 21, 33);
        indoorLight.castShadow = true;
        indoorLight.shadow.bias = -0.0001;
        indoorLight.visible = false;
        this.scene.add(indoorLight);
        this.fireLights.push(indoorLight);

        // 2. LAMPU OBOR PILAR (Outdoor)
        const pillarTorchName = 'projek_uas_grafkom__-566_32_203_to_-332_319_461_42';
        this.pillarTorchMesh = this.scene.getObjectByName(pillarTorchName);

        if (this.pillarTorchMesh) {
            console.log("✅ Obor Pilar Ditemukan!");
            this.setupPillarLight(this.pillarTorchMesh);
        }
    }

    setupPillarLight(mesh) {
        // [PERBAIKAN DIFFUSE]
        // Intensity dinaikkan drastis ke 500 agar "banjir cahaya".
        // Distance 300 agar jangkauannya jauh sampai ke hutan.
        // Decay 1.5 agar cahaya tidak cepat mati.
        const pillarLight = new THREE.PointLight(0xff4400, 500, 300, 1.5);

        // [PENTING] Geser lampu JAUH dari mesh (Z=5, Y=2) 
        // supaya cahaya tidak tertutup pilar sendiri. Ini agar DIFFUSE kelihatan di tanah.
        pillarLight.position.set(0, 2.0, 5.0);

        pillarLight.castShadow = true;
        pillarLight.shadow.bias = -0.0001;
        pillarLight.shadow.mapSize.width = 2048; // Kualitas bayangan tinggi
        pillarLight.shadow.mapSize.height = 2048;

        pillarLight.visible = false;

        mesh.add(pillarLight);
        this.fireLights.push(pillarLight);

        // Efek Glow Obor
        if (mesh.material) {
            mesh.material = mesh.material.clone();
            mesh.material.emissive.set(0xffaa00);
            mesh.material.emissiveIntensity = 20.0; // Glow super terang
        }
    }

    // Fungsi Helper untuk membuat efek Specular (Mengkilap)
    applySpecularMaterial(model) {
        if (!model) return;
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                // [PERBAIKAN SPECULAR]
                // Roughness 0.2 = Seperti basah/minyak/plastik licin -> Pantulan cahaya TAJAM
                // Metalness 0.1 = Sedikit sentuhan logam agar pantulan lebih kontras
                child.material.roughness = 0.2;
                child.material.metalness = 0.1;

                // Pastikan bayangan aktif
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    setupMobs() {
        const mobTypes = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'skeleton', 'spider', 'creeper', 'enderman'];
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

                // [UPDATE] Terapkan efek Specular ke Mob
                this.applySpecularMaterial(mob);

                const spawnPos = spawnPoints[index % spawnPoints.length];
                mob.position.copy(spawnPos);

                // Scale adjustment (Sama seperti sebelumnya)
                if (type === 'spider') { mob.scale.set(0.8, 0.8, 0.8); mob.rotation.x = Math.PI / 2; mob.rotation.y = degToRad(90); mob.position.y -= 1.95; }
                else if (type === 'enderman') { mob.scale.set(0.05, 0.05, 0.05); mob.position.y -= 1.35; }
                else if (type === 'creeper') { mob.scale.set(0.05, 0.05, 0.05); mob.position.y += 0.4; }
                else if (type === 'skeleton') { mob.scale.set(0.5, 0.5, 0.5); mob.position.y -= 2.9; }
                else if (type === 'zombie') { mob.scale.set(0.5, 0.5, 0.5); mob.position.y += 3; }

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

        if (!this.pillarTorchMesh) {
            const pillarTorchName = 'projek_uas_grafkom__-566_32_203_to_-332_319_461_42';
            this.pillarTorchMesh = this.scene.getObjectByName(pillarTorchName);
            if (this.pillarTorchMesh) this.setupPillarLight(this.pillarTorchMesh);
        }

        // --- Lighting ---
        this.defaultEnvIntensity = this.scene.environmentIntensity !== undefined ? this.scene.environmentIntensity : 0.5;
        this.defaultBgIntensity = this.scene.backgroundIntensity !== undefined ? this.scene.backgroundIntensity : 0.5;
        this.scene.environmentIntensity = 0.05;
        this.scene.backgroundIntensity = 0.05;

        // --- 1. SETTING GELAP (ENV & BACKGROUND) ---
        // Simpan nilai lama (fallback 0.5 jika undefined)
        // this.defaultEnvIntensity = this.scene.environmentIntensity !== undefined ? this.scene.environmentIntensity : 0.5;
        // this.defaultBgIntensity = this.scene.backgroundIntensity !== undefined ? this.scene.backgroundIntensity : 0.5;

        // // Paksa menjadi sangat gelap
        // this.scene.environmentIntensity = 0.05;
        // this.scene.backgroundIntensity = 0.05;
        const pmremGenerator = new THREE.PMREMGenerator(this.scene.renderer || new THREE.WebGLRenderer()); // Optional: kalau mau pre-process
    
        new EXRLoader().load('/resources/NightSkyHDRI003_4K_HDR.exr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
        
            // 2. [FIX PIXELATED] Atur Filter agar halus
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // 3. Matikan Mipmaps (Karena ini background langit, kita tidak butuh mipmaps)
    texture.generateMipmaps = false;

    // 4. Masukkan ke Scene
    this.scene.background = texture;
    this.scene.environment = texture;
    
    // 5. Atur Intensitas
    this.scene.backgroundIntensity = 1.0; 
    this.scene.environmentIntensity = 0.5;
        });

        if (sunLight) {
            sunLight.intensity = 0.1;
            sunLight.color.setHex(0x112244);
        }
        this.scene.traverse((child) => {
            if (child.isAmbientLight) child.intensity = 0.05;
        });

        this.fireLights.forEach(light => { light.visible = true; });

        if (this.scene1 && this.scene1.torch) {
            this.scene1.torch.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0xffaa00);
                    child.material.emissiveIntensity = 3.0;
                }
            });
        }

        // --- SETUP STEVE & ALEX (SPECULAR) ---
        const steve = this.scene2.steveStatic;
        const alex = this.scene2.alex;

        if (steve) {
            steve.position.set(-27.36, 18.82, 32.73);
            steve.visible = true;
            steve.lookAt(this.doorTarget);

            // [BARU] Tambahkan Specular ke Steve
            this.applySpecularMaterial(steve);
        }
        if (alex) {
            alex.position.set(-26.52, 17.63, 34.12);
            alex.visible = true;
            alex.lookAt(this.doorTarget);

            // [BARU] Tambahkan Specular ke Alex
            this.applySpecularMaterial(alex);
        }

        // Reset Pintu
        if (this.scene1 && this.scene1.door) this.scene1.door.rotation.y = degToRad(-90);
        if (this.scene1 && this.scene1.door2) this.scene1.door2.rotation.y = degToRad(270);

        this.mobs.forEach(mob => mob.visible = true);
    }

    update(delta) {
        if (!this.isActive) return;

        this.timer += delta;

        // FLICKER EFFECT
        const flickerSpeed = 10;
        const flickerRange = 0.2;

        this.fireLights.forEach(light => {
            if (light.visible) {
                if (!light.userData.baseIntensity) light.userData.baseIntensity = light.intensity;
                const base = light.userData.baseIntensity;
                const noise = Math.sin(this.timer * flickerSpeed) * 0.5 + Math.random() * 0.5;
                light.intensity = base + (base * flickerRange * noise);
            }
        });

        // PINTU TUTUP ANIMASI (Slam Effect: 19.6s - 19.8s)
        if (this.timer >= 19.6 && this.scene1) {
            const door = this.scene1.door;
            const door2 = this.scene1.door2;

            if (door && door2) {
                // Durasi animasi 0.2 detik (Cepat/Slam)
                const t = Math.min(Math.max((this.timer - 19.6) / 0.2, 0), 1);

                // Easing BackIn agar terasa seperti "dibanting"
                // t = t * t * t; // (Optional: Cubic Easing)

                // Door 1 (Kiri): 
                // Rotation: -90 deg -> 0 deg
                // Position X: -28.25 -> -27.5
                const rStart1 = THREE.MathUtils.degToRad(-90);
                const rEnd1 = 0;
                door.rotation.y = THREE.MathUtils.lerp(rStart1, rEnd1, t);
                door.position.x = THREE.MathUtils.lerp(-28.25, -27.5, t);

                // Door 2 (Kanan): 
                // Rotation: 270 deg -> 180 deg (Math.PI)
                // Position X: -25.75 -> -26.5
                const rStart2 = THREE.MathUtils.degToRad(270);
                const rEnd2 = Math.PI;
                door2.rotation.y = THREE.MathUtils.lerp(rStart2, rEnd2, t);
                door2.position.x = THREE.MathUtils.lerp(-25.75, -26.5, t);

                // Keep Y and Z constant as per Scene 1 defaults
                door.position.y = 18.025; door.position.z = 36;
                door2.position.y = 18.025; door2.position.z = 36;
            }
        }

        // UPDATE MOBS
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