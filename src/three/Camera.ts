import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Camera } from "@plugins/three-base-experience";
import gsap from "gsap";
import GUI from "lil-gui";

export default class ExpCamera extends Camera {
  // declare controls: OrbitControls;

  init() {
    super.init();
    this.setCameraInitialTransform();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      35,
      this.sizes.width / this.sizes.height,
      0.1,
      1000,
    );
    // this.instance.position.set(6, 4, 8);
    this.setCameraInitialTransform();
    super.setInstance();
  }

  setCameraInitialTransform = () => {
    this.instance.position.set(2.92, 0.109, -4.7);
    this.instance.rotation.set(0, 1.99, -0.11);
  };

  setControls() {
    // this.controls = new OrbitControls(this.instance, this.canvas);
    // this.controls.enableDamping = true;
  }

  update() {
    // this.controls.update();
  }

  destroy(): void {
    // this.controls.dispose();
  }

  setDebugObject(): void {
    super.setDebugObject();
    if (!this.debug.active) return;
    const positionFolder = this.debugFolder.addFolder("Position");
    positionFolder
      .add(this.instance.position, "x")
      .name("x")
      .min(-20)
      .max(20)
      .step(0.01);
    positionFolder
      .add(this.instance.position, "y")
      .name("y")
      .min(-20)
      .max(20)
      .step(0.01);
    positionFolder
      .add(this.instance.position, "z")
      .name("z")
      .min(-20)
      .max(20)
      .step(0.01);

    const rotationFolder = this.debugFolder.addFolder("Rotation");
    rotationFolder
      .add(this.instance.rotation, "x")
      .name("x")
      .min(-3.14)
      .max(3.14)
      .step(0.01);
    rotationFolder
      .add(this.instance.rotation, "y")
      .name("y")
      .min(-3.14)
      .max(3.14)
      .step(0.01);
    rotationFolder
      .add(this.instance.rotation, "z")
      .name("z")
      .min(-3.14)
      .max(3.14)
      .step(0.01);
  }
}
