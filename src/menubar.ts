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
  indexOf
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
    // TODO close menu
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
    // TODO close/reset

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

      // Look up the next sibling node.
      let ref = j + 1 < this._nodes.length ? this._nodes.at(j + 1) : null;

      // Insert the item node into the content node.
      this.contentNode.insertBefore(node, ref);

      // Connect to the menu triggered signal.
      menu.triggered.connect(this._onMenuTriggered, this);

      // Connect to the title changed signal.
      menu.title.changed.connect(this._onTitleChanged, this);

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

    // TODO close/reset

    // Look up the node and menu.
    let node = this._nodes.at(i);
    let menu = this._menus.at(i);

    // Remove the node and menu from the vectors.
    this._nodes.remove(i);
    this._menus.remove(i);

    // Remove the menu from the dirty set.
    this._dirtyMenus.delete(menu);

    // Disconnect from the menu triggered signal.
    menu.triggered.connect(this._onMenuTriggered, this);

    // Disconnect from the title changed signal.
    menu.title.changed.disconnect(this._onTitleChanged, this);

    // Remove the node from the content node.
    this.contentNode.removeChild(node);
  }

  /**
   * Remove all menus from the menu bar.
   */
  clearMenus(): void {
    // Bail if there is nothing to remove.
    if (this._menus.length === 0) {
      return;
    }

    // TODO close/reset

    // Disconnect from the menu triggered and title changed signals.
    each(this._menus, menu => {
      menu.triggered.disconnect(this._onMenuTriggered, this);
      menu.title.changed.disconnect(this._onTitleChanged, this);
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
   * Handle the `triggered` signal of a menu.
   */
  private _onMenuTriggered(sender: Menu, item: MenuItem): void {
    this.triggered.emit(item);
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirtyMenus.add(sender.owner as Menu);
    this.update();
  }

  private _activeIndex = -1;
  private _menus = new Vector<Menu>();
  private _dirtyMenus = new Set<Menu>();
  private _nodes = new Vector<HTMLElement>();
  private _renderer: MenuBar.IContentRenderer;
}


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


// Define the signals for the `MenuBar` class.
defineSignal(MenuBar.prototype, 'triggered');
