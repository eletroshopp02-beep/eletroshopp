from pathlib import Path
import re, html

src=Path("index.html").read_text(encoding="utf-8", errors="ignore")
out=Path("novo/data/extraction-report.txt")

lines=[]
lines.append(f"index.html bytes={len(src.encode('utf-8'))}")
lines.append(f"html tags: img={len(re.findall(r'<img\\b',src,re.I))}, article={len(re.findall(r'<article\\b',src,re.I))}, button={len(re.findall(r'<button\\b',src,re.I))}, li={len(re.findall(r'<li\\b',src,re.I))}")
lines.append("")

patterns=[
    r'(?i)(?:const|let|var)\\s+(?:products|produtos|catalogo|catalog|items|itens)\\s*=',
    r'(?i)products\\s*[:=]',
    r'(?i)produtos\\s*[:=]',
    r'(?i)catalog(?:o)?\\s*[:=]',
    r'(?i)pre[cç]o\\s*[:=]',
    r'(?i)price\\s*[:=]',
]
for p in patterns:
    m=re.search(p,src)
    lines.append(f"pattern {p}: {'FOUND' if m else 'not found'}" + (f" at {m.start()}" if m else ""))

lines.append("")
lines.append("Class names containing product/item/card:")
classes=[]
for m in re.finditer(r'class=["\']([^"\']+)["\']',src,re.I):
    for c in m.group(1).split():
        if re.search(r'(?i)(product|produto|item|card|catalog)',c):
            classes.append(c)
from collections import Counter
for c,n in Counter(classes).most_common(40):
    lines.append(f"{c}: {n}")

lines.append("")
lines.append("Image URLs (first 80 unique):")
urls=re.findall(r'(?i)(?:src|data-src|data-image)=["\']([^"\']+)["\']',src)
seen=[]
for u in urls:
    u=html.unescape(u)
    if u not in seen:
        seen.append(u)
for u in seen[:80]:
    lines.append(u)

lines.append("")
lines.append("Price-like strings (first 120 unique):")
prices=re.findall(r'R\\$\\s*[0-9]{1,3}(?:\\.[0-9]{3})*,[0-9]{2}|[0-9]{1,3}(?:\\.[0-9]{3})*,[0-9]{2}',src)
seen=[]
for p in prices:
    if p not in seen: seen.append(p)
for p in seen[:120]:
    lines.append(p)

out.write_text("\n".join(lines)+"\n",encoding="utf-8")
