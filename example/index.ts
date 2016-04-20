/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  TabBar
} from '../lib/tabbar';

import {
  Title
} from '../lib/title';

import {
  Widget
} from '../lib/widget';

import '../styles/base.css';

import './index.css';


function createTitle(text: string): Title {
  let tooltip = `This is a tooltip message for: ${text}.`;
  return new Title({ text, tooltip, closable: true });
}


function main(): void {
  let tb = new TabBar();
  tb.id = 'main';
  tb.tabsMovable = true;

  tb.addTab(createTitle('One'));
  tb.addTab(createTitle('Two'));
  tb.addTab(createTitle('Three'));
  tb.addTab(createTitle('Four'));
  tb.addTab(createTitle('Five'));
  tb.addTab(createTitle('Six'));
  tb.addTab(createTitle('Seven'));

  tb.tabCloseRequested.connect((sender, args) => {
    sender.removeTab(args.index);
  });

  Widget.attach(tb, document.body);
}


window.onload = main;
