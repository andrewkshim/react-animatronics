import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { JSDOM } from 'jsdom';

Enzyme.configure({ adapter: new Adapter() });

const dom = new JSDOM('<html><body></body></html>');
global.window = dom.window;
global.document = window.document;
global.navigator = window.navigator;
