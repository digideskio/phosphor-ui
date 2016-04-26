/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message, sendMessage
} from 'phosphor-core/lib/messaging';

import {
  indexOf, findIndex
} from 'phosphor-core/lib/searching';

import {
  ISequence
} from 'phosphor-core/lib/sequence';

import {
  ISignal, defineSignal
} from 'phosphor-core/lib/signaling';

import {
  Vector
} from 'phosphor-core/lib/vector';

import {
  boxSizing, hitTest
} from './domutil';

import {
  Widget, WidgetFlag, WidgetMessage
} from './widget';


/**
 * The class name added to Menu instances.
 */
const MENU_CLASS = 'p-Menu';

/**
 * The class name added to a menu content node.
 */
const CONTENT_CLASS = 'p-Menu-content';

/**
 * The class name added to a menu item node.
 */
const ITEM_CLASS = 'p-Menu-item';

/**
 * The class name added to a menu item icon node.
 */
const ICON_CLASS = 'p-Menu-itemIcon';

/**
 * The class name added to a menu item text node.
 */
const TEXT_CLASS = 'p-Menu-itemText';

/**
 * The class name added to a menu item shortcut node.
 */
const SHORTCUT_CLASS = 'p-Menu-itemShortcut';

/**
 * The class name added to a menu item submenu icon node.
 */
const SUBMENU_CLASS = 'p-Menu-itemSubmenuIcon';

/**
 * The class name added to a `'normal'` type menu item.
 */
const NORMAL_TYPE_CLASS = 'p-type-normal';

/**
 * The class name added to a `'check'` type menu item.
 */
const CHECK_TYPE_CLASS = 'p-type-check';

/**
 * The class name added to a `'radio'` type menu item.
 */
const RADIO_TYPE_CLASS = 'p-type-radio';

/**
 * The class name added to a `'separator'` type menu item.
 */
const SEPARATOR_TYPE_CLASS = 'p-type-separator';

/**
 * The class name added to a `'submenu'` type menu item.
 */
const SUBMENU_TYPE_CLASS = 'p-type-submenu';

/**
 * The class name added to active menu items.
 */
const ACTIVE_CLASS = 'p-mod-active';

/**
 * The class name added to a disabled menu item.
 */
const DISABLED_CLASS = 'p-mod-disabled';

/**
 * The class name added to a checked menu item.
 */
const CHECKED_CLASS = 'p-mod-checked';

/**
 * The class name added to a hidden menu item.
 */
const HIDDEN_CLASS = 'p-mod-hidden';

/**
 * The ms delay for opening and closing a submenu.
 */
const TIMER_DELAY = 300;

/**
 * The horizontal pixel overlap for open submenus.
 */
const SUBMENU_OVERLAP = 3;


/**
 * A type alias for the supported menu item types.
 */
export
type MenuItemType = 'normal' | 'check' | 'radio' | 'submenu' | 'separator';


/**
 * An options object for initializing a menu item.
 */
export
interface IMenuItemOptions {
  /**
   * The type of the menu item.
   */
  type?: MenuItemType;

  /**
   * The text for the menu item.
   */
  text?: string;

  /**
   * The icon class for the menu item.
   */
  icon?: string;

  /**
   * The keyboard shortcut decoration for the menu item.
   */
  shortcut?: string;

  /**
   * The checked state for the menu item.
   */
  checked?: boolean;

  /**
   * The disabled state for the menu item.
   */
  disabled?: boolean;

  /**
   * The hidden state for the menu item.
   */
  hidden?: boolean;

  /**
   * The extra class name for the menu item.
   */
  className?: string;

  /**
   * The command id for the menu item.
   */
  command?: string;

  /**
   * The command args for the menu item.
   */
  args?: any;

  /**
   * The submenu for the menu item.
   */
  submenu?: Menu;
}


/**
 * An object which holds the data for an item in a menu.
 *
 * #### Notes
 * A menu item is a simple data struct. If the data in a menu item is
 * changed, the changes will be reflected in a menu the next time the
 * menu is opened.
 */
