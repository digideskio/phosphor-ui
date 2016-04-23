/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message
} from 'phosphor-core/lib/messaging';

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
  Widget, WidgetFlag
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
 * A type alias for the supported menu item types.
 */
export
type MenuItemType = 'normal' | 'check' | 'separator' | 'submenu';


/**
 * An options object for initializing a menu item.
 */
export
interface IMenuItemOptions {
  /**
   * The type of the menu item.
   *
   * #### Notes
   * The default type is `'normal'`.
   */
  type?: MenuItemType;

  /**
   * The text for the menu item.
   *
   * #### Notes
   * The default is an empty string.
   */
  text?: string;

  /**
   * The icon class for the menu item.
   *
   * #### Notes
   * Multiple class names can be separated by whitespace.
   *
   * The default is an empty string.
   */
  icon?: string;

  /**
   * The keyboard shortcut for the menu item.
   *
   * #### Notes
   * The shortcut is for decoration only.
   *
   * The default is an empty string.
   */
  shortcut?: string;

  /**
   * The checked state for the menu item.
   *
   * #### Notes
   * The default is `false`.
   */
  checked?: boolean;

  /**
   * The disabled state for the menu item.
   *
   * #### Notes
   * The default is `false`.
   */
  disabled?: boolean;

  /**
   * The extra class name to associate with the menu item.
   *
   * #### Notes
   * Multiple class names can be separated by whitespace.
   *
   * The default is an empty string.
   */
  className?: string;

  /**
   * The handler function for the menu item.
   *
   * #### Notes
   * The default is `null`.
   */
  handler?: (args: any) => void;

  /**
   * The arguments for the item handler.
   *
   * #### Notes
   * The default is `null`.
   */
  args?: any;

  /**
   * The submenu for the menu item.
   *
   * #### Notes
   * The default is `null`.
   */
  submenu?: Menu;
}


/**
 * An object which can be added to a menu widget.
 *
 * #### Notes
 * A menu item is treated as a simple data struct. Changes to a menu
 * item will be reflected in a menu the next time the menu is opened.
 */
export
class MenuItem {
  /**
   * Construct a new menu item.
   *
   * @param options - The initialization options for the menu item.
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
    if (options.className !== void 0) {
      this.className = options.className;
    }
    if (options.handler !== void 0) {
      this.handler = options.handler;
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
   * This value controls how the rest of the menu item properties are
   * interpreted by the menu widget and the menu item renderer.
   *
   * The default value is `'normal'`.
   */
  type: MenuItemType = 'normal';

  /**
   * The text for the menu item.
   *
   * #### Notes
   * An ampersand (`&`) before a character denotes the item mnemonic.
   *
   * The default renderer ignores this value for `'separator'` items.
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
   * The default renderer ignores this value for `'separator'` items.
   *
   * The default is an empty string.
   */
  icon = '';

  /**
   * The keyboard shortcut decoration for the menu item.
   *
   * #### Notes
   * This value is for decoration only.
   *
   * The default renderer ignores this value for `'separator'` and
   * `'submenu'` items.
   *
   * The default is an empty string.
   */
  shortcut = '';

  /**
   * The checked state for the menu item.
   *
   * #### Notes
   * The default is `false`.
   */
  checked = false;

  /**
   * The disabled state for the menu item.
   *
   * #### Notes
   * The default value is `false`.
   */
  disabled = false;

  /**
   * The extra class name to associate with the menu item.
   *
   * #### Notes
   * Multiple class names can be separated by whitespace.
   *
   * The default is an empty string.
   */
  className = '';

  /**
   * The handler function for the menu item.
   *
   * #### Notes
   * The default is `null`.
   */
  handler: (args: any) => void = null;

  /**
   * The arguments for the item handler.
   *
   * #### Notes
   * The default is `null`.
   */
  args: any = null;

  /**
   * The submenu for the menu item.
   *
   * #### Notes
   * The default is `null`.
   */
  submenu: Menu = null;
}


