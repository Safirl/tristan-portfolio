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

export default class Card implements LifeTimeObject {
  declare public id: string;
  declare public title: string;
  declare public imageUrl: string;
  declare private mesh: THREE.Mesh;
  declare private experience: Experience;
  declare private debugFolder: GUI;
  private cardSpawnPoint: THREE.Vector3 = new THREE.Vector3()

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
    if (this.experience.debug) {
      this.debugFolder = this.experience.debug.ui.addFolder("card")
    }
  }

  init = () => {
    this.createMesh();
    if (this.experience.debug) {
      this.setDebugObject()
    }
  };

  createMesh = () => {
    this.mesh = new THREE.Mesh(this.createGeometry(), this.createMaterial())
    this.experience.scene.add(this.mesh)

    this.mesh.position.z = -2.2
    this.mesh.position.y = -.23
    this.mesh.position.x = -.16
    this.mesh.rotation.y = Math.PI/2
  }

  createGeometry = (): THREE.ShapeGeometry => {
    return createRoundedRectangleGeometry(0,0,1,1,.2);
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

  destroy = () => {};
  update = () => { };

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
      .min(-20)
      .max(20)
      .step(0.01);
    positionFolder
      .add(this.mesh.position, "z")
      .name("z")
      .min(-20)
      .max(20)
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
  }
  }
