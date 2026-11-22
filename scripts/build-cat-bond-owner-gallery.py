"""Create a completely offline owner-only 21-cinematic HTML review page.
Works from repository files; NEVER deploys to production or unlocks game save.
"""
from pathlib import Path
import re
import base64
root=Path("public/cat-bond")
source=Path("qa/cat-bond-review-gallery-template.html")
html=source.read_text(encoding="utf-8")
png=base64.b64encode((root/"assets/duo-premium-sheet.webp").read_bytes()).decode("ascii")
def inline(match):
    filename=match.group(1)
    body=(root/"js"/(filename+".js")).read_text(encoding="utf-8")
    if filename=="duo-premium.js":
        old="img.src=(window.CatBondDuoAssetBase||'assets/')+'duo-premium-sheet.webp?v=duo-studio-approved-art';"
        new="img.src='data:image/webp;base64,"+png+"';"
        assert old in body, "Illustration asset loading changed"
        body=body.replace(old,new)
    return "<script>\n"+body.replace("</script", "<\\/script")+"\n</script>"
# Keep matching explicit to avoid accidentally replacing untrusted URLs.
regex=re.compile(r'<script src="\.\./public/cat-bond/js/([a-zA-Z0-9_-]+)\.js(?:\?[^"]*)?"></script>')
html,n=regex.subn(inline,html)
assert n>=9, f"Expected inline game modules, got {n}"
assert "img.src=\'data:image/webp;base64," in html, "Premium art not embedded"
html=html.replace('href="../public/cat-bond/"','href="https://morrowwish.vercel.app/cat-bond/"')
dest=Path("/tmp/cat-bond-premium-21-duos-review.html")
dest.write_text(html,encoding="utf-8")
print("Owner-only offline review gallery:",dest, "bytes:",dest.stat().st_size,"modules:",n)
