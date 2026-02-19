"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function easeOutCirc(x: number) {
  return Math.sqrt(1 - Math.pow(x - 1, 4));
}

// ============ ROOM CONSTANTS ============
const ROOM = { width: 5, depth: 4, height: 2.8, backZ: -1.8 };
const DESK_H = 0.72;

// Clear material for the wall that faces the camera — theme-aware
function createClearWallMaterial(isLightMode: boolean) {
  return new THREE.MeshStandardMaterial({
    color: isLightMode ? 0xc0c0c8 : 0x3a3a45,
    transparent: true,
    opacity: isLightMode ? 0.5 : 0.2,
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0,
    depthWrite: false,
  });
}

// ============ BUILD SCENE ============
function buildScene(scene: THREE.Scene, isLightMode: boolean) {
  // ---- Floor — light: warm wood; dark: dark wood ----
  const floorColor = isLightMode ? 0x5e564e : 0x2a2520;
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: floorColor, 
    roughness: 0.8, 
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // ---- Walls — light: soft gray; dark: dark gray ----
  const wallColor = isLightMode ? 0xa8a6a4 : 0x3a3a45;
  const wallMat = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    roughness: 0.9, 
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.height), wallMat);
  backWall.position.set(0, ROOM.height / 2, ROOM.backZ);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const leftWallMat = wallMat.clone();
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.depth, ROOM.height), leftWallMat);
  leftWall.position.set(-ROOM.width / 2, ROOM.height / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWallMat = wallMat.clone();
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.depth, ROOM.height), rightWallMat);
  rightWall.position.set(ROOM.width / 2, ROOM.height / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  const clearWallMat = createClearWallMaterial(isLightMode);
  const roomCenter = new THREE.Vector3(0, 0.85, 0);
  const toCamera = new THREE.Vector3();
  // Face normal = direction from wall toward camera when we're outside (so front wall has max dot with toCamera)
  const walls: { mesh: THREE.Mesh; opaqueMat: THREE.Material; faceNormal: THREE.Vector3 }[] = [
    { mesh: backWall, opaqueMat: wallMat, faceNormal: new THREE.Vector3(0, 0, 1) },
    { mesh: leftWall, opaqueMat: leftWallMat, faceNormal: new THREE.Vector3(-1, 0, 0) },
    { mesh: rightWall, opaqueMat: rightWallMat, faceNormal: new THREE.Vector3(1, 0, 0) },
  ];

  // ---- Window on back wall (clear glass, works from front and back) ----
  const windowW = 1.4, windowH = 1.0;
  const windowPaneMat = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    roughness: 0,
    metalness: 0,
    depthWrite: false, // so we see through from any angle
  });
  const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(windowW, windowH), windowPaneMat);
  windowPane.position.set(0, 1.5, ROOM.backZ + 0.01);
  scene.add(windowPane);
  // Window frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a4a50, roughness: 0.6, metalness: 0.3 });
  const frameT = 0.06;
  [[0, 1.5 + windowH/2 + frameT/2, windowW + frameT*2, frameT],
   [0, 1.5 - windowH/2 - frameT/2, windowW + frameT*2, frameT],
   [-windowW/2 - frameT/2, 1.5, frameT, windowH + frameT*2],
   [windowW/2 + frameT/2, 1.5, frameT, windowH + frameT*2],
  ].forEach(([x, y, w, h]) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), frameMat);
    frame.position.set(x, y, ROOM.backZ + 0.02);
    scene.add(frame);
  });

  // ---- Desk ----
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.6, metalness: 0.05 });
  const deskW = 1.8, deskD = 0.8;
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(deskW, 0.04, deskD), deskMat);
  deskTop.position.set(0, DESK_H, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  scene.add(deskTop);
  // Desk legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.5 });
  const legGeo = new THREE.BoxGeometry(0.04, DESK_H - 0.02, 0.04);
  [[-deskW/2 + 0.08, -deskD/2 + 0.08], [deskW/2 - 0.08, -deskD/2 + 0.08],
   [-deskW/2 + 0.08, deskD/2 - 0.08], [deskW/2 - 0.08, deskD/2 - 0.08]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, DESK_H / 2 - 0.01, z);
    leg.castShadow = true;
    scene.add(leg);
  });

  // ---- Laptop (the main light source visually) ----
  const laptopMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.7 });
  // Base
  const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.32), laptopMat);
  lapBase.position.set(0, DESK_H + 0.03, -0.05);
  lapBase.castShadow = true;
  scene.add(lapBase);
  // Screen back
  const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.012), laptopMat);
  lapScreen.position.set(0, DESK_H + 0.2, -0.2);
  lapScreen.rotation.x = -0.18;
  lapScreen.castShadow = true;
  scene.add(lapScreen);
  // Screen face (GLOWING - this is the main visual light)
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x4aeadc }); // Bright teal, no shading
  const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.26), screenMat);
  screenFace.position.set(0, DESK_H + 0.2, -0.19);
  screenFace.rotation.x = -0.18;
  scene.add(screenFace);

  // ---- Chair (behind desk) ----
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.2 });
  const chairBaseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.6 });
  // Chair seat
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.4), chairMat);
  chairSeat.position.set(0, 0.42, 0.7);
  chairSeat.castShadow = true;
  scene.add(chairSeat);
  // Chair back
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.05), chairMat);
  chairBack.position.set(0, 0.7, 0.92);
  chairBack.castShadow = true;
  scene.add(chairBack);
  // Chair pole
  const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), chairBaseMat);
  chairPole.position.set(0, 0.24, 0.7);
  scene.add(chairPole);
  // Chair base star
  const chairBaseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 5);
  const chairBaseM = new THREE.Mesh(chairBaseGeo, chairBaseMat);
  chairBaseM.position.set(0, 0.08, 0.7);
  scene.add(chairBaseM);

  // ---- Person (founder) - SEATED in chair ----
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b090, roughness: 0.7, metalness: 0 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3a5a7a, roughness: 0.8, metalness: 0 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.8, metalness: 0 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a2015, roughness: 0.9, metalness: 0 });
  
  const seatY = 0.45; // Height of seat
  const personZ = 0.7; // Z position (in chair)
  
  // Head (looking at screen, slightly tilted forward)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.17, 0.14), skinMat);
  head.position.set(0, seatY + 0.52, personZ - 0.08);
  head.rotation.x = 0.1; // Looking down at screen
  head.castShadow = true;
  scene.add(head);
  // Hair
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.15), hairMat);
  hair.position.set(0, seatY + 0.61, personZ - 0.06);
  scene.add(hair);
  // Torso (upper body, leaning slightly forward)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.16), shirtMat);
  torso.position.set(0, seatY + 0.3, personZ - 0.05);
  torso.rotation.x = 0.15; // Leaning forward
  torso.castShadow = true;
  scene.add(torso);
  // Upper arms (shoulders to elbows)
  const upperArmGeo = new THREE.BoxGeometry(0.07, 0.18, 0.07);
  [-0.17, 0.17].forEach(x => {
    const upperArm = new THREE.Mesh(upperArmGeo, shirtMat);
    upperArm.position.set(x, seatY + 0.32, personZ - 0.02);
    upperArm.rotation.x = -0.5;
    upperArm.castShadow = true;
    scene.add(upperArm);
  });
  // Forearms (elbows to hands on keyboard)
  const forearmGeo = new THREE.BoxGeometry(0.06, 0.16, 0.06);
  [-0.17, 0.17].forEach(x => {
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.set(x, seatY + 0.15, personZ - 0.25);
    forearm.rotation.x = -1.2; // Reaching to keyboard
    forearm.castShadow = true;
    scene.add(forearm);
  });
  // Hands on keyboard area
  const handGeo = new THREE.BoxGeometry(0.06, 0.04, 0.06);
  [-0.12, 0.12].forEach(x => {
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(x, DESK_H + 0.04, 0.12);
    hand.castShadow = true;
    scene.add(hand);
  });
  // Thighs (seated)
  const thighGeo = new THREE.BoxGeometry(0.11, 0.12, 0.35);
  [-0.08, 0.08].forEach(x => {
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.position.set(x, seatY + 0.02, personZ - 0.1);
    thigh.rotation.x = -0.15;
    thigh.castShadow = true;
    scene.add(thigh);
  });
  // Lower legs
  const calfGeo = new THREE.BoxGeometry(0.08, 0.32, 0.08);
  [-0.08, 0.08].forEach(x => {
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.position.set(x, 0.16, personZ - 0.2);
    calf.castShadow = true;
    scene.add(calf);
  });

  // ---- Desk lamp (off or very dim - laptop is main light) ----
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.6 });
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 12), lampMat);
  lampBase.position.set(-0.7, DESK_H + 0.01, -0.15);
  scene.add(lampBase);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), lampMat);
  lampArm.position.set(-0.7, DESK_H + 0.19, -0.15);
  scene.add(lampArm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 12, 1, true), lampMat);
  shade.position.set(-0.7, DESK_H + 0.38, -0.15);
  shade.rotation.x = Math.PI;
  scene.add(shade);

  // ---- Coffee mug ----
  const mugMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe5, roughness: 0.5, metalness: 0.1 });
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 10), mugMat);
  mug.position.set(0.6, DESK_H + 0.04, 0.05);
  mug.castShadow = true;
  scene.add(mug);

  // ---- Small plant ----
  const potMat = new THREE.MeshStandardMaterial({ color: 0x7a5030, roughness: 0.7 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 8), potMat);
  pot.position.set(0.7, DESK_H + 0.035, -0.2);
  scene.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a8a3a, roughness: 0.8 });
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), leafMat);
    leaf.position.set(0.7 + (Math.random() - 0.5) * 0.06, DESK_H + 0.1, -0.2 + (Math.random() - 0.5) * 0.05);
    leaf.scale.y = 0.6;
    scene.add(leaf);
  }

  return { walls, clearWallMat, roomCenter, toCamera };
}

