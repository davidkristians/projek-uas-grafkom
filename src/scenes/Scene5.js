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
        
        // Penyimpanan Texture Malam (Pre-loaded)
        this.nightTexture = null; 
        
        // Simpan referensi lampu pilar
        this.pillarLightObj = null; 
    }

    setup() {
        console.log("🛠️ Setup: Scene 5 (Pre-loading Assets)");
        
        // 1. PRE-LOAD MOBS
        this.setupMobs();

        // 2. PRE-LOAD INDOOR LIGHT
        const indoorLight = new THREE.PointLight(0xffaa00, 20, 30, 2);
        indoorLight.position.set(-27, 21, 33);
        indoorLight.castShadow = true;
        indoorLight.shadow.bias = -0.0001;
        indoorLight.visible = false; // Matikan dulu
        this.scene.add(indoorLight);
        this.fireLights.push(indoorLight);

        // 3. PRE-LOAD PILLAR LIGHT (Obor)
        // Kita cari objeknya dan pasang lampunya SEKARANG, tapi dimatikan.
        const pillarTorchName = 'projek_uas_grafkom__-566_32_203_to_-332_319_461_42';
        this.pillarTorchMesh = this.scene.getObjectByName(pillarTorchName);

        if (this.pillarTorchMesh) {
            console.log("✅ Obor Pilar Ditemukan! Menyiapkan Lampu...");
            this.setupPillarLight(this.pillarTorchMesh);
        }

        // 4. PRE-LOAD NIGHT SKY (EXR)
        // Load sekarang biar nanti tidak lag pas ganti scene
        const pmremGenerator = new THREE.PMREMGenerator(this.scene.renderer || new THREE.WebGLRenderer());
        pmremGenerator.compileEquirectangularShader();

        new EXRLoader().load('/resources/NightSkyHDRI003_4K_HDR.exr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            
            this.nightTexture = texture; // Simpan di variabel, jangan dipakai dulu
            console.log("🌌 Night Sky Loaded!");
        });
    }

    setupPillarLight(mesh) {
        // Setup lampu dilakukan di awal game, bukan saat cutscene mulai
        const pillarLight = new THREE.PointLight(0xff4400, 500, 300, 1.5);

        pillarLight.position.set(0, 2.0, 5.0);
        pillarLight.castShadow = true;
        pillarLight.shadow.bias = -0.0001;
        pillarLight.shadow.mapSize.width = 2048; 
        pillarLight.shadow.mapSize.height = 2048;

        pillarLight.visible = false; // Hidden di awal

        mesh.add(pillarLight);
        this.fireLights.push(pillarLight);
        this.pillarLightObj = pillarLight; // Simpan referensi

        // Simpan material asli untuk efek glow nanti
        if (mesh.material) {
            // Clone sekarang biar nanti enteng
            mesh.userData.originalMaterial = mesh.material;
            mesh.userData.glowMaterial = mesh.material.clone();
            mesh.userData.glowMaterial.emissive.set(0xffaa00);
            mesh.userData.glowMaterial.emissiveIntensity = 20.0;
        }
    }

    applySpecularMaterial(model) {
        if (!model) return;
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Clone material jika belum di-clone (cek userData)
                if (!child.userData.isClonedForNight) {
                    child.material = child.material.clone();
                    child.userData.isClonedForNight = true;
                }
                
                child.material.roughness = 0.2;
                child.material.metalness = 0.1;
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
                const originalMixer = model.userData.mixer;
                delete model.userData.mixer;
                const mob = model.clone();
                if (originalMixer) model.userData.mixer = originalMixer;

                // Pre-apply specular di setup
                this.applySpecularMaterial(mob);

                const spawnPos = spawnPoints[index % spawnPoints.length];
                mob.position.copy(spawnPos);

                // Scale adjustment
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

        // --- 1. SET ENVIRONMENT (INSTANT SWAP) ---
        if (this.nightTexture) {
            this.scene.background = this.nightTexture;
            this.scene.environment = this.nightTexture;
            this.scene.backgroundIntensity = 1.0; 
            this.scene.environmentIntensity = 0.5;
        } else {
            // Fallback jika EXR belum selesai load (jarang terjadi jika setup dipanggil di awal)
            this.scene.backgroundIntensity = 0.05;
            this.scene.environmentIntensity = 0.05;
        }

        // --- 2. SET LIGHTING ---
        if (sunLight) {
            sunLight.intensity = 0.1;
            sunLight.color.setHex(0x112244);
        }
        this.scene.traverse((child) => {
            if (child.isAmbientLight) child.intensity = 0.05;
        });

        // Nyalakan semua lampu api yang sudah disiapkan di setup
        this.fireLights.forEach(light => { light.visible = true; });

        // Apply Glow Material ke Obor Pilar (Swap Material)
        if (this.pillarTorchMesh && this.pillarTorchMesh.userData.glowMaterial) {
            this.pillarTorchMesh.material = this.pillarTorchMesh.userData.glowMaterial;
        }

        if (this.scene1 && this.scene1.torch) {
            this.scene1.torch.traverse((child) => {
                if (child.isMesh) {
                    if (!child.userData.originalMat) child.userData.originalMat = child.material.clone();
                    child.material.emissive = new THREE.Color(0xffaa00);
                    child.material.emissiveIntensity = 3.0;
                }
            });
        }

        // --- 3. STEVE & ALEX ---
        const steve = this.scene2.steveStatic;
        const alex = this.scene2.alex;

        if (steve) {
            steve.position.set(-27.36, 18.82, 32.73);
            steve.visible = true;
            steve.lookAt(this.doorTarget);
            this.applySpecularMaterial(steve);
        }
        if (alex) {
            alex.position.set(-26.52, 17.63, 34.12);
            alex.visible = true;
            alex.lookAt(this.doorTarget);
            this.applySpecularMaterial(alex);
        }

        // Reset Pintu
        if (this.scene1 && this.scene1.door) this.scene1.door.rotation.y = degToRad(-90);
        if (this.scene1 && this.scene1.door2) this.scene1.door2.rotation.y = degToRad(270);

        // --- 4. MOBS VISIBILITY (Staggered to reduce lag?) ---
        // Kita nyalakan langsung karena aset sudah di-preload di setup
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

        // PINTU TUTUP ANIMASI
        if (this.timer >= 19.6 && this.scene1) {
            const door = this.scene1.door;
            const door2 = this.scene1.door2;

            if (door && door2) {
                const t = Math.min(Math.max((this.timer - 19.6) / 0.2, 0), 1);
                
                const rStart1 = THREE.MathUtils.degToRad(-90);
                const rEnd1 = 0;
                door.rotation.y = THREE.MathUtils.lerp(rStart1, rEnd1, t);
                door.position.x = THREE.MathUtils.lerp(-28.25, -27.5, t);

                const rStart2 = THREE.MathUtils.degToRad(270);
                const rEnd2 = Math.PI;
                door2.rotation.y = THREE.MathUtils.lerp(rStart2, rEnd2, t);
                door2.position.x = THREE.MathUtils.lerp(-25.75, -26.5, t);

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