import {
  Actor,
  Debug,
  Experience,
  roundedBoxSDF,
  type LifeTimeObject,
} from "@plugins/three-base-experience";
import * as THREE from "three/webgpu";
import { Discard, float, Fn, positionLocal, select, sin, texture, time, uniform, uv, vec2, vec3 } from "three/tsl";
import { createRoundedRectangleGeometry } from "@plugins/three-base-experience";
import type GUI from "lil-gui";
import gsap from "gsap"
import type ExpWorld from "./World";
import { lerp } from "three/src/math/MathUtils.js";

export default class Card implements LifeTimeObject {
  declare public id: number;
  declare public title: string;
  declare public imageUrl: string;
  declare public mesh: THREE.Mesh;
  declare private experience: Experience;
  declare private debugFolder: GUI;

  public hoverState: "hover" | "idle" = "idle"
  public previousHoverState: "hover" | "idle" = this.hoverState
  private speed = .00001;
  declare private splineProgression: number;
  private initialized = false;

  //path
  declare private path: THREE.CatmullRomCurve3

  //Shader
  private targetWaveAmplitude = .01
  private targetWaveFrequency = 21.9
  public waveAmplitude = uniform(this.targetWaveAmplitude);
  public waveFrequency = uniform(this.targetWaveFrequency);
  public targetCardRadius = .15
  public maxCardRadius = 1.
  public cardRadius = uniform(this.targetCardRadius);
  private width = 16 / 20;
  private height = 9 / 20;

  constructor(id: number, title: string, imageUrl: string, cardLength: number) {
    if (typeof id !== "number" || !title || !imageUrl) {
      throw new Error("Can't create card: id, title, or imageUrl is not valid");
    }
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    if (!Experience.instance) {
      throw new Error("Can't create card, experience instance is not valid.");
    }
    this.experience = Experience.instance;
    if (this.experience.debug.active) {
      this.debugFolder = this.experience.debug.ui.addFolder("Card")
    }
    this.splineProgression = (this.id + 1) / cardLength;
    console.log(this.splineProgression)
  }

  init = () => {
    this.createMesh();
    this.createPath();
    if (this.experience.debug.active) {
      this.setDebugObject()
    }
    this.initialized = true;
  };

  createMesh = () => {
    this.mesh = new THREE.Mesh(this.createGeometry(), this.createMaterial())
    this.experience.scene.add(this.mesh)
    this.resetValues()
  }

  createPath = () => {
    const points = [
      new THREE.Vector3(-.16, 0.3, -1.8),
      new THREE.Vector3(-.16, 0.2, -2.8),
     	new THREE.Vector3( -.16, 0.5, -3.5 ),
     	new THREE.Vector3( -.16, -0.1, -4.3 ),
     	new THREE.Vector3( -.16, 0.3, -5.5 ),
    ]
    this.path = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.BufferGeometry().setFromPoints( this.path.getPoints( 50 ) );
    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

    const curveObject = new THREE.Line(geometry, material);
    this.experience.scene.add(curveObject)
    const position = this.path.getPointAt(this.splineProgression)
    this.mesh.position.copy(position)
  }

  resetValues = () => {
    const camRotation = this.experience.camera.instance.rotation
    this.mesh.rotation.set(camRotation.x, camRotation.y, camRotation.z)
  }

  createGeometry = () => {
    // return createRoundedRectangleGeometry(-0.5,-0.25,16/20,9/20,.15);
    // return new THREE.CircleGeometry(.3, 200)
    return new THREE.PlaneGeometry(16 / 20, 9 / 20, 200, 200);
  };

  createMaterial = (): THREE.MeshBasicNodeMaterial => {
    const alphaTest = Fn(({ width, height, radius }: { width: THREE.Node<"float">; height: THREE.Node<"float">; radius: THREE.Node<"float"> }) => {
      const d = roundedBoxSDF(
          uv().sub(0.5).mul(vec2(width, height)),
          vec2(width, height).mul(0.5),
          float(radius)
        );
        return d.lessThan(0.0);
    })

    //uniforms
    const widthNode = uniform(this.width)
    const heightNode = uniform(this.height)

    const resources = this.experience.resources;
    const material = new THREE.MeshBasicNodeMaterial();
    material.transparent = false;
    material.alphaTest = .5;
    const waveY = sin(time.add(positionLocal.x.mul(this.waveFrequency))).mul(this.waveAmplitude) //TODO add speed
    // const waveZ = sin(time.add(positionLocal.y.mul(this.waveFrequency).mul(1.5))).mul(this.waveAmplitude.mul(10))
    const newPosition = vec3(positionLocal.x, positionLocal.y.add(waveY), positionLocal.z)
    material.positionNode = newPosition;
    material.colorNode = texture(resources.items["Rendus 3D Christian Boragine"] as THREE.Texture)
    material.opacityNode = select(alphaTest({ width: widthNode, height: heightNode, radius: this.cardRadius }), 1, 0)
    return material;
  };


  destroy = () => { };

  update = () => {
    if (!this.initialized) return;
    this.animateHover()
    // this.moveCard()
    this.moveCardOnPath();
  };

  animateHover = () => {
    // if (!this.spawnCompleted) return;
    if (this.previousHoverState === this.hoverState) return;
    // const newFriction = this.hoverState === "hover" ? 0 : this.targetFriction
    // gsap.to(this, {
    //   friction: newFriction,
    //   duration: 1.5
    // })
    const scale = this.hoverState === "hover" ? 1.1 : 1.
    gsap.to(this.mesh.scale,{
      x: scale,
      y: scale,
      z: scale,
    })
    this.previousHoverState = this.hoverState
  }

  moveCardOnPath = () => {
    if (!this.path) return;
    this.splineProgression += this.experience.time.delta * this.speed
    if (this.splineProgression > 1.) {
      this.splineProgression = 0;
    }

    const position = this.path.getPointAt(this.splineProgression)
    this.mesh.position.copy(position)
  }

  setDebugObject = () => {
    this.debugFolder.add(this.waveAmplitude, "value").min(0).max(100).name("wave amplitude").step(.001)
    this.debugFolder.add(this.waveFrequency, "value").min(0).max(100).name("wave frequency").step(.001)

    const positionFolder = this.debugFolder.addFolder("Position");
    positionFolder.open(false)
    positionFolder
      .add(this.mesh.position, "x")
      .name("x")
      .min(-20)
      .max(20)
      .step(0.01);
    positionFolder
      .add(this.mesh.position, "y")
      .name("y")
      .min(-5)
      .max(5)
      .step(0.01);
    positionFolder
      .add(this.mesh.position, "z")
      .name("z")
      .min(-5)
      .max(5)
      .step(0.01);

    const rotationFolder = this.debugFolder.addFolder("Rotation");
    rotationFolder.open(false)
    rotationFolder
      .add(this.mesh.rotation, "x")
      .name("x")
      .min(-3.14)
      .max(3.14)
      .step(0.01);
    rotationFolder
      .add(this.mesh.rotation, "y")
      .name("y")
      .min(-3.14)
      .max(3.14)
      .step(0.01);
    rotationFolder
      .add(this.mesh.rotation, "z")
      .name("z")
      .min(-3.14)
      .max(3.14)
      .step(0.01);
  }
}
