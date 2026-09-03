import * as THREE from 'three';
import { EventEmitter } from './EventEmitter';

export class InputManager extends EventEmitter {
  private keys: Map<string, boolean> = new Map();
  private mouseButtons: Map<number, boolean> = new Map();
  private mousePosition: THREE.Vector2 = new THREE.Vector2();
  private mouseDelta: THREE.Vector2 = new THREE.Vector2();
  private pointerLocked: boolean = false;
  private sensitivity: number = 0.002;
  private gamepadIndex: number = -1;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundContextMenu: (e: MouseEvent) => void;
  private boundWheel: (e: WheelEvent) => void;
  private boundGamepadConnected: (e: GamepadEvent) => void;
  private boundGamepadDisconnected: (e: GamepadEvent) => void;

  constructor() {
    super();
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);
    this.boundWheel = this.handleWheel.bind(this);
    this.boundGamepadConnected = this.handleGamepadConnected.bind(this);
    this.boundGamepadDisconnected = this.handleGamepadDisconnected.bind(this);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('contextmenu', this.boundContextMenu);
    window.addEventListener('wheel', this.boundWheel, { passive: false });
    window.addEventListener('gamepadconnected', this.boundGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.boundGamepadDisconnected);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    this.keys.set(e.code, true);

    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.emit('moveForward', true); break;
      case 'KeyS': case 'ArrowDown': this.emit('moveBackward', true); break;
      case 'KeyA': case 'ArrowLeft': this.emit('moveLeft', true); break;
      case 'KeyD': case 'ArrowRight': this.emit('moveRight', true); break;
      case 'Space': this.emit('jump'); break;
      case 'ShiftLeft': this.emit('sprint', true); break;
      case 'ControlLeft': this.emit('crouch', true); break;
      case 'KeyR': this.emit('reload'); break;
      case 'KeyE': this.emit('interact'); break;
      case 'KeyF': this.emit('flashlight'); break;
      case 'KeyQ': this.emit('quickMelee'); break;
      case 'KeyG': this.emit('throwGrenade'); break;
      case 'KeyC': this.emit('inspectWeapon'); break;
      case 'KeyV': this.emit('toggleFireMode'); break;
      case 'KeyX': this.emit('toggleLaser'); break;
      case 'KeyZ': this.emit('toggleNightVision'); break;
      case 'KeyT': this.emit('useGadget'); break;
      case 'KeyB': this.emit('openInventory'); break;
      case 'KeyM': this.emit('openMap'); break;
      case 'KeyL': this.emit('toggleFlashlight'); break;
      case 'Escape': this.emit('pause'); break;
      case 'Tab': this.emit('showScoreboard'); break;
      case 'Digit1': this.emit('weaponSwitch', 0); break;
      case 'Digit2': this.emit('weaponSwitch', 1); break;
      case 'Digit3': this.emit('weaponSwitch', 2); break;
      case 'Digit4': this.emit('weaponSwitch', 3); break;
      case 'Digit5': this.emit('weaponSwitch', 4); break;
      case 'Digit6': this.emit('weaponSwitch', 5); break;
      case 'Digit7': this.emit('weaponSwitch', 6); break;
      case 'Digit8': this.emit('weaponSwitch', 7); break;
      case 'Digit9': this.emit('weaponSwitch', 8); break;
      case 'Digit0': this.emit('weaponSwitch', 9); break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.set(e.code, false);

    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.emit('moveForward', false); break;
      case 'KeyS': case 'ArrowDown': this.emit('moveBackward', false); break;
      case 'KeyA': case 'ArrowLeft': this.emit('moveLeft', false); break;
      case 'KeyD': case 'ArrowRight': this.emit('moveRight', false); break;
      case 'ShiftLeft': this.emit('sprint', false); break;
      case 'ControlLeft': this.emit('crouch', false); break;
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.mouseButtons.set(e.button, true);

