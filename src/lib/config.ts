import type { Lang } from './i18n';

export interface FieldConfig {
	key: string;
	label: string;
	type: 'text' | 'longtext';
	private?: boolean;
}

export interface VitrineConfig {
	title: string;
	description: string;
	lang: Lang;
	fields: FieldConfig[];
}

export function defineConfig(config: VitrineConfig): VitrineConfig {
	return config;
}
