import * as THREE from 'three';

export class Scene5 {
    constructor(scene, assetManager, scene2Objects) {
        this.scene = scene;
        this.assets = assetManager;
        this.scene2 = scene2Objects;

        this.mobs = [];
        this.isActive = false;

        // Target Mob (Pintu)
        this.doorTarget = new THREE.Vector3(-27.19, 19.70, 39.20);

        this.mobSpeed = 1.0;
        this.torchLight = null;

        // Simpan nilai asli environment agar bisa di-reset nanti
        this.defaultEnvIntensity = 1.0;
        this.defaultBgIntensity = 1.0;
    }

    setup() {
        console.log("🛠️ Setup: Scene 5");
        this.setupMobs();

        // Setup Obor (Cahaya di dalam rumah)
        this.torchLight = new THREE.PointLight(0xffaa00, 10, 15);
        this.torchLight.position.set(-27, 21, 33);
        this.torchLight.castShadow = true;
        this.torchLight.visible = false;
        this.scene.add(this.torchLight);
    }

    setupMobs() {
        const mobTypes = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'];
        const spawnPoints = [
            // Original 5
            new THREE.Vector3(-66, 19, 52),
            new THREE.Vector3(-31, 19, 75),
            new THREE.Vector3(-50, 19, 46),
            new THREE.Vector3(-60, 19, 50),
            new THREE.Vector3(-40, 19, 60),

            // New 10 (Distributed x: [-70, -30], z: [40, 80], y: 19)
            new THREE.Vector3(-68, 19, 55),
            new THREE.Vector3(-35, 19, 70),
            new THREE.Vector3(-55, 19, 48),
            new THREE.Vector3(-62, 19, 58),
            new THREE.Vector3(-45, 19, 65),
            new THREE.Vector3(-58, 19, 52),
            new THREE.Vector3(-38, 19, 72),
            new THREE.Vector3(-64, 19, 50),
            new THREE.Vector3(-48, 19, 62),
            new THREE.Vector3(-52, 19, 44)
        ];

        spawnPoints.forEach((spawnPos, index) => {
            // Cycle through mob types
            const type = mobTypes[index % mobTypes.length];
            const model = this.assets.get(type);

            if (model) {
                // ========================================================
                // 🔴 FIX ERROR: Converting circular structure to JSON
                // ========================================================
                // 1. Simpan mixer asli sementara & Hapus dari userData
                // Ini mencegah Three.js mencoba meng-copy mixer lama yang menyebabkan crash
                const originalMixer = model.userData.mixer;
                delete model.userData.mixer;

                // 2. Clone Model (Sekarang aman karena tidak ada circular reference)
                const mob = model.clone();

                // 3. Kembalikan mixer ke model asli (Agar aset utama tetap utuh)
                if (originalMixer) model.userData.mixer = originalMixer;

                // ========================================================

                // Posisi Spawn
                mob.position.copy(spawnPos);

                // Scale adjustment
                if (type === 'spider') mob.scale.set(1.2, 1.2, 1.2);
                else if (type === 'creeper' || type === 'enderman') mob.scale.set(0.1, 0.1, 0.1);
                else mob.scale.set(0.5, 0.5, 0.5);

                mob.visible = false;

                // 4. BUAT MIXER BARU UNTUK MOB INI
                // Setiap mob harus punya mixer sendiri, tidak boleh sharing dengan aset utama
                const mixer = new THREE.AnimationMixer(mob);
                mob.userData.mixer = mixer;

                // Ambil data animasi dari model asli (ini aman karena cuma data array)
                const anims = model.userData.animations || [];

                if (anims.length > 0) {
                    // Cari animasi 'walk', fallback ke animasi pertama
                    let walkClip = anims.find(c => c.name.toLowerCase().includes('walk')) || anims[0];
                    // Play animasi pada mixer baru
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

        // --- 1. SETTING GELAP (ENV & BACKGROUND) ---
        // Simpan nilai lama (fallback 0.5 jika undefined)
        this.defaultEnvIntensity = this.scene.environmentIntensity !== undefined ? this.scene.environmentIntensity : 0.5;
        this.defaultBgIntensity = this.scene.backgroundIntensity !== undefined ? this.scene.backgroundIntensity : 0.5;

        // Paksa menjadi sangat gelap
        this.scene.environmentIntensity = 0.05;
        this.scene.backgroundIntensity = 0.05;

        // --- 2. SETTING MATAHARI ---
        if (sunLight) {
            sunLight.intensity = 0.1; // Sangat redup
            sunLight.color.setHex(0x112244); // Biru Malam
        }

        // --- 3. SETTING AMBIENT LIGHT ---
        this.scene.traverse((child) => {
            if (child.isAmbientLight) {
                child.intensity = 0.02; // Hampir mati
            }
        });

        // --- 4. NYALAKAN OBOR RUMAH ---
        if (this.torchLight) this.torchLight.visible = true;

        // Setup Posisi Steve & Alex
        const steve = this.scene2.steveStatic;
        const alex = this.scene2.alex;

        if (steve) {
            steve.position.set(-27.80, 18.82, 33.5);
            steve.rotation.set(0, 0, 0);
            steve.visible = true;
        }
        if (alex) {
            alex.position.set(-26.52, 17.52, 34.12);
            alex.rotation.set(0, 0, 0);
            alex.visible = true;
        }

        // Tampilkan Semua Mobs
        this.mobs.forEach(mob => mob.visible = true);
    }

    update(delta) {
        if (!this.isActive) return;

        this.mobs.forEach(mob => {
            // Update animasi (Mixer)
            if (mob.userData.mixer) mob.userData.mixer.update(delta);

            // Logic Jalan
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