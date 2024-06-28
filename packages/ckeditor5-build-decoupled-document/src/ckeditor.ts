/* eslint-disable */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import { DecoupledEditor as DecoupledEditorBase } from '@ckeditor/ckeditor5-editor-decoupled';

import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { FontSize, FontFamily, FontColor, FontBackgroundColor } from '@ckeditor/ckeditor5-font';
import { CKFinderUploadAdapter } from '@ckeditor/ckeditor5-adapter-ckfinder';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Bold, Italic, Strikethrough, Underline, Subscript, Superscript } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CKBox } from '@ckeditor/ckeditor5-ckbox';
import { CKFinder } from '@ckeditor/ckeditor5-ckfinder';
import { EasyImage } from '@ckeditor/ckeditor5-easy-image';
import { Heading } from '@ckeditor/ckeditor5-heading';
import {
	Image, ImageCaption, ImageResize, ImageStyle, ImageToolbar, ImageUpload, PictureEditing, ImageTextAlternative
} from '@ckeditor/ckeditor5-image';
import { Indent } from '@ckeditor/ckeditor5-indent';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize } from '@ckeditor/ckeditor5-table';
import { TextTransformation } from '@ckeditor/ckeditor5-typing';
import { CloudServices } from '@ckeditor/ckeditor5-cloud-services';
import { Comments } from '@ckeditor/ckeditor5-comments';
import { TrackChanges } from '@ckeditor/ckeditor5-track-changes';
import Standardtekster from '../src/plugins/standardtekster/standardtekster';
import Fullscreen from '../src/plugins/fullscreen/fullscreen';
import PasteImage from '../src/plugins/pasteimage/pasteimage';
import Save from '../src/plugins/save/save';
import { Base64UploadAdapter } from '@ckeditor/ckeditor5-upload';

export default class DecoupledEditor extends DecoupledEditorBase {

	standardTekster: any;
	fullscreenHandler: any;
	saveHandler: any;	

	constructor(sourceElementOrData, config) {
		super(sourceElementOrData, config);
		this.model.document.on('change:data', (evt, batch) => {
			if (batch.isUndoable) {
				this.set('hasChanges', true);
			}
		});

		this.on('ready', () => {
			const commentsRepo = this.plugins.get('CommentsRepository');

			if (commentsRepo) {
				commentsRepo.on('addComment', evt => this.setChanged());
				commentsRepo.on('updateComment', evt => this.setChanged());
				commentsRepo.on('removeComment', evt => this.setChanged());
				commentsRepo.on('resolveCommentThread', evt => this.setChanged());
				commentsRepo.on('removeCommentThread', evt => this.setChanged());
				commentsRepo.on('reopenCommentThread', evt => this.setChanged());
			}
		});
	}

	setChanged() {
		this.set('hasChanges', true);
	}

	override setData(data) {		
		const html = this.convertBase64ImagesToBlob(data);
		super.setData(html);
	}

	async getData(options?: {
		rootName?: string;
		trim?: 'empty' | 'none';
		[ key: string ]: unknown;
	}) {
		const html = super.getData(options);

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		if (!doc || !doc.body) {
			return "";
		}

		const images = Array.from(doc.querySelectorAll('img[src^="blob:"], img[src^="http"]'));

		await Promise.all(
			images.map(async (elt) => {

				if (elt.src.toLowerCase().startsWith('http')) {
					await this.resizeBase64ImageAsync(elt);
				}

				this.removeImageFigureNode(elt);
				const dataUri = await this.getBase64FromBlob(elt.src);
				elt.src = dataUri;
			})
		);

		const tables = Array.from(doc.querySelectorAll('table'));
		tables.map((elt) => this.removeTableFigureNode(elt));

		return doc.body.innerHTML;
	}

	settStandardTekster(mapper: any) {
		this.standardTekster = mapper;
		this.set('harStandardTekster', mapper && mapper.length > 0);
	}

	setFullscreenHandler(handler: any) {
		this.fullscreenHandler = handler;
	}

	setSaveHandler(handler: any) {
		this.saveHandler = handler;
		this.set('showSaveButton', true);
	}

	removeImageFigureNode(img) {
		let figureNode = img.parentNode;
		if (figureNode && figureNode.tagName.toLowerCase() == 'figure') {
			let figureParent = figureNode.parentNode;

			if (figureParent) {
				let width = figureNode.style.getPropertyValue("width");
				if (width) {
					img.style.width = width;
				}

				figureNode.removeChild(img);
				figureParent.insertBefore(img, figureNode);
				figureParent.removeChild(figureNode);
			}
		}
	}

	removeTableFigureNode(table) {
		let figureNode = table.parentNode;
		if (figureNode && figureNode.tagName.toLowerCase() == 'figure') {
			const width = this.getFigureWidth(figureNode);

			console.log(width);

			table.style.width = width;

			let figureParent = figureNode.parentNode;

			if (figureParent) {
				figureNode.removeChild(table);
				figureParent.insertBefore(table, figureNode);
				figureParent.removeChild(figureNode);
			}
		}
	}

	getFigureWidth(figureNode: any): string {
		const figureWidth = figureNode.style.getPropertyValue("width");

		if (figureWidth.endsWith('px')) {
			return figureWidth;
		} else if (figureWidth.endsWith('%')) {
			const percentString = figureWidth.replace('%', '');

			if (Number.isFinite(+percentString)) {
				const percent = Number.parseFloat(+percentString);
				const clientRect = this.sourceElement.getBoundingClientRect();
	
				let width = (clientRect.width * percent / 100);
	
				width = Math.min(600, width);
				
				return width + 'px';
			}
		}

		return '';		
	}

