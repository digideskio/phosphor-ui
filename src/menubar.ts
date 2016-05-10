/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each
} from 'phosphor-core/lib/iteration';

import {
  Message
} from 'phosphor-core/lib/messaging';

import {
  move
} from 'phosphor-core/lib/mutation';

import {
  findIndex, indexOf
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
  hitTest
} from './domutil';

import {
  Menu, MenuItem
} from './menu';

import {
  Title
} from './title';

import {
  Widget, WidgetFlag
} from './widget';


/**
 * The class name added to a menu bar widget.
 */
const MENU_BAR_CLASS = 'p-MenuBar';

/**
 * The class name added to a menu bar content node.
 */
const CONTENT_CLASS = 'p-MenuBar-content';

/**
 * The class name added to an open menu bar menu.
 */
const MENU_CLASS = 'p-MenuBar-menu';

/**
 * The class name added to a menu bar item node.
 */
const ITEM_CLASS = 'p-MenuBar-item';

/**
 * The class name added to a menu bar item icon cell.
 */
const ICON_CLASS = 'p-MenuBar-itemIcon';

/**
 * The class name added to a menu bar item text cell.
 */
const TEXT_CLASS = 'p-MenuBar-itemText';

/**
 * The class name added to an active menu bar and item.
 */
const ACTIVE_CLASS = 'p-mod-active';


/**
 * A widget which displays menus as a canonical menu bar.
 */
