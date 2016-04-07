/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ConflatableMessage, Message
} from 'phosphor-core/lib/patterns/messaging';

import {
  Widget
} from './widget';


/**
 * A collection of stateless messages related to widgets.
 */
export
namespace WidgetMessage {
  /**
   * A singleton `'after-show'` message.
   *
   * #### Notes
   * This message is sent to a widget after it becomes visible.
   *
   * This message is **not** sent when the widget is being attached.
   */
  export
  const AfterShow = new Message('after-show');

  /**
   * A singleton `'before-hide'` message.
   *
   * #### Notes
   * This message is sent to a widget before it becomes not-visible.
   *
   * This message is **not** sent when the widget is being detached.
   */
  export
  const BeforeHide = new Message('before-hide');

  /**
   * A singleton `'after-attach'` message.
   *
   * #### Notes
   * This message is sent to a widget after it is attached.
   */
  export
  const AfterAttach = new Message('after-attach');

  /**
   * A singleton `'before-detach'` message.
   *
   * #### Notes
   * This message is sent to a widget before it is detached.
   */
  export
  const BeforeDetach = new Message('before-detach');

  /**
   * A singleton `'parent-changed'` message.
   *
   * #### Notes
   * This message is sent to a widget when its parent has changed.
   */
  export
  const ParentChanged = new Message('parent-changed');

  /**
   * A singleton `'layout-changed'` message.
   *
   * #### Notes
   * This message is sent to a widget when its layout has changed.
   */
  export
  const LayoutChanged = new Message('layout-changed');

  /**
   * A singleton `'update-request'` message.
   *
   * #### Notes
   * This message can be dispatched to supporting widgets in order to
   * update their content based on the current widget state. Not all
   * widgets will respond to messages of this type.
   *
   * For widgets with a layout, this message will inform the layout to
   * update the position and size of its child widgets.
   */
  export
  const UpdateRequest = new ConflatableMessage('update-request');

  /**
   * A singleton `'fit-request'` message.
   *
   * #### Notes
   * For widgets with a layout, this message will inform the layout to
   * recalculate its size constraints to fit the space requirements of
   * its child widgets, and to update their position and size. Not all
   * layouts will respond to messages of this type.
   */
  export
  const FitRequest = new ConflatableMessage('fit-request');

  /**
   * A singleton `'close-request'` message.
   *
   * #### Notes
   * This message should be dispatched to a widget when it should close
   * and remove itself from the widget hierarchy.
   */
  export
  const CloseRequest = new ConflatableMessage('close-request');
}


/**
 * A message class for child related messages.
 */
export
class ChildMessage extends Message {
  /**
   * Construct a new child message.
   *
   * @param type - The message type.
   *
   * @param child - The child widget for the message.
   */
  constructor(type: string, child: Widget) {
    super(type);
    this._child = child;
  }

  /**
   * The child widget for the message.
   *
   * #### Notes
   * This is a read-only property.
   */
  get child(): Widget {
    return this._child;
  }

  private _child: Widget;
}


/**
 * A message class for `'resize'` messages.
 */
export
class ResizeMessage extends Message {
  /**
   * Construct a new resize message.
   *
   * @param width - The **offset width** of the widget, or `-1` if
   *   the width is not known.
   *
   * @param height - The **offset height** of the widget, or `-1` if
   *   the height is not known.
   */
  constructor(width: number, height: number) {
    super('resize');
    this._width = width;
    this._height = height;
  }

  /**
   * The offset width of the widget.
   *
   * #### Notes
   * This will be `-1` if the width is unknown.
   *
   * This is a read-only property.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The offset height of the widget.
   *
   * #### Notes
   * This will be `-1` if the height is unknown.
   *
   * This is a read-only property.
   */
  get height(): number {
    return this._height;
  }

  private _width: number;
  private _height: number;
}


/**
 * The namespace for the `ResizeMessage` class statics.
 */
export
namespace ResizeMessage {
  /**
   * A singleton `'resize'` message with an unknown size.
   */
  export
  const UnknownSize = new ResizeMessage(-1, -1);
}
