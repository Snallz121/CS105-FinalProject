

// import * as THREE from "../../node_modules/three/build/three.module.js";
// import { OrbitControls } from "../jsm/controls/OrbitControls.js";
// import { TeapotGeometry } from "../jsm/geometries/TeapotGeometry.js";
//import { GUI } from "./dat/dat.gui.module.js";
// import { TransformControls } from "../jsm/controls/TransformControls.js";

let camera,
  scene,
  renderer,
  gui,
  control,
  orbit,
  mesh,
  geometry,
  material,
  light,
  lighthelper,
  texture,
  plane,
  image_path = undefined,
  normal,
  modelLoader,
  shipLoader,
  stageLoader,
  listener,
  sound,
  audioLoader,
  gridHelper,
  clock,
  mixer;
let size = 30;
let r = 0.05;
var data = {
  model: "Box",
  surface: "Solid",
  detail: 5,
  transform: "None",
  objectcolor: 0xffffff,
  lighttype: "AmbientLight",
  lightcolor: 0xffffff,
  animation: "None",
};

init();
render();
animate();


function init() {
  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Camera
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.01,
    30000
  );

  camera.position.set(-70, 70, -70);
  camera.lookAt(0, 50, 0);

  // Scene
  scene = new THREE.Scene();
  plane = getPlane(10000);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
  scene.add(new THREE.GridHelper(10000, 100, 0x888888, 0x444444));
  plane.visible = false;

  // Light
  light = new THREE.AmbientLight(0xffffff);
  scene.add(light);

  // Load Texture
  texture = new THREE.TextureLoader().load("textures/scratch.jpg", render);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // Mesh
  geometry = new THREE.BoxGeometry(size, size, size);
  material = new THREE.MeshPhongMaterial({
    color: data.objectcolor,
    // wireframe: true,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  scene.add(mesh);

  // OrbitControls
  orbit = new THREE.OrbitControls(camera, renderer.domElement);
  orbit.update();
  orbit.addEventListener("change", render);

  // Transform
  control = new THREE.TransformControls(camera, renderer.domElement);
  control.addEventListener("change", render);
  control.addEventListener("dragging-changed", function (event) {
    orbit.enabled = !event.value;
  });
  control.addEventListener("")
  transformMode();
  scene.add(control);

  // GUI

  gui = new dat.GUI();
  // module

  modelLoader = new THREE.ColladaLoader();
  loadColada();

  normal = new THREE.TextureLoader().load(
    "models/3ds/portalgun/textures/normal.jpg"
  );
  shipLoader = new THREE.TDSLoader();
  loadShip();
  stageLoader = new THREE.GLTFLoader();
  loadStage();

  listener = new THREE.AudioListener();
  camera.add(listener);
  // create a global audio source
  sound = new THREE.Audio(listener);
  // load a sound and set it as the Audio object's buffer
  audioLoader = new THREE.AudioLoader();
  audioLoader.load("sounds/DITF.ogg", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
  });

  gridHelper = new THREE.GridHelper(50, 500);
  scene.add(gridHelper);
  gridHelper.visible = false;

  clock = new THREE.Clock();

  let objectFolder = gui.addFolder("Object");
  objectFolder
    .add(data, "transform", ["None", "Translate", "Scale", "Rotate"])
    .name("Transform Mode")
    .onChange(transformMode);
  objectFolder
    .add(data, "model", [
      "Box",
      "Sphere",
      "Cone",
      "Cylinder",
      "Torus",
      "Knot",
      "Teapot",
      "Tetrahedron",
      "Octahedron",
      "Dodecahedron",
      "Icosahedron",
    ])
    .name("Model")
    .onChange(generateGeometry);
  objectFolder
    .add(data, "surface", [
      "Solid",
      "Lines",
      "Points",
      "Texture 1",
      "Texture 2",
      "Texture 3",
    ])
    .name("Surface")
    .onChange(generateGeometry);
  objectFolder
    .addColor(data, "objectcolor")
    .name("Color")
    .onChange(function (value) {
      mesh.material.color.set(value);
    });

  let cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "x", -200, 200).name("X");
  cameraFolder.add(camera.position, "y", -200, 200).name("Y");
  cameraFolder.add(camera.position, "z", -200, 200).name("Z");
  cameraFolder
    .add(camera, "near", 0, 200)
    .name("Near")
    .onChange(onWindowResize);
  cameraFolder
    .add(camera, "far", 0, 50000)
    .name("Far")
    .onChange(onWindowResize);
  cameraFolder.add(camera, "fov", 0, 100).name("FOV").onChange(onWindowResize);

  let lightFolder = gui.addFolder("Light");
  lightFolder
    .add(data, "lighttype", ["AmbientLight", "PointLight","DirectionalLight"])
    .name("Light Type")
    .onChange(generateLight);
  lightFolder
    .addColor(data, "lightcolor")
    .name("Color")
    .onChange(function (value) {
      light.color.set(value);
    });

  let animationFolder = gui.addFolder("Animation");
  animationFolder
    .add(data, "animation", [
      "None",
      "Random appear",
      "Move, spin and return",
      "Move, spin and increase size",
      "Self-rotate",
      "Rung",
    ])
    .name("Animation Model")
    .onChange(animation);
    var obj = { Animated:function(){ 
      
    }};
    gui.add(obj,'Animated');
  // Resize
  window.addEventListener("resize", onWindowResize);
  
}

