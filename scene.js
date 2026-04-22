import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020204);
scene.fog = new THREE.FogExp2(0x020204, 0.015);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 200);
spotLight.position.set(0, 20, 10);
scene.add(spotLight);

const redRimLight = new THREE.PointLight(0xff0000, 150, 30);
redRimLight.position.set(-5, 0, -5);
scene.add(redRimLight);

const blueRimLight = new THREE.PointLight(0x00e5ff, 150, 30);
blueRimLight.position.set(5, 5, -5);
scene.add(blueRimLight);

// Hero Spotlights
const greenRimLight = new THREE.PointLight(0x00ff00, 150, 30);
greenRimLight.position.set(-65, 0, -5); // Hulk
scene.add(greenRimLight);

const yellowRimLight = new THREE.PointLight(0xffaa00, 150, 30);
yellowRimLight.position.set(-45, 0, -5); // Thor
scene.add(yellowRimLight);

const blueWolverineLight = new THREE.PointLight(0x00aaff, 150, 30);
blueWolverineLight.position.set(-25, 0, -5); // Wolverine
scene.add(blueWolverineLight);


// --- SYMBIOTE SLIME ---
const snoiseStr = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

const blobMat = new THREE.MeshPhysicalMaterial({
    color: 0x010101,
    metalness: 1.0,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.0
});

blobMat.onBeforeCompile = (shader) => {
    shader.uniforms.time = { value: 0 };
    shader.uniforms.agitation = { value: 0.0 };
    blobMat.userData.shader = shader;

    shader.vertexShader = `
        uniform float time;
        uniform float agitation;
        ${snoiseStr}
        
        vec3 getDisplacedPosition(vec3 pos, vec3 norm) {
            float freq1 = 0.8;
            float freq2 = 2.0;
            float speed = 1.0 + agitation * 2.0;
            float amp1 = 0.2 + agitation * 0.6; 
            float amp2 = 0.05 + agitation * 0.15; 
            
            float n1 = snoise(pos * freq1 + time * speed);
            float n2 = snoise(pos * freq2 - time * speed * 1.5);
            
            float noise = (n1 * amp1) - abs(n2 * amp2);
            
            return pos + norm * noise;
        }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
        if (length(t) < 0.1) t = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
        vec3 b = normalize(cross(normal, t));

        float epsilon = 0.01; 
        float radius = 2.0;
        
        vec3 p0 = getDisplacedPosition(position, normal);
        vec3 posT = normalize(position + t * epsilon) * radius;
        vec3 pt = getDisplacedPosition(posT, normalize(posT));
        vec3 posB = normalize(position + b * epsilon) * radius;
        vec3 pb = getDisplacedPosition(posB, normalize(posB));

        vec3 objectNormal = normalize(cross(pt - p0, pb - p0));
        `
    );

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `vec3 transformed = p0;`
    );
};

const blobMesh = new THREE.Mesh(new THREE.SphereGeometry(2.0, 256, 256), blobMat);
scene.add(blobMesh);


// --- OBJECTS ---
const vesselGroup = new THREE.Group();
scene.add(vesselGroup);

const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f7fa, transmission: 1.0, ior: 1.5, roughness: 0.05, transparent: true, opacity: 1.0, side: THREE.DoubleSide
});
const glassTube = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 12, 64), glassMat);
vesselGroup.add(glassTube);

const capMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.4 });
const topCap = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1, 64), capMat);
topCap.position.y = 6.5;
const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1, 64), capMat);
bottomCap.position.y = -6.5;
vesselGroup.add(topCap);
vesselGroup.add(bottomCap);


// 1. Venom (Special Dynamic Model)
const venomGroup = new THREE.Group();
scene.add(venomGroup);
venomGroup.visible = false;

let venomModelReady = false;

