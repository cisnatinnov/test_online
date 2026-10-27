import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import enGB from '../../locales/en-GB.json'
import RockPaperScissors from './RockPaperScissors.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
let wrapper
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })
function setup() {
  wrapper = mount(RockPaperScissors, { global: { plugins: [createI18n({ legacy: false, locale: 'en-GB', messages: { 'en-GB': enGB } })] } })
  return wrapper
}
const score = name => wrapper.get(`[data-testid="${name}-score"]`).text()
const pick = name => wrapper.get(`button[aria-label="${name}"]`).trigger('click')

describe('first to five match', () => {
  it.each([
    ['Rock', 'player', 'You win!'],
    ['Paper', 'computer', 'Computer wins!'],
  ])('ends when %s produces the fifth %s win and blocks more rounds', async (choice, winner, result) => {
    vi.spyOn(Math, 'random').mockReturnValue(.99) // Computer chooses scissors.
    setup()
    for (let round = 0; round < 4; round++) await pick(choice)
    expect(score(winner)).toBe('4')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    await pick(choice)
    expect(score(winner)).toBe('5')
    expect(wrapper.get('[role="status"]').text()).toBe('Game Over! ' + result)
    for (const button of wrapper.findAll('.choice-button')) expect(button.attributes('disabled')).toBeDefined()
    await pick(choice)
    expect(score(winner)).toBe('5')
  })

  it('does not end the match when draws reach five', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // Rock vs rock.
    setup()
    for (let round = 0; round < 6; round++) await pick('Rock')
    expect(score('draw')).toBe('6')
    expect(score('player')).toBe('0')
    expect(score('computer')).toBe('0')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.findAll('.choice-button').every(button => !button.element.disabled)).toBe(true)
  })

  it('New Game resets all scores and round feedback and allows another match', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    setup()
    await pick('Rock') // Include a draw so reset covers every counter.
    random.mockReturnValue(.99)
    for (let round = 0; round < 5; round++) await pick('Rock')
    const restart = wrapper.findAll('button').find(button => button.text() === 'New Game')
    expect(restart).toBeDefined()
    await restart.trigger('click')
    for (const name of ['player', 'draw', 'computer']) expect(score(name)).toBe('0')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('You win!')
    expect(wrapper.text()).toContain('Rock / Paper / Scissors')
    expect(wrapper.findAll('.choice-button').every(button => !button.element.disabled)).toBe(true)
    await pick('Rock')
    expect(score('player')).toBe('1')
  })
})
