import {
  Actor,
  Debug,
  Experience,
  type LifeTimeObject,
} from "@plugins/three-base-experience";
import * as THREE from "three/webgpu";
import { texture, uv, vec4 } from "three/tsl";
import { createRoundedRectangleGeometry } from "@plugins/three-base-experience/utils/customShapes";
import type GUI from "lil-gui";
import gsap from "gsap"
import { CustomEase } from "gsap/all";
import type ExpWorld from "./World";
import { lerp } from "three/src/math/MathUtils.js";

export default class Card implements LifeTimeObject {
  declare public id: string;
  declare public title: string;
  declare public imageUrl: string;
  declare private mesh: THREE.Mesh;
  declare private experience: Experience;
  declare private debugFolder: GUI;

  private friction = 0;
  private targetFriction = .0004;
  private speed = {value: 8};
  private radius = 10;
  private targetPosition = new THREE.Vector2();
  private hoverState: "hover" | "idle" = "idle"

  private initialPosition = new THREE.Vector3(-.16, 0.55, -2.6)
  private initialSpeed = 8;

  constructor(id: string, title: string, imageUrl: string) {
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
      + Math.PI / 5 // angle to add up and down
      * (Math.random() - .5) * 2
    this.targetPosition.x = this.initialPosition.y + Math.cos(angle) * this.radius;
    this.targetPosition.y = this.initialPosition.z + Math.sin(angle) * this.radius;
    this.friction = this.targetFriction
    gsap.to(this.speed, {
      value: 1,
      ease: "power1.out",
      duration: .8
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
    // Create the final object to add to the scene
    const curveObject = new THREE.Line(geometry, material);
    this.experience.scene.add(curveObject)
  }

  resetValues = () => {
    this.mesh.position.x = this.initialPosition.x
    this.mesh.position.y = this.initialPosition.y
    this.mesh.position.z = this.initialPosition.z
    this.targetPosition.x = this.initialPosition.y
    this.targetPosition.y = this.initialPosition.z
    this.mesh.rotation.y = Math.PI / 2
    this.speed.value = this.initialSpeed
  }

  createGeometry = (): THREE.ShapeGeometry => {
    return createRoundedRectangleGeometry(-0.5,-0.5,16/20,9/20,.15);
  };

  createMaterial = (): THREE.MeshBasicNodeMaterial => {
    const resources = this.experience.resources;
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = texture(resources.items["Rendus 3D Christian Boragine"] as THREE.Texture)

    material.map = resources.items[
      "Rendus 3D Christian Boragine"
    ] as THREE.Texture;
    return material;
  };

  destroy = () => { };

  update = () => {
    const world = this.experience.world as ExpWorld
    if (!world) return;
    const intersection = world.raycaster.intersectObject(this.mesh);
    this.hoverState = intersection.length > 0 ? "hover" : "idle"
    document.body.style.cursor = intersection.length > 0 ? "pointer" : "inherit"
    const newFriction = intersection.length > 0 ? 0 : this.targetFriction
    gsap.to(this, {
      friction: newFriction,
      duration: 1.5
    })
    // if (intersection.length > 0 && this.hoverState === "idle") {
    //   this.hoverState = "hover"
    //   document.body.style.cursor = "pointer"
    // } else if (intersection.length < 1 && this.hoverState === "hover") {
    //   this.hoverState = "idle"
    //   document.body.style.cursor = "inherit"
    //   this.friction = this.targetFriction;
    // }
    this.animateHover()
    this.moveCard()
  };

  animateHover = () => {
    const scale = this.hoverState === "hover" ? 1.1 : 1.
    gsap.to(this.mesh.scale,{
      x: scale,
      y: scale,
      z: scale,
    })
  }

  moveCard = () => {
    // if (this.friction === 0) return;
    this.mesh.position.y = lerp(this.mesh.position.y, this.targetPosition.x, this.friction * this.speed.value);
    this.mesh.position.z = lerp(this.mesh.position.z, this.targetPosition.y, this.friction * this.speed.value);
    // this.mesh.lookAt(this.experience.camera.instance.position)

    // console.log(lerp(this.mesh.position.y, this.targetPosition.x, this.friction))
  }

  setDebugObject = () => {
    const positionFolder = this.debugFolder.addFolder("Position");
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
