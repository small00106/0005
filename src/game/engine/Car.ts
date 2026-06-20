import type { InputState } from '../../types'
import { GAME_CONFIG } from '../../data/config'
import { clamp, normalizeAngle, lerp } from '../../utils/math'

export interface CarState {
  x: number
  y: number
  angle: number
  speed: number
  nitro: number
  drifting: boolean
  driftAngle: number
  usingNitro: boolean
  wheels: { x: number; y: number; skidding: boolean }[]
}

export class Car {
  x: number = 0
  y: number = 0
  angle: number = 0
  speed: number = 0
  maxSpeed: number = GAME_CONFIG.MAX_SPEED
  acceleration: number = GAME_CONFIG.ACCELERATION
  brakePower: number = GAME_CONFIG.BRAKE_POWER
  nitro: number = GAME_CONFIG.MAX_NITRO
  maxNitro: number = GAME_CONFIG.MAX_NITRO
  drifting: boolean = false
  driftAngle: number = 0
  usingNitro: boolean = false
  width: number = GAME_CONFIG.CAR_WIDTH
  height: number = GAME_CONFIG.CAR_HEIGHT
  wheels: { x: number; y: number; skidding: boolean }[] = []
  totalDistance: number = 0

  private nitroRegenTimer: number = 0

  constructor(x: number = 0, y: number = 0, angle: number = 0) {
    this.x = x
    this.y = y
    this.angle = angle
    this.initWheels()
  }

  private initWheels(): void {
    const hw = this.width / 2 - 4
    const hh = this.height / 2 - 8
    this.wheels = [
      { x: -hw, y: -hh + 10, skidding: false },
      { x: hw, y: -hh + 10, skidding: false },
      { x: -hw, y: hh - 10, skidding: false },
      { x: hw, y: hh - 10, skidding: false },
    ]
  }

  getWheelWorldPositions(): { x: number; y: number; skidding: boolean }[] {
    return this.wheels.map(w => {
      const cos = Math.cos(this.angle)
      const sin = Math.sin(this.angle)
      return {
        x: this.x + w.x * cos - w.y * sin,
        y: this.y + w.x * sin + w.y * cos,
        skidding: w.skidding,
      }
    })
  }

