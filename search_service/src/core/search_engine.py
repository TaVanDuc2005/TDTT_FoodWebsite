# search_engine.py
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from geopy.distance import geodesic

from src.database import get_collection
from src.config import settings
from src.core.embedder import RestaurantEmbedder


class HybridFoodFinder:
    """
    Search engine kết hợp:
    - Dense semantic (BGE-m3)
    - TF-IDF keyword
    - Lọc theo bán kính
    """

    def __init__(self):

        # 1. Load & chuẩn hoá dữ liệu
        self.df = self._load_data_from_mongo()

        if self.df.empty:
            print("⚠️ Warning: Database is empty!")
            return
        # 2. Khởi tạo embedder (BGE-m3)
        self.embedder = RestaurantEmbedder()

        # 3. Tạo semantic embeddings (dense)
        self.semantic_matrix = self.embedder.embeddings(self.df)

        # 4. Tạo TF-IDF model (sparse)
        self.vectorizer, self.tfidf_matrix = self._create_tfidf_model()

    def _load_data_from_mongo(self) -> pd.DataFrame:
        """Lấy dữ liệu từ Mongo và chuyển thành DataFrame"""
        col = get_collection(settings.COLLECTION_NAME)
        # Lấy tất cả, giữ _id để làm khớp cache
        cursor = col.find({})
        data_list = list(cursor)
        if not data_list:
            return pd.DataFrame()
        
        '''
        Flatten DATA
        '''
        flattened_data = []
        for item in data_list:
            # 1. Cơ bản
            row = {
                '_id': str(item.get('_id')),
                'name': item.get('name', ''),
                'address': item.get('address', ''),
                'source_url': item.get('source_url', ''),
                'avg_rating': item.get('avg_rating', 0.0),
            }

            # 2. Xử lý MENU
            menu_items = item.get('menu', [])
            row['menu'] = menu_items # Giữ nguyên list object để trả về API (Frontend cần cái này)
            
            if isinstance(menu_items, list):
                # 👇 FIX BUG: Lọc lấy tên món ra danh sách riêng
                menu_names = []
                for m in menu_items:
                    if isinstance(m, dict):
                        # Nếu là object {name: "Cơm", price: 30k} -> Lấy "Cơm"
                        name = m.get('name', '')
                        if name: menu_names.append(str(name))
                    elif isinstance(m, str):
                        # Nếu là string "Cơm" (data cũ) -> Lấy luôn
                        menu_names.append(m)
                
                # Giờ thì join thoải mái vì toàn là string
                row['menu_flat'] = ", ".join(menu_names) 
            else:
                row['menu_flat'] = ""

            # 3. Xử lý REVIEWS (List of Dicts -> String)
            # Gom tất cả nội dung comment lại thành 1 đoạn văn dài
            reviews = item.get('reviews', [])
            if isinstance(reviews, list):
                # Chỉ lấy phần content, bỏ qua user_name hay rating
                comments = [r.get('content', '') for r in reviews if isinstance(r, dict)]
                row['reviews_flat'] = " ".join(comments)
            else:
                row['reviews_flat'] = ""

            # 4. Xử lý SCORES (Dict -> Columns)
            # Tách scores.space thành cột scores_space
            scores = item.get('scores', {})
            if isinstance(scores, dict):
                row['score_space'] = scores.get('space', 0.0)
                row['score_service'] = scores.get('service', 0.0)
                row['score_price'] = scores.get('price', 0.0)
                row['score_position'] = scores.get('position', 0.0)
                row['score_quality'] = scores.get('quality', 0.0)
                
            
            # 5. Xử lý LOCATION (GeoJSON -> Lat/Lon riêng biệt)
            # Mongo lưu: [Lon, Lat] -> Ta tách ra thành 2 cột
            loc = item.get('location', {})
            if isinstance(loc, dict) and 'coordinates' in loc:
                coords = loc['coordinates']
                if isinstance(coords, list) and len(coords) == 2:
                    row['lon'] = coords[0]
                    row['lat'] = coords[1]
                else:
                    row['lon'], row['lat'] = 0.0, 0.0
            else:
                row['lon'], row['lat'] = 0.0, 0.0

            flattened_data.append(row)

        # --- BƯỚC 2: TẠO DATAFRAME ---
        df = pd.DataFrame(flattened_data)
        
        # --- BƯỚC 3: TẠO CỘT SEARCH TEXT (Quan trọng cho AI) ---
        # Bây giờ các cột đã phẳng, ta cộng chuỗi rất dễ dàng
        df['search_text'] = (
            df['name'] + ". " + 
            df['menu_flat'] + ". " + 
            df['reviews_flat'] + ". " +
            df['address']
        ).str.lower() # Chuyển thành chữ thường luôn

        # Xóa các dòng rác (nếu không có tên hoặc lat/lon lỗi)
        df = df.dropna(subset=['lat', 'lon'])
        
        print(f"✅ Loaded & Flattened {len(df)} restaurants.")
        return df

    def _create_tfidf_model(self):
        """
        Chuẩn bị dữ liệu text cho TF-IDF.
        Phải xử lý các trường List/Object thành chuỗi đơn giản.
        """
        search_corpus = self.df['search_text'].fillna("").tolist()

        # Cấu hình TF-IDF (Bắt từ đơn và từ ghép 2 chữ)
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        matrix = vectorizer.fit_transform(search_corpus)
        
        return vectorizer, matrix

    def search(
        self,
        query: str,
        district: str = None,
        top_k: int = 15,
        alpha: float = 0.6,
        center: tuple = None,
        radius_km: float = 0,
        
        # 👇 THAM SỐ MỚI: Trọng số (Mặc định nếu không truyền)
        weight_sim: float = 0.7,       # Mặc định ưu tiên nội dung (0.7)
        weight_dist: float = 0.3       # Mặc định ưu tiên khoảng cách (0.3)
    ):
        if self.df.empty: return []
        if not query.strip(): return self.df.head(top_k).to_dict('records')

        # ---------------------------------------------------------
        # BƯỚC 1: TÍNH ĐIỂM RELEVANCE (NỘI DUNG)
        # ---------------------------------------------------------
        query_emb = self.embedder.embed_query(query)
        sem_scores = np.dot(self.semantic_matrix, query_emb)

        query_tfidf = self.vectorizer.transform([query.lower()])
        tfidf_scores = cosine_similarity(query_tfidf, self.tfidf_matrix).flatten()

        # Điểm nội dung (0 -> 1)
        relevance_scores = (alpha * sem_scores) + ((1 - alpha) * tfidf_scores)

        # ---------------------------------------------------------
        # BƯỚC 2: TẠO BẢNG TẠM
        # ---------------------------------------------------------
        results = self.df.copy()
        results['relevance_score'] = relevance_scores
        results['semantic_score'] = sem_scores
        results['tfidf_score'] = tfidf_scores
        
        # Khởi tạo điểm khoảng cách mặc định là 0
        results['distance_score'] = 0.0
        results['distance_km'] = 0.0

        # ---------------------------------------------------------
        # BƯỚC 3: LỌC QUẬN (Hard Filter)
        # ---------------------------------------------------------
        if district:
            mask_district = results['address'].str.contains(district, case=False, na=False)
            if mask_district.any():
                results = results[mask_district]
            # Nếu lọc quận xong mà rỗng thì có thể return [] hoặc bỏ qua lọc tùy logic bạn muốn

        # ---------------------------------------------------------
        # BƯỚC 4: TÍNH ĐIỂM KHOẢNG CÁCH & LỌC BÁN KÍNH
        # ---------------------------------------------------------
        if center and radius_km > 0 and not results.empty:
            lat_center, lon_center = center
            
            # Tính khoảng cách thực tế (km)
            results['distance_km'] = results.apply(
                lambda row: geodesic((row['lat'], row['lon']), (lat_center, lon_center)).km, 
                axis=1
            )
            
            # Lọc cứng: Loại bỏ quán ngoài bán kính
            results = results[results['distance_km'] <= radius_km]
            
            if results.empty: return []

            # 👇 TÍNH ĐIỂM KHOẢNG CÁCH (0 -> 1)
            # Công thức: 1 - (Khoảng cách / Bán kính max)
            # Càng gần càng cao (1.0), càng xa càng thấp (0.0)
            results['distance_score'] = 1 - (results['distance_km'] / radius_km)
            
            # Đảm bảo không âm (phòng trường hợp sai số nhỏ)
            results['distance_score'] = results['distance_score'].clip(lower=0)
        
        elif center:
             # Nếu có center nhưng không lọc bán kính (radius_km=0),
             # ta vẫn có thể tính khoảng cách để sort, nhưng không lọc bỏ.
             # Tuy nhiên để đơn giản, nếu radius=0 ta coi như distance_score = 0.5 (trung lập)
             results['distance_score'] = 0.5

        # ---------------------------------------------------------
        # BƯỚC 5: TÍNH ĐIỂM TỔNG HỢP (FINAL SCORE)
        # ---------------------------------------------------------
        
        # Chuẩn hóa tổng trọng số về 1 (để tránh điểm bị lố)
        total_w = weight_sim + weight_dist
        if total_w == 0: total_w = 1 # Tránh chia cho 0
        
        w_s = weight_sim / total_w
        w_d = weight_dist / total_w

        # Công thức: Final = (w_s * Relevance) + (w_d * Distance)
        # Nếu không có tính khoảng cách (distance_score=0), điểm sẽ phụ thuộc hoàn toàn vào relevance
        results['final_score'] = (w_s * results['relevance_score']) + (w_d * results['distance_score'])

        # ---------------------------------------------------------
        # BƯỚC 6: SẮP XẾP & TRẢ VỀ
        # ---------------------------------------------------------
        results = results.sort_values('final_score', ascending=False).head(top_k)
        
        results['_id'] = results['_id'].astype(str)
        
        return results.to_dict('records')