	downloadData(url) {
		return new Promise((resolve, reject) => {
			const req = new XMLHttpRequest();
			req.open('GET', url, true);
			req.responseType = 'blob';

			req.addEventListener('load', () => resolve(req.response), {
				once: true,
				passive: true,
				capture: true,
			});

			req.addEventListener(
				'error',
				() =>
					reject({
						status: req.status,
						statusMsg: req.statusText,
						body: req.responseText,
					}),
				{
					once: true,
					passive: true,
					capture: true,
				}
			);

			req.send();
		});
	}

	async getBase64FromBlob(blobUri) {
		const data = await this.downloadData(blobUri);
		return await new Promise(function (resolve, reject) {
			const reader = new FileReader();

			reader.addEventListener('load', function () {
				resolve(reader.result);
			});
			reader.addEventListener('error', reject);
			reader.readAsDataURL(data);
		});
	}

	convertBase64ImagesToBlob(html: string): string {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		const dataImgs = Array.from(doc.querySelectorAll('img[src^="data:"]'));

		dataImgs.map((img) => {
			const blob = this.convertDataUriToBlob(img.src);
			const src = URL.createObjectURL(blob);
			img.src = src;
		});

		return doc && doc.body ? doc.body.innerHTML : "";
	}

	convertDataUriToBlob(dataUri): Blob {
		const arr = this.convertDataURIToBinary(dataUri);
		const mime = dataUri.substring('data:'.length, dataUri.indexOf(';'));
		return new Blob([arr], { type: mime });
	}

	convertDataURIToBinary(dataUri): Uint8Array {
		const BASE64_MARKER = ';base64,';
		const base64Index =
			dataUri.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
		const base64 = dataUri.substring(base64Index);
		const raw = window.atob(base64);
		const rawLength = raw.length;
		const array = new Uint8Array(rawLength);

		for (let i = 0; i < rawLength; i++) {
			array[i] = raw.charCodeAt(i);
		}
		return array;
	}

	async resizeBase64ImageAsync(img) {
		const maxImgWidth = 1200;
		const maxShowImgWidth = 600;
		const quality = 0.7;
		const imgMime = 'image/jpeg';
	
		const canvasImg = await new Promise(function (resolve, reject) {
			const canvasImg = new window.Image();
			canvasImg.addEventListener('load', function () {
				resolve(canvasImg);
			});
			canvasImg.setAttribute('crossOrigin', 'anonymous');
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
		ctx.drawImage(canvasImg, 0, 0, canvas.width, canvas.height);
	
		let blob = await new Promise(function (resolve) {
			canvas.toBlob(resolve, imgMime, quality);
		});
	
		const url = URL.createObjectURL(blob);
		img.src = url;
		img.style.width = showWidth + 'px';
		img.style.height = showHeight + 'px';
		img.width = showWidth;
		img.height = showHeight;
	}


	public static override builtinPlugins = [
		Essentials,
		Alignment,
		FontSize,
		FontFamily,
		FontColor,
		FontBackgroundColor,
		CKFinderUploadAdapter,
		Autoformat,
		Bold,
		Italic,
		Strikethrough,
		Underline,
		Subscript,
		Superscript,
		BlockQuote,
		CKBox,
		CKFinder,
		CloudServices,
		EasyImage,
		Heading,
		Image,
		ImageCaption,
		ImageResize,
		ImageStyle,
		ImageToolbar,
		ImageUpload,
		ImageTextAlternative,
		Indent,
		Link,
		List,
		Paragraph,
		PasteFromOffice,
		PictureEditing,
		Table,
		TableToolbar,
		TableProperties,
		TableCellProperties,
		TableColumnResize,
		TextTransformation,
		Base64UploadAdapter,
		Standardtekster,
		Fullscreen,
		Save,
		PasteImage,
		Comments,
		TrackChanges
	];

	public static override defaultConfig = {
		licenseKey: 'dm9HTGhKK25DbFNaUWJNelQzRHNaUjF4SXJieTJRc3lUdVNPWXJ4d3RkQkZwRVUwM2xQVm9nNEY0emVELU1qQXlOVEEwTWpNPQ==',
		toolbar: {
			items: [
				'save', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
			'|', 'bulletedList', 'numberedList',
			'|', 'indent', 'outdent',
			'|', 'alignment:left', 'alignment:center', 'alignment:right', 'alignment:justify',
			'|', 'imageUpload', 'insertTable', 'standardtekster',
			'|', 'heading',
			'|', 'undo', 'redo',
			'|', 'trackChanges', 'comment'
			]
		},
		image: {
			resizeUnit: 'px' as const,
			styles: {
				options: [ 'alignLeft', 'alignCenter', 'alignRight' ],
			},
			toolbar: [
				// 'imageStyle:alignLeft',
				// 'imageStyle:alignCenter',
				// 'imageStyle:alignRight',
				'imageTextAlternative'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells',
				'tableProperties',
				'tableCellProperties'
			]
		},
		heading: {
			options: [
				{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
				{ model: 'heading4', view: 'h4', title: 'Heading 1', class: 'ck-heading_heading4' },
				{ model: 'heading5', view: 'h5', title: 'Heading 2', class: 'ck-heading_heading5' },
				{ model: 'heading6', view: 'h6', title: 'Heading 3', class: 'ck-heading_heading6' }
			]
		},
		locale: {
			dateTimeFormat: (date: Date) => date.toLocaleString('nb-NO')
		},
		comments: {

			editorConfig: {}
		},

		// This value must be kept in sync with the language defined in webpack.config.js.
		language: 'en'
	};
}
