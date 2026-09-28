from app.routers.news import get_latest_tax_news

def test_get_latest_tax_news():
    items = get_latest_tax_news()
    assert len(items) > 0
    first = items[0]
    assert "title" in first
    assert "link" in first
    assert "category" in first
