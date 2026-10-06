"""Genera entrega/la-placa-base-por-dentro.html: un único archivo con CSS, JS y fuentes incrustados."""
import base64, re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
def css(path):
    t = (root / path).read_text(encoding='utf-8')
    def font(m):
        f = (root / 'assets/css' / m.group(1)).resolve()
        return "url('data:font/woff2;base64," + base64.b64encode(f.read_bytes()).decode() + "')"
    return re.sub(r"url\('(\.\./fonts/[^']+)'\)", font, t)
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>\n' + css(m.group(1)) + '\n</style>', html)
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>', html)
out = root / 'entrega/la-placa-base-por-dentro.html'
out.write_text(html, encoding='utf-8')
print(out, round(out.stat().st_size / 1024), 'KB')
