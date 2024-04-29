/* eslint-disable */
/**
 * @license Copyright (c) 2024, ACOS.
 */

import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import { DecoupledEditor } from "../../ckeditor";

export default class Fullscreen extends Plugin {
	public init(): void {
		this.editor.keystrokes.set("CTRL+SHIFT+F", () => {
			const decoupledEditor = this.editor as DecoupledEditor;
			if ( decoupledEditor.fullscreenHandler ) {
				decoupledEditor.fullscreenHandler();
			}
		});
	}
}
