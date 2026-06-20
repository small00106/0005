import type { InputState } from '../../types'

export class InputManager {
  private keys: Set<string> = new Set()
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  }
  private keyMap: Record<string, keyof InputState> = {
    'ArrowUp': 'up',
    'KeyW': 'up',
    'w': 'up',
    'W': 'up',
    'ArrowDown': 'down',
    'KeyS': 'down',
    's': 'down',
    'S': 'down',
    'ArrowLeft': 'left',
    'KeyA': 'left',
    'a': 'left',
    'A': 'left',
    'ArrowRight': 'right',
    'KeyD': 'right',
    'd': 'right',
    'D': 'right',
    'Space': 'drift',
    ' ': 'drift',
    'ShiftLeft': 'nitro',
    'ShiftRight': 'nitro',
    'Shift': 'nitro',
  }

  constructor() {
    this.bindEvents()
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown, true)
    window.addEventListener('keyup', this.handleKeyUp, true)
    window.addEventListener('blur', this.handleBlur)
  }

  private handleBlur = (): void => {
    this.keys.clear()
    this.state.up = false
    this.state.down = false
    this.state.left = false
    this.state.right = false
    this.state.drift = false
    this.state.nitro = false
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code
    const key = e.key

    this.keys.add(code)
    this.keys.add(key)

    let mapped: keyof InputState | undefined = this.keyMap[code]
    if (!mapped) {
      mapped = this.keyMap[key]
    }

    if (mapped) {
      this.state[mapped] = true
      if ([
        'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
        'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'
      ].includes(code) || [' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(key)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    const code = e.code
    const key = e.key

    this.keys.delete(code)
    this.keys.delete(key)

    let mapped: keyof InputState | undefined = this.keyMap[code]
    if (!mapped) {
      mapped = this.keyMap[key]
    }

    if (mapped) {
      let stillPressed = false
      for (const k of this.keys) {
        if (this.keyMap[k] === mapped) {
          stillPressed = true
          break
        }
      }
      if (!stillPressed) {
        this.state[mapped] = false
      }
    }
  }

  getState(): InputState {
    return { ...this.state }
  }

  isPressed(codeOrKey: string): boolean {
    return this.keys.has(codeOrKey)
  }

  setVirtualInput(action: keyof InputState, value: boolean): void {
    this.state[action] = value
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown, true)
    window.removeEventListener('keyup', this.handleKeyUp, true)
    window.removeEventListener('blur', this.handleBlur)
  }
}
