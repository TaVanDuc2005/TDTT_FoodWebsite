from fastapi import APIRouter, Query
from typing import Optional, List

# Import bộ não xử lý
from src.core.search_engine import HybridFoodFinder
from src.core.nlp_parser import IntentParser
from src.schemas import RestaurantResult, RouteStep, MultiStepSearchResponse

# Tạo Router
router_v1 = APIRouter(prefix="/api/v1/search", tags=["Search"])
router_v2 = APIRouter(prefix="/api/v2/search", tags=["Search V2"])


# --- KHỞI TẠO ENGINE (SINGLETON) ---
# Load 1 lần duy nhất khi server chạy
print("⏳ Đang khởi động Search Engine...")
try:
    engine = HybridFoodFinder() # Tự động load từ MongoDB
    nlp = IntentParser()
    # planner = RoutePlanner(engine)
except Exception as e:
    print(f"❌ Lỗi khởi tạo Search Engine: {e}")
    engine = None
    nlp = None
    planner = None

# ==========================================
# API 1: TÌM KIẾM THƯỜNG (Hybrid Search)
# ==========================================
@router_v1.get("/", response_model=List[RestaurantResult])
def search_restaurants(
    q: str = Query(..., description="Từ khóa tìm kiếm (VD: Cơm tấm)"),
    district: Optional[str] = Query(None, description="Lọc theo quận"),
    lat: Optional[float] = Query(10.7769, description="Vĩ độ hiện tại của User"),
    lon: Optional[float] = Query(106.7009, description="Kinh độ hiện tại của User"),
    radius: float = Query(0, description="Bán kính tìm kiếm (km)"),
    alpha: float = Query(0.6, description="Trọng số AI (0.0 -> 1.0)"),
    top_k: int = 20
):
    """
    Tìm kiếm quán ăn kết hợp ngữ nghĩa (AI) và từ khóa (TF-IDF).
    Có lọc theo bán kính nếu truyền lat/lon.
    """
    if not engine:
        return []

    # Xử lý tọa độ center
    center = (lat, lon)

    # Gọi engine xử lý (Hàm search trong core/search_engine.py)
    results = engine.search(
        query=q,
        district=district,
        alpha=alpha,
        top_k=top_k,
        center=center,
        radius_km=radius
    )
    
    return results

# ==========================================
# API 2: TEST PARSER + TÌM KIẾM
# ==========================================
@router_v2.get("/", response_model=MultiStepSearchResponse)
def search_restaurants_v2(
    q: str = Query(..., description="Từ khóa tìm kiếm (VD: Cơm tấm)"),
    lat: Optional[float] = Query(10.7769, description="Vĩ độ hiện tại của User"),
    lon: Optional[float] = Query(106.7009, description="Kinh độ hiện tại của User"),
    radius: float = Query(0, description="Bán kính tìm kiếm (km)"),
    alpha: float = Query(0.6, description="Trọng số AI (0.0 -> 1.0)"),
    top_k: int = 5
):
    if not engine or not nlp:
        return {"original_query": q, "steps": []}
    
    intents = nlp.parse(q)
    print(f"🤖 Intents: {intents}")

    steps_result = []

    #Route Optimize sẽ được gọi ở đây
    for idx, intent in enumerate(intents):
        keyword = intent.get("keyword", "")
        district = intent.get("district")

        candidates = engine.search(
            query=keyword,
            district=district,
            top_k=top_k,
            center=(lat, lon),
            radius_km=radius,
            alpha=alpha
        )

        step_data = RouteStep(
            step_index=idx + 1,
            intent=intent,
            candidates=candidates
        )
        steps_result.append(step_data)
    
    return {
        "original_query": q,
        "steps": steps_result
    }