function playAnimationQueue(mixer, actionsDict, keywordsQueue, lastLoops = true, gapMs = 1500) {
    let queue = [];
    for (let kw of keywordsQueue) {
        if (kw === 'all_emotes') {
            Object.keys(actionsDict).forEach(k => {
                if (k.toLowerCase().includes('emote') && !queue.includes(k)) queue.push(k);
            });
        } else {
            const words = kw.toLowerCase().split(/[_\s]+/);
            const found = Object.keys(actionsDict).find(n => {
                const nameLower = n.toLowerCase();
                return words.every(w => nameLower.includes(w));
            });
            if (found && !queue.includes(found)) queue.push(found);
        }
    }
    if (queue.length === 0) queue.push(Object.keys(actionsDict)[0]);

    let currentIndex = 0;

    function playNext() {
        if (currentIndex >= queue.length) {
            if (lastLoops) currentIndex = queue.length - 1;
            else return;
        }

        let actionName = queue[currentIndex];
        let action = actionsDict[actionName];
        if (!action) {
            currentIndex++;
            playNext();
            return;
        }

        mixer.stopAllAction();

        let isLast = (currentIndex === queue.length - 1);
        if (isLast && lastLoops) {
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
        } else {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
        }

        action.reset();
        action.play();
    }

    mixer.addEventListener('finished', (e) => {
        currentIndex++;
        if (currentIndex >= queue.length && !lastLoops) return;
        if (gapMs > 0) {
            setTimeout(() => { playNext(); }, gapMs);
        } else {
            playNext();
        }
    });

    playNext();
}

let venomMixer;
let venomAnimations = {};
let venomAnimStarted = false;

new GLTFLoader().load('./models/venom-marvel-rivals/source/Venom.glb', (gltf) => {
    const model = gltf.scene;

    model.updateMatrixWorld(true);
    const box = new THREE.Box3();
    model.traverse((child) => {
        if (child.isMesh && child.geometry) {
            child.geometry.computeBoundingBox();
            const childBox = child.geometry.boundingBox.clone();
            childBox.applyMatrix4(child.matrixWorld);
            box.union(childBox);
        }
    });

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 11 / maxDim;
    model.scale.setScalar(scale);
    model.position.set(1, -5.5, 0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) {
                child.material.roughness = 0.3;
                child.material.envMapIntensity = 1.5;
                child.material.transparent = false;
                child.material.depthWrite = true;
            }
        }
    });

    if (gltf.animations && gltf.animations.length > 0) {
        venomMixer = new THREE.AnimationMixer(model);
        extraMixers.push(venomMixer);
        gltf.animations.forEach((clip) => { venomAnimations[clip.name] = venomMixer.clipAction(clip); });
    }

    venomGroup.add(model);
    venomModelReady = true;
});


// 2. Generic Hero Loader (Hulk, Thor, Wolverine)
const extraMixers = [];

function loadHero(url, position, targetSize, animKeywords, loopOnce = false) {
    const group = new THREE.Group();
    scene.add(group);

    new GLTFLoader().load(url, (gltf) => {
        const model = gltf.scene;

        model.updateMatrixWorld(true);
        const box = new THREE.Box3();
        model.traverse((child) => {
            if (child.isMesh && child.geometry) {
                child.geometry.computeBoundingBox();
                const childBox = child.geometry.boundingBox.clone();
                childBox.applyMatrix4(child.matrixWorld);
                box.union(childBox);
            }
        });

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = targetSize / maxDim;
        model.scale.setScalar(scale);

        model.position.copy(position);
        model.rotation.y = Math.PI / 8; // Angled slightly towards camera

        model.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;
                if (child.material) {
                    child.material.roughness = 0.4;
                    child.material.envMapIntensity = 1.0;
                    child.material.transparent = false;
                    child.material.depthWrite = true;
                }
            }
        });

        if (gltf.animations && gltf.animations.length > 0) {
            const charMixer = new THREE.AnimationMixer(model);
            extraMixers.push(charMixer);

            let actions = {};
            gltf.animations.forEach((clip) => {
                actions[clip.name] = charMixer.clipAction(clip);
            });

            playAnimationQueue(charMixer, actions, animKeywords, !loopOnce);
        }

        group.add(model);
    });
    return group;
}

