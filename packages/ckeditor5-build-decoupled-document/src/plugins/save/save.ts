/* eslint-disable */
/**
 * @license Copyright (c) 2024, ACOS.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Command from '@ckeditor/ckeditor5-core/src/command';
import saveIcon from './icons/save.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
 
export default class Save extends Plugin {
    static get pluginName() {
        return 'Save';
    }
     
    init() {
        const editor = this.editor;
        const t = editor.t;

        editor.commands.add('save', new SaveCommand(this.editor));
        const saveCommand = editor.commands.get('save');

        if (this.editor.plugins.has('TrackChangesEditing')) {
            const trackChangesEditing = editor.plugins.get('TrackChangesEditing');
		    trackChangesEditing.enableCommand('save');
        }        

        editor.keystrokes.set("CTRL+S", (keyEvtData, cancel) => {
			cancel();
            editor.execute('save');
		});        
 
        editor.ui.componentFactory.add('save', locale => {

            const view = new ButtonView( locale );
 
            view.set({
                label: t('Lagre (CTRL+S)'),
                icon: saveIcon,
                tooltip: true,
                tooltipPosition: 'se'
            });

            view.on('execute', async () => {
              await editor.execute('save');
            });

            view.bind('isVisible').to(editor, 'showSaveButton');
            view.bind('isEnabled').to(saveCommand, 'isEnabled');

            return view;
        });
     }
 }

 export class SaveCommand extends Command {    

    constructor(editor) {
        super(editor);
        
        this.bind('isEnabled').to(editor, 'hasChanges');
    }

    async execute() {
        if (this.editor.saveHandler) {
            const data = await this.editor.getData();
            const saved = await this.editor.saveHandler(data);
            this.editor.set("hasChanges", !saved);
            this.refresh();
        }
    }

    refresh() {
        //Don't remove this method. Save button enabling will no longer work correctly.
    }
}