export
class MenuItem {
  /**
   * Construct a new menu item.
   *
   * @param options - The options for initializing the menu item.
   */
  constructor(options?: IMenuItemOptions) {
    if (options === void 0) {
      return;
    }
    if (options.type !== void 0) {
      this.type = options.type;
    }
    if (options.text !== void 0) {
      this.text = options.text;
    }
    if (options.icon !== void 0) {
      this.icon = options.icon;
    }
    if (options.shortcut !== void 0) {
      this.shortcut = options.shortcut;
    }
    if (options.checked !== void 0) {
      this.checked = options.checked;
    }
    if (options.disabled !== void 0) {
      this.disabled = options.disabled;
    }
    if (options.hidden !== void 0) {
      this.hidden = options.hidden;
    }
    if (options.className !== void 0) {
      this.className = options.className;
    }
    if (options.command !== void 0) {
      this.command = options.command;
    }
    if (options.args !== void 0) {
      this.args = options.args;
    }
    if (options.submenu !== void 0) {
      this.submenu = options.submenu;
    }
  }

  /**
   * The type of the menu item.
   *
   * #### Notes
   * This controls how the rest of the item properties are interpreted.
   *
   * The default value is `'normal'`.
   */
  type: MenuItemType = 'normal';

  /**
   * The text for the menu item.
   *
   * #### Notes
   * A `'&&'` sequence before a character denotes the item mnemonic.
   *
   * This value is ignored for `'separator'` type items.
   *
   * The default value is an empty string.
   */
  text = '';

  /**
   * The icon class for the menu item.
   *
   * #### Notes
   * This class name is added to the menu item icon node.
   *
   * Multiple class names can be separated by whitespace.
   *
   * This value is ignored for `'separator'` type items.
   *
   * The default value is an empty string.
   */
  icon = '';

  /**
   * The keyboard shortcut decoration for the menu item.
   *
   * #### Notes
   * This value is for decoration purposes only. Management of keyboard
   * shortcut bindings is left to other library code.
   *
   * This value is ignored for `'separator'` and `'submenu'` type items.
   *
   * The default value is an empty string.
   */
  shortcut = '';

  /**
   * The checked state for the menu item.
   *
   * #### Notes
   * This value is only used for `'check'` and `'radio'` type items.
   *
   * The default value is `false`.
   */
  checked = false;

  /**
   * The disabled state for the menu item.
   *
   * #### Notes
   * This value is ignored for `'separator'` type items.
   *
   * The default value is `false`.
   */
  disabled = false;

  /**
   * The hidden state for the menu item.
   *
   * #### Notes
   * The default value is `false`.
   */
  hidden = false;

  /**
   * The extra class name to associate with the menu item.
   *
   * #### Notes
   * Multiple class names can be separated by whitespace.
   *
   * The default value is an empty string.
   */
  className = '';

  /**
   * The command id to associate with the menu item.
   *
   * #### Notes
   * The default value is an empty string.
   */
  command = '';

  /**
   * The command args to associate with the menu item.
   *
   * #### Notes
   * This should be a simple JSON-compatible value.
   *
   * The default value is `null`.
   */
  args: any = null;

  /**
   * The submenu for the menu item.
   *
   * #### Notes
   * This value is only used for `'submenu'` type items.
   *
   * The default value is `null`.
   */
  submenu: Menu = null;
}


/**
 * An object which renders item nodes for a menu.
 *
 * #### Notes
 * User code can implement a custom item renderer when the default
 * item nodes created by the menu are insufficient.
 */
export
interface IMenuItemRenderer {
  /**
   * Create a node for a menu item.
   *
   * @returns A new node for a menu item.
   *
   * #### Notes
   * The data in the node should be uninitialized. The `updateItemNode`
   * method will be called to initialize the data for the item node.
   */
  createItemNode(): HTMLElement;

  /**
   * Update an item node to reflect the state of a menu item.
   *
   * @param node - An item node created by a call to `createItemNode`.
   *
   * @param item - The menu item holding the data for the node.
   *
   * #### Notes
   * This method should completely reset the state of the node to
   * reflect the data in the menu item.
   */
  updateItemNode(node: HTMLElement, item: MenuItem): void;
}


/**
 * A concrete implementation of [[IMenuItemRenderer]].
 *
 * #### Notes
 * This is the default item renderer type for a [[Menu]].
 */
export
class MenuItemRenderer implements IMenuItemRenderer {
  /**
   * Create a node for a menu item.
   *
   * @returns A new node for a menu item.
   */
  createItemNode(): HTMLElement {
    let node = document.createElement('li');
    let icon = document.createElement('span');
    let text = document.createElement('span');
    let shortcut = document.createElement('span');
    let submenu = document.createElement('span');
    node.className = ITEM_CLASS;
    text.className = TEXT_CLASS;
    shortcut.className = SHORTCUT_CLASS;
    submenu.className = SUBMENU_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(shortcut);
    node.appendChild(submenu);
    return node;
  }

