/* eslint-disable */
/**
 * @license Copyright (c) 2024, ACOS.
 */

import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import EventInfo from '@ckeditor/ckeditor5-utils/src/eventinfo';

export default class PasteImage extends Plugin {
	init() {
		let editor = this.editor;

		editor.editing.view.document.on( 'clipboardInput', async ( evt, data ) => {

			const dataTransfer = data.dataTransfer;

			if (dataTransfer.files.length != 1) {
				return;
			}

			const file = dataTransfer.files[0];

			if (!file.type.startsWith('image/')) {
				return;
			}

			evt.stop();

			const base64String: string = await new Promise(function (resolve, reject) {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = () => resolve(reader.result.toString());
				reader.onerror = error => reject(error);
			});

			console.log('Pasted image file converted to base64. Length: ' + base64String.length);

			let content = '<img src="' + base64String + '">';

			content = editor.data.htmlProcessor.toView( content );

			const eventInfo = new EventInfo( editor, 'inputTransformation' );

			editor.plugins.get('ClipboardPipeline').fire( eventInfo, {
				content,
				dataTransfer,
				targetRanges: data.targetRanges,
				method: data.method
			} );

		});
	}
}