function transformMode() {
  switch (data.transform) {
    case "Translate":
      if (control.object == undefined) {
        control.attach(mesh);
      }
      control.setMode("translate");
      break;
    case "Rotate":
      if (control.object == undefined) {
        control.attach(mesh);
      }
      control.setMode("rotate");
      break;
    case "Scale":
      if (control.object == undefined) {
        control.attach(mesh);
      }
      control.setMode("scale");
      break;
    case "None":
      control.detach();
      break;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  animation(data);

  renderer.render(scene, camera);
}

function animation(data) {
  switch (data.animation) {
    case "Random appear":
      return RandomAppear();
    case "Move, spin and return":
      return updateAnimation2();
    case "Move, spin and increase size":
      return updateAnimation3();
    case "Self-rotate":
      return updateAnimation4();
    case "Rung":
      return updateAnimation5();
    case "None":
      return undefined;
  }
}

var rangeScence = 400;
function RandomAppear() {
  // animation1Folder.visible = true;
  mesh.visible = true;
  mesh.position.x = THREE.MathUtils.randInt(-50, 50);
  mesh.position.y = THREE.MathUtils.randInt(-10, 10);
  mesh.position.z = THREE.MathUtils.randInt(-20, 20);
  mesh.material.color.setHex(Math.random() * 0xffffff);
  remove();
}

function updateAnimation2() {
  mesh.visible = true;
  if (mesh.position.x >= rangeScence) {
    mesh.position.x = -rangeScence;
  }

  mesh.rotation.y += 0.01;
  mesh.rotation.x += 0.01;
  mesh.rotation.z += 0.01;

  if (mesh.position.x >= -200 && mesh.position.x <= 200) {
    //position
    mesh.position.x += 30;

    // rotation
    mesh.rotation.x += 0.1;
    mesh.rotation.x += 0.1;
    mesh.rotation.z += 0.1;
  } else {
    mesh.position.x += 0.5;
  }
  remove();
}

var t = 0;
var count = -100;
function updateAnimation3() {
  mesh.visible = true;
  t += 0.01;
  count += 1;
  mesh.rotation.y += 20;

  mesh.position.x = 250 * Math.cos(t) + 0;
  mesh.position.z = 250 * Math.sin(t) + 0;

  if (count <= 0) {
    mesh.scale.x += 0.05;
    mesh.scale.y += 0.05;
    mesh.scale.z += 0.05;
  } else if (count > 0 && count <= 100) {
    mesh.scale.x -= 0.05;
    mesh.scale.y -= 0.05;
    mesh.scale.z -= 0.05;
  } else {
    count = -100;
  }
  remove();
}

function updateAnimation4() {
  mesh.visible = true;
  mesh.rotation.x += 30;
  mesh.rotation.y += 30;
  mesh.rotation.z += 30;
  remove()
}
function loadColada() {
  modelLoader.load(
    "./models/collada/dance/Flair.dae",
    //"./models/Swimming.dae",
    function (collada) {
      const avatar = collada.scene;
      const animations = avatar.animations;

      avatar.traverse(function (node) {
        if (node.isSkinnedMesh) {
          node.frustumCulled = false;
        }
      });

      mixer = new THREE.AnimationMixer(avatar);
      mixer.clipAction(animations[0]).play();

      scene.add(avatar);
      avatar.name = "model";
      avatar.visible = false;
      avatar.scale.set(0.03, 0.03, 0.03);
      // avatar.rotation.z = -Math.PI / 2;
    }
  );
}
let tmp = 1000;
let tmp1 = 2000;
function updateAnimation5() {
  mesh.position.x = Math.sin(tmp * 0.001) * 0.5
  mesh.position.z = Math.cos(tmp1 * 0.001) * 0.5
  tmp += 500;
  tmp1 += 500;
  remove();
}

// 

function generateLight() {
  switch (data.lighttype) {
    case "AmbientLight":
      if (light.parent == scene) {
        scene.remove(light);
      }
      light = new THREE.AmbientLight(0xffffff);
      scene.add(light);
      plane.visible = false;
      if ((lighthelper.parent = scene)) {
        scene.remove(lighthelper);
      }
      break;
    case "PointLight":
      if (light.parent == scene) {
        scene.remove(light);
      }
      light = new THREE.PointLight(0xffffff, 2);
      scene.add(light);
      light.castShadow = true;
      light.position.set(40, 40, 40);
      plane.visible = false;
      lighthelper = new THREE.PointLightHelper(light, 15);
      light.add(lighthelper);
      break;
    case "DirectionalLight":
      if (light.parent == scene) {
        scene.remove(light);
      }
      light = new THREE.DirectionalLight("rgb(255,255,255)");
      scene.add(light);
      // scene.add(light.target)
      light.castShadow = true;
      light.position.set(20,40,20);
      // directionalLight.target.position.set(40,40,40);
      plane.visible = true;
      lighthelper = new THREE.PointLightHelper(light, 15);
      light.add(lighthelper);
      break;
  }
}

function uploadImg(data, flag) {
  var input = document.getElementById("img-path");
  console.log(input);
  input.addEventListener("change", function () {
    var file = input.files[0];
    image_path = URL.createObjectURL(file);
    generateGeometry();
  });

  // make sure surface is texture
  if (data.surface == "Texture") {
    input.click();
  }
}

function generateGeometry() {
  if (control.object != undefined) {
    control.detach();
  }
  if (mesh != undefined || mesh.parent == scene) {
    scene.remove(mesh);
  }

  geometry = newGeometry(data);
  if (data.surface == "Points") {
    mesh = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: data.objectcolor,
        size: 1,
      })
    );
  } else if (data.surface == "Lines") {
    ///////
    mesh = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: data.objectcolor,
        size: 1,
      })
    );
  } else if (data.surface == "Texture 1") {
    var loader = new THREE.TextureLoader();
    loader.setCrossOrigin("Anonymous");
    // uploadImg(data);
    // make sure image_paht != none
    image_path = "textures/Danh.jpg";
    if (image_path != undefined) {
      console.log("null roi ne");
      texture = loader.load(image_path, render);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          color: "rgb(255,255,255)",
          map: data.surface == "Texture 1" ? texture : null,
        })
      );
    }
  } else if (data.surface == "Texture 2") {
    var loader = new THREE.TextureLoader();
    loader.setCrossOrigin("Anonymous");
    // uploadImg(data);

    // make sure image_paht != none
    image_path = "textures/Meo.jpg";
    if (image_path != undefined) {
      texture = loader.load(image_path, render);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          color: "rgb(255,255,255)",
          map: data.surface == "Texture 2" ? texture : null,
        })
      );
    }
  } else if (data.surface == "Texture 3") {
    var loader = new THREE.TextureLoader();
    loader.setCrossOrigin("Anonymous");
    // uploadImg(data);
    // make sure image_paht != none
    image_path = "textures/scratch.jpg";
    if (image_path != undefined) {
      console.log("null roi ne");
      texture = loader.load(image_path, render);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          color: "rgb(255,255,255)",
          map: data.surface == "Texture 3" ? texture : null,
        })
      );
    }
  } else {
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        color: data.objectcolor,
      })
    );
  }
  mesh.castShadow = true;
  scene.add(mesh);
  transformMode();
}

