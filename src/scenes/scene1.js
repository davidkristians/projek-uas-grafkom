import * as THREE from 'three';

export class Scene1 {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager;
        this.steve = null; // Wadah untuk simpan objek Steve
    }

    setup() {
        console.log("🛠️ Setup: Menata Object Scene 1");

        // 1. Masukkan MAP
        const map = this.assets.get('map');
        if (map) {
            this.scene.add(map);
            map.position.set(0, 0, 0); 
        }

        // 2. Masukkan STEVE (Diambil dari AssetManager)
        this.steve = this.assets.get('steve');
        
        // Simpan koordinat pusat Steve untuk referensi perabotan
        const roomX = -27.53;
        const roomY = 18.85;
        const roomZ = 33.11;

        if (this.steve) {
            console.log("✅ Steve berhasil ditambahkan ke Scene!");

            // --- POSISI STEVE ---
            this.steve.position.set(roomX, roomY, roomZ); 
            
            // Rotasi & Scale
            this.steve.rotation.y = Math.PI; 
            this.steve.scale.set(0.05, 0.05, 0.05);  
            
            this.scene.add(this.steve);

            // --- ANIMASI STEVE ---
            const mixer = this.steve.userData.mixer;
            const anims = this.steve.userData.animations;
            
            if (mixer && anims.length > 0) {
                mixer.clipAction(anims[0]).play();
            }
        } else {
            console.warn("⚠️ Gagal memuat Steve. Pastikan AssetManager sudah benar.");
        }

        // 3. Masukkan PERABOTAN (Furniture)
        // Saya samakan scale-nya dengan Steve (0.05) biar proporsional

        // A. CHEST (Peti) - Sebelah Kiri
        const chest = this.assets.get('chest');
        if (chest) {
            chest.position.set(-25.51, 18.03, 34.49); // Geser X +2
            chest.scale.set(0.63, 0.63, 0.63); 
            chest.rotation.y = -Math.PI / 2; 
            this.scene.add(chest);
        }

        // B. torch - Sebelah Kanan
        const craftingTable = this.assets.get('torch');
        if (craftingTable) {
            craftingTable.position.set(roomX - 2, roomY, roomZ); // Geser X -2
            craftingTable.scale.set(0.2, 0.2, 0.2);
            this.scene.add(craftingTable);
        }

        // C. picaxe (Tungku) - Di Belakang
        const furnace = this.assets.get('pickaxe');
        if (furnace) {
            furnace.position.set(-27.03, 21.04, 32.045); // Geser X kiri, Z belakang
            furnace.scale.set(0.04, 0.04, 0.04);
            furnace.rotation.y = Math.PI / 4; 
            furnace.rotation.x = THREE.MathUtils.degToRad(90);
            this.scene.add(furnace);
        }
    }
}