  /**
   * Update an item node to reflect the state of a menu item.
   *
   * @param node - An item node created by a call to `createItemNode`.
   *
   * @param item - The menu item holding the data for the node.
   */
  updateItemNode(node: HTMLElement, item: MenuItem): void {
    let sub = item.type === 'submenu';
    let sep = item.type === 'separator';
    let icon = node.firstChild as HTMLElement;
    let text = icon.nextSibling as HTMLElement;
    let shortcut = text.nextSibling as HTMLElement;
    node.className = this.createItemClassName(item);
    icon.className = ICON_CLASS + (item.icon ? ` ${item.icon}` : '');
    text.textContent = sep ? '' : item.text.replace(/&&/g, '');
    shortcut.textContent = (sep || sub) ? '' : item.shortcut;
  }

  /**
   * Create the full class name for a menu item.
   *
   * @param item - The menu item of interest.
   *
   * #### Notes
   * This method will render the full class name for the item, taking
   * into account its type and other relevant state based on the type.
   */
  createItemClassName(item: MenuItem): string {
    let name = ITEM_CLASS;
    switch (item.type) {
    case 'normal':
      name += ` ${NORMAL_TYPE_CLASS}`;
      if (item.disabled) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'check':
      name += ` ${CHECK_TYPE_CLASS}`;
      if (item.checked) {
        name += ` ${CHECKED_CLASS}`;
      }
      if (item.disabled) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'radio':
      name += ` ${RADIO_TYPE_CLASS}`;
      if (item.checked) {
        name += ` ${CHECKED_CLASS}`;
      }
      if (item.disabled) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'submenu':
      name += ` ${SUBMENU_TYPE_CLASS}`;
      if (item.disabled) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'separator':
      name += ` ${SEPARATOR_TYPE_CLASS}`;
      break;
    }
    if (item.hidden) {
      name += ` ${HIDDEN_CLASS}`;
    }
    if (item.className) {
      name += ` ${item.className}`;
    }
    return name;
  }
}


/**
 * The namespace for the `MenuItemRenderer` class statics.
 */
export
namespace MenuItemRenderer {
  /**
   * A singleton instance of the `MenuItemRenderer` class.
   *
   * #### Notes
   * This is default item renderer instance used by `TabBar`.
   */
  export
  const instance = new MenuItemRenderer();
}


/**
 * A widget which displays menu items as a canonical menu.
 */