function drawWithTexture(image) {
  const texture = loader.load(image);
  var materialTexture = new THREE.MeshStandardMaterial({
    map: texture,
    color: material.color,
  });
  var mesh = new THREE.Mesh(createGeometry(), materialTexture);

  mesh.castShadow = true;
  mesh.name = "object";
  control.attach(mesh);
  control.visible = false;
  control.enabled = false;
  return mesh;
}
function newGeometry(data) {
  switch (data.model) {
    case "Box":
      return new THREE.BoxGeometry(
        size,
        size,
        size,
        2 * data.detail,
        2 * data.detail,
        2 * data.detail
      );
    case "Sphere":
      return new THREE.SphereGeometry(
        size / 1.25,
        8 * data.detail,
        8 * data.detail
      );
    case "Cone":
      return new THREE.ConeGeometry(
        size,
        size,
        16 * data.detail,
        16 * data.detail
      );
    case "Cylinder":
      return new THREE.CylinderGeometry(
        size / 1.5,
        size / 1.5,
        1.25 * size,
        8 * data.detail,
        8 * data.detail
      );
    case "Torus":
      return new THREE.TorusGeometry(
        size / 2,
        size / 6,
        16 * data.detail,
        8 * data.detail
      );
    case "Knot":
      return new THREE.TorusKnotGeometry(
        size / 2,
        size / 6,
        16 * data.detail,
        8 * data.detail
      );
    case "Teapot":
      return new THREE.TeapotGeometry(
        size / 1.25,
        data.detail * 2,
        true,
        true,
        true,
        true,
        true
      );
    case "Tetrahedron":
      return new THREE.TetrahedronGeometry(30);
    case "Octahedron":
      return new THREE.OctahedronGeometry(30);
    case "Dodecahedron":
      return new THREE.DodecahedronGeometry(30);
    case "Icosahedron":
      return new THREE.IcosahedronGeometry(30);
  }
}

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  render();
}

