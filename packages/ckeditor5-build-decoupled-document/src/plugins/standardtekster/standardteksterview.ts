/* eslint-disable */
/**
 * @license Copyright (c) 2024, ACOS.
 */

import folderIcon from './icons/folder.svg';
import folderOpenIcon from './icons/folder-open.svg';
import textIcon from './icons/text.svg';
import View from '@ckeditor/ckeditor5-ui/src/view';
import './standardtekster.css';

export default class StandardteksterView extends View {
 
    constructor(locale, editor) {
        super(locale);

        this.editor = editor;

        const list = document.createElement('ul');

        for (const mappe of editor.standardTekster) {
            list.appendChild(this.createFolderListItem(mappe));
        }

        this.setTemplate({
            tag: 'div',
            children: [list]
        });
    }

    createFolderListItem(mappen) {
        const elem = document.createElement('li');
        elem.className = 'stdtext';
 
        elem.appendChild(this.createButton(mappen.navn, folderIcon));
        
        if (mappen.mapper.length > 0 || mappen.standardTekster.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'stdtext hidden';
 
            for (const mappe of mappen.mapper) {
                ul.appendChild(this.createFolderListItem(mappe));
            }
            
            for (const tekst of mappen.standardTekster) {
                ul.appendChild(this.createTextListItem(tekst));
            }
 
            elem.appendChild(ul);
        }
 
        elem.addEventListener('click', this.toggleFolder, false);
 
        return elem;
    }

    createTextListItem(text) {			
        const elem = document.createElement('li');
        elem.setAttribute('data-content', text.innhold);
        elem.className = 'stdtext';
        elem.appendChild(this.createButton(text.navn, textIcon));
        elem.addEventListener('click', this.clickText, false);
        return elem;
    }

    createButton(name, icon) {
        const btn = document.createElement('span');
        btn.tabIndex = 0;
        btn.className = 'stdtext actionBtn';
        btn.appendChild(this.createSpan(icon));
        btn.appendChild(this.createSpan(name));
        return btn;
    }

    createSpan(content) {
        const elem = document.createElement('span');
        elem.innerHTML = content;
        return elem;
    }

    toggleFolder = (event) => {
        if (event.currentTarget.classList.contains('open')) {
            event.currentTarget.classList.remove('open');
            event.currentTarget.children[0].children[0].innerHTML = folderIcon;
        }
        else {
            event.currentTarget.classList.add('open');
            event.currentTarget.children[0].children[0].innerHTML = folderOpenIcon;
        }

        const uls = event.currentTarget.getElementsByTagName('ul');

        if (uls.length > 0) {
            uls[0].classList.toggle('hidden');
        }
        
        event.cancelBubble = true;
    }

    clickText = (event) => {
        const content = event.currentTarget.getAttribute('data-content')
        const viewFragment = this.editor.data.processor.toView( content );
        const modelFragment = this.editor.data.toModel( viewFragment );
        this.editor.model.insertContent( modelFragment );

        this.editor.editing.view.focus();

        event.cancelBubble = true;
    }

    focus() {
        //To avoid 'ui-dropdown-panel-focus-child-missing-focus' warning
    }
}