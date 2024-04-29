/* eslint-disable */
/**
 * @license Copyright (c) 2024, ACOS.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import textIcon from './icons/text.svg';
import StandardteksterView from './standardteksterview';
 
export default class Standardtekster extends Plugin {
	static get pluginName() {
		return 'Standardtekster';
	}
	 
	init() {
		const editor = this.editor;
		const t = editor.t;
 
		editor.ui.componentFactory.add('standardTekster', locale => {
 
			const dropdownView = createDropdown(locale);
 
			dropdownView.buttonView.set({
				icon: textIcon,
				label: t( 'Sett inn standardtekst' ),
				tooltip: true
			});
 
			dropdownView.buttonView.bind('isVisible').to( editor, 'harStandardTekster');
			dropdownView.buttonView.unbind('isEnabled');
			dropdownView.buttonView.bind('isEnabled').to( editor, 'isReadOnly', value => !value);
 
			dropdownView.once('change:isOpen', () => { 
				const stdTextView = new StandardteksterView(locale, editor);
				dropdownView.panelView.children.add( stdTextView );
			});

			return dropdownView;
		});
	}
}