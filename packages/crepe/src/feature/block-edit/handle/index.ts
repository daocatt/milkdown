import type { PluginView } from '@milkdown/prose/state'
import { TextSelection } from '@milkdown/prose/state'
import { BlockProvider, block } from '@milkdown/plugin-block'
import type { Ctx } from '@milkdown/ctx'
import type { AtomicoThis } from 'atomico/types/dom'
import { editorViewCtx } from '@milkdown/core'
import { paragraphSchema } from '@milkdown/preset-commonmark'
import { menuAPI } from '../menu'
import { defIfNotExists } from '../../../utils'
import type { BlockHandleProps } from './component'
import { BlockHandleElement } from './component'

export class BlockHandleView implements PluginView {
  #content: AtomicoThis<BlockHandleProps>
  #provider: BlockProvider
  #ctx: Ctx

  constructor(ctx: Ctx) {
    this.#ctx = ctx
    const content = new BlockHandleElement()
    this.#content = content
    this.#content.onAdd = this.onAdd
    this.#provider = new BlockProvider({
      ctx,
      content,
    })
    this.update()
  }

  update = () => {
    this.#provider.update()
  }

  destroy = () => {
    this.#provider.destroy()
    this.#content.remove()
  }

  onAdd = () => {
    const ctx = this.#ctx
    const view = ctx.get(editorViewCtx)
    if (!view.hasFocus())
      view.focus()

    const { state, dispatch } = view
    const active = this.#provider.activeNode
    if (!active)
      return
    const pos = active.$pos
    const isNoneTextBlock = ['hr', 'image-block'].includes(active.node.type.name)
    const nodeSize = isNoneTextBlock ? active.node.nodeSize : active.node.content.size
    const side = pos.pos + nodeSize + (['blockquote'].includes(pos.parent.type.name) ? 1 : 0)
    const offset
      = ['blockquote'].includes(pos.parent.type.name) ? 1 : isNoneTextBlock ? 1 : 2
    let tr = state.tr.insert(side, paragraphSchema.type(ctx).create())
    tr = tr.setSelection(TextSelection.create(tr.doc, side + offset))
    dispatch(tr.scrollIntoView())

    this.#provider.hide()
    ctx.get(menuAPI.key).show(tr.selection.from)
  }
}

defIfNotExists('milkdown-block-handle', BlockHandleElement)
export function configureBlockHandle(ctx: Ctx) {
  ctx.set(block.key, {
    view: () => new BlockHandleView(ctx),
  })
}