export
class MenuBar extends Widget {
  /**
   * Create the DOM node for a menu bar.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = CONTENT_CLASS;
    node.appendChild(content);
    node.tabIndex = -1;
    return node;
  }

  /**
   * Construct a new menu bar.
   *
   * @param options - The options for initializing the menu bar.
   */
  constructor(options: MenuBar.IOptions = {}) {
    super();
    this.addClass(MENU_BAR_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._renderer = options.renderer || MenuBar.ContentRenderer.instance;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._closeChildMenu();
    this._menus.clear();
    this._nodes.clear();
    this._renderer = null;
    super.dispose();
  }

  /**
   * A signal emitted when a menu item in the hierarchy is triggered.
   *
   * #### Notes
   * This signal is emitted when a descendant menu item in any menu in
   * the hierarchy is triggered, so consumers only need to to connect
   * to the triggered signal of the menu bar.
   *
   * The argument for the signal is the menu item which was triggered.
   */
  triggered: ISignal<MenuBar, MenuItem>;

  /**
   * Get the menu bar content node.
   *
   * #### Notes
   * This is the node which holds the menu title nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * A read-only sequence of the menus in the menu bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get menus(): ISequence<Menu> {
    return this._menus;
  }

  /**
   * Get the child menu of the menu bar.
   *
   * #### Notes
   * This will be `null` if the menu bar does not have an open menu.
   *
   * This is a read-only property.
   */
  get childMenu(): Menu {
    return this._childMenu;
  }

  /**
   * Get the currently active menu.
   *
   * #### Notes
   * This will be `null` if no menu is active.
   */
  get activeMenu(): Menu {
    let i = this._activeIndex;
    return i !== -1 ? this._menus.at(i): null;
  }

  /**
   * Set the currently active menu.
   *
   * #### Notes
   * If the menu does not exist, the menu will be set to `null`.
   */
  set activeMenu(value: Menu) {
    this.activeIndex = indexOf(this._menus, value);
  }

  /**
   * Get the index of the currently active menu.
   *
   * #### Notes
   * This will be `-1` if no menu is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active menu.
   *
   * #### Notes
   * If the index is out of range, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Coerce the value to an index.
    let i = Math.floor(value);
    if (i < 0 || i >= this._menus.length) {
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
   * Open the active menu and activate its first menu item.
   *
   * #### Notes
   * If there is no active menu, this is a no-op.
   */
  openActiveMenu(): void {
    if (this._activeIndex === -1) {
      return;
    }
    this._openChildMenu();
    this._childMenu.activeIndex = 0; // TODO first selectable instead of 0?
  }

  /**
   * Add a menu to the end of the menu bar.
   *
   * @param menu - The menu to add to the menu bar.
   *
   * #### Notes
   * If the menu is already added to the menu bar, it will be moved.
   */
  addMenu(menu: Menu): void {
    this.insertMenu(this._menus.length, menu);
  }

  /**
   * Insert a menu into the menu bar at the specified index.
   *
   * @param index - The index at which to insert the menu.
   *
   * @param menu - The menu to insert into the menu bar.
   *
   * #### Notes
   * The index will be clamped to the bounds of the menus.
   *
   * If the menu is already added to the menu bar, it will be moved.
   */
  insertMenu(index: number, menu: Menu): void {
    // Close the child menu before making changes.
    this._closeChildMenu();

    // Look up the index of the menu.
    let i = indexOf(this._menus, menu);

    // Clamp the insert index to the vector bounds.
    let j = Math.max(0, Math.min(Math.floor(index), this._menus.length));

    // If the menu is not in the vector, insert it.
    if (i === -1) {
      // Create the new item node for the menu.
      let node = this._renderer.createItemNode();
      this._renderer.updateItemNode(node, menu.title);

      // Insert the node and menu into the vectors.
      this._nodes.insert(j, node);
      this._menus.insert(j, menu);

      // Add the styling class to the menu.
      menu.addClass(MENU_CLASS);

      // Look up the next sibling node.
      let ref = j + 1 < this._nodes.length ? this._nodes.at(j + 1) : null;

      // Insert the item node into the content node.
      this.contentNode.insertBefore(node, ref);

      // Connect to the menu signals.
      menu.triggered.connect(this._onMenuTriggered, this);
      menu.aboutToClose.connect(this._onMenuAboutToClose, this);
      menu.title.changed.connect(this._onTitleChanged, this);
      menu.edgeRequested.connect(this._onEdgeRequested, this);

      // There is nothing more to do.
      return;
    }

    // Otherwise, the menu exists in the vector and should be moved.

    // Adjust the index if the location is at the end of the vector.
    if (j === this._menus.length) j--;

    // Bail if there is no effective move.
    if (i === j) return;

    // Move the item node and menu to the new locations.
    move(this._nodes, i, j);
    move(this._menus, i, j);

    // Look up the next sibling node.
    let ref = j + 1 < this._nodes.length ? this._nodes.at(j + 1) : null;

    // Move the node in the content node.
    this.contentNode.insertBefore(this._nodes.at(j), ref);
  }

  /**
   * Remove a menu from the menu bar.
   *
   * @param index - The index of the menu to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeMenu(index: number): void {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._menus.length) {
      return;
    }

    // Close the child menu before making changes.
    this._closeChildMenu();

    // Look up the node and menu.
    let node = this._nodes.at(i);
    let menu = this._menus.at(i);

    // Remove the node and menu from the vectors.
    this._nodes.remove(i);
    this._menus.remove(i);

    // Remove the menu from the dirty set.
    this._dirtyMenus.delete(menu);

    // Disconnect from the menu signals.
    menu.triggered.disconnect(this._onMenuTriggered, this);
    menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
    menu.title.changed.disconnect(this._onTitleChanged, this);

    // Remove the node from the content node.
    this.contentNode.removeChild(node);

    // Remove the styling class from the menu.
    menu.removeClass(MENU_CLASS);
  }

  /**
   * Remove all menus from the menu bar.
   */
  clearMenus(): void {
    // Bail if there is nothing to remove.
    if (this._menus.length === 0) {
      return;
    }

    // Close the child menu before making changes.
    this._closeChildMenu();

    // Disconnect from the menu signals and remove the styling class.
    each(this._menus, menu => {
      menu.triggered.disconnect(this._onMenuTriggered, this);
      menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
      menu.title.changed.disconnect(this._onTitleChanged, this);
      menu.edgeRequested.disconnect(this._onEdgeRequested, this);
      menu.removeClass(MENU_CLASS);
    });

    // Clear the node and menus vectors.
    this._nodes.clear();
    this._menus.clear();

    // Clear the dirty menu set.
    this._dirtyMenus.clear();

    // Clear the content node.
    this.contentNode.textContent = '';
  }

  /**
   * Handle the DOM events for the menu bar.
   *
   * @param event - The DOM event sent to the menu bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the menu bar's DOM nodes. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
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
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('mousedown', this);
    this.node.removeEventListener('mousemove', this);
    this.node.removeEventListener('mouseleave', this);
    this.node.removeEventListener('contextmenu', this);
    this._closeChildMenu();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let nodes = this._nodes;
    let menus = this._menus;
    let renderer = this._renderer;
    let activeMenu = this.activeMenu;
    let dirtyMenus = this._dirtyMenus;
    for (let i = 0, n = nodes.length; i < n; ++i) {
      let node = nodes.at(i);
      let menu = menus.at(i);
      if (dirtyMenus.has(menu)) {
        renderer.updateItemNode(node, menu.title);
      }
      if (menu === activeMenu) {
        node.classList.add(ACTIVE_CLASS);
      } else {
        node.classList.remove(ACTIVE_CLASS);
      }
    }
    dirtyMenus.clear();
  }

  /**
   * Handle the `'keydown'` event for the menu bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    switch (event.keyCode) {
    case 13: // Enter
    case 38: // Up Arrow
    case 40: // Down Arrow
      event.preventDefault();
      event.stopPropagation();
      this.openActiveMenu();
      break;
    case 27: // Escape
      event.preventDefault();
      event.stopPropagation();
      this._closeChildMenu();
      this.activeIndex = -1;
      this.blur();
      break;
    case 37: // Left Arrow
      event.preventDefault();
      event.stopPropagation();
      let i1 = this._activeIndex;
      let n1 = this._menus.length;
      this.activeIndex = i1 === 0 ? n1 - 1 : i1 - 1;
      break;
    case 39: // Right Arrow
      event.preventDefault();
      event.stopPropagation();
      let i2 = this._activeIndex;
      let n2 = this._menus.length;
      this.activeIndex = i2 === n2 - 1 ? 0 : i2 + 1;
      break;
    }
  }

  /**
   * Handle the `'mousedown'` event for the menu bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail if the mouse press was not on the menu bar. This can occur
    // when the document listener is installed for an active menu bar.
    let x = event.clientX;
    let y = event.clientY;
    if (!hitTest(this.node, x, y)) {
      return;
    }

    // Stop the propagation of the event. Immediate propagation is
    // also stopped so that an open menu does not handle the event.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Check if the mouse is over one of the menu items.
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // If the press was not on an item, close the child menu.
    if (i === -1) {
      this._closeChildMenu();
      return;
    }

    // If the press was not the left mouse button, do nothing further.
    if (event.button !== 0) {
      return;
    }

    // Otherwise, toggle the open state of the child menu.
    if (this._childMenu) {
      this._closeChildMenu();
      this.activeIndex = i;
    } else {
      this.activeIndex = i;
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mousemove'` event for the menu bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Check if the mouse is over one of the menu items.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // Bail early if the active index will not change.
    if (i === this._activeIndex) {
      return;
    }

    // Bail early if a child menu is open and the mouse is not over
    // an item. This allows the child menu to be kept open when the
    // mouse is over the empty part of the menu bar.
    if (i === -1 && this._childMenu) {
      return;
    }

    // Update the active index to the hovered item.
    this.activeIndex = i;

    // Open the new menu if a menu is already open.
    if (this._childMenu) {
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mouseleave'` event for the menu bar.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Reset the active index if there is no open menu.
    if (!this._childMenu) {
      this.activeIndex = -1;
    }
  }

  /**
   * Open the child menu at the active index immediately.
   *
   * If a different child menu is already open, it will be closed,
   * even if there is no active menu.
   */
  private _openChildMenu(): void {
    // If there is no active menu, close the current menu.
    let newMenu = this.activeMenu;
    if (!newMenu) {
      this._closeChildMenu();
      return;
    }

    // Bail, if there is no effective menu change.
    let oldMenu = this._childMenu;
    if (oldMenu === newMenu) {
      return;
    }

    // Swap the internal menu reference.
    this._childMenu = newMenu;

    // Close the current menu, or setup for the new menu.
    if (oldMenu) {
      oldMenu.close();
    } else {
      this.addClass(ACTIVE_CLASS);
      document.addEventListener('mousedown', this, true);
    }

    // Get the positioning data for the new menu.
    let node = this._nodes.at(this._activeIndex);
    let { left, bottom } = node.getBoundingClientRect();

    // Open the new menu at the computed location.
    newMenu.open(left, bottom, { forceX: true, forceY: true });
  }

  /**
   * Close the child menu immediately.
   *
   * This is a no-op if a child menu is not open.
   */
  private _closeChildMenu(): void {
    // Bail if no child menu is open.
    if (!this._childMenu) {
      return;
    }

    // Remove the active class from the menu bar.
    this.removeClass(ACTIVE_CLASS);

    // Remove the document listeners.
    document.removeEventListener('mousedown', this, true);

    // Clear the internal menu reference.
    let menu = this._childMenu;
    this._childMenu = null;

    // Close the menu.
    menu.close();

    // Reset the active index.
    this.activeIndex = -1;
  }

  /**
   * Handle the `triggered` signal of a menu.
   */
  private _onMenuTriggered(sender: Menu, item: MenuItem): void {
    this.triggered.emit(item);
  }

  /**
   * Handle the `aboutToClose` signal of a menu.
   */
  private _onMenuAboutToClose(sender: Menu): void {
    // Bail if the sender is not the child menu.
    if (sender !== this._childMenu) {
      return;
    }

    // Remove the active class from the menu bar.
    this.removeClass(ACTIVE_CLASS);

    // Remove the document listeners.
    document.removeEventListener('mousedown', this, true);

    // Clear the internal menu reference.
    this._childMenu = null;

    // Reset the active index.
    this.activeIndex = -1;
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirtyMenus.add(sender.owner as Menu);
    this.update();
  }

  /**
   * Handle the `edgeRequested` signal of a child menu.
   */
  private _onEdgeRequested(sender: Menu, args: 'left' | 'right'): void {
    let i = this._activeIndex;
    let n = this._menus.length;
    switch (args) {
    case 'left':
      this.activeIndex = i === 0 ? n - 1 : i - 1;
      break;
    case 'right':
      this.activeIndex = i === n - 1 ? 0 : i + 1;
      break;
    }
    this.openActiveMenu();
  }

  private _activeIndex = -1;
  private _childMenu: Menu = null;
  private _menus = new Vector<Menu>();
  private _dirtyMenus = new Set<Menu>();
  private _nodes = new Vector<HTMLElement>();
  private _renderer: MenuBar.IContentRenderer;
}


// Define the signals for the `MenuBar` class.
defineSignal(MenuBar.prototype, 'triggered');


/**
 * The namespaces for the `MenuBar` class statics.
 */
export
namespace MenuBar {
  /**
   * An options object for creating a menu bar.
   */
  export
  interface IOptions {
    /**
     * A custom renderer for creating menu bar content.
     */
    renderer?: IContentRenderer;
  }

