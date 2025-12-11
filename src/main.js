// src/main.js
import { createRenderer } from './core/renderer.js';
import { createCamera, handleResize } from './core/cameraManager.js';
import { createScene, createComposer } from './core/sceneManager.js';
import { setupLighting } from './core/lighting.js';
import { clock } from './core/timeline.js';
import { FreeRoamControls } from './controls/FreeRoamControls.js';
import { loadMap } from './objects/MinecraftMap.js';

// 1. Setup Core System
const renderer = createRenderer();
const camera = createCamera();
const scene = createScene();
const composer = createComposer(renderer, scene, camera);

// 2. Setup Lighting & Environment
setupLighting(scene);

// 3. Setup Controls
const playerControls = new FreeRoamControls(camera, document.body);

// 4. Load Objects
loadMap(scene);

// 5. Handle Resize
handleResize(camera, renderer, composer);

// 6. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update Controls Logic
    playerControls.update(delta, camera);

    // Render Scene (Gunakan Composer untuk GTAO/Bloom)
    composer.render();
}

animate();