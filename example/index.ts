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
  Menu, MenuItem, MenuTemplate
} from '../lib/menu';

import '../styles/base.css';

import './index.css';


const MENU_TEMPLATE: MenuTemplate = [
  {
    text: '&&Copy',
    icon: 'fa fa-copy',
    shortcut: 'Ctrl+C',
    command: 'copy'
  },
  {
    text: 'Cu&&t',
    icon: 'fa fa-cut',
    shortcut: 'Ctrl+X',
    command: 'cut'
  },
  {
    text: '&&Paste',
    icon: 'fa fa-paste',
    shortcut: 'Ctrl+V',
    command: 'paste'
  },
  {
    type: 'separator'
  },
  {
    text: '&&New Tab',
    command: 'new-tab'
  },
  {
    text: '&&Close Tab',
    command: 'close-tab'
  },
  {
    type: 'check',
    checked: true,
    text: '&&Save On Exit',
    command: 'save-on-exit'
  },
  {
    type: 'separator'
  },
  {
    text: 'Task Manager',
    disabled: true
  },
  {
    type: 'separator'
  },
  {
    type: 'submenu',
    text: 'More...',
    submenu: [
      {
        text: 'One',
        command: 'one'
      },
      {
        text: 'Two',
        command: 'two'
      },
      {
        text: 'Three',
        command: 'three'
      },
      {
        text: 'Four',
        command: 'four'
      }
    ]
  },
  {
    type: 'separator'
  },
  {
    text: 'Close',
    icon: 'fa fa-close',
    command: 'close'
  }
];


function main(): void {

  let menu = Menu.fromTemplate(MENU_TEMPLATE);

  menu.triggered.connect((sender, item) => {
    if (item.command === 'save-on-exit') {
      item.checked = !item.checked;
    }
    console.log('triggered:', item.command);
  });

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    menu.open(event.clientX, event.clientY);
  });
}


window.onload = main;
