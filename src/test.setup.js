import { JSDOM } from 'jsdom';

const dom = new JSDOM('<html><body></body></html>');
global.window = dom.window;
global.document = window.document;
global.navigator = window.navigator;
