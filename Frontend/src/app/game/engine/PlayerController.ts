import * as THREE from 'three';
import { InputManager } from './InputManager';
import { Vector3 } from './types';

export class PlayerController {
  private camera: THREE.PerspectiveCamera | null = null;
  private scene: THREE.Scene | null = null;
  private inputManager: InputManager | null = null;

  private position: THREE.Vector3 = new THREE.Vector3(0, 1.8, 0);
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');

  private moveSpeed: number = 6;
  private sprintMultiplier: number = 1.8;
  private crouchMultiplier: number = 0.5;
  private jumpForce: number = 8;
  private gravity: number = -25;
  private terminalVelocity: number = -50;

  private onGround: boolean = false;
  private isSprinting: boolean = false;
  private isCrouching: boolean = false;
  private isAiming: boolean = false;
  private wasCrouching: boolean = false;

  private playerHeight: number = 1.8;
  private crouchHeight: number = 1.0;
  private currentHeight: number = 1.8;
  private heightTransitionSpeed: number = 10;

  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;

  private yaw: number = 0;
  private pitch: number = 0;
  private maxPitch: number = Math.PI / 2 - 0.05;

  private headBobTimer: number = 0;
  private headBobIntensity: number = 0;
  private headBobFrequency: number = 8;
  private headBobAmplitude: number = 0.02;

  private landingBobTimer: number = 0;
  private landingBobIntensity: number = 0;

  private stepTimer: number = 0;
  private stepInterval: number = 0.4;

  private collisionRadius: number = 0.35;
  private collisionHeight: number = 1.8;

  private moveInput: THREE.Vector2 = new THREE.Vector2();
  private lookInput: THREE.Vector2 = new THREE.Vector2();

  constructor() {}

  initialize(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    inputManager: InputManager
  ): void {
    this.camera = camera;
    this.scene = scene;
    this.inputManager = inputManager;

    this.setupInputListeners();
    this.camera.position.copy(this.position);
  }

