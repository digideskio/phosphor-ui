/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Signal
} from 'phosphor-core/lib/patterns/signaling';

import {
  Widget
} from './widget';


/**
 * An options object for initializing a title.
 */
export
interface ITitleOptions {
  /**
   * The text for the title.
   */
  text?: string;

  /**
   * The icon class for the title.
   */
  icon?: string;

  /**
   * The tooltip for the title.
   */
  tooltip?: string;

  /**
   * The extra class name for the title.
   */
  className?: string;

  /**
   * The closable state for the title.
   */
  closable?: boolean;
}


/**
 * An object which holds data related to a widget's title.
 *
 * #### Notes
 * A title object is intended to hold the data necessary to display a
 * header for a particular widget. A common example is the `TabPanel`,
 * which uses the widget title to populate the tab for a child widget.
 */
export
class Title {
  /**
   * Construct a new title.
   *
   * @param owner - The widget which owns the title. This may be
   *   `null` if there is no owner for the title.
   *
   * @param options - The options for initializing the title.
   */
  constructor(owner: Widget, options: ITitleOptions = {}) {
    this._owner = owner;
    if (options.text !== void 0) {
      this._text = options.text;
    }
    if (options.icon !== void 0) {
      this._icon = options.icon;
    }
    if (options.tooltip !== void 0) {
      this._tooltip = options.tooltip;
    }
    if (options.closable !== void 0) {
      this._closable = options.closable;
    }
    if (options.className !== void 0) {
      this._className = options.className;
    }
  }

  /**
   * Get the widget which owns the title.
   *
   * #### Notes
   * This will be `null` if the title has no owner.
   *
   * This is a read-only property.
   */
  get owner(): Widget {
    return this._owner;
  }

  /**
   * Get the text for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get text(): string {
    return this._text;
  }

  /**
   * Set the text for the title.
   */
  set text(value: string) {
    if (this._text === value) {
      return;
    }
    this._text = value;
    Title.changed.emit(this, void 0);
  }

  /**
   * Get the icon class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get icon(): string {
    return this._icon;
  }

  /**
   * Set the icon class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set icon(value: string) {
    if (this._icon === value) {
      return;
    }
    this._icon = value;
    Title.changed.emit(this, void 0);
  }

  /**
   * Get the tooltip for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get tooltip(): string {
    return this._tooltip;
  }

  /**
   * Set the tooltip for the title.
   */
  set tooltip(value: string) {
    if (this._tooltip === value) {
      return;
    }
    this._tooltip = value;
    Title.changed.emit(this, void 0);
  }

  /**
   * Get the extra class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get className(): string {
    return this._className;
  }

  /**
   * Set the extra class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set className(value: string) {
    if (this._className === value) {
      return;
    }
    this._className = value;
    Title.changed.emit(this, void 0);
  }

  /**
   * Get the closable state for the title.
   *
   * #### Notes
   * The default value is `false`.
   */
  get closable(): boolean {
    return this._closable;
  }

  /**
   * Set the closable state for the title.
   *
   * #### Notes
   * This controls the presence of a close icon when applicable.
   */
  set closable(value: boolean) {
    if (this._closable === value) {
      return;
    }
    this._closable = value;
    Title.changed.emit(this, void 0);
  }

  private _owner: Widget;
  private _text = '';
  private _icon = '';
  private _tooltip = '';
  private _className = '';
  private _closable = false;
}


/**
 * The namespace for the `Title` class statics.
 */
export
namespace Title {
  /**
   * A signal emitted when the state of the title changes.
   */
  export
  const changed = new Signal<Title, void>();
}