/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, each
} from 'phosphor-core/lib/algorithm/iteration';

import {
  IDisposable
} from 'phosphor-core/lib/patterns/disposable';

import {
  Message, sendMessage
} from 'phosphor-core/lib/patterns/messaging';

import {
  clearPropertyData
} from 'phosphor-core/lib/patterns/properties';

import {
  clearSignalData
} from 'phosphor-core/lib/patterns/signaling';

import {
  ChildMessage, ResizeMessage
} from '../widgets/messages';

import {
  Widget
} from '../widgets/widget';


/**
 * An abstract base class for creating Phosphor layouts.
 *
 * #### Notes
 * A layout is used to add child widgets to a parent and to arrange
 * those children within that parent's DOM node.
 *
 * This class implements the base functionality which is required of
 * nearly all layouts. It must be subclassed in order to be useful.
 *
 * Notably, this class does not define a uniform interface for adding
 * children to the layout. A subclass should define an API for adding
 * child widgets in a way which is meaningful for its intended use.
 */
export
abstract class Layout implements IDisposable {
  /**
   * Create an iterator over the child widgets in the layout.
   *
   * @returns A new iterator over the children in the layout.
   *
   * #### Notes
   * This abstract method must be implemented by a subclass.
   */
  abstract children(): IIterator<Widget>;

  /**
   * A message handler invoked on a `'layout-changed'` message.
   *
   * #### Notes
   * This method is invoked when the layout is installed on its parent
   * widget. It should reparent all of the children to the new parent,
   * and add the child DOM nodes to the parent's node as appropriate.
   *
   * This abstract method must be implemented by a subclass.
   */
  protected abstract onLayoutChanged(msg: Message): void;

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * This is invoked when a child widget's `parent` property is set to
   * `null`. The layout should remove the child widget and detach its
   * node from the DOM.
   *
   * This abstract method must be implemented by a subclass.
   */
  protected abstract onChildRemoved(msg: ChildMessage): void;

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This should be reimplemented to dispose and clear the children.
   *
   * All reimplementations should call the superclass method.
   */
  dispose(): void {
    this._disposed = true;
    this._parent = null;
    clearSignalData(this);
    clearPropertyData(this);
  }

  /**
   * Test whether the layout is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Get the parent widget of the layout.
   */
  get parent(): Widget {
    return this._parent;
  }

  /**
   * Set the parent widget of the layout.
   *
   * #### Notes
   * This is set automatically when installing the layout on the parent
   * widget. The parent widget should not be set directly by user code.
   */
  set parent(value: Widget) {
    if (!value) {
      throw new Error('Cannot set parent widget to null.');
    }
    if (this._parent === value) {
      return;
    }
    if (this._parent) {
      throw new Error('Cannot change parent widget.');
    }
    if (value.layout !== this) {
      throw new Error('Invalid parent widget.');
    }
    this._parent = value;
  }

  /**
   * Process a message sent to the parent widget.
   *
   * @param msg - The message sent to the parent widget.
   *
   * #### Notes
   * This method is called by the parent widget to process a message.
   *
   * Subclasses may reimplement this method as needed.
   */
  processParentMessage(msg: Message): void {
    switch (msg.type) {
    case 'resize':
      this.onResize(msg as ResizeMessage);
      break;
    case 'update-request':
      this.onUpdateRequest(msg);
      break;
    case 'fit-request':
      this.onFitRequest(msg);
      break;
    case 'after-show':
      this.onAfterShow(msg);
      break;
    case 'before-hide':
      this.onBeforeHide(msg);
      break;
    case 'after-attach':
      this.onAfterAttach(msg);
      break;
    case 'before-detach':
      this.onBeforeDetach(msg);
      break;
    case 'child-removed':
      this.onChildRemoved(msg as ChildMessage);
      break;
    case 'child-shown':
      this.onChildShown(msg as ChildMessage);
      break;
    case 'child-hidden':
      this.onChildHidden(msg as ChildMessage);
      break;
    case 'layout-changed':
      this.onLayoutChanged(msg);
      break;
    }
  }

  /**
   * A message handler invoked on a `'resize'` message.
   *
   * #### Notes
   * The layout should ensure that its children are resized according
   * to the specified layout space, and that they are sent a `'resize'`
   * message if appropriate.
   *
   * The default implementation of this method sends an `UnknownSize`
   * resize message to all children.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onResize(msg: ResizeMessage): void {
    each(this.children(), child => {
      sendMessage(child, ResizeMessage.UnknownSize);
    });
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   *
   * #### Notes
   * The layout should ensure that its children are resized according
   * to the available layout space, and that they are sent a `'resize'`
   * message if appropriate.
   *
   * The default implementation of this method sends an `UnknownSize`
   * resize message to all children.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onUpdateRequest(msg: Message): void {
    each(this.children(), child => {
      sendMessage(child, ResizeMessage.UnknownSize);
    });
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all children. It assumes all child widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterAttach(msg: Message): void {
    each(this.children(), child => {
      sendMessage(child, msg);
    });
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all children. It assumes all child widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeDetach(msg: Message): void {
    each(this.children(), child => {
      sendMessage(child, msg);
    });
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all non-hidden children. It assumes all child widget nodes
   * are attached to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterShow(msg: Message): void {
    each(this.children(), child => {
      if (!child.isHidden) sendMessage(child, msg);
    });
  }

  /**
   * A message handler invoked on a `'before-hide'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all non-hidden children. It assumes all child widget nodes
   * are attached to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeHide(msg: Message): void {
    each(this.children(), child => {
      if (!child.isHidden) sendMessage(child, msg);
    });
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onFitRequest(msg: Message): void { }

  /**
   * A message handler invoked on a `'child-shown'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildShown(msg: ChildMessage): void { }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildHidden(msg: ChildMessage): void { }

  private _disposed = false;
  private _parent: Widget = null;
}
