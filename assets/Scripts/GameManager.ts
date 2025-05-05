import { _decorator, Camera, Component, EventTouch, geometry, Input, input, instantiate, Material, MeshCollider, MeshRenderer, Node, PhysicsSystem, Prefab, Quat, RigidBody, Texture2D, Tween, tween, UITransform, Vec2, Vec3, } from "cc";
import { balloonCreation } from "./BalloonCreation";
const { ccclass, property } = _decorator;

@ccclass("GameManager")
export class GameManager extends Component {
  @property(Camera)
  camera: Camera = null;

  @property(balloonCreation)
  BalloonCreation: balloonCreation = null;

  @property(Prefab)
  Particle: Prefab = null;


  @property(Material)
  ParticleSF: Material[] = [];

  @property(Node)
  Canvas: Node = null;

  protected anim(node: Node): void {
    // Define control points for the curve

    const rand = Math.random() < 0.5 ? -1 : 1;
    const startPoint = new Vec3(0, 0, 0.1);
    const controlPoint1 = new Vec3(rand * 4, 60, 0.1);
    const controlPoint2 = new Vec3(rand * 6, 60, 0.1);
    const endPoint = new Vec3(rand * 8, 60, 0.1);

    let t = 0;
    const duration = 2.5; // seconds
    const rigidbody = node.getComponent(RigidBody);

    this.schedule((dt) => {
      if (t >= 1) {
        rigidbody.setLinearVelocity(Vec3.ZERO); // Stop movement
        return;
      }

      t += dt / duration;

      // Get current and next position on curve
      const currentPos = bezier(t, startPoint, controlPoint1, controlPoint2, endPoint);
      const nextPos = bezier(t + 0.01, startPoint, controlPoint1, controlPoint2, endPoint);

      // Compute velocity = (nextPos - currentPos) / dt
      const velocity = nextPos.subtract(currentPos).multiplyScalar(1 / dt);
      rigidbody.setLinearVelocity(velocity);

    }, 0.4, Math.ceil(duration / 0.016));

    // Bezier function (Cubic)
    function bezier(t: number, p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): Vec3 {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const p = new Vec3();
      p.x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
      p.y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
      p.z = uuu * p0.z + 3 * uu * t * p1.z + 3 * u * tt * p2.z + ttt * p3.z;
      return p;
    }

  }

  protected start(): void {
    this.handTween();
  }

  animh: Tween<Node>;
  handnode: Node;
  handTween() {
    this.Canvas.active = true;
    this.handnode = this.Canvas.getChildByName("hand");
    this.handnode.setPosition(-120, 0, 0)
    this.animh = tween(this.handnode)
      .sequence(
        tween().to(1.2, { position: new Vec3(230, 0, 0) }),
        tween().to(0.01, { position: new Vec3(-120, 0, 0) })
      )
      .repeatForever()
      .start();

  }