/**
 *
 */
export
interface IMenuItemRenderer {
  /**
   *
   */
  createItemNode(): HTMLElement;

  /**
   *
   */
  updateItemNode(node: HTMLElement, item: MenuItem): void;
}


/**
 *
 */
export
class MenuItemRenderer implements IMenuItemRenderer {
  /**
   *
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
   *
   */
  updateItemNode(node: HTMLElement, item: MenuItem): void {
    let sub = item.type === 'submenu';
    let sep = item.type === 'separator';
    let icon = node.firstChild as HTMLElement;
    let text = icon.nextSibling as HTMLElement;
    let shortcut = text.nextSibling as HTMLElement;
    node.className = this.createItemClassName(item);
    icon.className = ICON_CLASS + (item.icon ? ` ${item.icon}` : '');
    text.textContent = sep ? '' : item.text.replace(/&/g, '');
    shortcut.textContent = (sep || sub) ? '' : item.shortcut;
  }

  /**
   *
   */
  createItemClassName(item: MenuItem): string {
    let name = ITEM_CLASS;
    switch (item.type) {
    case 'normal':
      name += ` ${NORMAL_TYPE_CLASS}`;
      if (item.disabled || !item.handler) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'check':
      name += ` ${CHECK_TYPE_CLASS}`;
      if (item.checked) {
        name += ` ${CHECKED_CLASS}`;
      }
      if (item.disabled || !item.handler) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'submenu':
      name += ` ${SUBMENU_TYPE_CLASS}`;
      if (item.disabled || !item.submenu) {
        name += ` ${DISABLED_CLASS}`;
      }
      break;
    case 'separator':
      name += ` ${SEPARATOR_TYPE_CLASS}`;
      break;
    }
    if (item.className) {
      name += ` ${item.className}`;
    }
    return name;
  }
}


/**
 *
 */
export
namespace MenuItemRenderer {
  /**
   *
   */
  export
  const instance = new MenuItemRenderer();
}


/**
 *
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
   */
  constructor(renderer: IMenuItemRenderer = MenuItemRenderer.instance) {
    super();
    this._renderer = renderer;
    this.addClass(MENU_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
  }

  /**
   *
   */
  get items(): ISequence<MenuItem> {
    return this._items;
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
   * Find the root menu of this menu hierarchy.
   *
   * #### Notes
   * This is a read-only property.
   */
  get rootMenu(): Menu {
    let menu: Menu = this;
    while (menu._parentMenu) {
      menu = menu._parentMenu;
    }
    return menu;
  }

  /**
   * Find the leaf menu of this menu hierarchy.
   *
   * #### Notes
   * This is a read-only property.
   */
  get leafMenu(): Menu {
    let menu: Menu = this;
    while (menu._childMenu) {
      menu = menu._childMenu;
    }
    return menu;
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
   *
   */
  addItem(item: MenuItem): void {
    this.insertItem(this._items.length, item);
  }

  /**
   *
   */
  insertItem(index: number, item: MenuItem): void {
    // TODO - close if open?

    // Reset the active index.
    this._activeIndex = -1;

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
   *
   */
  removeItem(index: number): void {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._items.length) {
      return;
    }

    // TODO close if open?

    // Reset the active index.
    this._activeIndex = -1;

    // Look up the item node.
    let node = this._nodes.at(i);

    // Remove the item and node from the vectors.
    this._items.remove(i);
    this._nodes.remove(i);

    // Remove the node from the content node.
    this.contentNode.removeChild(node);
  }

  /**
   *
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

    // Hide the redundant and useless menu item nodes.
    // MenuPrivate.hideUselessItems(nodes, items);
  }

  private _activeIndex = 1;
  private _childMenu: Menu = null;
  private _parentMenu: Menu = null;
  private _renderer: IMenuItemRenderer;
  private _items = new Vector<MenuItem>();
  private _nodes = new Vector<HTMLElement>();
}
