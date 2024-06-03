/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* eslint-env node */

'use strict';

const upath = require( 'upath' );

const PACKAGES_DIRECTORY = 'packages';

const RELEASE_DIRECTORY = 'release';

const CKEDITOR5_ROOT_PATH = upath.join( __dirname, '..', '..', '..' );

const CKEDITOR5_COMMERCIAL_PATH = upath.resolve( CKEDITOR5_ROOT_PATH, 'external', 'ckeditor5-commercial' );

const CKEDITOR5_INDEX = upath.join( CKEDITOR5_ROOT_PATH, 'src', 'index.ts' );

const CKEDITOR5_PREMIUM_FEATURES_INDEX = upath.join(
	CKEDITOR5_COMMERCIAL_PATH, PACKAGES_DIRECTORY, 'ckeditor5-premium-features', 'src', 'index.ts'
);

const S3_COPY_DIR_ARGS = '--recursive --metadata-directive REPLACE --cache-control max-age=31536000';
const S3_COPY_FILE_ARGS = '--metadata-directive REPLACE --cache-control max-age=31536000';

const CDN_S3_BUCKET = 'ckeditor-cdn-prod-files';
const CDN_CLOUDFRONT_ID = 'E15BDG1F16R4YA';

module.exports = {
	PACKAGES_DIRECTORY,
	RELEASE_DIRECTORY,
	CKEDITOR5_ROOT_PATH,
	CKEDITOR5_COMMERCIAL_PATH,
	CKEDITOR5_INDEX,
	CKEDITOR5_PREMIUM_FEATURES_INDEX,
	S3_COPY_DIR_ARGS,
	S3_COPY_FILE_ARGS,
	CDN_S3_BUCKET,
	CDN_CLOUDFRONT_ID
};