  onEnable() {
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  onDisable() {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  StartingPoint: Vec3 = new Vec3(0, 0, 0);
  SelectedNode: Node = null;
  InitialAngle;
  previousAngle = 0;
  enableTouchMove = true;
  BalloonPopCount = 0;
  private count: number = 0;

  onTouchStart(event) {
    this.animh.stop();
    this.handnode.active = false;
    this.Canvas.active = false;
    const mousePos = event.getLocation();
    this.StartingPoint.x = mousePos.x;
    this.StartingPoint.y = mousePos.y;
    const ray = new geometry.Ray();
    this.camera.screenPointToRay(mousePos.x, mousePos.y, ray);
    const mask = 0xffffffff; // Detect all layers (default)
    const maxDistance = 1000; // Maximum ray distance
    const queryTrigger = true; // Include trigger colliders

    if (PhysicsSystem.instance.raycastClosest(ray, mask, maxDistance, queryTrigger)) {

      const result = PhysicsSystem.instance.raycastClosestResult;
      const collider = result.collider;
      const node = collider.node;


      if (node.name === "Circle1") {
        this.SelectedNode = node;
        this.InitialAngle = node.eulerAngles.y;
      }


    } else {
      // No object was hit
      this.SelectedNode = this.node;
      this.InitialAngle = this.node.eulerAngles.y;

    }
  }


  onTouchMove(event: EventTouch) {
    const mousePos = event.getLocation();
    let deltaY = mousePos.y - this.StartingPoint.y;
    if (this.enableTouchMove) {
      let angle = (mousePos.x - this.StartingPoint.x) / 2.5;
      this.SelectedNode.setRotationFromEuler(0, this.InitialAngle + angle, 0);
    }

    console.log("y-axis", (mousePos.y - this.StartingPoint.y))

  }

  setParticleNode() {

    // let idx =0;
    this.schedule(() => {
      let ParticleNode = instantiate(this.Particle);
      ParticleNode.getComponent(MeshRenderer).materials[0] = this.ParticleSF[this.particleIdx];
      let node = this.balloonPopArr.pop();
      node.parent.addChild(ParticleNode);
      ParticleNode.setPosition(new Vec3(node.position.x, node.position.y + 0.1, node.position.z + 0.2))
      node.destroy();
      this.anim(ParticleNode);
      // idx +=1;
    }, 0.05, this.balloonPopArr.length - 1)

    this.scheduleOnce((() => {
      this.balloonPopArr = [];
      this.BalloonPopCount = 0;
      this.enableTouchMove = true;
      input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
      input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
      input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }), 1.4);

  }

  private particleIdx;

  private balloonPopArr = [];


  onTouchEnd(event) {
    if (this.SelectedNode === null || !this.enableTouchMove) return;

    if (this.SelectedNode.name === "Circle1") {
      const angle = this.InitialAngle;
      let getAngle = this.calculateRotation(angle, this.SelectedNode.eulerAngles.y);
      let fixedAngle = this.FixRotPos(this.SelectedNode.eulerAngles.y);
      let fixedArrayAngle = this.FixRotPos(getAngle);
      if (Math.abs(getAngle) > 0) {
        this.count += 1;
      }
      console.log(getAngle, fixedAngle, fixedArrayAngle)
      this.SelectedNode.setRotationFromEuler(0, fixedAngle, 0);
      let setIdexArrayData = this.BalloonCreation.setIdexArrayData;
      let matchingIndex = this.BalloonCreation.changeinArray(this.BalloonCreation.balloonMainArray, this.BalloonCreation.setIdexArrayData, this.SelectedNode.parent.getSiblingIndex(), fixedArrayAngle);
      this.particleIdx = this.BalloonCreation.balloonMainArray[0][matchingIndex[0]];
      console.log("matchingIndex", matchingIndex, this.BalloonCreation.balloonMainArray);
      if (matchingIndex.length > 0 && this.particleIdx !== -1) {
        setIdexArrayData.forEach((element, i) => {
          // this.BalloonCreation.node.children[i].children[0].children[element[matchingIndex[0]]].children[0].getComponent(MeshCollider).enabled = true;
          this.balloonPopArr.push(this.BalloonCreation.node.children[i].children[0].children[element[matchingIndex[0]]].children[0]);
          this.BalloonCreation.balloonMainArray[i][matchingIndex[0]] = -1;

        });
        this.setParticleNode()
      }


      if (this.count > 15) {
        this.Canvas.active = true;
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
      }
    }
    this.SelectedNode = null;
  }
  FixRotPos(n) {
    return Math.round(n / 19) * 19;
  }
  calculateRotation(fromAngle: number, toAngle: number): number {
    let rotation = toAngle - fromAngle;
    if (rotation > 180) {
      rotation -= 360;
    } else if (rotation < -180) {
      rotation += 360;
    }

    return rotation;
  }

  OnStartButtonClick() {
    window.open("https://play.google.com/store/apps/details?id=com.gamebrain.hexasort", "HexaSort");
  }


}
