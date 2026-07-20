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
  private speed = {value: 8};
  private directionRadius = 10;
  private targetPosition = new THREE.Vector2();
  public hoverState: "hover" | "idle" = "idle"
  public previousHoverState: "hover" | "idle" = "idle"

  public targetAngle = Math.PI / 10;

  private initialPosition = new THREE.Vector3(-.16, 0.3, -2.09)
  private initialSpeed = 12;
  private spawnCompleted = false;

  //Shader
  public waveAmplitude = uniform(.01);
  public waveFrequency = uniform(21.9);
  private width = 16 / 20;
  private height = 9 / 20;
  private cardRadius = .15;

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
      // ease: "bounce.inOut",
      duration: .9,
    })
    gsap.to(this.speed, {
      value: 1,
      ease: "power1.out",
      duration: 1.1,
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
    this.speed.value = this.initialSpeed
    this.spawnCompleted = false;
    this.mesh.scale.set(0, 0, 0);
  }

  createGeometry = () => {
    // return createRoundedRectangleGeometry(-0.5,-0.25,16/20,9/20,.15);
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
    const radiusNode = uniform(this.cardRadius)

    const resources = this.experience.resources;
    const material = new THREE.MeshBasicNodeMaterial();
    material.transparent = false;
    material.alphaTest = .5;
    const waveY = sin(time.add(positionLocal.x.mul(this.waveFrequency))).mul(this.waveAmplitude)
    const waveZ = sin(time.add(positionLocal.y.mul(this.waveFrequency))).mul(this.waveAmplitude)
    const newPosition = vec3(positionLocal.x, positionLocal.y.add(waveY), positionLocal.z.add(waveZ))
    material.positionNode = newPosition;
    // Discard(alphaTest({ width: widthNode, height: heightNode, radius: radiusNode }));
    material.colorNode = texture(resources.items["Rendus 3D Christian Boragine"] as THREE.Texture)
    material.opacityNode = select(alphaTest({ width: widthNode, height: heightNode, radius: radiusNode }), 1, 0)
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
    this.mesh.position.y = lerp(this.mesh.position.y, this.targetPosition.x, this.friction * this.speed.value);
    this.mesh.position.z = lerp(this.mesh.position.z, this.targetPosition.y, this.friction * this.speed.value);
    // this.mesh.lookAt(this.experience.camera.instance.position)

    // console.log(lerp(this.mesh.position.y, this.targetPosition.x, this.friction))
  }

  setDebugObject = () => {
    this.debugFolder.add(this.waveAmplitude, "value").min(0).max(100).name("wave amplitude")
    this.debugFolder.add(this.waveFrequency, "value").min(0).max(100).name("wave frequency")

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
