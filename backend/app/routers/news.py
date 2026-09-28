import urllib.request
import json
import re
from xml.etree import ElementTree as ET
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/tax", tags=["Latest Tax News"])

NEWS_RSS_URL = "https://news.google.com/rss/search?q=Indian+income+tax+CBDT+Budget&hl=en-IN&gl=IN&ceid=IN:en"

@router.get("/news")
def get_latest_tax_news(category: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        req = urllib.request.Request(
            NEWS_RSS_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        xml_data = urllib.request.urlopen(req, timeout=8).read()
        root = ET.fromstring(xml_data)
        
        items = []
        for elem in root.findall("./channel/item")[:12]:
            title = elem.findtext("title", "Tax Update")
            link = elem.findtext("link", "https://incometaxindia.gov.in")
            pub_date = elem.findtext("pubDate", "")
            description = elem.findtext("description", "")
            source = elem.findtext("source", "Income Tax News")
            
            # Clean description HTML tags
            clean_desc = re.sub(r'<[^>]+>', '', description) if description else title
            
            # Category tagging heuristic
            cat = "General Tax"
            t_lower = (title + clean_desc).lower()
            if "cbdt" in t_lower or "circular" in t_lower or "notification" in t_lower:
                cat = "CBDT Notifications"
            elif "itr" in t_lower or "filing" in t_lower or "return" in t_lower or "deadline" in t_lower:
                cat = "ITR & Deadlines"
            elif "regime" in t_lower or "slab" in t_lower or "budget" in t_lower:
                cat = "Budget & Tax Slabs"
            elif "capital gain" in t_lower or "equity" in t_lower or "stcg" in t_lower or "ltcg" in t_lower:
                cat = "Capital Gains"
            elif "gst" in t_lower:
                cat = "GST & Indirect Tax"

            if category and category.lower() != "all" and category.lower() not in cat.lower():
                continue

            items.append({
                "title": title,
                "link": link,
                "pub_date": pub_date,
                "summary": clean_desc[:220] + "..." if len(clean_desc) > 220 else clean_desc,
                "source": source,
                "category": cat
            })
            
        return items if items else _fallback_news()
    except Exception as e:
        print(f"Error fetching live RSS news: {e}")
        return _fallback_news()

def _fallback_news() -> List[Dict[str, Any]]:
    return [
        {
            "title": "CBDT Issues Important Circular on Section 115BAC New Tax Regime Option",
            "link": "https://incometaxindia.gov.in",
            "pub_date": "2026-09-27",
            "summary": "Central Board of Direct Taxes clarifies Employer TDS deduction guidelines under New Tax Regime FY 2024-25.",
            "source": "Income Tax Department",
            "category": "CBDT Notifications"
        },
        {
            "title": "Union Budget 2024 Amendments: LTCG Tax Rate Revised to 12.5% with ₹1.25L Exemption",
            "link": "https://www.indiabudget.gov.in",
            "pub_date": "2026-09-26",
            "summary": "Finance Act 2024 updates equity LTCG exemption threshold to ₹1.25 Lakh per financial year for transfers post July 23, 2024.",
            "source": "Ministry of Finance",
            "category": "Budget & Tax Slabs"
        },
        {
            "title": "ITR Filing Deadlines & e-Verification Guidelines Released for AY 2025-26",
            "link": "https://incometax.gov.in",
            "pub_date": "2026-09-25",
            "summary": "Income Tax Department mandates 30-day window for e-Verification of returns to prevent processing delays.",
            "source": "Income Tax Portal",
            "category": "ITR & Deadlines"
        }
    ]
