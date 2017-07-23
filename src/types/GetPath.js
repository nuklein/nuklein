// @flow
/* eslint import/prefer-default-export: 0 */
export type GetPath = string | Array<GetPath> | {
	_path?: string;
	[propName: string]: GetPath;
};
