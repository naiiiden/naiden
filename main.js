import Lenis from "lenis";
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from "three/examples/jsm/Addons.js";

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const container = document.getElementById('threejs-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

let model;
new RGBELoader().load('texture.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  
  const loader = new GLTFLoader();
  loader.load('untitledcompressed.glb', function (gltf) {
      model = gltf.scene;
      model.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = new THREE.MeshPhysicalMaterial({
            metalness: 1,
            roughness: 0,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
          });
        }
      });
      scene.add(model);
  }, undefined, function (error) {
      console.error(error);
  });
});

camera.position.z = 1;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    console.log(camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let mouseX, mouseY;

function rotateModelOnMove(event) {
  if (event.touches) {
    mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.touches[0].clientY / window.innerHeight) * 2 + 1;
  } else {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 + 1;
  }

  if (model) {
    model.rotation.x = mouseY * Math.PI / 1;
    model.rotation.y = mouseX * Math.PI / 1;
  }
}

window.addEventListener('touchmove', rotateModelOnMove);
window.addEventListener('mousemove', rotateModelOnMove);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

(function() {
  const folds = Array.from(document.getElementsByClassName("fold"));
  const baseContent = document.getElementById("base-content");
  const mainCopyContent = document.querySelector(".main-copy");

  let state = {
    disposed: false,
    targetScroll: 0,
    scroll: 0
  };

  function lerp(current, target, speed = 0.1, limit = 0.001) {
    let change = (target - current) * speed;
    if (Math.abs(change) < limit) {
      change = target - current;
    }
    return change;
  }

  function setContent(baseContent) {
    let scrollers = [];

    for (let i = 0; i < folds.length; i++) {
      const fold = folds[i];
      const copyContent = baseContent.cloneNode(true);
      copyContent.id = "";
      let scroller;

      let sizeFixEle = document.createElement("div");
      sizeFixEle.classList.add("fold-size-fix");

      scroller = document.createElement("div");
      scroller.classList.add("fold-scroller");
      sizeFixEle.append(scroller);
      fold.append(sizeFixEle);

      scroller.append(copyContent);
      scrollers[i] = scroller;
    }
    return scrollers;
  }

  function updateStyles(scroll, scrollers) {
    for (let i = 0; i < folds.length; i++) {
      const scroller = scrollers[i];
      scroller.children[0].style.transform = `translateY(${scroll}px)`;
    }
  }

  function appendMainCopyContent(scrollers) {
    for (let scroller of scrollers) {
      const foldContent = scroller.querySelector(".fold-content");
      const copyContent = mainCopyContent.cloneNode(true);
      copyContent.id = "";
      foldContent.append(copyContent);
    }
  }

  let scrollers = setContent(baseContent);

  const centerFold = folds[Math.floor(folds.length / 2)];
  let tick = () => {
    if (state.disposed) return;

    // Calculate the scroll based on how much the content is outside the centerFold
    document.body.style.height = scrollers[0].children[0].clientHeight - centerFold.clientHeight + window.innerHeight + "px";

    state.targetScroll = -(document.documentElement.scrollTop || document.body.scrollTop);
    state.scroll += lerp(state.scroll, state.targetScroll, 0.1, 0.0001);

    updateStyles(state.scroll, scrollers);

    // Check if we have reached the end of the scrollable content
    const scrollableHeight = scrollers[0].children[0].clientHeight;
    const scrollPosition = -state.scroll + window.innerHeight;

    if (scrollPosition >= scrollableHeight - 100) { // 100 pixels before the end
      appendMainCopyContent(scrollers);
    }

    requestAnimationFrame(tick);
  };

  document.body.classList.remove('loading');
  tick();
})();