// Spawning heroes in a massive gallery lineup:
// Hulk
loadHero('./models/hulk-marvel-rivals/source/Hulk.glb', new THREE.Vector3(-80, -6, 0), 11, ['transform', 'emote_10110012011'], false);
// Thor
loadHero('./models/thor-marvel-rivals/source/Thor.glb', new THREE.Vector3(-60, -6, 0), 13, ['personality', 'all_emotes'], false);
// Wolverine
loadHero('./models/wolverine-marvel-rivals-animated/source/Wolverine_Animated_PBR.glb', new THREE.Vector3(-40, -6, 0), 10, ['emote'], false);
// Black Panther
loadHero('./models/black-panther-marvel-rivals-animated/source/Black Panther_Animated_PBR.glb', new THREE.Vector3(-20, -6, 0), 10, ['emote_10260012010'], false);


// --- SCROLL LOGIC ---
let targetScroll = 0;
let currentScroll = 0;
let venomLocked = false;
window.addEventListener('scroll', () => {
    targetScroll = window.scrollY / window.innerHeight;
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function map(v, inMin, inMax, outMin, outMax) {
    if (v <= inMin) return outMin;
    if (v >= inMax) return outMax;
    return outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin));
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    currentScroll += (targetScroll - currentScroll) * 0.08;

    // Total 7 phases (Scroll 0 to 6)
    // 0: Hulk (X = -60)
    // 1: Thor (X = -40)
    // 2: Wolverine (X = -20)
    // 3: Venom Containment (X = 0)
    // 4: Breach
    // 5: Assimilation
    // 6: We Are Venom

    // --- CAMERA FLIGHT PATH ---
    if (venomLocked) {
        // The scroll space is condensed! Max scroll is 4.0.
        if (currentScroll < 3.0) {
            camera.position.x = -80 + (currentScroll * 20);
            camera.position.z = 20;
            camera.lookAt(camera.position.x, 0, 0);
        } else {
            // currentScroll between 3.0 and 4.0
            let t = Math.min(currentScroll - 3.0, 1.0);
            // Fly directly from Black Panther to Venom's locked pose
            camera.position.x = map(t, 0.0, 1.0, -20, -4);
            camera.position.z = 20; // Constant Z
            camera.lookAt(map(t, 0.0, 1.0, -20, -2), 0, 0);
        }
    } else {
        // Original flight path
        if (currentScroll < 3.0) {
            camera.position.x = -80 + (currentScroll * 20);
            camera.position.z = 20;
            camera.lookAt(camera.position.x, 0, 0);
        } else if (currentScroll < 4.0) {
            let t = currentScroll - 3.0;
            camera.position.x = map(t, 0.0, 1.0, -20, 0);
            camera.position.z = map(t, 0.0, 1.0, 20, 30);
            camera.lookAt(map(t, 0.0, 1.0, -20, 0), 0, 0);
        } else {
            let vS = currentScroll - 4.0;
            camera.position.x = map(vS, 0.0, 3.0, 0, -4);
            camera.position.z = map(vS, 0.0, 3.0, 30, 20);
            camera.lookAt(map(vS, 0.0, 3.0, 0, -2), 0, 0);
        }
    }

    // Normalize scroll for Venom animations
    let vScroll = currentScroll - 4.0;
    if (vScroll < 0) vScroll = 0;

    // Once transformation completes, lock it permanently
    if (vScroll >= 2.8 && !venomLocked) {
        venomLocked = true;
        document.body.classList.add('venom-locked');

        // Condense the scroll space instantly so the camera doesn't fly backwards
        targetScroll = 4.0;
        currentScroll = 4.0;

        // Force the browser scroll to remain at the absolute bottom
        window.scrollTo(0, document.body.scrollHeight);
    }

    if (venomLocked) {
        vesselGroup.visible = false;
        blobMesh.visible = false;
        venomGroup.visible = true;
        venomGroup.position.y = -1.0; // Bring him up!
    } else {
        // --- VISIBILITY & SYMBIOTE ANIMATION ---
        vesselGroup.visible = currentScroll > 2.1;
        vesselGroup.position.y = map(vScroll, 0.2, 0.8, 0, 30);
        glassMat.opacity = map(vScroll, 0.2, 0.8, 1.0, 0.0);

        venomGroup.visible = false;
        blobMesh.visible = currentScroll > 2.1;

        // Phase 1 (vScroll 0-1): Containment
        if (vScroll < 1.0) {
            blobMesh.position.set(0, map(vScroll, 0.8, 1.0, Math.sin(time * 2) * 0.5, -4), 0);
            blobMesh.scale.setScalar(map(vScroll, 0.8, 1.0, 1.0, 1.5));
            if (blobMat.userData.shader) blobMat.userData.shader.uniforms.agitation.value = map(vScroll, 0.8, 1.0, 0.0, 0.3);
        }
        // Phase 2 (vScroll 1-2): Portal Formation
        else if (vScroll < 2.0) {
            blobMesh.position.x = map(vScroll, 1.0, 2.0, 0, 1);
            blobMesh.position.y = map(vScroll, 1.0, 2.0, -4, -5.5); // Move to ground
            blobMesh.position.z = map(vScroll, 1.0, 2.0, 0, 0);

            // Flatten into a puddle/portal
            let scaleXZ = map(vScroll, 1.0, 2.0, 1.5, 6.0);
            let scaleY = map(vScroll, 1.0, 2.0, 1.5, 0.2);
            blobMesh.scale.set(scaleXZ, scaleY, scaleXZ);

            // Make it boil violently
            if (blobMat.userData.shader) blobMat.userData.shader.uniforms.agitation.value = map(vScroll, 1.0, 2.0, 0.3, 2.0);

            // Hide venom underground
            if (vScroll > 0.5 && venomModelReady) {
                venomGroup.visible = true;
                venomGroup.position.y = -120.0;
            }
        }
        // Phase 3-4 (vScroll 2-3): Rise from the Portal
        else {
            if (!venomAnimStarted && venomMixer) {
                venomAnimStarted = true;
                playAnimationQueue(venomMixer, venomAnimations, ['103571_Devouring_Appear', 'Emote_10355012020'], true, 0);
            }

            venomGroup.visible = true;
            blobMesh.position.set(1, -5.5, 0);

            let progress = map(vScroll, 2.0, 2.8, 0.0, 1.0);
            let easeOut = 1 - Math.pow(1 - Math.min(progress * 2.0, 1.0), 3); // Snap up immediately!

            // Venom rises from underground
            venomGroup.position.y = map(easeOut, 0.0, 1.0, -120.0, -1.0); // Bring him up!

            // The portal shrinks away into nothing
            let shrinkXZ = map(progress, 0.0, 1.0, 6.0, 0.0);
            let shrinkY = map(progress, 0.0, 1.0, 0.2, 0.0);
            blobMesh.scale.set(shrinkXZ, shrinkY, shrinkXZ);

            if (shrinkXZ <= 0.01) blobMesh.visible = false;

            if (blobMat.userData.shader) blobMat.userData.shader.uniforms.agitation.value = map(progress, 0.0, 1.0, 2.0, 0.0);
        }
    }

    // Tick all animations
    extraMixers.forEach(m => m.update(delta));

    vesselGroup.rotation.y = time * 0.2;
    blobMesh.rotation.y = time * 0.5;
    if (blobMat.userData.shader) blobMat.userData.shader.uniforms.time.value = time;

    renderer.render(scene, camera);
}

animate();