export
class Menu extends Widget {
  /**
   * Create the DOM node for a menu.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = CONTENT_CLASS;
    node.appendChild(content);
    return node;
  }

  /**
   * Construct a new menu.
   *
   * @param renderer - The item renderer for creating new item nodes.
   */
  constructor(renderer: IMenuItemRenderer = MenuItemRenderer.instance) {
    super();
    this._renderer = renderer;
    this.addClass(MENU_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
  }

  /**
   * Dispose of the resources held by the menu.
   */
  dispose(): void {
    // TODO ... ?
    // this.close();
    // this.clearItems();
    super.dispose();
  }

  /**
   * A signal emitted when the menu is closed.
   *
   * #### Notes
   * TODO
   */
  closed: ISignal<Menu, void>;

  /**
   * A signal emitted when a menu item in the hierarchy is triggered.
   *
   * #### Notes
   * TODO
   */
  triggered: ISignal<Menu, MenuItem>;

  /**
   * Get the parent menu of the menu.
   *
   * #### Notes
   * This will be `null` if the menu is not an open submenu.
   *
   * This is a read-only property.
   */
  get parentMenu(): Menu {
    return this._parentMenu;
  }

  /**
   * Get the child menu of the menu.
   *
   * #### Notes
   * This will be `null` if the menu does not have an open submenu.
   *
   * This is a read-only property.
   */
  get childMenu(): Menu {
    return this._childMenu;
  }

  /**
   * Get the menu content node.
   *
   * #### Notes
   * This is the node which holds the menu item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * A read-only sequence of the menu items in the menu.
   *
   * #### Notes
   * This is a read-only property.
   */
  get items(): ISequence<MenuItem> {
    return this._items;
  }

  /**
   * A read-only sequence of the menu item nodes in the menu.
   *
   * #### Notes
   * This is a read-only property.
   */
  get itemNodes(): ISequence<HTMLElement> {
    return this._nodes;
  }

  /**
   * Get the currently active menu item.
   *
   * #### Notes
   * This will be `null` if no menu item is active.
   */
  get activeItem(): MenuItem {
    let i = this._activeIndex;
    return i !== -1 ? this._items.at(i) : null;
  }

  /**
   * Set the currently active menu item.
   *
   * #### Notes
   * If the item does not exist, the menu item will be set to `null`.
   */
  set activeItem(value: MenuItem) {
    this.activeIndex = indexOf(this._items, value);
  }

  /**
   * Get the currently active menu item node.
   *
   * #### Notes
   * This will be `null` if no menu item is active.
   */
  get activeItemNode(): HTMLElement {
    let i = this._activeIndex;
    return i !== -1 ? this._nodes.at(i) : null;
  }

  /**
   * Set the currently active menu item node.
   *
   * #### Notes
   * If the node does not exist, the node will be set to `null`.
   */
  set activeItemNode(value: HTMLElement) {
    this.activeIndex = indexOf(this._nodes, value);
  }

  /**
   * Get the index of the currently active menu item.
   *
   * #### Notes
   * This will be `-1` if no menu item is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active menu item.
   *
   * #### Notes
   * If the index is out of range, or points to a disabled, hidden,
   * or `'separator'` type item, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Coerce the value to an index.
    let i = Math.floor(value);
    if (i < 0 || i >= this._items.length) {
      i = -1;
    }

    // Ensure the item is selectable.
    if (i !== -1 && !Private.isSelectable(this._items.at(i))) {
      i = -1;
    }

    // Bail early if the index will not change.
    if (this._activeIndex === i) {
      return;
    }

    // Remove the active class from the old node.
    if (this._activeIndex !== -1) {
      let node = this._nodes.at(this._activeIndex);
      node.classList.remove(ACTIVE_CLASS);
    }

    // Add the active class to the new node.
    if (i !== -1) {
      let node = this._nodes.at(i);
      node.classList.add(ACTIVE_CLASS);
    }

    // Update the active index.
    this._activeIndex = i;
  }

  /**
   * Add a menu item to the end of the menu.
   *
   * @param item - The menu item to add to the menu.
   */
  addItem(item: MenuItem): void {
    this.insertItem(this._items.length, item);
  }

  /**
   * Insert a menu item into the menu at the specified index.
   *
   * @param index - The index at which to insert the item.
   *
   * @param item - The menu item to insert into the menu.
   *
   * #### Notes
   * The index will be clamped to the bounds of the items.
   */
  insertItem(index: number, item: MenuItem): void {
    // TODO - close if open?

    // Reset the active index.
    this.activeIndex = -1;

    // Clamp the insert index to the vector bounds.
    let i = Math.max(0, Math.min(Math.floor(index), this._items.length));

    // Create the node for the item. It will be initialized on open.
    let node = this._renderer.createItemNode();

    // Insert the item and node into the vectors.
    this._items.insert(i, item);
    this._nodes.insert(i, node);

    // Look up the next sibling node.
    let ref = i + 1 < this._nodes.length ? this._nodes.at(i + 1) : null;

    // Insert the node into the content node.
    this.contentNode.insertBefore(node, ref);
  }

  /**
   * Remove a menu item from the menu.
   *
   * @param index - The index of the item to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeItem(index: number): void {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._items.length) {
      return;
    }

    // TODO close if open?

    // Reset the active index.
    this.activeIndex = -1;

    // Look up the item node.
    let node = this._nodes.at(i);

    // Remove the item and node from the vectors.
    this._items.remove(i);
    this._nodes.remove(i);

    // Remove the node from the content node.
    this.contentNode.removeChild(node);
  }

  /**
   * Remove all menu items from the menu.
   */
  clearItems(): void {
    // TODO close if open?

    // Reset the active index.
    this.activeIndex = -1;

    // Clear the item and node vectors.
    this._items.clear();
    this._nodes.clear();

    // Clear the content node.
    this.contentNode.textContent = '';
  }

  /**
   * Open the menu at the specified location.
   *
   * @param x - The client X coordinate of the menu location.
   *
   * @param y - The client Y coordinate of the menu location.
   *
   * #### Notes
   * The menu will be opened at the given location unless it will not
   * fully fit on the screen. If it will not fit, it will be adjusted
   * to fit naturally on the screen.
   *
   * This is a no-op if the menu is already attached to the DOM.
   */
  open(x: number, y: number): void {
    if (this.isAttached) {
      return;
    }
    Private.openRootMenu(this, x, y, false, false);
  }

  /**
   * Handle the DOM events for the menu.
   *
   * @param event - The DOM event sent to the menu.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the menu's DOM nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    // Events attached to the menu node:
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseleave':
      this._evtMouseLeave(event as MouseEvent);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    // Events attached to the document node:
    // case 'keydown':
    //   this._evtKeyDown(event as KeyboardEvent);
    //   break;
    // case 'keypress':
    //   this._evtKeyPress(event as KeyboardEvent);
    //   break;
    // case 'mousedown':
    //   this._evtMouseDown(event as MouseEvent);
    //   break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('mouseup', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
    document.addEventListener('keydown', this, true);
    document.addEventListener('keypress', this, true);
    document.addEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('mouseup', this);
    this.node.removeEventListener('mousemove', this);
    this.node.removeEventListener('mouseleave', this);
    this.node.removeEventListener('contextmenu', this);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('keypress', this, true);
    document.removeEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch common variables.
    let items = this._items;
    let nodes = this._nodes;
    let renderer = this._renderer;

    // Update the state of the item nodes.
    for (let i = 0, n = items.length; i < n; ++i) {
      renderer.updateItemNode(nodes.at(i), items.at(i));
    }

    // Add the active class to the active item.
    if (this._activeIndex !== -1) {
      nodes.at(this._activeIndex).classList.add(ACTIVE_CLASS);
    }

    // Hide the extra separator nodes.
    Private.hideExtraSeparators(items, nodes);
  }

  /**
   * A message handler invoked on a `'close-request'` message.
   */
  protected onCloseRequest(msg: Message): void {
    // Cancel the pending timers.
    this._cancelOpenTimer();
    this._cancelCloseTimer();

    // Reset the active index.
    this.activeIndex = -1;

    // Close any open child menu.
    let childMenu = this._childMenu;
    if (childMenu) {
      this._childIndex = -1;
      this._childMenu = null;
      childMenu._parentMenu = null;
      childMenu.close();
    }

    // Remove this menu from any parent.
    let parentMenu = this._parentMenu;
    if (parentMenu) {
      this._parentMenu = null;
      parentMenu._cancelOpenTimer();
      parentMenu._cancelCloseTimer();
      parentMenu._childIndex = -1;
      parentMenu._childMenu = null;
    }

    // If the menu is parented, remove it and emit the closed signal.
    if (this.parent) {
      this.parent = null;
      this.closed.emit(void 0);
      return;
    }

    // If the menu is attached, detach it and emit the closed signal.
    if (this.isAttached) {
      Widget.detach(this);
      this.closed.emit(void 0);
      return;
    }
  }

  /**
   * Handle the `'mouseup'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Bail if the left button was not released.
    if (event.button !== 0) {
      return;
    }

    // Prevent further propagation of the event.
    event.preventDefault();
    event.stopPropagation();

    // Hit test the item nodes for the item under the mouse.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // Bail if no item is under the mouse.
    if (i === -1) {
      return;
    }

    // Bail if the item is not selectable
    let item = this._items.at(i);
    if (!Private.isSelectable(item)) {
      return;
    }

    // Ensure the active index is set.
    this.activeIndex = i;

    // If the item is a submenu, open it immediately.
    if (item.type === 'submenu') {
      this._cancelOpenTimer();
      this._cancelCloseTimer();
      this._openChildMenu();
      return;
    }

    // Otherwise, trigger the item and close the menu hierarchy.
    this._triggerItem(item);
  }

  /**
   * Handle the `'mousemove'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Hit test the item nodes for the item under the mouse.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // Bail early if the mouse is already over the active index.
    if (i === this._activeIndex) {
      return;
    }

    // Update and coerce the active index.
    this.activeIndex = i;
    i = this.activeIndex;

    // Synchronize the active ancestor items.
    for (let menu = this._parentMenu; menu; menu = menu._parentMenu) {
      menu._cancelOpenTimer();
      menu._cancelCloseTimer();
      menu.activeIndex = menu._childIndex;
    }

    // If the index is the current child index, cancel the timers.
    if (i === this._childIndex) {
      this._cancelOpenTimer();
      this._cancelCloseTimer();
      return;
    }

    // If a child menu is currently open, start the close timer.
    if (this._childIndex !== -1) {
      this._startCloseTimer();
    }

    // Cancel the open timer to give a full delay for opening.
    this._cancelOpenTimer();

    // Bail if the active item is not a valid submenu item.
    let item = this.activeItem;
    if (!item || item.type !== 'submenu' || !item.submenu) {
      return;
    }

    // Start the open timer to open the active item submenu.
    this._startOpenTimer();
  }

  /**
   * Handle the `'mouseleave'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Cancel any pending submenu opening.
    this._cancelOpenTimer();

    // If there is no open child menu, just reset the active index.
    if (!this._childMenu) {
      this.activeIndex = -1;
      return;
    }

    // If the mouse is over the child menu, cancel the close timer.
    if (hitTest(this._childMenu.node, event.clientX, event.clientY)) {
      this._cancelCloseTimer();
      return;
    }

    // Otherwise, reset the active index and start the close timer.
    this.activeIndex = -1;
    this._startCloseTimer();
  }

  /**
   * Handle the `'mousedown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  // private _evtMouseDown(event: MouseEvent): void {
  //   // // Only process the event if the menu is a root.
  //   // if (this._parentMenu) {
  //   //   return;
  //   // }

  //   // // Hit test the menu hierarchy.
  //   // let hit = false;
  //   // let menu: Menu = this;
  //   // let x = event.clientX;
  //   // let y = event.clientY;
  //   // while (!hit && menu) {
  //   //   hit = hitTest(menu.node, x, y);
  //   //   menu = menu._childMenu;
  //   // }

  //   // // If a child menu was hit, stop the propagation.
  //   // if (hit) {
  //   //   // TODO stop propagation here?
  //   //   return;
  //   // }

  //   // // Otherwise, close the menu hierarchy. The event is allowed to
  //   // // propagate so that other document listeners can act on it.
  //   // this.close();
  // }

  /**
   * Open the child menu at the active index immediately.
   *
   * If a different child menu is already open, it will be closed.
   */
  private _openChildMenu(): void {
    // If the item is not a valid submenu, just close the child menu.
    let item = this.activeItem;
    if (!item || item.type !== 'submenu' || !item.submenu) {
      this._closeChildMenu();
      return;
    }

    // Do nothing if the child menu will not change.
    let menu = item.submenu;
    if (menu === this._childMenu) {
      return;
    }

    // Ensure the current child menu is closed.
    this._closeChildMenu();

    // Update the private child state.
    this._childMenu = menu;
    this._childIndex = this._activeIndex;

    // Set the parent menu reference for the child.
    menu._parentMenu = this;

    // Open the submenu at the active node.
    Private.openSubmenu(menu, this.activeItemNode);
  }

  /**
   * Close the open child menu immediately.
   *
   * This is a no-op if a child menu is not open.
   */
  private _closeChildMenu(): void {
    // Bail early if a child menu is not open.
    let child = this._childMenu
    if (!child) {
      return;
    }

    // Reset the private child state.
    this._childIndex = -1;
    this._childMenu = null;

    // Remove the parent menu reference from the child.
    child._parentMenu = null;

    // Actually close the child menu.
    child.close();
  }

  /**
   * Trigger the given menu item.
   *
   * This emits the triggered signal for each ancestor menu in the
   * hierarchy, then closes the entire hierarchy from the root menu.
   */
  private _triggerItem(item: MenuItem): void {
    let root: Menu;
    let menu: Menu = this;
    while (menu) {
      root = menu;
      menu.triggered.emit(item);
      menu = menu._parentMenu;
    }
    root.close();
  }

  /**
   * Start the open timer, unless it is already pending.
   */
  private _startOpenTimer(): void {
    if (this._openTimerID === 0) {
      this._openTimerID = setTimeout(() => {
        this._openTimerID = 0;
        this._openChildMenu();
      }, TIMER_DELAY);
    }
  }

  /**
   * Start the close timer, unless it is already pending.
   */
  private _startCloseTimer(): void {
    if (this._closeTimerID === 0) {
      this._closeTimerID = setTimeout(() => {
        this._closeTimerID = 0;
        this._closeChildMenu();
      }, TIMER_DELAY);
    }
  }

  /**
   * Cancel the open timer, if the timer is pending.
   */
  private _cancelOpenTimer(): void {
    if (this._openTimerID !== 0) {
      clearTimeout(this._openTimerID);
      this._openTimerID = 0;
    }
  }

  /**
   * Cancel the close timer, if the timer is pending.
   */
  private _cancelCloseTimer(): void {
    if (this._closeTimerID !== 0) {
      clearTimeout(this._closeTimerID);
      this._closeTimerID = 0;
    }
  }

  private _childIndex = -1;
  private _openTimerID = 0;
  private _closeTimerID = 0;
  private _activeIndex = -1;
  private _childMenu: Menu = null;
  private _parentMenu: Menu = null;
  private _renderer: IMenuItemRenderer;
  private _items = new Vector<MenuItem>();
  private _nodes = new Vector<HTMLElement>();
}


// Define the signals for the `Menu` class.
defineSignal(Menu.prototype, 'closed');
defineSignal(Menu.prototype, 'triggered');


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   *
   */
  export
  function isSelectable(item: MenuItem): boolean {
    return !(item.type === 'separator' || item.disabled || item.hidden);
  }

