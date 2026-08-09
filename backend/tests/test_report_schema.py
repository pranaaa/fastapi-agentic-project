from __future__ import annotations

from app.agents.nodes.report_writer import REQUIRED_HEADINGS, _ensure_headings


def test_ensure_headings_appends_missing():
    md = "## 1. Idea Snapshot\ntext"
    out = _ensure_headings(md)
    for h in REQUIRED_HEADINGS:
        assert h in out


def test_ensure_headings_preserves_existing():
    md = "\n\n".join(REQUIRED_HEADINGS) + "\n\nfull content"
    out = _ensure_headings(md)
    assert out.count("## 1. Idea Snapshot") == 1
