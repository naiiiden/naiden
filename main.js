import Lenis from "lenis";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/Addons.js";

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const container = document.getElementById("threejs-container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

camera.position.set(0, 1, 1);

let model;
new RGBELoader().load("texture.hdr", function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;

  const loader = new GLTFLoader();
  loader.load(
    "untitledcompressed.glb",
    function (gltf) {
      model = gltf.scene;
      model.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = new THREE.MeshStandardMaterial({
            metalness: 0,
            roughness: 0,
            transparent: true,
            opacity: .7,
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
    function (error) {
      console.error(error);
    }
  );
});

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

  const direction = new THREE.Vector3()
    .subVectors(camera.position, boxCenter)
    .multiply(new THREE.Vector3(1, 0, 1))
    .normalize();

  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
  camera.updateProjectionMatrix();
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let targetRotation = new THREE.Vector2();
let currentRotation = new THREE.Vector2();

function rotateModelOnMove(event) {
  let clientX, clientY;
  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  const canvas = renderer.domElement;
  const halfWidth = canvas.clientWidth / 2;
  const halfHeight = canvas.clientHeight / 2;

  targetRotation.x = ((clientY - halfHeight) / halfHeight) * Math.PI;
  targetRotation.y = ((clientX - halfWidth) / halfWidth) * Math.PI;

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
}

document.body.addEventListener("touchmove", rotateModelOnMove);
document.body.addEventListener("mousemove", rotateModelOnMove);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

const state = {
  disposed: false,
  targetScroll: 0,
  scroll: 0,
};

const folds = Array.from(document.getElementsByClassName("fold"));
const baseContent = document.getElementById("base-content");
const mainCopyContent = document.querySelector(".main-copy");
let scrollers;

function lerp(current, target, speed = 0.1, limit = 0.001) {
  const change = (target - current) * speed;
  return Math.abs(change) < limit ? target - current : change;
}

function setContent(baseContent) {
  return folds.map(fold => {
    const copyContent = baseContent.cloneNode(true);
    copyContent.id = "";

    const sizeFixEle = document.createElement("div");
    sizeFixEle.classList.add("fold-size-fix");

    const scroller = document.createElement("div");
    scroller.classList.add("fold-scroller");
    sizeFixEle.append(scroller);
    fold.append(sizeFixEle);

    scroller.append(copyContent);
    return scroller;
  });
}

function updateStyles(scroll, scrollers) {
  scrollers.forEach(scroller => {
    scroller.children[0].style.transform = `translateY(${scroll}px)`;
  });
}

function appendMainCopyContent(scrollers) {
  scrollers.forEach(scroller => {
    const foldContent = scroller.querySelector(".fold-content");
    if (foldContent) {
      const copyContent = mainCopyContent.cloneNode(true);
      copyContent.id = "";
      foldContent.append(copyContent);
    } else {
      const newFoldContent = document.createElement("div");
      newFoldContent.classList.add("fold-content");
      const copyContent = mainCopyContent.cloneNode(true);
      copyContent.id = "";
      newFoldContent.append(copyContent);
      scroller.append(newFoldContent);
    }
  });

  updateBodyHeight();
}

function updateBodyHeight() {
  const centerFold = folds[Math.floor(folds.length / 2)];
  document.body.style.height =
    scrollers[0].children[0].clientHeight -
    centerFold.clientHeight +
    window.innerHeight +
    "px";
}

function handleScroll() {
  if (state.disposed) return;

  state.targetScroll = -(
    document.documentElement.scrollTop || document.body.scrollTop
  );
  state.scroll += lerp(state.scroll, state.targetScroll, 0.1, 0.0001);

  updateStyles(state.scroll, scrollers);

  const scrollableHeight = scrollers[0].children[0].clientHeight;
  const scrollPosition = -state.scroll + window.innerHeight;

  if (scrollPosition >= scrollableHeight - 100) {
    appendMainCopyContent(scrollers);
  }
}

function init() {
  scrollers = setContent(baseContent);
  updateBodyHeight();

  window.addEventListener('scroll', handleScroll);

  handleScroll();
}
init();