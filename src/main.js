import { createRenderer } from './core/renderer.js';
import { createCamera, handleResize } from './core/cameraManager.js';
import { createScene, createComposer } from './core/sceneManager.js';
import { setupLighting } from './core/lighting.js';
import { clock } from './core/timeline.js';
import { FreeRoamControls } from './controls/FreeRoamControls.js';
import { AssetManager } from './managers/AssetManager.js';
import { StoryManager } from './managers/StoryManager.js';
import './style.css'; // Add this if you haven't already

// 1. Setup Core System
const renderer = createRenderer();
const camera = createCamera();
const scene = createScene();
const composer = createComposer(renderer, scene, camera);

// 2. Setup Lighting
const { sunLight } = setupLighting(scene);

// 3. Setup Controls (Awalnya disabled oleh StoryManager)
const playerControls = new FreeRoamControls(camera, document.body);

// 4. Setup Managers
const assetManager = new AssetManager();
let director = null; 

// 5. Load Assets & Start Movie
assetManager.loadAssets(() => {
    console.log("Assets Ready! Starting Movie...");
    
    director = new StoryManager(scene, camera, assetManager, sunLight, playerControls);
    director.startScene1();
});

// 6. Handle Resize
handleResize(camera, renderer, composer);

// 7. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // A. Update Cinematic (Jika aktif)
    if (director) {
        director.update(delta);
    }

    // B. Update Free Roam (Jika aktif)
    playerControls.update(delta, camera);

    // Render Scene
    composer.render();
}

animate();

// Debug Tool: Tekan P untuk cek koordinat
window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP') {
        const p = camera.position;
        console.log(`📍 ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);
    }
});
import * as THREE from 'three';
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Jika pointer terkunci (sedang main), kita anggap klik di tengah layar (crosshair)
    // Jika pointer bebas (ada kursor mouse), kita ikutin posisi kursor
    if (document.pointerLockElement) {
        mouse.x = 0;
        mouse.y = 0;
    } else {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    // Tembakkan sinar dari kamera
    raycaster.setFromCamera(mouse, camera);

    // Cek objek apa yang kena tembak
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        
        console.log("🎯 OBJEK TERDETEKSI:");
        console.log("-----------------------");
        console.log("Nama Object :", hitObject.name);
        console.log("Nama Parent :", hitObject.parent ? hitObject.parent.name : 'Tidak ada');
        console.log("Tipe        :", hitObject.type);
        console.log("-----------------------");

        // [Optional] Efek Kedip Merah (Visual Feedback)
        // Agar kamu yakin objek mana yang kena klik
        if (hitObject.material) {
            const originalEmissive = hitObject.material.emissive ? hitObject.material.emissive.getHex() : 0x000000;
            
            // Ubah jadi merah terang
            if(hitObject.material.emissive) hitObject.material.emissive.setHex(0xff0000);
            
            // Balikin warna asli setelah 0.5 detik
            setTimeout(() => {
                if(hitObject.material.emissive) hitObject.material.emissive.setHex(originalEmissive);
            }, 500);
        }
    }});