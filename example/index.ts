/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  TabPanel
} from '../lib/tabpanel';

import {
  Widget
} from '../lib/widget';

import '../styles/base.css';

import './index.css';


function createContent(title: string): Widget {
  let tooltip = `This is a tooltip message for: ${title}.`;
  let widget = new Widget();
  widget.addClass('content');
  widget.addClass(title.toLowerCase());
  widget.title.text = title;
  widget.title.closable = true;
  widget.title.tooltip = tooltip;
  return widget;
}


function main(): void {
  let red = createContent('Red');
  let yellow = createContent('Yellow');
  let blue = createContent('Blue');
  let green = createContent('Green');

  let panel = new TabPanel();
  panel.id = 'main';
  panel.tabsMovable = true;
  panel.addWidget(red);
  panel.addWidget(yellow);
  panel.addWidget(blue);
  panel.addWidget(green);

  Widget.attach(panel, document.body);

  window.onresize = () => { panel.update(); };
}


window.onload = main;
