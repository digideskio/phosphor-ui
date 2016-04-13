/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  BoxPanel
} from '../lib/box-panel';

import {
  Widget
} from '../lib/widget';

import '../styles/base.css';

import './index.css';


function createContent(name: string): Widget {
  let widget = new Widget();
  widget.addClass('content');
  widget.addClass(name);
  return widget;
}


function main(): void {
  let red = createContent('red');
  let green = createContent('green');
  let blue = createContent('blue');
  let yellow = createContent('yellow');

  BoxPanel.setStretch(red, 1);
  BoxPanel.setStretch(green, 2);
  BoxPanel.setStretch(blue, 3);
  BoxPanel.setStretch(yellow, 1);

  let panel = new BoxPanel();
  panel.id = 'main';
  panel.addWidget(red);
  panel.addWidget(green);
  panel.addWidget(blue);
  panel.addWidget(yellow);

  let refresh = () => {
    if (document.documentElement.offsetWidth < 600) {
      panel.direction = BoxPanel.TopToBottom;
    } else {
      panel.direction = BoxPanel.LeftToRight;
    }
    panel.update();
  };

  Widget.attach(panel, document.body);

  refresh();

  window.onresize = refresh;
}


window.onload = main;
