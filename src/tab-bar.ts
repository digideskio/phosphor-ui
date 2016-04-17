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
  move
} from 'phosphor-core/lib/mutation';

import {
  indexOf, findIndex
} from 'phosphor-core/lib/searching';

import {
  ISequence
} from 'phosphor-core/lib/sequence';

import {
  Vector
} from 'phosphor-core/lib/vector';

import {
  hitTest
} from './dom-util';

import {
  Title
} from './title';

import {
  Widget, WidgetFlag
} from './widget';


/**
 * The class name added to TabBar instances.
 */
const TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to a tab bar body node.
 */
const BODY_CLASS = 'p-TabBar-body';

/**
 * The class name added to a tab bar header node.
 */
const HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to a tab bar content node.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to a tab bar footer node.
 */
const FOOTER_CLASS = 'p-TabBar-footer';

/**
 * The class name added to a tab bar tab.
 */
const TAB_CLASS = 'p-TabBar-tab';

/**
 * The class name added to a tab text node.
 */
const TEXT_CLASS = 'p-TabBar-tabText';

/**
 * The class name added to a tab icon node.
 */
const ICON_CLASS = 'p-TabBar-tabIcon';

/**
 * The class name added to a tab close icon node.
 */
const CLOSE_ICON_CLASS = 'p-TabBar-tabCloseIcon';

/**
 * The class name added to a tab bar and tab when dragging.
 */
const DRAGGING_CLASS = 'p-mod-dragging';

/**
 * The class name added to the current tab.
 */
const CURRENT_CLASS = 'p-mod-current';

/**
 * The class name added to a closable tab.
 */
const CLOSABLE_CLASS = 'p-mod-closable';

/**
 * The start drag distance threshold.
 */
const DRAG_THRESHOLD = 5;

/**
 * The detach distance threshold.
 */
const DETACH_THRESHOLD = 20;

/**
 * The tab transition duration.
 */
const TRANSITION_DURATION = 150;  // Keep in sync with CSS.


/**
 * The arguments object for a `tabDetachRequested` signal.
 */
export
interface ITabDetachArgs {
  /**
   * TODO
   */
  index: number;

  /**
   * The current client X position of the mouse.
   */
  clientX: number;

  /**
   * The current client Y position of the mouse.
   */
  clientY: number;
}


/**
 * The arguments object for a `tabMoved` signal.
 */
export
interface ITabMovedArgs {
  /**
   * The previous index of the tab.
   */
  fromIndex: number;

  /**
   * The current index of the tab.
   */
  toIndex: number;
}


/**
 * A factory object which creates tabs for a tab bar.
 */
export
interface ITabFactory {
  /**
   * Create a node for a tab.
   *
   * @returns A new node for a tab.
   *
   * #### Notes
   * The data in the node should be uninitialized. The `updateTabNode`
   * method will be called to initialize the data for the tab node.
   */
  createTab(): HTMLElement;

  /**
   * Update a tab node to reflect the state of a title.
   *
   * @param node - A tab node created by a call to `createTabNode`.
   *
   * @param title - The title object holding the data for the tab.
   *
   * #### Notes
   * This method should completely reset the state of the tab node to
   * reflect the data in the title.
   */
  updateTab(node: HTMLElement, title: Title): void;

  /**
   * Lookup the close icon descendant node for a tab node.
   *
   * @param node - A tab node created by a call to `createTabNode`.
   *
   * @returns The close icon descendant node, or `null` if none exists.
   *
   * #### Notes
   * This is used by the tab bar to detect clicks on the close icon.
   */
  closeIcon(node: HTMLElement): HTMLElement;
}


/**
 * A widget which displays titles as a row of tabs.
 */
