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

  private friction = 0;
  private targetFriction = .0004;
  private directionRadius = 10;
  private targetPosition = new THREE.Vector2();
  public hoverState: "hover" | "idle" = "idle"
  public previousHoverState: "hover" | "idle" = this.hoverState

  public targetAngle = Math.PI / 10;

  private initialPosition = new THREE.Vector3(-.16, 0.3, -2.09)
  private initialSpeed = 12;
  private speed = this.initialSpeed
  private spawnCompleted = false;
  declare private xRotation: number

  //Shader
  private targetWaveAmplitude = .01
  private targetWaveFrequency = 21.9
  private maxWaveAmplitude = .01
  private maxWaveFrequency = 60
  public waveAmplitude = uniform(this.maxWaveAmplitude);
  public waveFrequency = uniform(this.maxWaveAmplitude);
  public targetCardRadius = .15
  public maxCardRadius = 1.
  public cardRadius = uniform(this.maxCardRadius);
  private width = 16 / 20;
  private height = 9 / 20;

  constructor(id: number, title: string, imageUrl: string) {
    if (!id || !title || !imageUrl) {
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
      this.debugFolder = this.experience.debug.ui.addFolder("card")
    }
    this.initialPosition.x += id / 100
  }

  init = () => {
    this.createMesh();
    // this.createPath();
    if (this.experience.debug.active) {
      this.setDebugObject()
    }
  };

  spawnCard = () => {
    this.resetValues()

    const angle =
      (3 * 2 * Math.PI) / 4 //initial angle
      + this.targetAngle // angle to add up and down
      * (Math.random() - .5) * 2
    this.targetPosition.x = this.initialPosition.y + Math.cos(angle) * this.directionRadius;
    this.targetPosition.y = this.initialPosition.z + Math.sin(angle) * this.directionRadius;
    this.friction = this.targetFriction
    gsap.to(this.mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 2.,
      ease: "back.out"
    })
    gsap.to(this.cardRadius, {
      value: this.targetCardRadius,
      duration: 1.5,
      ease: "back.out"
    })
    gsap.to(this.waveFrequency, {
      value: this.targetWaveFrequency,
      duration: 2.5,
      ease: "power1.out"
    })
    gsap.to(this.waveAmplitude, {
      value: this.targetWaveAmplitude,
      duration: 2.5,
      ease: "power1.out"
    })
    gsap.to(this, {
      speed: 1,
      ease: "power2.out",
      duration: .8,
      onComplete: () => this.spawnCompleted = true
    })
  }

  createMesh = () => {
    this.mesh = new THREE.Mesh(this.createGeometry(), this.createMaterial())
    this.experience.scene.add(this.mesh)
    this.resetValues()
  }

  createPath = () => {
    const points = [
      new THREE.Vector3( -10, 0, 10 ),
     	new THREE.Vector3( -5, 5, 5 ),
     	new THREE.Vector3( 0, 0, 0 ),
     	new THREE.Vector3( 5, -5, 5 ),
    ]
    const path = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.BufferGeometry().setFromPoints( path.getPoints( 50 ) );
    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

    const curveObject = new THREE.Line(geometry, material);
    this.experience.scene.add(curveObject)
  }

  resetValues = () => {
    this.mesh.position.x = this.initialPosition.x
    this.mesh.position.y = this.initialPosition.y
    this.mesh.position.z = this.initialPosition.z
    this.targetPosition.x = this.initialPosition.y
    this.targetPosition.y = this.initialPosition.z
    const camRotation = this.experience.camera.instance.rotation
    this.mesh.rotation.set(camRotation.x, camRotation.y, camRotation.z)
    this.speed = this.initialSpeed
    this.spawnCompleted = false;
    this.mesh.scale.set(0, 0, 0);
    this.waveAmplitude.value = this.maxWaveAmplitude
    this.waveFrequency.value = this.maxWaveFrequency
    this.cardRadius.value = this.maxCardRadius

    this.xRotation =
      Math.PI / 10 // angle to add up and down
      * (Math.random() - .5) * 2

    console.log(this.xRotation)
    this.mesh.rotation.x += this.xRotation;
  }

  createGeometry = () => {
    // return createRoundedRectangleGeometry(-0.5,-0.25,16/20,9/20,.15);
    return new THREE.CircleGeometry(.3, 200)
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
    const waveZ = sin(time.add(positionLocal.y.mul(this.waveFrequency).mul(1.5))).mul(this.waveAmplitude.mul(10))
    const newPosition = vec3(positionLocal.x, positionLocal.y.add(waveY), positionLocal.z)
    material.positionNode = newPosition;
    material.colorNode = texture(resources.items["Rendus 3D Christian Boragine"] as THREE.Texture)
    // material.opacityNode = select(alphaTest({ width: widthNode, height: heightNode, radius: this.cardRadius }), 1, 0)
    return material;
  };


  destroy = () => { };

  update = () => {
    this.animateHover()
    this.moveCard()
  };

  animateHover = () => {
    if (!this.spawnCompleted) return;
    if (this.previousHoverState === this.hoverState) return;
    const newFriction = this.hoverState === "hover" ? 0 : this.targetFriction
    gsap.to(this, {
      friction: newFriction,
      duration: 1.5
    })
    const scale = this.hoverState === "hover" ? 1.1 : 1.
    gsap.to(this.mesh.scale,{
      x: scale,
      y: scale,
      z: scale,
    })
    this.previousHoverState = this.hoverState
  }

  moveCard = () => {
    // if (this.friction === 0) return;
    this.mesh.position.y = lerp(this.mesh.position.y, this.targetPosition.x, this.friction * this.speed);
    this.mesh.position.z = lerp(this.mesh.position.z, this.targetPosition.y, this.friction * this.speed);
    // this.mesh.lookAt(this.experience.camera.instance.position)

    // console.log(lerp(this.mesh.position.y, this.targetPosition.x, this.friction))
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

    this.debugFolder.add(this, "spawnCard")
  }
}
