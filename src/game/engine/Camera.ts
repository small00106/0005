import { lerp, clamp } from '../../utils/math'
import { GAME_CONFIG } from '../../data/config'

export class Camera {
  x: number = 0
  y: number = 0
  targetX: number = 0
  targetY: number = 0
  shake: number = 0
  shakeIntensity: number = 0
  zoom: number = 1
  targetZoom: number = 1
  carScreenY: number = 0.75

  constructor() {
    this.carScreenY = 0.72
  }

  follow(targetX: number, targetY: number, speed: number, isNitro: boolean): void {
    const nitroZoom = isNitro ? 1.1 : 1.0
    this.targetX = targetX
    this.targetY = targetY
    this.targetZoom = nitroZoom
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
  }

  update(dt: number): void {
    const smooth = 0.12
    this.x = lerp(this.x, this.targetX, smooth)
    this.y = lerp(this.y, this.targetY, smooth)
    this.zoom = lerp(this.zoom, this.targetZoom, smooth)

    if (this.shakeIntensity > 0.05) {
      this.shake = this.shakeIntensity
      this.shakeIntensity *= 0.88
    } else {
      this.shake = 0
      this.shakeIntensity = 0
    }
  }

  apply(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const screenCarY = canvasHeight * this.carScreenY
    
    ctx.save()
    
    if (this.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shake * 8,
        (Math.random() - 0.5) * this.shake * 8
      )
    }

    ctx.translate(canvasWidth / 2, screenCarY)
    ctx.scale(this.zoom, this.zoom)
    ctx.translate(-this.x, -this.y)
  }

  reset(x: number, y: number): void {
    this.x = x
    this.y = y
    this.targetX = x
    this.targetY = y
    this.zoom = 1
    this.targetZoom = 1
    this.shake = 0
    this.shakeIntensity = 0
  }

  getWorldToScreen(worldX: number, worldY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    const screenCarY = canvasHeight * this.carScreenY
    const dx = (worldX - this.x) * this.zoom
    const dy = (worldY - this.y) * this.zoom
    return {
      x: canvasWidth / 2 + dx,
      y: screenCarY + dy
    }
  }
}
