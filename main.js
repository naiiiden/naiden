import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer, RenderPass, EffectPass } from "postprocessing";
import { ASCIIEffect } from "./ascii";

let cursor = document.querySelector('.cursor');

function cursorPosition(cursorElement, xPosSubstractValue, yPosSubstractValue) {
  document.addEventListener('mousemove', (e) => {
    cursorElement.style.left = e.clientX - xPosSubstractValue + 'px';
    cursorElement.style.top = e.clientY - yPosSubstractValue + 'px';
  });
}

cursorPosition(cursor, 3.5, 3.5);

const container = document.getElementById("threejs-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const asciiEffect = new ASCIIEffect({
  characters: ' 10@,! ',
  fontSize: 64,
  cellSize: 12,
  color: '#999',
  invert: true
});

const effectPass = new EffectPass(camera, asciiEffect);
composer.addPass(effectPass);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

let model;

const loader = new GLTFLoader();
loader.load(
  "naiden.glb",
  (gltf) => {
    model = gltf.scene;
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    frameArea(boxSize * 0.5, boxSize, boxCenter, camera);
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

  const direction = new THREE.Vector3()
    .subVectors(camera.position, boxCenter)
    .multiply(new THREE.Vector3(1, 0, 1))
    .normalize();

  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

let targetRotation = new THREE.Vector2();
let currentRotation = new THREE.Vector2();

function rotateModelOnMove(event) {
  let clientX = event.touches ? event.touches[0].clientX : event.clientX;
  let clientY = event.touches ? event.touches[0].clientY : event.clientY;

  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;

  targetRotation.x = ((clientY - halfHeight) / halfHeight) * Math.PI;
  targetRotation.y = ((clientX - halfWidth) / halfWidth) * Math.PI;
}

document.body.addEventListener("mousemove", rotateModelOnMove);
document.body.addEventListener("touchmove", rotateModelOnMove);

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    currentRotation.x = THREE.MathUtils.lerp(
      currentRotation.x,
      targetRotation.x,
      0.1
    );
    currentRotation.y = THREE.MathUtils.lerp(
      currentRotation.y,
      targetRotation.y,
      0.1
    );

    model.rotation.x = currentRotation.x;
    model.rotation.y = currentRotation.y;
  }

  composer.render();
}
animate();
