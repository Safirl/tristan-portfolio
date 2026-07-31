import { Experience, type LifeTimeObject } from "@plugins/three-base-experience";
import { type project } from "./types";
import Card from "./Card";
import type ExpWorld from "./World";
import * as THREE from "three"
import GUI from "lil-gui";
import gsap from "gsap";

export default class CardManager implements LifeTimeObject {
  public cards: Card[] = [];
  public spawnCountdown = 5000.;
  public initialSpeed = .00003
  public speed = this.initialSpeed
  private acceleration = 0
  public maxAcceleration = .0005

  private declare experience: Experience;
  private declare debugFolder: GUI

  /*
  * Scrolling
  */
  private idleScrollElapsed = 0.
  //in ms
  private idleScrollThreshold = 100

  /**
   * Spacing between each card;
   */
  private spacing = 0.2;

  constructor(projects: project[]) {
    //@todo later replace by real projects
    const p = [0, 1, 2, 3]
    p.forEach((project) => {
      const card = new Card(project, "1", "1", p.length, this)
      this.cards.push(card)
    })
    if (!Experience.instance) {
      throw new Error("Can't create card, experience instance is not valid.");
    }
    this.experience = Experience.instance;
    if (this.experience.debug.active) {
      this.debugFolder = this.experience.debug.ui.addFolder("Card Manager")
    }
  }

  init = () => {
    if (this.experience.debug.active) {
      this.setDebugObject()
    }
    this.cards.forEach((c) => {
      c.init()
    })
    document.addEventListener("wheel", this.onDocumentScroll)
  };

  onDocumentScroll = (e: any) => {
    this.idleScrollElapsed = 0.
    this.acceleration = Math.abs(e.wheelDelta) / 100000
  };

  checkForIdleScroll = () => {
    this.idleScrollElapsed += this.experience.time.delta
    if (this.idleScrollElapsed > this.idleScrollThreshold && this.acceleration > 0) {
      gsap.to(this, {
        acceleration: 0.,
        ease: "power1",
        duration: .1
      })
    }
  }

  destroy = () => {
    document.removeEventListener("wheel", this.onDocumentScroll)
  };

  update = () => {
    this.checkForIdleScroll()
    this.speed = this.initialSpeed + Math.min(this.acceleration, this.maxAcceleration)
    this.cards.forEach((c) => {
      c.update();
    })
    const exp = Experience.instance;
    if (!exp) return;

    const world = exp.world as ExpWorld
    const cardMeshes = this.cards.map((c) => c.mesh)
    const intersections = world.raycaster.intersectObjects(cardMeshes);
    document.body.style.cursor = intersections.length > 0 ? "pointer" : "inherit"
    this.cards.forEach((c) => {
      let intersectMesh: THREE.Object3D | null = null
      if (intersections.length > 0) {
        intersectMesh = intersections[0].object
      }
      if (intersectMesh instanceof THREE.Mesh && c.mesh === intersectMesh) {
        c.hoverState = "hover"
      }
      else {
        c.hoverState = "idle"
      }
    })
  };

  setDebugObject = () => {
    this.debugFolder.add(this, "spawnCountdown").min(0).max(1000000);
    this.debugFolder.add(this, "initialSpeed").min(0).max(10).step(.00001).name("initialSpeed");
  }
}