function getPlane(size) {
  let geometry = new THREE.PlaneGeometry(size, size);
  let material = new THREE.MeshPhongMaterial({
    color: "rgb(120, 120, 120)",
    side: THREE.DoubleSide,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function loadShip() {
  shipLoader.setResourcePath("models/3ds/portalgun/textures/");
  shipLoader.load("models/3ds/portalgun/portalgun.3ds", function (object) {
    object.traverse(function (child) {
      if (child.isMesh) {
        child.material.specular.setScalar(0.1);
        child.material.normalMap = normal;
      }
    });

    scene.add(object);
    object.name = "model2";
    object.visible = false;
  });
}
function loadStage() {
  stageLoader.load(
    "models/stage_gachimuchi/scene.gltf",
    function (gltf) {
      var model = gltf.scene;
      scene.add(model);
      model.scale.set(0.007, 0.007, 0.007);
      model.position.y = -5;
      model.name = "stage";
      model.receiveShadow = true;
      model.visible = false;
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}

function remove() {
  var model = scene.getObjectByName("model");
  var model2 = scene.getObjectByName("model2");
  var stage = scene.getObjectByName("stage");
  model.visible = false;
  model2.visible = false;
  stage.visible = false;
  gridHelper.visible = false;
  plane.visible = false;
  if (sound.isPlaying) {
    sound.stop();
  }

  // cancelAnimationFrame(requestID);
  // console.log(requestID);
}