    if (e.button === 0) {
      this.emit('shootStart');
      if (this.pointerLocked) {
        this.emit('shoot');
      }
    } else if (e.button === 1) {
      this.emit('aim', true);
    } else if (e.button === 2) {
      this.emit('aim', true);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    this.mouseButtons.set(e.button, false);

    if (e.button === 0) {
      this.emit('shootEnd');
    } else if (e.button === 1 || e.button === 2) {
      this.emit('aim', false);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.pointerLocked) {
      this.mouseDelta.x = e.movementX;
      this.mouseDelta.y = e.movementY;
      this.emit('look', this.mouseDelta.x * this.sensitivity, this.mouseDelta.y * this.sensitivity);
    } else {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  private handleWheel(e: WheelEvent): void {
    if (this.pointerLocked) {
      e.preventDefault();
      if (e.deltaY > 0) {
        this.emit('weaponSwitchNext');
      } else {
        this.emit('weaponSwitchPrev');
      }
    }
  }

  private handleGamepadConnected(e: GamepadEvent): void {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].index === e.gamepad.index) {
        this.gamepadIndex = i;
        this.emit('gamepadConnected', e.gamepad);
        break;
      }
    }
  }

  private handleGamepadDisconnected(e: GamepadEvent): void {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = -1;
      this.emit('gamepadDisconnected', e.gamepad);
    }
  }

  public updateGamepad(): void {
    if (this.gamepadIndex === -1) return;
    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) return;

    const deadzone = 0.1;

    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];
    const rightStickX = gamepad.axes[2];
    const rightStickY = gamepad.axes[3];

    if (Math.abs(leftStickX) > deadzone) {
      this.emit('moveRight', leftStickX > 0);
      this.emit('moveLeft', leftStickX < 0);
    }
    if (Math.abs(leftStickY) > deadzone) {
      this.emit('moveForward', leftStickY < 0);
      this.emit('moveBackward', leftStickY > 0);
    }
    if (Math.abs(rightStickX) > deadzone) {
      this.emit('look', rightStickX * this.sensitivity * 2, 0);
    }
    if (Math.abs(rightStickY) > deadzone) {
      this.emit('look', 0, rightStickY * this.sensitivity * 2);
    }

    const buttons = gamepad.buttons;
    if (buttons[0].pressed) this.emit('shoot');
    if (buttons[1].pressed) this.emit('jump');
    if (buttons[2].pressed) this.emit('crouch', true);
    if (buttons[3].pressed) this.emit('interact');
    if (buttons[4].pressed) this.emit('aim', true);
    if (buttons[5].pressed) this.emit('shoot');
    if (buttons[6].pressed) this.emit('throwGrenade');
    if (buttons[7].pressed) this.emit('pause');
    if (buttons[8].pressed) this.emit('toggleFlashlight');
    if (buttons[9].pressed) this.emit('inspectWeapon');
    if (buttons[12].pressed) this.emit('moveForward', true);
    if (buttons[13].pressed) this.emit('moveBackward', true);
    if (buttons[14].pressed) this.emit('moveLeft', true);
    if (buttons[15].pressed) this.emit('moveRight', true);
  }

  public isKeyPressed(code: string): boolean {
    return this.keys.get(code) === true;
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.get(button) === true;
  }

  public getMouseDelta(): THREE.Vector2 {
    return this.mouseDelta.clone();
  }

  public getMousePosition(): THREE.Vector2 {
    return this.mousePosition.clone();
  }

  public isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  public setPointerLock(locked: boolean): void {
    this.pointerLocked = locked;
  }

  public setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }

  public getSensitivity(): number {
    return this.sensitivity;
  }

  public requestPointerLock(): void {
    document.body.requestPointerLock?.();
  }

  public exitPointerLock(): void {
    document.exitPointerLock?.();
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('contextmenu', this.boundContextMenu);
    window.removeEventListener('wheel', this.boundWheel);
    window.removeEventListener('gamepadconnected', this.boundGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.boundGamepadDisconnected);
    this.removeAllListeners();
  }
}