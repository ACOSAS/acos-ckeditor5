/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module upload/adapters/base64uploadadapter
 */

/* globals window */

import { Plugin } from '@ckeditor/ckeditor5-core';
import FileRepository, { type UploadResponse, type FileLoader, type UploadAdapter } from '../filerepository.js';

type DomFileReader = globalThis.FileReader;

/**
 * A plugin that converts images inserted into the editor into [Base64 strings](https://en.wikipedia.org/wiki/Base64)
 * in the {@glink installation/getting-started/getting-and-setting-data editor output}.
 *
 * This kind of image upload does not require server processing – images are stored with the rest of the text and
 * displayed by the web browser without additional requests.
 *
 * Check out the {@glink features/images/image-upload/image-upload comprehensive "Image upload overview"} to learn about
 * other ways to upload images into CKEditor 5.
 */
export default class Base64UploadAdapter extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ FileRepository ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'Base64UploadAdapter' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		this.editor.plugins.get( FileRepository ).createUploadAdapter = loader => new Adapter( loader );
	}
}

/**
 * The upload adapter that converts images inserted into the editor into Base64 strings.
 */
class Adapter implements UploadAdapter {
	/**
	 * `FileLoader` instance to use during the upload.
	 */
	public loader: FileLoader;

	public reader?: DomFileReader;

	/**
	 * Creates a new adapter instance.
	 */
	constructor( loader: FileLoader ) {
		this.loader = loader;
	}

	/**
	 * Starts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#upload
	 */
	public upload(): Promise<UploadResponse> {
		return new Promise( ( resolve, reject ) => {
			const reader = this.reader = new window.FileReader();

			reader.addEventListener( 'load', () => {
				const img = new Image();
				img.src = reader.result != null ? reader.result.toString() : '';
				
				this.resizeBase64ImageAsync( img ).then( function() {
                    resolve( { default: img.src, width: img.width + 'px', height: img.height + 'px' } );
                } );
			} );

			reader.addEventListener( 'error', err => {
				reject( err );
			} );

			reader.addEventListener( 'abort', () => {
				reject();
			} );

			this.loader.file.then( file => {
				reader.readAsDataURL( file! );
			} );
		} );
	}

	/**
	 * Aborts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#abort
	 */
	public abort(): void {
		this.reader!.abort();
	}

	private async resizeBase64ImageAsync(img: any): Promise<void> {
		const maxImgWidth = 1200;
		const maxShowImgWidth = 600;
		const quality = 0.7;
		const imgMime = 'image/jpeg';

		const canvasImg: any = await new Promise(function (resolve, reject) {
			const canvasImg = new window.Image();
			canvasImg.addEventListener('load', function () {
				resolve(canvasImg);
			});
			canvasImg.addEventListener('error', reject);
			canvasImg.src = img.src;
			return canvasImg;
		});

		const ratio = canvasImg.width / canvasImg.height;
		const showWidth = Math.min(maxShowImgWidth, canvasImg.width);
		const showHeight = Math.round(showWidth / ratio);

		const canvas = document.createElement('canvas');
		canvas.width = Math.min(maxImgWidth, canvasImg.width);
		canvas.height = Math.round(canvas.width / ratio);

		const ctx = canvas.getContext('2d');
		ctx?.drawImage(canvasImg, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise(function (resolve) {
			canvas.toBlob(resolve, imgMime, quality);
		});

		const url = URL.createObjectURL(blob as Blob);
		img.src = url;
		img.style.width = showWidth + 'px';
		img.style.height = showHeight + 'px';
		img.width = showWidth;
		img.height = showHeight;
	}
}
