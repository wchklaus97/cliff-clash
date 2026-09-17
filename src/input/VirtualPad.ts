import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const PAD_DEPTH = 1000;
/** Viewport at or below this width always shows the pad (mobile). */
const MOBILE_VIEWPORT_MAX = 420;
const BUTTON_RADIUS = 34;
const BUTTON_FILL = 0xffffff;
const BUTTON_FILL_ACTIVE = 0xffee88;
const BUTTON_ALPHA = 0.28;
const BUTTON_ALPHA_ACTIVE = 0.48;

type PadButton = {
  zone: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  held: boolean;
};

export class VirtualPad {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly leftBtn: PadButton;
  private readonly rightBtn: PadButton;
  private readonly jumpBtn: PadButton;
  private readonly lightBtn: PadButton;
  private readonly heavyBtn: PadButton;

  private jumpJustDown = false;
  private lightJustDown = false;
  private heavyJustUp = false;
  private prevHeavyHeld = false;
  private keyboardUsed = false;
  private pointerUsed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(PAD_DEPTH);

    const padY = GAME_HEIGHT - 78;
    this.leftBtn = this.createHoldButton(58, padY, "◀", (held) => {
      this.leftBtn.held = held;
    });
    this.rightBtn = this.createHoldButton(118, padY, "▶", (held) => {
      this.rightBtn.held = held;
    });

    const actionY = padY - 4;
    this.jumpBtn = this.createTapButton(235, actionY, "JMP", () => {
      this.jumpJustDown = true;
    });
    this.lightBtn = this.createTapButton(295, actionY, "LT", () => {
      this.lightJustDown = true;
    });
    this.heavyBtn = this.createHoldButton(350, actionY, "HV", (held) => {
      this.heavyBtn.held = held;
    });

    this.bindKeyboardTracking();
    this.bindResize();
    this.refreshVisibility();
  }

  /** Call once per frame before reading pad state (heavy release edges). */
  frameTick(): void {
    const heavyHeld = this.heavyBtn.held;
    this.heavyJustUp = this.prevHeavyHeld && !heavyHeld;
    this.prevHeavyHeld = heavyHeld;
    this.refreshVisibility();
  }

  isLeftDown(): boolean {
    return this.leftBtn.held;
  }

  isRightDown(): boolean {
    return this.rightBtn.held;
  }

  consumeJump(): boolean {
    const pressed = this.jumpJustDown;
    this.jumpJustDown = false;
    return pressed;
  }

  consumeLight(): boolean {
    const pressed = this.lightJustDown;
    this.lightJustDown = false;
    return pressed;
  }

  isHeavyDown(): boolean {
    return this.heavyBtn.held;
  }

  consumeHeavyUp(): boolean {
    const released = this.heavyJustUp;
    this.heavyJustUp = false;
    return released;
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.refreshVisibility, this);
    this.container.destroy(true);
  }

  private createHoldButton(
    x: number,
    y: number,
    text: string,
    onHold: (held: boolean) => void,
  ): PadButton {
    const zone = this.scene.add
      .circle(x, y, BUTTON_RADIUS, BUTTON_FILL, BUTTON_ALPHA)
      .setStrokeStyle(2, 0x000000, 0.35);
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#1a1a1a",
      })
      .setOrigin(0.5);

    zone.setInteractive({ useHandCursor: false });
    zone.on("pointerdown", () => {
      this.pointerUsed = true;
      onHold(true);
      zone.setFillStyle(BUTTON_FILL_ACTIVE, BUTTON_ALPHA_ACTIVE);
    });
    zone.on("pointerup", () => {
      onHold(false);
      zone.setFillStyle(BUTTON_FILL, BUTTON_ALPHA);
    });
    zone.on("pointerout", () => {
      onHold(false);
      zone.setFillStyle(BUTTON_FILL, BUTTON_ALPHA);
    });

    this.container.add([zone, label]);
    return { zone, label, held: false };
  }

  private createTapButton(
    x: number,
    y: number,
    text: string,
    onTap: () => void,
  ): PadButton {
    const zone = this.scene.add
      .circle(x, y, BUTTON_RADIUS, BUTTON_FILL, BUTTON_ALPHA)
      .setStrokeStyle(2, 0x000000, 0.35);
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#1a1a1a",
      })
      .setOrigin(0.5);

    zone.setInteractive({ useHandCursor: false });
    zone.on("pointerdown", () => {
      this.pointerUsed = true;
      onTap();
      zone.setFillStyle(BUTTON_FILL_ACTIVE, BUTTON_ALPHA_ACTIVE);
    });
    zone.on("pointerup", () => {
      zone.setFillStyle(BUTTON_FILL, BUTTON_ALPHA);
    });
    zone.on("pointerout", () => {
      zone.setFillStyle(BUTTON_FILL, BUTTON_ALPHA);
    });

    this.container.add([zone, label]);
    return { zone, label, held: false };
  }

  private bindKeyboardTracking(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    const markKeyboard = (): void => {
      this.keyboardUsed = true;
      this.refreshVisibility();
    };

    kb.on("keydown", markKeyboard);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off("keydown", markKeyboard);
    });
  }

  private bindResize(): void {
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.refreshVisibility, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.refreshVisibility, this);
    });
  }

  private refreshVisibility = (): void => {
    const viewportW = typeof window !== "undefined" ? window.innerWidth : GAME_WIDTH;
    const mobileViewport = viewportW <= MOBILE_VIEWPORT_MAX;
    const hideOnDesktop = !mobileViewport && this.keyboardUsed && !this.pointerUsed;

    if (hideOnDesktop) {
      this.container.setAlpha(0);
      this.container.setScale(0.6);
      this.setInteractiveEnabled(false);
      this.resetHeldState();
      return;
    }

    this.container.setAlpha(1);
    this.container.setScale(1);
    this.setInteractiveEnabled(true);
  };

  private setInteractiveEnabled(enabled: boolean): void {
    for (const btn of [
      this.leftBtn,
      this.rightBtn,
      this.jumpBtn,
      this.lightBtn,
      this.heavyBtn,
    ]) {
      if (enabled) {
        btn.zone.setInteractive({ useHandCursor: false });
      } else {
        btn.zone.disableInteractive();
      }
    }
  }

  private resetHeldState(): void {
    for (const btn of [this.leftBtn, this.rightBtn, this.heavyBtn]) {
      btn.held = false;
      btn.zone.setFillStyle(BUTTON_FILL, BUTTON_ALPHA);
    }
    this.jumpJustDown = false;
    this.lightJustDown = false;
    this.heavyJustUp = false;
    this.prevHeavyHeld = false;
  }
}
