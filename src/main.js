import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// --- POST PROCESSING IMPORTS ---
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// NEW: Import Ambient Occlusion (Bayangan Sudut Realistis)
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

// =========================================
// 1. SETUP RENDERER
// =========================================
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true // Mencegah glitch pada objek jauh
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Shadow Settings
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipe bayangan lembut

// Color Management
renderer.outputColorSpace = THREE.SRGBColorSpace; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(30, 40, 60);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.05;

const controls = new PointerLockControls(camera, document.body);

// Instruksi: Klik layar untuk mengunci kursor dan mulai bergerak
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
blocker.style.pointerEvents = 'none'; // Biarkan klik tembus ke body
blocker.innerHTML = 'KLIK UNTUK MULAI<br><span style="font-size:14px">WASD = Gerak, Mouse = Lihat</span>';
document.body.appendChild(blocker);

document.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    blocker.style.display = 'block';
});

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
// TAMBAHAN: Variabel untuk Naik/Turun
let moveUp = false;
let moveDown = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

// Event Keyboard Tekan
const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        // UBAH: Spasi untuk Naik
        case 'Space':
            moveUp = true;
            break;
        // UBAH: Shift (Kiri/Kanan) untuk Turun
        case 'ShiftLeft':
        case 'ShiftRight':
            moveDown = true;
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        // UBAH: Reset status saat tombol dilepas
        case 'Space':
            moveUp = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            moveDown = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// =========================================
// 2. SETUP POST PROCESSING (GTAO + BLOOM)
// =========================================

const composer = new EffectComposer(renderer);

// A. Render Pass (Wajib Pertama)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// B. GTAO Pass (Ambient Occlusion) - RAHASIA REALISTIS
// Ini membuat bayangan di sela-sela rumput dan sudut bangunan
const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtaoPass.output = GTAOPass.OUTPUT.Default;
// Tweak angka ini sesuai selera:
gtaoPass.blendIntensity = 1.0; // Kekuatan kegelapan sudut (0.0 - 1.0)
gtaoPass.scale = 1.5;          // Skala efek (coba mainkan 0.5 - 1.5)
composer.addPass(gtaoPass);

// C. Bloom Pass (Glowing)
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 
    0.2,  // Strength (Turunkan sedikit biar tidak silau karena sudah ada GTAO)
    0.4,  // Radius
    0.85  // Threshold
);
composer.addPass(bloomPass);

// D. Output Pass (Color Correction) - Wajib Terakhir
const outputPass = new OutputPass();
composer.addPass(outputPass);

// =========================================
// 3. PENCAHAYAAN (SUN + HDRI)
// =========================================

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    '/public/resources/citrus_orchard_road_puresky_2k.hdr', 
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture; 
        scene.backgroundIntensity = 0.5; 
        scene.environmentIntensity = 0.5;
    }
);

// Matahari dengan Soft Shadows
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);

// --- SETTING MANUAL HASIL DEBUGGING ---
// Masukkan angka final yang kamu dapatkan dari GUI di sini:
const sunPosition = { x: 50, y: 100, z: 50 }; // Arah datang cahaya
const shadowSize = 300; // Luas area bayangan (semakin besar, area makin luas tapi resolusi turun)
const shadowFar = 500;  // Jarak render bayangan terjauh

sunLight.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
sunLight.castShadow = true;

// Kualitas Bayangan
sunLight.shadow.mapSize.width = 4096; 
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.bias = -0.0005; // Mengurangi glitch garis-garis
sunLight.shadow.radius = 2;     // Blur pinggiran bayangan

// Penerapan Area Bayangan
sunLight.shadow.camera.left = -shadowSize;
sunLight.shadow.camera.right = shadowSize;
sunLight.shadow.camera.top = shadowSize;
sunLight.shadow.camera.bottom = -shadowSize;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = shadowFar;

scene.add(sunLight);


// =========================================
// 4. LOAD MODEL
// =========================================

const realisticWaterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0088ff,
    transmission: 1.0,
    opacity: 1.0,
    metalness: 0,
    roughness: 0.05, // Sedikit kasar biar ada pantulan menyebar
    ior: 1.33,
    thickness: 1.5,
    specularIntensity: 1.0,
    envMapIntensity: 1.0,
    side: THREE.DoubleSide
});

const loader = new GLTFLoader();

loader.load(
    '/resources/untitled - Copy.glb', 
    (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.shadowSide = THREE.DoubleSide;

                if (child.material.map) {
                    // FIX TEXTURE TRANSPARAN
                    child.material.transparent = false; 
                    child.material.alphaTest = 0.5; 
                    child.material.depthWrite = true;
                    child.material.depthTest = true;
                    child.material.side = THREE.DoubleSide; 
                }
            }
        });

        // Setup Air
        const water = model.getObjectByName('water_still');
        if (water) {
             water.material = realisticWaterMaterial;
             water.material.transparent = true;
             water.material.depthWrite = false;
             water.castShadow = false; 
             water.receiveShadow = true;
        }

        scene.add(model);
    },
    undefined,
    (error) => console.error(error)
);

// =========================================
// 5. ANIMATION
// =========================================

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (controls.isLocked === true) {
        // 1. Gesekan Udara (Deceleration) - Agar berhenti pelan-pelan saat tombol dilepas
        // Semakin besar angka (10.0), semakin cepat berhenti (lebih responsif)
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta; // Tambahkan gesekan untuk naik/turun

        // 2. Tentukan Arah Gerak Horizontal (WASD)
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        // 3. Tentukan Arah Gerak Vertikal (Space/Shift)
        // Kita tidak perlu direction vector khusus untuk Y karena langsung akses velocity.y
        
        // --- KECEPATAN ---
        const speed = 100.0; // Kecepatan gerak (bisa diatur)

        // Akselerasi Horizontal
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        // Akselerasi Vertikal (Fly Logic)
        if (moveUp) {
            velocity.y += speed * delta; // Naik
        }
        if (moveDown) {
            velocity.y -= speed * delta; // Turun
        }

        // 4. Terapkan Gerakan
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        // Manual update untuk posisi Y (Karena pointerLockControls hanya handle X & Z secara default)
        camera.position.y += velocity.y * delta;

        // OPSIONAL: Batas Lantai (agar tidak tembus tanah)
        if (camera.position.y < 2) {
            camera.position.y = 2;
            velocity.y = 0;
        }
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