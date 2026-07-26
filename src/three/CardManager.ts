import { Experience, type LifeTimeObject } from "@plugins/three-base-experience";
import { type project } from "./types";
import Card from "./Card";
import type ExpWorld from "./World";
import * as THREE from "three"
import type GUI from "lil-gui";

export default class CardManager implements LifeTimeObject {
  public cards: Card[] = [];
  public spawnCountdown = 5000.;
  private timer = this.spawnCountdown;
  private currentCard = 0;

  private declare experience: Experience;
  private declare debugFolder: GUI

  /**
   * Spacing between each card;
   */
  private spacing = 0.1;

  constructor(projects: project[]) {
    //@todo later replace by real projects
    const p = [0, 1, 2, 3, 4]
    p.forEach((project) => {
      const card = new Card(project, "1", "1", p.length)
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
  };

  destroy = () => { };

  update = () => {
    this.cards.forEach((c) => {
      c.update();
    })
    const exp = Experience.instance;
    if (!exp) return;
    // this.timer += exp.time.delta
    // if (this.timer >= this.spawnCountdown) {
    //   this.spawnCard()
    //   this.timer = 0;
    // }

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

  spawnCard = () => {
    const card = this.cards[this.currentCard]
    if (!card) throw new Error(`no card found with id, ${this.currentCard}`);

    card.spawnCard();
    this.currentCard++;
    if (this.currentCard > this.cards.length - 1) {
      this.currentCard = 0;
    }
  }

  setDebugObject = () => {
    this.debugFolder.add(this, "spawnCountdown").min(0).max(1000000);
  }
}
