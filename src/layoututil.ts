/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  sendMessage
} from 'phosphor-core/lib/messaging';

import {
  AttachedProperty
} from 'phosphor-core/lib/properties';

import {
  ResizeMessage, Widget
} from './widget';


/**
 * Prepare a widget for absolute layout geometry.
 *
 * @param widget - The widget of interest.
 *
 * #### Notes
 * This sets the inline style position of the widget to `absolute`.
 */
export
function prepareGeometry(widget: Widget): void {
  widget.node.style.position = 'absolute';
}


/**
 * Reset the layout geometry of a widget.
 *
 * @param widget - The widget of interest.
 *
 * #### Notes
 * This clears the inline style position and geometry of the widget.
 */
export
function resetGeometry(widget: Widget): void {
  let style = widget.node.style;
  let rect = Private.rectProperty.get(widget);
  rect.top = NaN;
  rect.left = NaN;
  rect.width = NaN;
  rect.height = NaN;
  style.position = '';
  style.top = '';
  style.left = '';
  style.width = '';
  style.height = '';
}


/**
 * Set the absolute layout geometry of a widget.
 *
 * @param widget - The widget of interest.
 *
 * @param left - The desired offset left position of the widget.
 *
 * @param top - The desired offset top position of the widget.
 *
 * @param width - The desired offset width of the widget.
 *
 * @param height - The desired offset height of the widget.
 *
 * #### Notes
 * All dimensions are assumed to be pixels with coordinates relative to
 * the origin of the widget's offset parent.
 *
 * The widget's node is assumed to be position `absolute`.
 *
 * If the widget is resized from its previous size, a `ResizeMessage`
 * will be automatically sent to the widget.
 */
export
function setGeometry(widget: Widget, left: number, top: number, width: number, height: number): void {
  let resized = false;
  let style = widget.node.style;
  let rect = Private.rectProperty.get(widget);
  if (rect.top !== top) {
    rect.top = top;
    style.top = `${top}px`;
  }
  if (rect.left !== left) {
    rect.left = left;
    style.left = `${left}px`;
  }
  if (rect.width !== width) {
    resized = true;
    rect.width = width;
    style.width = `${width}px`;
  }
  if (rect.height !== height) {
    resized = true;
    rect.height = height;
    style.height = `${height}px`;
  }
  if (resized) {
    sendMessage(widget, new ResizeMessage(width, height));
  }
}


/**
 * The namespace for the module private data.
 */
namespace Private {
  /**
   * An object which represents an offset rect.
   */
  export
  interface IRect {
    /**
     * The offset top edge, in pixels.
     */
    top: number;

    /**
     * The offset left edge, in pixels.
     */
    left: number;

    /**
     * The offset width, in pixels.
     */
    width: number;

    /**
     * The offset height, in pixels.
     */
    height: number;
  }

  /**
   * A property descriptor for a widget absolute geometry rect.
   */
  export
  const rectProperty = new AttachedProperty<Widget, IRect>({
    name: 'rect',
    create: () => ({ top: NaN, left: NaN, width: NaN, height: NaN }),
  });
}
