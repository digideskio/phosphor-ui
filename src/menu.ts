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
 * The ms delay for opening a submenu.
 */
const OPEN_DELAY = 300;

/**
 * The ms delay for closing a submenu.
 */
const CLOSE_DELAY = 300;

/**
 * The horizontal px overlap for open submenus.
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
   * Get the currently active item.
   *
   * #### Notes
   * This will be `null` if no item is active.
   */
  get activeItem(): MenuItem {
    let i = this._activeIndex;
    return i !== -1 ? this._items.at(i) : null;
  }

  /**
   * Set the currently active item.
   *
   * #### Notes
   * If the item does not exist, the item will be set to `null`.
   */
  set activeItem(value: MenuItem) {
    this.activeIndex = indexOf(this._items, value);
  }

  /**
   * Get the currently active item node.
   *
   * #### Notes
   * This will be `null` if no item is active.
   */
  get activeItemNode(): HTMLElement {
    let i = this._activeIndex;
    return i !== -1 ? this._nodes.at(i) : null;
  }

  /**
   * Set the currently active item node.
   *
   * #### Notes
   * If the node does not exist, the node will be set to `null`.
   */
  set activeItemNode(value: HTMLElement) {
    this.activeIndex = indexOf(this._nodes, value);
  }

  /**
   * Get the index of the currently active item.
   *
   * #### Notes
   * This will be `-1` if no item is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active item.
   *
   * #### Notes
   * If the value is out of range, the index will be set to `-1`.
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

    // Create an uninitialized node for the item.
    // It will be inited on the next menu update.
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
   * @param x - The client X coordinate of the popup location.
   *
   * @param y - The client Y coordinate of the popup location.
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
    // Events attached to menu node:
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
    // Events attached to document node:
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'keypress':
      this._evtKeyPress(event as KeyboardEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('mouseup', this);
    //this.node.addEventListener('mousedown', this);
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
    //this.node.removeEventListener('mousedown', this);
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
      this._nodes.at(this._activeIndex).classList.add(ACTIVE_CLASS);
    }

    // Hide the extra separator nodes.
    Private.hideExtraSeparators(items, nodes);
  }

  /**
   * A message handler invoked on a `'close-request'` message.
   */
  protected onCloseRequest(msg: Message): void {
    // Cancel any pending open or close.
    this._cancelPendingOpen();
    this._cancelPendingClose();

    // Reset the active index.
    this.activeIndex = -1;

    // Close any open child menu.
    let childMenu = this._childMenu;
    if (childMenu) {
      this._childMenu = null;
      this._childItem = null;
      childMenu._parentMenu = null;
      childMenu.close();
    }

    // Remove this menu from any parent.
    let parentMenu = this._parentMenu;
    if (parentMenu) {
      this._parentMenu = null;
      parentMenu._cancelPendingOpen();
      parentMenu._cancelPendingClose();
      parentMenu._childMenu = null;
      parentMenu._childItem = null;
    }

    // Ensure this menu is detached.
    if (this.parent) {
      this.parent = null;
      //this.closed.emit(void 0);
    } else if (this.isAttached) {
      Widget.detach(this);
      //this.closed.emit(void 0);
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

    // Bail early if the mouse is already over the active index.
    if (i !== this._activeIndex) {
      return;
    }

    let item = this.activeItem;
    if (!item || !item.submenu) {
      return;
    }

    if (item === this._childItem) {
      this._cancelPendingClose();
    } else {
      this._closeChildMenu();
      this._openChildMenu(item, this._nodes.at(i));
    }

    // // Bail if there is no active item.
    // let item = this.activeItem;
    // if (!item) {
    //   return;
    // }

    // // Bail if the active node does not contain the clicked node.
    // if (!this.activeNode.contains(event.target as HTMLElement)) {
    //   return;
    // }

    // Trigger the item
    // let node = this._nodes[this.activeIndex];
    // if (node && node.contains(event.target as HTMLElement)) {
    //   this.triggerActiveItem();
    // }
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

    // Update the active index.
    this.activeIndex = i;

    // Synchronize the active ancestor items.
    this._syncAncestors();

    // Start the close timer for an open child menu.
    // this._closeChildMenu();

    // Cancel any pending open menu timer.
    this._cancelPendingOpen();

    // Bail if the active item has no submenu.
    let item = this.activeItem;
    if (!item || !item.submenu) {
      return;
    }

    // If the item has a submenu, open it or keep it open.
    // if (item === this._childItem) {
    //   this._cancelPendingClose();
    // } else {
    //   this._openChildMenuDelayed(item, this._nodes.at(i));
    // }
  }

  /**
   * Handle the `'mouseleave'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Cancel any pending submenu opening.
    this._cancelPendingOpen();

    // Bail if the mouse moved over the child menu.
    let child = this._childMenu;
    if (child && hitTest(child.node, event.clientX, event.clientY)) {
      return;
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Close any open child menu.
    this._closeChildMenu();
  }

  /**
   * Handle the `'keydown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Only process the event if the menu is a leaf.
    if (this._childMenu) {
      return;
    }

    // event.stopPropagation();
    // let leaf = this.leafMenu;
    // switch (event.keyCode) {
    // case 13:  // Enter
    //   event.preventDefault();
    //   leaf.triggerActiveItem();
    //   break;
    // case 27:  // Escape
    //   event.preventDefault();
    //   leaf.close();
    //   break;
    // case 37:  // Left Arrow
    //   event.preventDefault();
    //   if (leaf !== this) leaf.close();
    //   break;
    // case 38:  // Up Arrow
    //   event.preventDefault();
    //   leaf.activatePreviousItem();
    //   break;
    // case 39:  // Right Arrow
    //   event.preventDefault();
    //   leaf.openActiveItem();
    //   break;
    // case 40:  // Down Arrow
    //   event.preventDefault();
    //   leaf.activateNextItem();
    //   break;
    // }
  }

  /**
   * Handle the `'keypress'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtKeyPress(event: KeyboardEvent): void {
    // Only process the event if the menu is a leaf.
    if (this._childMenu) {
      return;
    }

    // event.preventDefault();
    // event.stopPropagation();
    // let key = String.fromCharCode(event.charCode);
    // this.leafMenu.activateMnemonicItem(key);
  }

  /**
   * Handle the `'mousedown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Only process the event if the menu is a root.
    if (this._parentMenu) {
      return;
    }

    // Hit test the menu hierarchy.
    let hit = false;
    let menu: Menu = this;
    let x = event.clientX;
    let y = event.clientY;
    while (!hit && menu) {
      hit = hitTest(menu.node, x, y);
      menu = menu._childMenu;
    }

    // If a child menu was hit, stop the propagation.
    if (hit) {
      // TODO stop propagation here?
      return;
    }

    // Otherwise, close the menu hierarchy. The event is allowed to
    // propagate so that other document listeners can act on it.
    this.close();
  }

  /**
   * Synchronize the active items of the ancestor hierarchy.
   *
   * ### Note
   * This ensures that the proper child items are activated for the
   * ancestors and that pending open and close tasks are canceled.
   */
  private _syncAncestors(): void {
    //
    let menu = this._parentMenu;
    while (menu) {
      //
      menu._cancelPendingOpen();
      menu._cancelPendingClose();

      //
      menu.activeIndex = indexOf(menu._items, menu._childItem);

      //
      menu = menu._parentMenu;
    }
  }

  /**
   * Open a menu item's submenu using the given node for location.
   *
   * #### Notes
   * This opens the child menu immediately.
   *
   * Any pending open operation will be canceled.
   *
   * If the given item is already open, this is a no-op.
   */
  private _openChildMenu(item: MenuItem, node: HTMLElement): void {
    //
    if (item === this._childItem) {
      return;
    }

    //
    this._cancelPendingOpen();

    //
    let menu = item.submenu;

    //
    this._childItem = item;
    this._childMenu = menu;

    //
    menu._parentMenu = this;

    //
    Private.openSubmenu(menu, node);
  }

  /**
   * Open a menu item's submenu using the given node for location.
   *
   * #### Notes
   * This opens the child menu on a delay.
   *
   * Any pending open operation will be canceled.
   *
   * If the given item is already open, this is a no-op.
   */
  private _openChildMenuDelayed(item: MenuItem, node: HTMLElement): void {
    //
    if (item === this._childItem) {
      return;
    }

    //
    this._cancelPendingOpen();

    //
    this._openTimerId = setTimeout(() => {
      this._openTimerId = 0;
      this._openChildMenu(item, node);
    }, OPEN_DELAY);
  }

  /**
   * Close the currently open child menu using a delayed task.
   *
   * #### Notes
   * This is a no-op if a task is pending or if there is no child menu.
   */
  private _closeChildMenu(): void {
    //
    if (this._closeTimerId || !this._childMenu) {
      return;
    }

    //
    this._closeTimerId = setTimeout(() => {
      //
      this._closeTimerId = 0;

      //
      let childMenu = this._childMenu;
      if (!childMenu) {
        return;
      }

      //
      this._childMenu = null;
      this._childItem = null;

      //
      childMenu._parentMenu = null;
      childMenu.close();
    }, CLOSE_DELAY);
  }

  /**
   * Cancel any pending child menu open task.
   */
  private _cancelPendingOpen(): void {
    if (this._openTimerId) {
      clearTimeout(this._openTimerId);
      this._openTimerId = 0;
    }
  }

  /**
   * Cancel any pending child menu close task.
   */
  private _cancelPendingClose(): void {
    if (this._closeTimerId) {
      clearTimeout(this._closeTimerId);
      this._closeTimerId = 0;
    }
  }

  private _openTimerId = 0;
  private _closeTimerId = 0;
  private _activeIndex = -1;
  private _childMenu: Menu = null;
  private _parentMenu: Menu = null;
  private _childItem: MenuItem = null;
  private _renderer: IMenuItemRenderer;
  private _items = new Vector<MenuItem>();
  private _nodes = new Vector<HTMLElement>();
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   *
   */
  export
  function isSelectable(item: MenuItem): boolean {
    if (item.type === 'separator') {
      return false;
    }
    if (item.disabled) {
      return false;
    }
    if (item.type === 'submenu') {
      return !!item.submenu;
    }
    return !!item.handler;
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
