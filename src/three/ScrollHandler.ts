import type { LifeTimeObject } from "@plugins/three-base-experience";

export default class ScrollHandler implements LifeTimeObject {
  //We need to get the scroll speed of the user.
  // We will have an animation triggering in background slowly
  // the fastest the scroll is, the fastest the animation wil go.
  // On hover the animation will strop

  constructor() {

  }
  init = () => {};
  destroy = () => {};
  update = () => {};
}
