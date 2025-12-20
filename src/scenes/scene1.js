import * as THREE from 'three';

export class Scene1 {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assets = assetManager;
        this.steve = null;
        this.door = null; // Wadah untuk pintu baru
        this.door2 = null;

        // [BARU] Array untuk menyimpan objek padat (Collider)
        this.colliders = [];
    }

    setup() {
        console.log("🛠️ Setup: Menata Object Scene 1");

        // 1. MAP
        const map = this.assets.get('map');
        if (map) {
            this.scene.add(map);
            map.position.set(0, 0, 0);

            // [BARU] Masukkan Map ke Collision (Kecuali Air & Rumput)
            map.traverse((child) => {
                if (child.isMesh) {
                    if (!child.name.includes('water') && !child.name.includes('grass')) {
                        this.colliders.push(child);
                    }
                }
            });
        }

        // 2. PINTU BARU (Wooden Door)
        this.door = this.assets.get('door');
        if (this.door) {
            this.door.position.set(-27.5, 18.025, 36.26);
            this.door.scale.set(0.5, 0.5, 0.3);
            this.door.rotation.y = THREE.MathUtils.degToRad(0);
            this.scene.add(this.door);

            // [BARU] Pintu masuk collider
            this.door.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
        }

        // PINTU 2
        this.door2 = this.assets.get('door2');
        if (this.door2) {
            this.door2.position.set(-26.5, 18.025, 36.26);
            this.door2.scale.set(0.5, 0.5, 0.3);
            this.door2.rotation.y = THREE.MathUtils.degToRad(180);
            this.scene.add(this.door2);

            // [BARU] Pintu 2 masuk collider
            this.door2.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
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

            // [BARU] Chest masuk collider
            chest.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
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

        // 5. FURNACE
        const furnace = this.assets.get('furnace');
        if (furnace) {
            furnace.position.set(-27, 17, 30);
            this.scene.add(furnace);

            // Furnace masuk collider
            furnace.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
        }

        // 6. FURNACE 2 (di kanan furnace pertama)
        const furnace2 = this.assets.get('furnace2');
        if (furnace2) {
            furnace2.position.set(-28, 17, 30);
            this.scene.add(furnace2);

            // Furnace2 masuk collider
            furnace2.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
        }

        // 7. CRAFTING TABLE
        const craftingTable = this.assets.get('crafting_table');
        if (craftingTable) {
            craftingTable.position.set(-3.5, 19.5, -2.5);
            this.scene.add(craftingTable);

            // Crafting table masuk collider
            craftingTable.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
        }

        // 8. MINECRAFT CHEST (di kiri crafting table)
        const minecraftChest = this.assets.get('minecraft_chest');
        if (minecraftChest) {
            minecraftChest.position.set(-2.5, 19.5, -2.5);
            minecraftChest.scale.set(0.005, 0.005, 0.005);
            minecraftChest.rotation.y = THREE.MathUtils.degToRad(90);  // Ubah nilai derajat: 0, 90, 180, -90
            this.scene.add(minecraftChest);

            // Minecraft chest masuk collider
            minecraftChest.traverse((c) => { if (c.isMesh) this.colliders.push(c); });
        }
    }

    // [BARU] Getter untuk diambil StoryManager
    getColliders() {
        return this.colliders;
    }
}