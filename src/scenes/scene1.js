import * as THREE from 'three';

export class Scene1 {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager;
        this.steve = null; 
        this.door = null; // Wadah untuk pintu baru
    }

    setup() {
        console.log("🛠️ Setup: Menata Object Scene 1");

        // 1. MAP
        const map = this.assets.get('map');
        if (map) {
            this.scene.add(map);
            map.position.set(0, 0, 0); 
            // Tidak perlu lagi cari-cari pintu di dalam map
        }

        // 2. PINTU BARU (Wooden Door)
        this.door = this.assets.get('door');
        if (this.door) {
            // Koordinat dari Anda: -26.96, 19.36, 35.46
            this.door.position.set(-27.5, 18.025, 36.26);
            
            // Cek Scale: Jika pintu terlihat raksasa/kecil, ubah angka ini
            // Biasanya 1.0 jika export dari map, atau 0.05 jika dari Blockbench
            this.door.scale.set(0.5, 0.5, 0.3); 

            // Putar pintu agar pas dengan lubang tembok (sesuaikan jika perlu)
            // Misalnya 0, 90, 180, atau 270 derajat
            this.door.rotation.y = 90; 

            // -- LOGIKA BUKA PINTU --
            // Langsung kita buka 90 derajat agar sesuai script "Pintu Terbuka"
            this.door.rotation.y = THREE.MathUtils.degToRad(0);

            this.scene.add(this.door);
        }
          // 2. PINTU BARU (Wooden Door)
        this.door2 = this.assets.get('door2');
        if (this.door2) {
            // Koordinat dari Anda: -26.96, 19.36, 35.46
            this.door2.position.set(-26.5, 18.025, 36.26);
            
            // Cek Scale: Jika pintu terlihat raksasa/kecil, ubah angka ini
            // Biasanya 1.0 jika export dari map, atau 0.05 jika dari Blockbench
            this.door2.scale.set(0.5, 0.5, 0.3); 

            // Putar pintu agar pas dengan lubang tembok (sesuaikan jika perlu)
            // Misalnya 0, 90, 180, atau 270 derajat
            this.door2.rotation.y = 90; 

            // -- LOGIKA BUKA PINTU --
            // Langsung kita buka 90 derajat agar sesuai script "Pintu Terbuka"
            this.door2.rotation.y = THREE.MathUtils.degToRad(180);

            this.scene.add(this.door2);
        }

        // 3. STEVE
        this.steve = this.assets.get('steve');
        const roomX = -27.53;
        const roomY = 18.85;
        const roomZ = 33.11;

        if (this.steve) {
            this.steve.position.set(roomX, roomY, roomZ); 
            this.steve.rotation.y = Math.PI; 
            this.steve.scale.set(0.05, 0.05, 0.05); 
            this.scene.add(this.steve);

            const mixer = this.steve.userData.mixer;
            const anims = this.steve.userData.animations;
            if (mixer && anims.length > 0) mixer.clipAction(anims[0]).play();
        }

        // 4. PERABOTAN LAIN (Chest, Torch, Pickaxe)
        const chest = this.assets.get('chest');
        if (chest) {
            chest.position.set(-25.51, 18.03, 34.49); 
            chest.scale.set(0.63, 0.63, 0.63);
            chest.rotation.y = THREE.MathUtils.degToRad(-90); 
            this.scene.add(chest);
        }

        const torch = this.assets.get('torch');
        if (torch) {
            torch.position.set(roomX - 2, roomY, roomZ); 
            torch.scale.set(0.2, 0.2, 0.2);
            this.scene.add(torch);
        }

        const pickaxe = this.assets.get('pickaxe');
        if (pickaxe) {
            pickaxe.position.set(-27.03, 21.04, 32.045); 
            pickaxe.scale.set(0.04, 0.04, 0.04);
            pickaxe.rotation.y = THREE.MathUtils.degToRad(45);
            pickaxe.rotation.x = THREE.MathUtils.degToRad(90.5);
            this.scene.add(pickaxe);
        }
    }
}