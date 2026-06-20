import type { Particle } from '../../types'
import { GAME_CONFIG } from '../../data/config'
import { randomRange, randomChoice } from '../../utils/math'

const SMOKE_COLORS = ['#FF2D95', '#00D4FF', '#8B5CF6', '#FFE600', '#00FF88']

export class ParticleSystem {
  private particles: Particle[] = []
  private pool: Particle[] = []

  constructor() {
    for (let i = 0; i < GAME_CONFIG.PARTICLE_POOL_SIZE; i++) {
      this.pool.push(this.createEmptyParticle())
    }
  }

  private createEmptyParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 0,
      color: '#ffffff',
      type: 'smoke',
    }
  }

  private getFromPool(): Particle | null {
    return this.pool.pop() || null
  }

  private returnToPool(p: Particle): void {
    p.life = 0
    this.pool.push(p)
  }

  emitSmoke(x: number, y: number, angle: number, count: number = 2): void {
    for (let i = 0; i < count; i++) {
      const p = this.getFromPool()
      if (!p) return

      const spread = randomRange(-0.3, 0.3)
      const speed = randomRange(0.5, 2)
      
      p.x = x + randomRange(-8, 8)
      p.y = y + randomRange(-4, 4)
      p.vx = -Math.cos(angle + spread) * speed + randomRange(-0.5, 0.5)
      p.vy = -Math.sin(angle + spread) * speed + randomRange(-0.3, 0.3)
      p.life = randomRange(20, 40)
      p.maxLife = p.life
      p.size = randomRange(6, 16)
      p.color = randomChoice(SMOKE_COLORS)
      p.type = 'smoke'

      this.particles.push(p)
    }
  }

  emitNitroFlame(x: number, y: number, angle: number, count: number = 3): void {
    for (let i = 0; i < count; i++) {
      const p = this.getFromPool()
      if (!p) return

      const spread = randomRange(-0.15, 0.15)
      const speed = randomRange(3, 6)
      
      p.x = x + randomRange(-6, 6)
      p.y = y
      p.vx = -Math.cos(angle + spread) * speed
      p.vy = -Math.sin(angle + spread) * speed + randomRange(-0.2, 0.2)
      p.life = randomRange(8, 18)
      p.maxLife = p.life
      p.size = randomRange(8, 20)
      p.color = Math.random() > 0.5 ? '#00D4FF' : '#00FF88'
      p.type = 'flame'

      this.particles.push(p)
    }
  }

  emitSpeedTrail(x: number, y: number, angle: number): void {
    const p = this.getFromPool()
    if (!p) return

    p.x = x + randomRange(-4, 4)
    p.y = y + randomRange(-2, 2)
    p.vx = -Math.cos(angle) * randomRange(1, 2)
    p.vy = -Math.sin(angle) * randomRange(1, 2)
    p.life = randomRange(10, 20)
    p.maxLife = p.life
    p.size = randomRange(4, 10)
    p.color = '#00D4FF'
    p.type = 'trail'

    this.particles.push(p)
  }

  emitSparks(x: number, y: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const p = this.getFromPool()
      if (!p) return

      const angle = randomRange(0, Math.PI * 2)
      const speed = randomRange(1, 4)
      
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = randomRange(5, 15)
      p.maxLife = p.life
      p.size = randomRange(2, 5)
      p.color = Math.random() > 0.5 ? '#FFE600' : '#FF2D95'
      p.type = 'spark'

      this.particles.push(p)
    }
  }

  emitRain(count: number, canvasWidth: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.getFromPool()
      if (!p) return

      p.x = randomRange(0, canvasWidth)
      p.y = randomRange(-50, 0)
      p.vx = randomRange(-1, 1)
      p.vy = randomRange(8, 15)
      p.life = 60
      p.maxLife = 60
      p.size = randomRange(1, 2)
      p.color = 'rgba(100, 150, 255, 0.6)'
      p.type = 'rain'

      this.particles.push(p)
    }
  }

  update(dt: number, canvasWidth: number, canvasHeight: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt * 60

      if (p.type === 'smoke') {
        p.vx *= 0.98
        p.vy *= 0.98
        p.size += 0.1
      } else if (p.type === 'flame') {
        p.vx *= 0.95
        p.vy *= 0.95
      } else if (p.type === 'rain') {
        if (p.y > canvasHeight) {
          p.x = randomRange(0, canvasWidth)
          p.y = randomRange(-50, 0)
        }
      }

      p.x += p.vx * dt * 60
      p.y += p.vy * dt * 60

      if (p.life <= 0) {
        this.returnToPool(p)
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.save()

      if (p.type === 'smoke') {
        ctx.globalAlpha = alpha * 0.6
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'flame') {
        ctx.globalAlpha = alpha * 0.9
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = alpha * 0.5
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.size * 0.3, p.size * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'trail') {
        ctx.globalAlpha = alpha * 0.4
        ctx.strokeStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.stroke()
      } else if (p.type === 'spark') {
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      } else if (p.type === 'rain') {
        ctx.globalAlpha = 0.6
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.returnToPool(p)
    }
    this.particles.length = 0
  }
}