  /**
   * An object which renders the content for a menu bar.
   *
   * #### Notes
   * User code can implement a custom renderer when the default
   * content created by the menu bar is insufficient.
   */
  export
  interface IContentRenderer {
    /**
     * Create a node for a menu bar item.
     *
     * @returns A new node for a menu bar item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateItemNode` method will be called for initialization.
     */
    createItemNode(): HTMLElement;

    /**
     * Update an item node to reflect the state of a menu title.
     *
     * @param node - An item node created by a call to `createItemNode`.
     *
     * @param title - The menu title holding the data for the node.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data in the menu title.
     */
    updateItemNode(node: HTMLElement, title: Title): void;
  }

  /**
   * The default concrete implementation of [[IContentRenderer]].
   */
  export
  class ContentRenderer implements IContentRenderer {
    /**
     * Create a node for a menu bar item.
     *
     * @returns A new node for a menu bar item.
     */
    createItemNode(): HTMLElement {
      let node = document.createElement('li');
      let icon = document.createElement('span');
      let text = document.createElement('span');
      node.className = ITEM_CLASS;
      icon.className = ICON_CLASS;
      text.className = TEXT_CLASS;
      node.appendChild(icon);
      node.appendChild(text);
      return node;
    }

    /**
     * Update an item node to reflect the state of a menu title.
     *
     * @param node - An item node created by a call to `createItemNode`.
     *
     * @param title - The menu title holding the data for the node.
     */
    updateItemNode(node: HTMLElement, title: Title): void {
      let icon = node.firstChild as HTMLElement;
      let text = node.lastChild as HTMLElement;
      let itemClass = ITEM_CLASS;
      let iconClass = ICON_CLASS;
      if (title.className) itemClass += ` ${title.className}`;
      if (title.icon) iconClass += ` ${title.icon}`;
      node.className = itemClass;
      icon.className = iconClass;
      text.textContent = title.text;
    }
  }

  /**
   * The namespace for the `ContentRenderer` class statics.
   */
  export
  namespace ContentRenderer {
    /**
     * A default instance of the `ContentRenderer` class.
     */
    export
    const instance = new ContentRenderer();
  }
}