export
class TabBar extends Widget {
  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let header = document.createElement('div');
    let body = document.createElement('div');
    let footer = document.createElement('div');
    let content = document.createElement('ul');
    header.className = HEADER_CLASS;
    body.className = BODY_CLASS;
    footer.className = FOOTER_CLASS;
    content.className = CONTENT_CLASS;
    body.appendChild(content);
    node.appendChild(header);
    node.appendChild(body);
    node.appendChild(footer);
    return node;
  }

  /**
   * Construct a new tab bar.
   *
   * @param factory - The factory for creating new tab nodes.
   */
  constructor(factory: ITabFactory = TabFactory.instance) {
    super();
    this._factory = factory;
    this.addClass(TAB_BAR_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this._factory = null;
    this._tabs.length = 0;
    this._titles.length = 0;
    this._currentIndex = -1;
    this._dirtyTitles.clear();
    super.dispose();
  }

  /**
   * Get the tab bar header node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar header.
   *
   * This is a read-only property.
   */
  get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar body node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar.
   *
   * This is a read-only property.
   */
  get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar footer.
   *
   * This is a read-only property.
   */
  get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * This is the node which holds the tab nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * A read-only sequence of the tabs in the tab bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get tabs(): ISequence<HTMLElement> {
    return this._tabs;
  }

  /**
   * A read-only sequence of the titles in the tab bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get titles(): ISequence<Title> {
    return this._titles;
  }

  /**
   * Get the index of the currently selected tab.
   *
   * #### Notes
   * This will be `-1` if no tab is selected.
   */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /**
   * Set the index of the currently selected tab.
   *
   * #### Notes
   * If the value is out of range, the index will be set to `-1`.
   */
  set currentIndex(value: number) {
    // TODO ...
  }

  /**
   * Get the currently selected tab node.
   *
   * #### Notes
   * This will be `null` if no tab is selected.
   */
  get currentTab(): HTMLElement {
    let i = this._currentIndex;
    return i !== -1 ? this._tabs.at(i) : null;
  }

  /**
   * Set the currently selected tab node.
   *
   * #### Notes
   * If the tab does not exist, the tab will be set to `null`.
   */
  set currentTab(value: HTMLElement) {
    this.currentIndex = indexOf(this._tabs, value);
  }

  /**
   * Get the currently selected title.
   *
   * #### Notes
   * This will be `null` if no tab is selected.
   */
  get currentTitle(): Title {
    let i = this._currentIndex;
    return i !== -1 ? this._titles.at(i) : null;
  }

  /**
   * Set the currently selected title.
   *
   * #### Notes
   * If the title does not exist, the title will be set to `null`.
   */
  set currentTitle(value: Title) {
    this.currentIndex = indexOf(this._titles, value);
  }

  /**
   * Get whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can be moved programmatically, irrespective of this value.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can be moved programmatically, irrespective of this value.
   */
  set tabsMovable(value: boolean) {
    this._tabsMovable = value;
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * @param title - The title which holds the data for the tab.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  addTab(title: Title): void {
    this.insertTab(this._titles.length, title);
  }

  /**
   * Insert a tab into the tab bar at the specified index.
   *
   * @param index - The index at which to insert the tab.
   *
   * @param title - The title which holds the data for the tab.
   *
   * #### Notes
   * The index will be clamped to the bounds of the tabs.
   *
   * If the title is already added to the tab bar, it will be moved.
   */
  insertTab(index: number, title: Title): void {
    // Release the mouse before making any changes.
    this._releaseMouse();

    // Lookup the index of the title.
    let i = indexOf(this._titles, title);

    // Clamp the insert index to the vector bounds.
    let j = Math.max(0, Math.min(Math.floor(index), this._titles.length));

    // If the title is not in the vector, insert it.
    if (i === -1) {
      // Create the new tab node for the title.
      let tab = this._factory.createTab();
      this._factory.updateTab(tab, title);

      // Insert the tab and title into the vectors.
      this._tabs.insert(j, tab);
      this._titles.insert(j, title);

      // Lookup the next sibling node.
      let ref = j + 1 < this._tabs.length ? this._tabs.at(j + 1) : null;

      // Insert the tab into the content node.
      this.contentNode.insertBefore(tab, ref);

      // Connect to the title changed signal.
      Title.changed.connect(title, this._onTitleChanged, this);

      // Update the current index.
      // TODO ...

      // Schedule an update to fix up the tab Z ordering.
      this.update();

      // There is nothing more to do.
      return;
    }

    // Otherwise, the title exists in the vector and should be moved.

    // Adjust the index if the location is at the end of the vector.
    if (j === this._titles.length) j--;

    // Bail if there is no effective move.
    if (i === j) return;

    // Move the tab and title to the new locations.
    move(this._tabs, i, j);
    move(this._titles, i, j);

    // Lookup the next sibling node.
    let ref = j + 1 < this._tabs.length ? this._tabs.at(j + 1) : null;

    // Move the tab in the content node.
    this.contentNode.insertBefore(this._tabs.at(j), ref);

    // Update the current index.
    // TODO ...

    // Schedule an update to fix up the tab Z ordering.
    this.update();
  }

  /**
   * Remove a tab from the tab bar.
   *
   * @param title - The title to remove from the tab bar.
   *
   * #### Notes
   * If the title does not exist, this is a no-op.
   */
  removeTab(title: Title): void {
    // Bail if the title does not exist.
    let i = indexOf(this._titles, title);
    if (i === -1) {
      return;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Lookup the corresponding tab node.
    let tab = this._tabs.at(i);

    // Remove the tab and title from the containers.
    this._tabs.remove(i);
    this._titles.remove(i);
    this._dirtyTitles.delete(title);

    // Disconnect from the title changed signal.
    Title.changed.connect(title, this._onTitleChanged, this);

    // Remove the tab from the content node.
    this.contentNode.removeChild(tab);

    // Update the current index.
    // TODO ...

    // Schedule an update to fix up the tab Z ordering.
    this.update();
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   *
   * #### Notes
   * This will cause the tab bar to stop handling mouse events and to
   * restore the tabs to their non-dragged positions.
   */
  releaseMouse(): void {
    this._releaseMouse();
  }

  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
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
    this.node.addEventListener('click', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('mousedown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let tabs = this._tabs;
    let titles = this._titles;
    let factory = this._factory;
    let dirtyTitles = this._dirtyTitles;
    let currentTitle = this.currentTitle;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let tab = tabs.at(i);
      let title = titles.at(i);
      if (dirtyTitles.has(title)) {
        factory.updateTab(tab, title);
      }
      if (title === currentTitle) {
        tab.classList.add(CURRENT_CLASS);
        tab.style.zIndex = `${n}`;
      } else {
        tab.classList.remove(CURRENT_CLASS);
        tab.style.zIndex = `${n - i - 1}`;
      }
    }
    dirtyTitles.clear();
  }

  /**
   * Handle the `'keydown'` event for the tab bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) this._releaseMouse();
  }

  /**
   * Handle the `'click'` event for the tab bar.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left click.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Do nothing if the click is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let index = findIndex(this._tabs, tab => hitTest(tab, x, y));
    if (index < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the click if the title is not closable.
    let title = this._titles.at(index);
    if (!title.closable) {
      return;
    }

    // Ignore the click if it was not on a close icon.
    let icon = this._factory.closeIcon(this._tabs.at(index));
    if (!icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the tab close requested signal.
    TabBar.tabCloseRequested.emit(this, { index, title }); // TODO
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Do nothing if the press is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let index = findIndex(this._tabs, tab => hitTest(tab, x, y));
    if (index < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the press if it was on a close icon.
    let icon = this._factory.closeIcon(this._tabs.at(index));
    if (icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Setup the drag data if the tabs are movable.
    if (this._tabsMovable) {
      this._dragData = new DragData();
      // TODO
      // this._dragData.index = index;
      // this._dragData.tab = this._tabs[index];
      // this._dragData.pressX = event.clientX;
      // this._dragData.pressY = event.clientY;
      document.addEventListener('mousemove', this, true);
      document.addEventListener('mouseup', this, true);
      document.addEventListener('keydown', this, true);
      document.addEventListener('contextmenu', this, true);
    }

    // Update the current item to the pressed item.
    // TODO
    // this.currentItem = this._items[i];
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  // private _evtMouseMove(event: MouseEvent): void {
  //   // Do nothing if no drag is in progress.
  //   if (!this._dragData) {
  //     return;
  //   }

  //   // Suppress the event during a drag.
  //   event.preventDefault();
  //   event.stopPropagation();

  //   // Ensure the drag threshold is exceeded before moving the tab.
  //   let data = this._dragData;
  //   if (!data.dragActive) {
  //     let dx = Math.abs(event.clientX - data.pressX);
  //     let dy = Math.abs(event.clientY - data.pressY);
  //     if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
  //       return;
  //     }

  //     // Fill in the rest of the drag data measurements.
  //     let tabRect = data.tab.getBoundingClientRect();
  //     data.tabLeft = data.tab.offsetLeft;
  //     data.tabWidth = tabRect.width;
  //     data.tabPressX = data.pressX - tabRect.left;
  //     data.tabLayout = TabBarPrivate.snapTabLayout(this._tabs);
  //     data.contentRect = this.contentNode.getBoundingClientRect();
  //     data.override = overrideCursor('default');

  //     // Add the dragging classes and mark the drag as active.
  //     data.tab.classList.add(DRAGGING_CLASS);
  //     this.addClass(DRAGGING_CLASS);
  //     data.dragActive = true;
  //   }

  //   // Emit the detach request signal if the threshold is exceeded.
  //   if (!data.detachRequested && TabBarPrivate.detachExceeded(data, event)) {
  //     data.detachRequested = true;
  //     let index = data.index;
  //     let item = this._items[index];
  //     let clientX = event.clientX;
  //     let clientY = event.clientY;
  //     this.tabDetachRequested.emit({ index, item, clientX, clientY });
  //     if (data.dragAborted) {
  //       return;
  //     }
  //   }

  //   // Update the tab layout and computed target index.
  //   TabBarPrivate.layoutTabs(this._tabs, data, event);
  // }

  /**
   * Handle the `'mouseup'` event for the tab bar.
   */
  // private _evtMouseUp(event: MouseEvent): void {
  //   // Do nothing if it's not a left mouse release.
  //   if (event.button !== 0) {
  //     return;
  //   }

  //   // Do nothing if no drag is in progress.
  //   if (!this._dragData) {
  //     return;
  //   }

  //   // Suppress the event during a drag operation.
  //   event.preventDefault();
  //   event.stopPropagation();

  //   // Remove the extra mouse event listeners.
  //   document.removeEventListener('mousemove', this, true);
  //   document.removeEventListener('mouseup', this, true);
  //   document.removeEventListener('keydown', this, true);
  //   document.removeEventListener('contextmenu', this, true);

  //   // Bail early if the drag is not active.
  //   let data = this._dragData;
  //   if (!data.dragActive) {
  //     this._dragData = null;
  //     return;
  //   }

  //   // Position the tab at its final resting position.
  //   TabBarPrivate.finalizeTabPosition(data);

  //   // Remove the dragging class from the tab so it can be transitioned.
  //   data.tab.classList.remove(DRAGGING_CLASS);

  //   // Complete the release on a timer to allow the tab to transition.
  //   setTimeout(() => {
  //     // Do nothing if the drag has been aborted.
  //     if (data.dragAborted) {
  //       return;
  //     }

  //     // Clear the drag data reference.
  //     this._dragData = null;

  //     // Reset the positions of the tabs.
  //     TabBarPrivate.resetTabPositions(this._tabs);

  //     // Clear the cursor grab and drag styles.
  //     data.override.dispose();
  //     this.removeClass(DRAGGING_CLASS);

  //     // If the tab was not moved, there is nothing else to do.
  //     let i = data.index;
  //     let j = data.targetIndex;
  //     if (j === -1 || i === j) {
  //       return;
  //     }

  //     // Move the tab and related tab item to the new location.
  //     arrays.move(this._tabs, i, j);
  //     arrays.move(this._items, i, j);
  //     this.contentNode.insertBefore(this._tabs[j], this._tabs[j + 1]);

  //     // Emit the tab moved signal and schedule a render update.
  //     this.tabMoved.emit({ fromIndex: i, toIndex: j, item: this._items[j] });
  //     this.update();
  //   }, TRANSITION_DURATION);
  // }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Remove the extra mouse listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Clear the drag data reference.
    let data = this._dragData;
    this._dragData = null;

    // Indicate the drag has been aborted. This allows the mouse
    // event handlers to return early when the drag is canceled.
    data.dragAborted = true;

    // If the drag is not active, there's nothing more to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the tabs to their non-dragged positions.
    TabBarPrivate.resetTabPositions(this._tabs);

    // Clear the cursor override.
    data.override.dispose();

    // Clear the dragging style classes.
    data.tab.classList.remove(DRAGGING_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirtyTitles.add(sender);
    this.update();
  }

  private _currentIndex = -1;
  private _tabsMovable = false;
  private _factory: ITabFactory;
  private _dragData: DragData = null;
  private _titles = new Vector<Title>();
  private _dirtyTitles= new Set<Title>();
  private _tabs = new Vector<HTMLElement>();
}


/**
 * A concrete implementation of [[ITabFactory]].
 */
export
class TabFactory implements ITabFactory {
  /**
   * Create a node for a tab.
   *
   * @returns A new node for a tab.
   */
  createTab(): HTMLElement {
    let node = document.createElement('li');
    let icon = document.createElement('span');
    let text = document.createElement('span');
    let close = document.createElement('span');
    node.className = TAB_CLASS;
    icon.className = ICON_CLASS;
    text.className = TEXT_CLASS;
    close.className = CLOSE_ICON_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(close);
    return node;
  }

  /**
   * Update a tab node to reflect the state of a title.
   *
   * @param node - A tab node created by a call to `createTabNode`.
   *
   * @param title - The title object holding the data for the tab.
   */
  updateTab(node: HTMLElement, title: Title): void {
    let tabInfix = title.className ? ` ${title.className}` : '';
    let tabSuffix = title.closable ? ` ${CLOSABLE_CLASS}` : '';
    let iconSuffix = title.icon ? `' ${title.icon}` : '';
    let icon = node.firstChild as HTMLElement;
    let text = icon.nextSibling as HTMLElement;
    node.className = `${TAB_CLASS} ${tabInfix} ${tabSuffix}`;
    icon.className = `${ICON_CLASS} ${iconSuffix}`;
    text.textContent = title.text;
    text.title = title.tooltip;
  }

  /**
   * Lookup the close icon descendant node for a tab node.
   *
   * @param node - A tab node created by a call to `createTabNode`.
   *
   * @returns The close icon descendant node, or `null` if none exists.
   */
  closeIcon(node: HTMLElement): HTMLElement {
    return node.lastChild as HTMLElement;
  }
}


/**
 * The namespace for the `TabFactory` class statics.
 */
export
namespace TabFactory {
  /**
   * A singleton instance of the `TabFactory` class.
   */
  export
  const instance = new TabFactory();
}


/**
 * A struct which holds the drag data for a tab bar.
 */
class DragData {
  // /**
  //  * The tab node being dragged.
  //  */
  // tab: HTMLElement = null;

  // /**
  //  * The index of the tab being dragged.
  //  */
  // index = -1;

  // /**
  //  * The offset left of the tab being dragged.
  //  */
  // tabLeft = -1;

  // /**
  //  * The offset width of the tab being dragged.
  //  */
  // tabWidth = -1;

  // /**
  //  * The original mouse X position in tab coordinates.
  //  */
  // tabPressX = -1;

  // /**
  //  * The tab target index upon mouse release.
  //  */
  // targetIndex = -1;

  // /**
  //  * The array of tab layout objects snapped at drag start.
  //  */
  // tabLayout: ITabLayout[] = null;

  // *
  //  * The mouse press client X position.

  // pressX = -1;

  // /**
  //  * The mouse press client Y position.
  //  */
  // pressY = -1;

  // /**
  //  * The bounding client rect of the tab bar content node.
  //  */
  // contentRect: ClientRect = null;

  // /**
  //  * The disposable to clean up the cursor override.
  //  */
  // override: IDisposable = null;

  // /**
  //  * Whether the drag is currently active.
  //  */
  // dragActive = false;

  // /**
  //  * Whether the drag has been aborted.
  //  */
  // dragAborted = false;

  // /**
  //  * Whether a detach request as been made.
  //  */
  // detachRequested = false;
}
