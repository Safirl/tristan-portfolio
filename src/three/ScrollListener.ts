import type { LifeTimeObject } from "@plugins/three-base-experience";

export default class ScrollListener implements LifeTimeObject {
  public scrollSpeed = 0.

  init = () => {
    document.addEventListener("wheel", this.onDocumentScroll)
  };
  update = () => { };
  destroy = () => {
    document.removeEventListener("wheel", this.onDocumentScroll)
  };

  onDocumentScroll = (e: WheelEvent) => {
    console.log(e.wheelDelta)
  };
}
