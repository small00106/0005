import { lerp, clamp } from '../../utils/math'
import { GAME_CONFIG } from '../../data/config'

export class Camera {
  x: number = 0
  y: number = 0
  targetX: number = 0
  targetY: number = 0
  angle: number = 0
  targetAngle: number = 0
  shake: number = 0
  shakeIntensity: number = 0
  zoom: number = 1
  targetZoom: number = 1
  offsetX: number = 0
  offsetY: number = 150

  constructor() {}

  follow(targetX: number, targetY: number, targetAngle: number, speed: number, isNitro: boolean): void {
    const speedFactor = speed / GAME_CONFIG.MAX_SPEED
    const followDistance = 100 + speedFactor * 80
    const nitroZoom = isNitro ? 1.15 : 1.0
    
    this.targetX = targetX - Math.cos(targetAngle) * followDistance
    this.targetY = targetY - Math.sin(targetAngle) * followDistance
    this.targetAngle = targetAngle
    this.targetZoom = nitroZoom
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
  }

  update(dt: number): void {
    const smooth = 0.1
    this.x = lerp(this.x, this.targetX, smooth)
    this.y = lerp(this.y, this.targetY, smooth)
    this.angle = lerp(this.angle, this.targetAngle, smooth * 0.5)
    this.zoom = lerp(this.zoom, this.targetZoom, smooth)

    if (this.shakeIntensity > 0.1) {
      this.shake = this.shakeIntensity
      this.shakeIntensity *= 0.9
    } else {
      this.shake = 0
      this.shakeIntensity = 0
    }
  }

  apply(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.translate(canvasWidth / 2, canvasHeight / 2)
    ctx.scale(this.zoom, this.zoom)
    ctx.rotate(-this.angle - Math.PI / 2)
    
    if (this.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shake * 10,
        (Math.random() - 0.5) * this.shake * 10
      )
    }
    
    ctx.translate(-this.x, -this.y - this.offsetY)
  }

  reset(x: number, y: number, angle: number): void {
    this.x = x
    this.y = y
    this.targetX = x
    this.targetY = y
    this.angle = angle
    this.targetAngle = angle
    this.zoom = 1
    this.targetZoom = 1
    this.shake = 0
    this.shakeIntensity = 0
  }

  getScreenPosition(worldX: number, worldY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    const dx = worldX - this.x
    const dy = worldY - this.y - this.offsetY
    const cos = Math.cos(this.angle + Math.PI / 2)
    const sin = Math.sin(this.angle + Math.PI / 2)
    const rx = dx * cos + dy * sin
    const ry = -dx * sin + dy * cos
    return {
      x: canvasWidth / 2 + rx * this.zoom,
      y: canvasHeight / 2 + ry * this.zoom
    }
  }
}
