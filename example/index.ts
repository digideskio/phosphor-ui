/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  SplitPanel
} from '../lib/split-panel';

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
  let red1 = createContent('red');
  let red2 = createContent('red');

  let yellow1 = createContent('yellow');
  let yellow2 = createContent('yellow');

  let green1 = createContent('green');
  let green2 = createContent('green');

  let blue1 = createContent('blue');
  let blue2 = createContent('blue');

  let sp3 = new SplitPanel();
  sp3.orientation = SplitPanel.Vertical;
  sp3.addWidget(red1);
  sp3.addWidget(green1);
  sp3.addWidget(blue1);

  let sp2 = new SplitPanel();
  sp2.orientation = SplitPanel.Horizontal;
  sp2.addWidget(sp3);
  sp2.addWidget(yellow1);
  sp2.addWidget(red2);

  let sp1 = new SplitPanel();
  sp1.orientation = SplitPanel.Vertical;
  sp1.addWidget(yellow2);
  sp1.addWidget(blue2);
  sp1.addWidget(sp2);
  sp1.addWidget(green2);
  sp1.id = 'main';

  Widget.attach(sp1, document.body);

  window.onresize = () => { sp1.update(); };
}


window.onload = main;
