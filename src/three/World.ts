import { Experience } from "@plugins/three-base-experience";
import { Environment } from "@plugins/three-base-experience";
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
  declare plane: Card;
  declare private projects: project[];
  public declare raycaster: THREE.Raycaster
  public mousePosition = new THREE.Vector2()

  constructor(inProjects: any) {
    super();
    this.projects = inProjects.map((item: any) => {
      return {
        id: item.id,
        title: item.data.title,
        imageUrl: item.data.images[0],
      };
    });
    document.addEventListener("mousemove", this.onMouseMove)
    this.raycaster = new THREE.Raycaster()
  }

  destroy(): void {
    document.removeEventListener("mousemove", this.onMouseMove)
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
    this.plane = new Card("1", "1", "1")
    this.plane.init()
  }

  onMouseMove = (event: MouseEvent) => {
		event.preventDefault();

		this.mousePosition.x = ( event.clientX / this.experience.sizes.width ) * 2 - 1;
    this.mousePosition.y = - (event.clientY / this.experience.sizes.height) * 2 + 1;
	}

  update() {
    if (this.raycaster) {
      this.raycaster.setFromCamera( this.mousePosition, this.experience.camera.instance );
    }
    if (this.trumpet) {
      this.trumpet.update();
    }
    if (this.plane) {
      this.plane.update()
    }
  }
}
