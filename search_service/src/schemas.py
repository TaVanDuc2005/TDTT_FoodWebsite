from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated, Dict, Any

# Xử lý ObjectId của Mongo
PyObjectId = Annotated[str, BeforeValidator(str)]

class MenuItem(BaseModel):
    name: str
    price: float = 0.0

class LocationModel(BaseModel):
    type: str = "Point"
    coordinates: List[float]

class ScoresModel(BaseModel):
    space: float = 0.0
    position: float = 0.0
    quality: float = 0.0
    service: float = 0.0
    price: float = 0.0

# Model hiển thị kết quả tìm kiếm
class RestaurantResult(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    address: str
    avg_rating: float
    
    # Các trường bổ sung
    menu: List[MenuItem] = []
    avatar_url: Optional[str] = None
    
    # Điểm số thuật toán (Quan trọng để debug xem tại sao quán này lên top)
    score: float = 0.0       # Điểm tổng hợp (Hybrid)
    semantic_score: float = 0.0
    tfidf_score: float = 0.0
    
    # Tọa độ (để vẽ bản đồ)
    lat: float = 0.0
    lon: float = 0.0

    class Config:
        populate_by_name = True

class RouteStep(BaseModel):
    step_index: int
    intent: Dict[str, Any] # Chứa {"keyword": "...", "district": "..."}
    candidates: List[RestaurantResult] # Danh sách quán gợi ý cho bước này

#Schemas trả về của Advanced Search
class MultiStepSearchResponse(BaseModel):
    original_query: str
    steps: List[RouteStep]

class RoutePlan(BaseModel):
    route_id: str
    total_score: float
    total_distance: float
    stops: List[RestaurantResult] # Danh sách các quán trong lộ trình này

# Cập nhật Response tổng
class MultiStepSearchResponse(BaseModel):
    original_query: str
    steps: List[RouteStep] # Danh sách ứng viên cho từng bước (để user tự chọn nếu muốn)
    suggested_routes: List[RoutePlan] = [] # 👇 THÊM: Top 3 lộ trình tốt nhất do AI ghép