  update(dt: number, input: InputState): void {
    const effectiveMaxSpeed = input.nitro && this.nitro > 0
      ? this.maxSpeed * GAME_CONFIG.NITRO_MULTIPLIER
      : this.maxSpeed

    this.usingNitro = input.nitro && this.nitro > 0 && input.up

    if (input.up) {
      const accel = this.usingNitro
        ? this.acceleration * GAME_CONFIG.NITRO_MULTIPLIER
        : this.acceleration
      this.speed = clamp(this.speed + accel * dt * 60, 0, effectiveMaxSpeed)
    } else if (input.down) {
      this.speed = clamp(this.speed - this.brakePower * dt * 60, -this.maxSpeed * 0.3, this.maxSpeed)
    } else {
      this.speed *= this.drifting ? GAME_CONFIG.DRIFT_FRICTION : GAME_CONFIG.FRICTION
      if (Math.abs(this.speed) < 0.01) this.speed = 0
    }

    if (this.usingNitro) {
      this.nitro = clamp(this.nitro - GAME_CONFIG.NITRO_CONSUMPTION * dt * 60, 0, this.maxNitro)
      this.nitroRegenTimer = 0
    } else {
      this.nitroRegenTimer += dt
      if (this.nitroRegenTimer > 0.5) {
        this.nitro = clamp(this.nitro + GAME_CONFIG.NITRO_REGEN * dt * 60, 0, this.maxNitro)
      }
    }

    const speedFactor = Math.min(Math.abs(this.speed) / this.maxSpeed, 1)
    this.drifting = input.drift && Math.abs(this.speed) > this.maxSpeed * 0.3

    let turnAmount = 0
    const baseTurn = GAME_CONFIG.TURN_SPEED * speedFactor
    if (input.left) turnAmount -= baseTurn
    if (input.right) turnAmount += baseTurn

    if (this.drifting) {
      turnAmount *= GAME_CONFIG.DRIFT_TURN_MULTIPLIER
      this.driftAngle = lerp(this.driftAngle, turnAmount * 3, 0.15)
    } else {
      this.driftAngle = lerp(this.driftAngle, 0, 0.1)
    }

    this.angle = normalizeAngle(this.angle + turnAmount * dt * 60)

    const moveAngle = this.angle + this.driftAngle * 0.3
    const dx = Math.cos(moveAngle) * this.speed * dt * 60
    const dy = Math.sin(moveAngle) * this.speed * dt * 60
    this.x += dx
    this.y += dy

    this.totalDistance += Math.sqrt(dx * dx + dy * dy)

    for (const wheel of this.wheels) {
      wheel.skidding = this.drifting || (input.down && Math.abs(this.speed) > this.maxSpeed * 0.4)
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle + this.driftAngle * 0.2)

    if (this.usingNitro) {
      ctx.shadowColor = '#00D4FF'
      ctx.shadowBlur = 30
    } else if (this.drifting) {
      ctx.shadowColor = '#FF2D95'
      ctx.shadowBlur = 15
    } else {
      ctx.shadowColor = '#8B5CF6'
      ctx.shadowBlur = 10
    }

    const hw = this.width / 2
    const hh = this.height / 2

    ctx.fillStyle = '#2a2a4a'
    this.drawPixelRect(ctx, -hw + 4, -hh, this.width - 8, 6)

    const bodyGradient = ctx.createLinearGradient(0, -hh, 0, hh)
    bodyGradient.addColorStop(0, '#FF2D95')
    bodyGradient.addColorStop(0.5, '#8B5CF6')
    bodyGradient.addColorStop(1, '#00D4FF')
    ctx.fillStyle = bodyGradient
    this.drawPixelRect(ctx, -hw + 2, -hh + 6, this.width - 4, this.height - 14)

    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    this.drawPixelRect(ctx, -hw + 4, -hh + 8, 4, this.height - 20)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    this.drawPixelRect(ctx, hw - 8, -hh + 8, 4, this.height - 20)

    ctx.fillStyle = 'rgba(0, 212, 255, 0.6)'
    this.drawPixelRect(ctx, -hw + 8, -hh + 12, this.width - 16, 18)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    this.drawPixelRect(ctx, -hw + 10, -hh + 14, 6, 8)

    ctx.fillStyle = '#1a1a2e'
    this.drawPixelRect(ctx, -hw, -hh + 10, 6, 14)
    this.drawPixelRect(ctx, hw - 6, -hh + 10, 6, 14)
    this.drawPixelRect(ctx, -hw, hh - 22, 6, 14)
    this.drawPixelRect(ctx, hw - 6, hh - 22, 6, 14)

    if (this.usingNitro) {
      ctx.fillStyle = '#00D4FF'
      ctx.shadowColor = '#00D4FF'
      ctx.shadowBlur = 20
    } else {
      ctx.fillStyle = '#FF2D95'
      ctx.shadowColor = '#FF2D95'
      ctx.shadowBlur = 10
    }
    this.drawPixelRect(ctx, -hw + 6, hh - 8, 8, 4)
    this.drawPixelRect(ctx, hw - 14, hh - 8, 8, 4)

    ctx.fillStyle = '#FFE600'
    ctx.shadowColor = '#FFE600'
    ctx.shadowBlur = 15
    this.drawPixelRect(ctx, -hw + 8, -hh + 2, 8, 4)
    this.drawPixelRect(ctx, hw - 16, -hh + 2, 8, 4)

    ctx.restore()
  }

  private drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }

  getState(): CarState {
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      speed: this.speed,
      nitro: this.nitro,
      drifting: this.drifting,
      driftAngle: this.driftAngle,
      usingNitro: this.usingNitro,
      wheels: this.getWheelWorldPositions(),
    }
  }

  reset(x: number = 0, y: number = 0, angle: number = 0): void {
    this.x = x
    this.y = y
    this.angle = angle
    this.speed = 0
    this.nitro = this.maxNitro
    this.drifting = false
    this.driftAngle = 0
    this.usingNitro = false
    this.totalDistance = 0
  }
}
