from __future__ import annotations

import markdown as md_lib

_STYLE = """
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #111; max-width: 780px; margin: 0 auto; line-height: 1.55; }
h1, h2, h3 { color: #111; margin-top: 1.6em; }
h2 { border-bottom: 1px solid #ddd; padding-bottom: 4px; }
code, pre { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
ul { padding-left: 22px; }
blockquote { border-left: 3px solid #f59e0b; padding-left: 12px; color: #555; }
"""


def markdown_to_pdf(md: str) -> bytes:
    html_body = md_lib.markdown(md, extensions=["tables", "fenced_code"])
    html = f"<html><head><meta charset='utf-8'><style>{_STYLE}</style></head><body>{html_body}</body></html>"
    # Import weasyprint lazily so the whole app doesn't crash if system libs are missing.
    from weasyprint import HTML

    return HTML(string=html).write_pdf()
