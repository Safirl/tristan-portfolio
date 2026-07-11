import { Experience } from "@plugins/three-base-experience";
import { Environment } from "@plugins/three-base-experience";
import { Floor } from "@plugins/three-base-experience";
import type { GLTF } from "three/examples/jsm/Addons.js";
import { Actor } from "@plugins/three-base-experience";
import { World } from "@plugins/three-base-experience";
import * as THREE from "three";
import Card from "./Card";

interface project {
  id: string;
  title: string;
  imageUrl: string;
}

export default class ExpWorld extends World {
  declare experience: Experience;
  declare scene: Experience["scene"];
  declare environment: Environment;
  declare resources: Experience["resources"];
  declare trumpet: Actor;
  declare private projects: project[];

  constructor(inProjects: any) {
    super();
    this.projects = inProjects.map((item: any) => {
      return {
        id: item.id,
        title: item.data.title,
        imageUrl: item.data.images[0],
      };
    });
  }

  init() {
    super.init();
    this.environment = new Environment(
      this.resources.items.environmentMapTexture as THREE.CubeTexture,
      false,
    );
    this.trumpet = new Actor(
      "trumpet",
      this.resources.items.trumpetModel as GLTF,
      true,
      false,
    );
    const plane = new Card("1", "1", "1")
    plane.init()
  }

  update() {
    if (this.trumpet) {
      this.trumpet.update();
    }
  }
}