  private setupInputListeners(): void {
    if (!this.inputManager) return;

    this.inputManager.on('moveForward', (active: boolean) => { this.moveForward = active; });
    this.inputManager.on('moveBackward', (active: boolean) => { this.moveBackward = active; });
    this.inputManager.on('moveLeft', (active: boolean) => { this.moveLeft = active; });
    this.inputManager.on('moveRight', (active: boolean) => { this.moveRight = active; });
    this.inputManager.on('sprint', (active: boolean) => { this.setSprinting(active); });
    this.inputManager.on('crouch', (active: boolean) => { this.setCrouching(active); });
    this.inputManager.on('aim', (active: boolean) => { this.setAiming(active); });
    this.inputManager.on('look', (x: number, y: number) => {
      this.yaw -= x;
      this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch - y));
    });
  }

  public update(deltaTime: number): void {
    if (!this.camera) return;

    this.updateMovement(deltaTime);
    this.updateRotation();
    this.updateCameraPosition(deltaTime);
    this.updateHeadBob(deltaTime);
    this.updateLandingBob(deltaTime);
    this.updateStepSounds(deltaTime);
  }

  private updateMovement(deltaTime: number): void {
    this.moveInput.set(0, 0);

    if (this.moveForward) this.moveInput.y -= 1;
    if (this.moveBackward) this.moveInput.y += 1;
    if (this.moveLeft) this.moveInput.x -= 1;
    if (this.moveRight) this.moveInput.x += 1;

    const isMoving = this.moveInput.length() > 0;

    if (isMoving) {
      this.moveInput.normalize();
    }

    let currentSpeed = this.moveSpeed;

    if (this.isSprinting && !this.isCrouching && this.moveInput.y < 0) {
      currentSpeed *= this.sprintMultiplier;
    } else if (this.isCrouching) {
      currentSpeed *= this.crouchMultiplier;
    }

    if (this.isAiming) {
      currentSpeed *= 0.6;
    }

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const targetVelocity = new THREE.Vector3();
    targetVelocity.addScaledVector(forward, -this.moveInput.y * currentSpeed);
    targetVelocity.addScaledVector(right, this.moveInput.x * currentSpeed);

    const acceleration = this.onGround ? 30 : 10;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelocity.x, 1 - Math.exp(-acceleration * deltaTime));
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelocity.z, 1 - Math.exp(-acceleration * deltaTime));

    this.velocity.y += this.gravity * deltaTime;
    this.velocity.y = Math.max(this.velocity.y, this.terminalVelocity);

    const newPosition = this.position.clone();
    newPosition.addScaledVector(this.velocity, deltaTime);

    this.checkCollisions(newPosition, deltaTime);

    this.position.copy(newPosition);

    this.updateGroundCheck();
  }

  private checkCollisions(newPosition: THREE.Vector3, deltaTime: number): void {
    if (!this.scene) return;

    const collisionObjects = this.scene.children.filter(child => 
      child.userData.collision !== false && child instanceof THREE.Mesh
    );

    const playerBox = new THREE.Box3();
    const halfHeight = this.currentHeight / 2;
    playerBox.setFromCenterAndSize(
      new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z),
      new THREE.Vector3(this.collisionRadius * 2, this.currentHeight, this.collisionRadius * 2)
    );

    for (const object of collisionObjects) {
      if (!(object instanceof THREE.Mesh)) continue;
      if (object === this.camera) continue;

      const objectBox = new THREE.Box3().setFromObject(object);
      objectBox.expandByScalar(0.05);

      if (playerBox.intersectsBox(objectBox)) {
        const center = new THREE.Vector3();
        objectBox.getCenter(center);

        const diff = newPosition.clone().sub(center);
        diff.y = 0;

        const halfExtents = new THREE.Vector3();
        objectBox.getSize(halfExtents).multiplyScalar(0.5);
        halfExtents.x += this.collisionRadius;
        halfExtents.z += this.collisionRadius;

        if (Math.abs(diff.x) > Math.abs(diff.z)) {
          if (diff.x > 0) {
            newPosition.x = center.x + halfExtents.x;
          } else {
            newPosition.x = center.x - halfExtents.x;
          }
          this.velocity.x = 0;
        } else {
          if (diff.z > 0) {
            newPosition.z = center.z + halfExtents.z;
          } else {
            newPosition.z = center.z - halfExtents.z;
          }
          this.velocity.z = 0;
        }

        playerBox.setFromCenterAndSize(
          new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z),
          new THREE.Vector3(this.collisionRadius * 2, this.currentHeight, this.collisionRadius * 2)
        );
      }
    }
  }

  private updateGroundCheck(): void {
    if (!this.scene) {
      this.onGround = this.position.y <= this.playerHeight;
      if (this.onGround) {
        this.position.y = this.playerHeight;
        this.velocity.y = 0;
      }
      return;
    }

    const rayOrigin = this.position.clone();
    rayOrigin.y += 0.1;

    const raycaster = new THREE.Raycaster(
      rayOrigin,
      new THREE.Vector3(0, -1, 0),
      0,
      this.currentHeight / 2 + 0.2
    );

    const collisionObjects = this.scene.children.filter(child => 
      child.userData.collision !== false && child instanceof THREE.Mesh
    );

    const intersects = raycaster.intersectObjects(collisionObjects, true);

    this.onGround = intersects.length > 0 && intersects[0].distance < this.currentHeight / 2 + 0.15;

    if (this.onGround && this.velocity.y < 0) {
      this.velocity.y = 0;
      const groundY = this.position.y - intersects[0].distance + this.currentHeight / 2;
      if (Math.abs(this.position.y - groundY) > 0.01) {
        this.position.y = groundY;
        this.triggerLandingBob();
      }
    }
  }

  private updateRotation(): void {
    if (!this.camera) return;

    this.rotation.set(this.pitch, this.yaw, 0);
    this.camera.rotation.copy(this.rotation);
  }

  private updateCameraPosition(deltaTime: number): void {
    if (!this.camera) return;

    const targetHeight = this.isCrouching ? this.crouchHeight : this.playerHeight;
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, this.heightTransitionSpeed * deltaTime);

    const cameraOffset = new THREE.Vector3(0, this.currentHeight * 0.95, 0);

    if (this.isAiming) {
      cameraOffset.z += 0.1;
    }

    this.camera.position.lerp(
      this.position.clone().add(cameraOffset),
      1 - Math.exp(-20 * deltaTime)
    );
  }

  private updateHeadBob(deltaTime: number): void {
    if (!this.camera) return;

    const speed = new THREE.Vector2(this.velocity.x, this.velocity.z).length();
    const isMoving = speed > 0.5 && this.onGround;

    if (isMoving) {
      const bobSpeed = this.isSprinting ? this.headBobFrequency * 1.5 : this.headBobFrequency;
      this.headBobTimer += deltaTime * bobSpeed;
      this.headBobIntensity = THREE.MathUtils.lerp(this.headBobIntensity, 1, deltaTime * 10);
    } else {
      this.headBobIntensity = THREE.MathUtils.lerp(this.headBobIntensity, 0, deltaTime * 5);
    }

    const bobX = Math.sin(this.headBobTimer) * this.headBobAmplitude * this.headBobIntensity;
    const bobY = Math.abs(Math.sin(this.headBobTimer * 2)) * this.headBobAmplitude * 0.5 * this.headBobIntensity;

    if (this.isAiming) {
      this.camera.position.x += bobX * 0.3;
      this.camera.position.y += bobY * 0.3;
    } else {
      this.camera.position.x += bobX;
      this.camera.position.y += bobY;
    }
  }

  private updateLandingBob(deltaTime: number): void {
    if (!this.camera) return;

    if (this.landingBobIntensity > 0) {
      this.landingBobTimer += deltaTime * 15;
      this.landingBobIntensity = THREE.MathUtils.lerp(this.landingBobIntensity, 0, deltaTime * 3);

      const bob = Math.sin(this.landingBobTimer) * this.landingBobIntensity * 0.1;
      this.camera.position.y += bob;
      this.camera.rotation.z = bob * 0.5;
    } else {
      this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, 0, deltaTime * 10);
    }
  }

  private triggerLandingBob(): void {
    if (this.velocity.y < -10) {
      this.landingBobIntensity = Math.min(Math.abs(this.velocity.y) * 0.02, 1);
      this.landingBobTimer = 0;
    }
  }

  private updateStepSounds(deltaTime: number): void {
    if (!this.onGround) return;

    const speed = new THREE.Vector2(this.velocity.x, this.velocity.z).length();
    if (speed < 1) return;

    const interval = this.isSprinting ? this.stepInterval * 0.6 : this.isCrouching ? this.stepInterval * 1.5 : this.stepInterval;

    this.stepTimer += deltaTime;
    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      this.emitStepSound();
    }
  }

  private emitStepSound(): void {
    // This would emit an event for the audio system
  }

  public jump(): void {
    if (this.onGround && !this.isCrouching) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }
  }

  public setSprinting(active: boolean): void {
    this.isSprinting = active && !this.isCrouching && this.moveForward && !this.moveBackward;
  }

  public setCrouching(active: boolean): void {
    this.isCrouching = active;
    if (active) {
      this.isSprinting = false;
    }
  }

  public setAiming(active: boolean): void {
    this.isAiming = active;
    if (active) {
      this.isSprinting = false;
    }
  }

  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    if (this.camera) {
      this.camera.position.copy(position);
      this.camera.position.y += this.currentHeight * 0.95;
    }
  }

  public setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, pitch));
  }

  public getCameraPosition(): THREE.Vector3 {
    return this.camera?.position.clone() || this.position.clone();
  }

  public getCameraDirection(): THREE.Vector3 {
    if (!this.camera) return new THREE.Vector3(0, 0, -1);
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  public getRotation(): THREE.Euler {
    return this.rotation.clone();
  }

  public isOnGround(): boolean {
    return this.onGround;
  }

  public isSprintingActive(): boolean {
    return this.isSprinting;
  }

  public isCrouchingActive(): boolean {
    return this.isCrouching;
  }

  public isAimingActive(): boolean {
    return this.isAiming;
  }

  public getCurrentHeight(): number {
    return this.currentHeight;
  }

  public applyImpulse(force: THREE.Vector3): void {
    this.velocity.add(force);
  }

  public setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  public setJumpForce(force: number): void {
    this.jumpForce = force;
  }

  public setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  public dispose(): void {
    this.camera = null;
    this.scene = null;
    this.inputManager = null;
  }
}