  /**
   * Hide leading, trailing, and consecutive separator nodes.
   */
  export
  function hideExtraSeparators(items: Vector<MenuItem>, nodes: Vector<HTMLElement>): void {
    // Hide the leading separators.
    let k1 = 0;
    let n = items.length;
    for (; k1 < n; ++k1) {
      if (items.at(k1).type !== 'separator') {
        break;
      }
      nodes.at(k1).classList.add(HIDDEN_CLASS);
    }

    // Hide the trailing separators.
    let k2 = n - 1;
    for (; k2 >= 0; --k2) {
      if (items.at(k2).type !== 'separator') {
        break;
      }
      nodes.at(k2).classList.add(HIDDEN_CLASS);
    }

    // Hide the remaining consecutive separators.
    let hide = false;
    while (++k1 < k2) {
      if (items.at(k1).type !== 'separator') {
        hide = false;
      } else if (hide) {
        nodes.at(k1).classList.add(HIDDEN_CLASS);
      } else {
        hide = true;
      }
    }
  }

  /**
   * Open a menu as a root menu at the target location.
   */
  export
  function openRootMenu(menu: Menu, x: number, y: number, forceX: boolean, forceY: boolean): void {
    //
    sendMessage(menu, WidgetMessage.UpdateRequest);

    //
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    //
    let maxHeight = ch - (forceY ? y : 0);

    //
    let node = menu.node;
    let style = node.style;

    //
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    //
    Widget.attach(menu, document.body);

    //
    if (node.scrollHeight > maxHeight) {
      style.width = `${2 * node.offsetWidth - node.clientWidth}px`;
    }

    //
    let { width, height } = node.getBoundingClientRect();

    //
    if (!forceX && (x + width > px + cw)) {
      x = px + cw - width;
    }

    //
    if (!forceY && (y + height > py + ch)) {
      if (y > py + ch) {
        y = py + ch - height;
      } else {
        y = y - height;
      }
    }

    //
    style.top = `${Math.max(0, y)}px`;
    style.left = `${Math.max(0, x)}px`;

    //
    style.visibility = '';
  }

  /**
   * Open a menu as a submenu using an item node for positioning.
   */
  export
  function openSubmenu(menu: Menu, itemNode: HTMLElement): void {
    //
    sendMessage(menu, WidgetMessage.UpdateRequest);

    //
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    //
    let maxHeight = ch;

    //
    let node = menu.node;
    let style = node.style;

    //
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    //
    Widget.attach(menu, document.body);

    //
    if (node.scrollHeight > maxHeight) {
      style.width = `${2 * node.offsetWidth - node.clientWidth}px`;
    }

    //
    let { width, height } = node.getBoundingClientRect();

    //
    let box = boxSizing(menu.node);

    //
    let itemRect = itemNode.getBoundingClientRect();

    //
    let x = itemRect.right - SUBMENU_OVERLAP;

    //
    if (x + width > px + cw) {
      x = itemRect.left + SUBMENU_OVERLAP - width;
    }

    //
    let y = itemRect.top - box.borderTop - box.paddingTop;

    //
    if (y + height > py + ch) {
      y = itemRect.bottom + box.borderBottom + box.paddingBottom - height;
    }

    //
    style.top = `${Math.max(0, y)}px`;
    style.left = `${Math.max(0, x)}px`;

    //
    style.visibility = '';
  }
}
