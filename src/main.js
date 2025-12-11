import { createRenderer } from './core/renderer.js';
import { createCamera, handleResize } from './core/cameraManager.js';
import { createScene, createComposer } from './core/sceneManager.js';
import { setupLighting } from './core/lighting.js';
import { clock } from './core/timeline.js';
import { FreeRoamControls } from './controls/FreeRoamControls.js';
import { AssetManager } from './managers/AssetManager.js';
import { StoryManager } from './managers/StoryManager.js';

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