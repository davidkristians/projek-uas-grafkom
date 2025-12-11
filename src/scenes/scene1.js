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
        
        if (this.steve) {
            console.log("✅ Steve berhasil ditambahkan ke Scene!");

            // --- POSISI STEVE ---
            // Koordinat ini diambil dari titik 'LookAt' (fokus kamera) yang kamu catat
            // Saya turunkan Y-nya sedikit (18.2) supaya kakinya napak lantai (bukan melayang)
            this.steve.position.set(-27.53, 18.85, 33.11); 
            
            // Rotasi (Menghadap Pintu)
            // Kalau hadapnya salah, ubah nilai ini (Math.PI, 0, -Math.PI/2)
            this.steve.rotation.y = Math.PI ; 
            this.steve.scale.set(0.05, 0.05, 0.05);  
            
            this.scene.add(this.steve);

            // --- ANIMASI STEVE (IDLE) ---
            // Cek apakah model punya animasi
            const mixer = this.steve.userData.mixer;
            const anims = this.steve.userData.animations;
            
            if (mixer && anims.length > 0) {
                // Play animasi pertama (biasanya Idle/Napas)
                mixer.clipAction(anims[0]).play();
            }
        } else {
            console.warn("⚠️ Gagal memuat Steve. Pastikan AssetManager sudah benar.");
        }
    }
}