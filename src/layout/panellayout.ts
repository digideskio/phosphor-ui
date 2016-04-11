/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator
} from 'phosphor-core/lib/algorithm/iteration';

import {
  move
} from 'phosphor-core/lib/algorithm/mutation';

import {
  indexOf
} from 'phosphor-core/lib/algorithm/searching';

import {
  ISequence
} from 'phosphor-core/lib/algorithm/sequence';

import {
  Vector
} from 'phosphor-core/lib/collections/vector';

import {
  Message, sendMessage
} from 'phosphor-core/lib/patterns/messaging';

import {
  Layout
} from './layout';

import {
  ChildMessage, WidgetMessage
} from '../widgets/messages';

import {
  Widget
} from '../widgets/widget';


/**
 * A concrete layout implementation suitable for many use cases.
 *
 * #### Notes
 * This class is suitable as a base class for implementing a variety of
 * layouts, but can also be used directly with standard CSS to layout a
 * collection of widgets.
 */
export
class PanelLayout extends Layout {
  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will dispose all child widgets in the layout.
   *
   * All reimplementations should call the superclass method.
   *
   * This method is called automatically when the parent is disposed.
   */
  dispose(): void {
    disposeChildren(this._children);
    super.dispose();
  }

  /**
   * A read-only sequence of the child widgets in the layout.
   *
   * #### Notes
   * This is a read-only property.
   */
  get children(): ISequence<Widget> {
    return this._children;
  }

  /**
   * Create an iterator over the child widgets in the layout.
   *
   * @returns A new iterator over the child widgets in the layout.
   */
  iter(): IIterator<Widget> {
    return this._children.iter();
  }

  /**
   * Add a child widget to the end of the layout.
   *
   * @param child - The child widget to add to the layout.
   *
   * #### Notes
   * If the child is already contained in the layout, it will be moved.
   */
  addChild(child: Widget): void {
    this.insertChild(this._children.length, child);
  }

  /**
   * Insert a child widget into the layout at the specified index.
   *
   * @param index - The index at which to insert the child widget.
   *
   * @param child - The child widget to insert into the layout.
   *
   * #### Notes
   * The index will be clamped to the bounds of the children.
   *
   * If the child is already contained in the layout, it will be moved.
   */
  insertChild(index: number, child: Widget): void {
    // Remove the child from its current parent. If the child's
    // parent is already the layout parent, this is a no-op.
    child.parent = this.parent;

    // Clamp the insert index to the vector bounds.
    let n = this._children.length;
    let j = Math.max(0, Math.min(Math.floor(index), n));

    // Lookup the current index of the child widget.
    let i = indexOf(this._children, child);

    // If the child is not in the vector, insert it.
    if (i === -1) {
      // Insert the child into the vector.
      this._children.insert(j, child);

      // If the layout is parented, attach the child to the DOM.
      if (this.parent) this.attachChild(j, child);

      // There is nothing more to do.
      return;
    }

    // The child already exists in the vector and should be moved.
    // Adjust the index if the location is at the end of the vector.
    if (j === n) j--;

    // Bail if there is no effective move.
    if (i === j) return;

    // Move the vector element to the new location.
    move(this._children, i, j);

    // If the layout is parented, move the child in the DOM.
    if (this.parent) this.moveChild(i, j, child);
  }

  /**
   * Remove a child widget from the layout.
   *
   * @param child - The child widget to remove from the layout.
   *
   * #### Notes
   * A child widget will be removed from the layout automatically when
   * its `parent` is set to `null`. This method should only be invoked
   * directly when removing a widget from a layout which has yet to be
   * installed on a parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   *
   * If the child is not contained in the layout, this is a no-op.
   */
  removeChild(child: Widget): void {
    // Find the index of the specified child.
    let i = indexOf(this._children, child);

    // Bail if the child is not in the vector.
    if (i === -1) {
      return;
    }

    // Remove the child from the vector.
    this._children.remove(i);

    // If the layout is parented, detach the child from the DOM.
    if (this.parent) this.detachChild(i, child);
  }

  /**
   * Attach a child widget to the parent's DOM node.
   *
   * @param index - The current index of the child in the layout.
   *
   * @param child - The child widget to attach to the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation adds the child's node to the parent's
   * node at the proper location, and sends an `'after-attach'` message
   * to the child if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the child's
   * node is added to the parent's node, but the reimplementation must
   * send an `'after-attach'` message to the child if the parent is
   * attached to the DOM.
   */
  protected attachChild(index: number, child: Widget): void {
    let ref = this.parent.node.children[index];
    this.parent.node.insertBefore(child.node, ref);
    if (this.parent.isAttached) sendMessage(child, WidgetMessage.AfterAttach);
  }

  /**
   * Move a child widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the child in the layout.
   *
   * @param toIndex - The current index of the child in the layout.
   *
   * @param child - The child widget to move in the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation moves the child's node to the proper
   * location in the parent's node and sends both a `'before-detach'`
   * and an `'after-attach'` message to the child if the parent is
   * attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the child's
   * node is moved in the parent's node, but the reimplementation must
   * send both a `'before-detach'` and an `'after-attach'` message to
   * the child if the parent is attached to the DOM.
   */
  protected moveChild(fromIndex: number, toIndex: number, child: Widget): void {
    if (this.parent.isAttached) sendMessage(child, WidgetMessage.BeforeDetach);
    this.parent.node.removeChild(child.node);
    let ref = this.parent.node.children[toIndex];
    this.parent.node.insertBefore(child.node, ref);
    if (this.parent.isAttached) sendMessage(child, WidgetMessage.AfterAttach);
  }

  /**
   * Detach a child widget from the parent's DOM node.
   *
   * @param index - The previous index of the child in the layout.
   *
   * @param child - The child widget to detach from the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation removes the child's node from the
   * parent's node, and sends a `'before-detach'` message to the child
   * if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the child's
   * node is removed from the parent's node, but the reimplementation
   * must send a `'before-detach'` message to the child if the parent
   * is attached to the DOM.
   */
  protected detachChild(index: number, child: Widget): void {
    if (this.parent.isAttached) sendMessage(child, WidgetMessage.BeforeDetach);
    this.parent.node.removeChild(child.node);
  }

  /**
   * A message handler invoked on a `'layout-changed'` message.
   *
   * #### Notes
   * This is called when the layout is installed on its parent.
   *
   * The default implementation attaches all children to the DOM.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onLayoutChanged(msg: Message): void {
    for (let i = 0; i < this._children.length; ++i) {
      let child = this._children.at(i);
      child.parent = this.parent;
      this.attachChild(i, child);
    }
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * This will remove the child from the layout.
   *
   * Subclasses should **not** typically reimplement this method.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    this.removeChild(msg.child);
  }

  private _children = new Vector<Widget>();
}


/**
 * Remove and dispose of all children in a vector.
 *
 * @param children - The vector of child widgets of interest.
 */
function disposeChildren(children: Vector<Widget>): void {
  let child: Widget;
  while ((child = children.popBack()) !== void 0) {
    child.dispose();
  }
}
