const extensions = [
	'aac',  'ai', 'bmp', 'cs',
	'css', 'csv', 'doc', 'docx',
	'exe', 'gif', 'heic', 'html',
	'java', 'jpg', 'js', 'json',
	'jsx', 'key', 'm4p', 'md',
	'mdx', 'mov', 'mp3', 'mp4',
	'otf', 'pdf', 'php', 'png',
	'ppt', 'pptx', 'psd', 'py',
	'raw', 'rb', 'sass', 'scss',
	'sh', 'svg', 'tiff', 'tsx',
	'ttf', 'txt', 'wav', 'woff',
	'xls', 'xlsx', 'xml', 'yml'
];

class BootstrapExt {
    static getExt(title) {
        if (extensions.indexOf( title.split('.').pop() ) >= 0) {
            return 'bi-filetype-' + title.split('.').pop();
        } else {
            return 'bi-file-binary';
        }
    }
}