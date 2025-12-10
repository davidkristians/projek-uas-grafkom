import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

// --- IMPORT BARU UNTUK AIR ---
import { Water } from 'three/addons/objects/Water.js';

// --- POST PROCESSING IMPORTS ---
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

// =========================================
// 1. SETUP RENDERER
// =========================================
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// // FOG & BACKGROUND SETUP (Sesuai perbaikan sebelumnya)
// scene.fog = new THREE.FogExp2(0x050505, 0.002); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 10, 30);

// =========================================
// 2. CONTROLS (SPECTATOR)
// =========================================
const controls = new PointerLockControls(camera, document.body);

const blocker = document.createElement('div');
blocker.style.position = 'absolute';
blocker.style.top = '50%';
blocker.style.left = '50%';
blocker.style.transform = 'translate(-50%, -50%)';
blocker.style.color = 'white';
blocker.style.fontFamily = 'Arial';
blocker.style.fontSize = '24px';
blocker.style.backgroundColor = 'rgba(0,0,0,0.5)';
blocker.style.padding = '20px';
blocker.innerHTML = 'KLIK UNTUK MULAI<br><span style="font-size:14px">WASD = Gerak, Spasi/Shift = Terbang</span>';
document.body.appendChild(blocker);

document.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => blocker.style.display = 'none');
controls.addEventListener('unlock', () => blocker.style.display = 'block');

// Variable Gerak
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

const onKeyDown = (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': moveUp = true; break;
        case 'ShiftLeft': moveDown = true; break;
    }
};
const onKeyUp = (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
        case 'Space': moveUp = false; break;
        case 'ShiftLeft': moveDown = false; break;
    }
};
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// =========================================
// 3. POST PROCESSING
// =========================================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtaoPass.output = GTAOPass.OUTPUT.Default;
gtaoPass.blendIntensity = 0.8; 
gtaoPass.scale = 1.0;          
composer.addPass(gtaoPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.4, 0.85);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// =========================================
// 4. LIGHTING
// =========================================
const hdrLoader = new HDRLoader(); // Ganti nama variabel biar rapi (opsional)
hdrLoader.load(
    '/public/resources/citrus_orchard_road_puresky_2k.hdr', 
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        scene.backgroundIntensity = 1.0; 
        scene.environmentIntensity = 0.6;
    },
    undefined,
    function (err) {
        console.error('Error loading HDR:', err);
    }
);

const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
sunLight.position.set(100, 150, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096; 
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.bias = -0.0005; 
const d = 100;
sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// =========================================
// 5. LOAD MODEL & WATER SETUP
// =========================================

// Variabel global untuk akses air di animasi
let water; 

// =========================================
// 5. LOAD MODEL & FIX TRANSPARENCY
// =========================================

const loader = new GLTFLoader();
loader.load(
    '/resources/untitled - Copy.glb', 
    (gltf) => {
        const model = gltf.scene;
        
        const toReplace = []; // Penampung untuk mesh air yang akan diganti

        model.traverse((child) => {
            if (child.isMesh) {
                // 1. Aktifkan Bayangan
                child.castShadow = true;
                child.receiveShadow = true;

                // 2. DETEKSI APAKAH INI AIR?
                if (child.name === 'water_still' || child.name.includes('water')) {
                    toReplace.push(child); // Simpan untuk diproses nanti
                } 
                // 3. JIKA BUKAN AIR (Blok, Daun, Pintu, Pagar)
                else {
                    // FIX OBJEK TEMBUS PANDANG
                    // Paksa material menjadi PADAT (Opaque) dengan Alpha Test
                    if (child.material.map) {
                        child.material.transparent = false; // JANGAN true, ini biangnya masalah
                        child.material.alphaTest = 0.5;     // Pixel < 50% opacity akan bolong, sisanya padat
                        child.material.depthWrite = true;   // Wajib true agar bayangan tidak tembus
                        child.material.depthTest = true;
                        child.material.side = THREE.DoubleSide; // Agar terlihat dari dua sisi
                        
                        // Opsional: Matikan roughness agar blok tidak terlalu mengkilap aneh
                        child.material.roughness = 1.0; 
                    }
                }
            }
        });

        // 4. PROSES PEMBUATAN AIR (Sesuai kode sebelumnya)
        toReplace.forEach(oldMesh => {
            // Buat geometri baru yang luas (PlaneGeometry)
            const waterGeometry = new THREE.PlaneGeometry(10000, 10000); 

            water = new Water(
                waterGeometry,
                {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: new THREE.TextureLoader().load( '/resources/waternormals.jpg', function ( texture ) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    } ),
                    sunDirection: new THREE.Vector3(0, 1, 0), // Arah matahari default
                    sunColor: 0xffffff,
                    waterColor: 0x00ffff, // Cyan/Biru Laut
                    distortionScale: 3.7,
                    fog: false
                }
            );

            water.rotation.x = - Math.PI / 2;
            water.position.y = oldMesh.position.y;
            water.material.uniforms['alpha'].value = 0.9; 

            scene.add(water);
            oldMesh.parent.remove(oldMesh);
        });

        scene.add(model);
    },
    undefined,
    (error) => console.error(error)
);

// =========================================
// 6. ANIMATION
// =========================================

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // -- LOGIKA CONTROLS --
    if (controls.isLocked === true) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speed = 400.0;
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
        if (moveUp) velocity.y += speed * delta;
        if (moveDown) velocity.y -= speed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;
    }

    // -- ANIMASI AIR --
    // Menggerakkan uniform 'time' agar air terlihat mengalir
    if (water) {
        water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    }

    composer.render();
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});