// ============ MAIN COMPONENT ============
export function VoxelFounderScene({ isLightMode = false }: { isLightMode?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;
    renderer.setSize(container.clientWidth, container.clientHeight);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scW = container.clientWidth;
    const scH = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null; // Transparent — scene blends with page, no box

    // Camera - closer framing
    const target = new THREE.Vector3(0, 0.85, 0);
    const scale = scH * 0.003 + 2.8;
    const camera = new THREE.OrthographicCamera(-scale, scale, scale, -scale, 0.01, 100);
    const initialCameraPosition = new THREE.Vector3(
      10 * Math.sin(0.2 * Math.PI),
      5.5,
      10 * Math.cos(0.2 * Math.PI)
    );
    camera.position.copy(initialCameraPosition);
    camera.lookAt(target);

    // Renderer — alpha so page background shows through (no boundaries)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(scW, scH);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLightMode ? 1.35 : 1.2;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ======== LIGHTING — theme-aware: brighter in light mode so walls read light -======
    const ambientColor = isLightMode ? 0x808890 : 0x606070;
    const ambientIntensity = isLightMode ? 0.95 : 0.75;
    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambient);

    const hemiSky = isLightMode ? 0xa8b8d0 : 0x8090b0;
    const hemiGround = isLightMode ? 0x606050 : 0x404038;
    const hemiIntensity = isLightMode ? 0.75 : 0.6;
    const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, hemiIntensity);
    scene.add(hemi);

    // Main light: laptop screen glow (teal) - KEY LIGHT
    const screenLight = new THREE.PointLight(0x4aeadc, 2.5, 4, 1.5);
    screenLight.position.set(0, DESK_H + 0.3, -0.1);
    screenLight.castShadow = true;
    screenLight.shadow.mapSize.width = 512;
    screenLight.shadow.mapSize.height = 512;
    scene.add(screenLight);

    // Secondary screen light (face fill)
    const faceLight = new THREE.PointLight(0x5aeaea, 1.2, 2);
    faceLight.position.set(0, DESK_H + 0.4, 0.25);
    scene.add(faceLight);

    // Warm desk lamp light (dim, secondary)
    const lampLight = new THREE.PointLight(0xffeedd, 0.8, 3);
    lampLight.position.set(-0.7, DESK_H + 0.5, -0.15);
    scene.add(lampLight);

    // Window fill — daylight in light mode, softer in dark
    const windowColor = isLightMode ? 0xb8d0e8 : 0x90a8c0;
    const windowIntensity = isLightMode ? 0.7 : 0.5;
    const windowLight = new THREE.DirectionalLight(windowColor, windowIntensity);
    windowLight.position.set(0, 2, ROOM.backZ - 1);
    windowLight.target.position.set(0, 0.5, 0.5);
    scene.add(windowLight.target);
    scene.add(windowLight);

    // Back rim light for depth
    const rimLight = new THREE.PointLight(0x4060a0, 0.5, 5);
    rimLight.position.set(1.5, 2, -1);
    scene.add(rimLight);

    const { walls, clearWallMat, roomCenter, toCamera } = buildScene(scene, isLightMode);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.enablePan = false;

    // Animation
    let frame = 0;
    const maxIntroFrames = 100;
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      frame = frame <= maxIntroFrames ? frame + 1 : frame;

      if (frame <= maxIntroFrames) {
        const t = frame / maxIntroFrames;
        const rotSpeed = -easeOutCirc(t) * Math.PI * 14;
        const p = initialCameraPosition;
        camera.position.y = 5.5;
        camera.position.x = p.x * Math.cos(rotSpeed) + p.z * Math.sin(rotSpeed);
        camera.position.z = p.z * Math.cos(rotSpeed) - p.x * Math.sin(rotSpeed);
        camera.lookAt(target);
      } else {
        controls.update();
      }

      // Make the wall that is front elevation (facing camera) clear so we see into the room
      toCamera.subVectors(camera.position, roomCenter).normalize();
      let bestDot = -Infinity;
      let frontWall: THREE.Mesh | null = null;
      for (const { mesh, faceNormal } of walls) {
        const dot = toCamera.dot(faceNormal);
        if (dot > bestDot) {
          bestDot = dot;
          frontWall = mesh;
        }
      }
      for (const { mesh, opaqueMat } of walls) {
        (mesh as THREE.Mesh).material = mesh === frontWall ? clearWallMat : opaqueMat;
      }

      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.domElement.remove();
      renderer.dispose();
    };
  }, [handleResize, isLightMode]);

  return <div ref={containerRef} className="h-full w-full min-h-[280px]" />;
}
